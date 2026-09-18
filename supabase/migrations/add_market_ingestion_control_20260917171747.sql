create table public.market_ingestion_state (
  realm text primary key,
  next_cursor bigint not null,
  lease_token uuid,
  lease_expires_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint market_ingestion_state_realm_not_blank
    check (btrim(realm) <> ''),
  constraint market_ingestion_state_cursor_positive
    check (next_cursor > 0),
  constraint market_ingestion_state_lease_complete
    check (
      (lease_token is null and lease_expires_at is null)
      or
      (lease_token is not null and lease_expires_at is not null)
    )
);

create table public.market_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  realm text not null
    references public.market_ingestion_state(realm),
  lease_token uuid,
  status text not null,
  start_cursor bigint not null,
  end_cursor bigint not null,
  processed_count integer not null default 0,
  gap_count integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint market_ingestion_runs_status_check
    check (status in ('running', 'completed', 'failed', 'skipped')),
  constraint market_ingestion_runs_cursor_positive
    check (start_cursor > 0 and end_cursor > 0),
  constraint market_ingestion_runs_counts_nonnegative
    check (processed_count >= 0 and gap_count >= 0),
  constraint market_ingestion_runs_finished_state
    check (
      (status = 'running' and finished_at is null)
      or
      (status <> 'running' and finished_at is not null)
    )
);

create index market_ingestion_runs_realm_started_idx
  on public.market_ingestion_runs (realm, started_at desc);

create index market_ingestion_runs_running_idx
  on public.market_ingestion_runs (realm, lease_token)
  where status = 'running';

create table public.market_ingestion_gaps (
  realm text not null,
  cursor bigint not null,
  status text not null,
  attempt_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_attempted_at timestamptz not null default now(),
  last_http_status integer,
  error_message text,
  primary key (realm, cursor),
  constraint market_ingestion_gaps_state_fk
    foreign key (realm)
    references public.market_ingestion_state(realm),
  constraint market_ingestion_gaps_cursor_positive
    check (cursor > 0),
  constraint market_ingestion_gaps_status_check
    check (status in ('pending', 'confirmed_missing', 'recovered')),
  constraint market_ingestion_gaps_attempts_positive
    check (attempt_count > 0)
);

alter table public.market_ingestion_state enable row level security;
alter table public.market_ingestion_runs enable row level security;
alter table public.market_ingestion_gaps enable row level security;

revoke all on table public.market_ingestion_state
  from public, anon, authenticated;
revoke all on table public.market_ingestion_runs
  from public, anon, authenticated;
revoke all on table public.market_ingestion_gaps
  from public, anon, authenticated;

grant select, insert, update on table public.market_ingestion_state
  to service_role;
grant select, insert, update on table public.market_ingestion_runs
  to service_role;
grant select, insert, update on table public.market_ingestion_gaps
  to service_role;

insert into public.market_ingestion_state (realm, next_cursor)
values (
  'poe1',
  coalesce(
    (
      select snapshot.next_change_id
      from public.market_snapshots snapshot
      where snapshot.realm = 'poe1'
        and snapshot.status = 'ready'
      order by snapshot.snapshot_hour desc
      limit 1
    ),
    1789488000
  )
)
on conflict (realm) do nothing;

create or replace function public.claim_market_ingestion_run(
  p_realm text,
  p_lease_seconds integer default 360
)
returns table (
  result_acquired boolean,
  result_run_id uuid,
  result_lease_token uuid,
  result_next_cursor bigint,
  result_lease_expires_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_state public.market_ingestion_state%rowtype;
  v_run_id uuid;
  v_lease_token uuid;
  v_lease_expires_at timestamptz;
begin
  if p_realm is null or btrim(p_realm) = '' then
    raise exception 'realm must not be blank';
  end if;

  if p_lease_seconds < 60 or p_lease_seconds > 1800 then
    raise exception 'lease seconds must be between 60 and 1800';
  end if;

  select state.*
  into v_state
  from public.market_ingestion_state state
  where state.realm = p_realm
  for update;

  if not found then
    raise exception 'ingestion state does not exist for realm %', p_realm;
  end if;

  if v_state.lease_expires_at is not null
     and v_state.lease_expires_at > now() then
    insert into public.market_ingestion_runs (
      realm,
      status,
      start_cursor,
      end_cursor,
      finished_at,
      error_message
    )
    values (
      p_realm,
      'skipped',
      v_state.next_cursor,
      v_state.next_cursor,
      now(),
      'Another ingestion run owns the active lease.'
    )
    returning id into v_run_id;

    return query
    select
      false,
      v_run_id,
      null::uuid,
      v_state.next_cursor,
      v_state.lease_expires_at;
    return;
  end if;

  update public.market_ingestion_runs run
  set
    status = 'failed',
    finished_at = now(),
    error_message = coalesce(
      run.error_message,
      'The ingestion lease expired before the run completed.'
    )
  where run.realm = p_realm
    and run.status = 'running';

  v_lease_token := gen_random_uuid();
  v_lease_expires_at := now() + make_interval(secs => p_lease_seconds);

  update public.market_ingestion_state
  set
    lease_token = v_lease_token,
    lease_expires_at = v_lease_expires_at,
    updated_at = now()
  where realm = p_realm;

  insert into public.market_ingestion_runs (
    realm,
    lease_token,
    status,
    start_cursor,
    end_cursor
  )
  values (
    p_realm,
    v_lease_token,
    'running',
    v_state.next_cursor,
    v_state.next_cursor
  )
  returning id into v_run_id;

  return query
  select
    true,
    v_run_id,
    v_lease_token,
    v_state.next_cursor,
    v_lease_expires_at;
end;
$$;

create or replace function public.advance_market_ingestion_cursor(
  p_realm text,
  p_lease_token uuid,
  p_expected_cursor bigint,
  p_next_cursor bigint,
  p_lease_seconds integer default 360
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_updated_count integer;
begin
  if p_next_cursor < p_expected_cursor then
    raise exception 'next cursor must not move backwards';
  end if;

  if p_lease_seconds < 60 or p_lease_seconds > 1800 then
    raise exception 'lease seconds must be between 60 and 1800';
  end if;

  update public.market_ingestion_state
  set
    next_cursor = p_next_cursor,
    lease_expires_at = now() + make_interval(secs => p_lease_seconds),
    updated_at = now()
  where realm = p_realm
    and lease_token = p_lease_token
    and lease_expires_at > now()
    and next_cursor = p_expected_cursor;

  get diagnostics v_updated_count = row_count;
  return v_updated_count = 1;
end;
$$;

create or replace function public.record_market_ingestion_gap(
  p_realm text,
  p_cursor bigint,
  p_status text,
  p_http_status integer default null,
  p_error_message text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_status not in ('pending', 'confirmed_missing', 'recovered') then
    raise exception 'invalid ingestion gap status %', p_status;
  end if;

  if p_status = 'recovered' then
    update public.market_ingestion_gaps
    set
      status = 'recovered',
      last_attempted_at = now(),
      last_http_status = p_http_status,
      error_message = p_error_message
    where realm = p_realm
      and cursor = p_cursor;
    return;
  end if;

  insert into public.market_ingestion_gaps (
    realm,
    cursor,
    status,
    last_http_status,
    error_message
  )
  values (
    p_realm,
    p_cursor,
    p_status,
    p_http_status,
    p_error_message
  )
  on conflict (realm, cursor)
  do update set
    status = excluded.status,
    attempt_count = public.market_ingestion_gaps.attempt_count + 1,
    last_attempted_at = now(),
    last_http_status = excluded.last_http_status,
    error_message = excluded.error_message;
end;
$$;

create or replace function public.finish_market_ingestion_run(
  p_run_id uuid,
  p_realm text,
  p_lease_token uuid,
  p_status text,
  p_end_cursor bigint,
  p_processed_count integer,
  p_gap_count integer,
  p_error_message text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_updated_count integer;
begin
  if p_status not in ('completed', 'failed') then
    raise exception 'run can only finish as completed or failed';
  end if;

  if p_processed_count < 0 or p_gap_count < 0 then
    raise exception 'run counts must not be negative';
  end if;

  update public.market_ingestion_runs
  set
    status = p_status,
    end_cursor = p_end_cursor,
    processed_count = p_processed_count,
    gap_count = p_gap_count,
    error_message = p_error_message,
    finished_at = now()
  where id = p_run_id
    and realm = p_realm
    and lease_token = p_lease_token
    and status = 'running';

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> 1 then
    return false;
  end if;

  update public.market_ingestion_state
  set
    lease_token = null,
    lease_expires_at = null,
    updated_at = now()
  where realm = p_realm
    and lease_token = p_lease_token;

  return true;
end;
$$;

comment on table public.market_ingestion_state is
  'Durable PoE ingestion cursor and expiring serverless worker lease.';
comment on table public.market_ingestion_runs is
  'Durable outcome history for scheduled PoE ingestion invocations.';
comment on table public.market_ingestion_gaps is
  'PoE cursor payloads that were temporarily or permanently unavailable.';

revoke all on function public.claim_market_ingestion_run(text, integer)
  from public, anon, authenticated;
revoke all on function public.advance_market_ingestion_cursor(text, uuid, bigint, bigint, integer)
  from public, anon, authenticated;
revoke all on function public.record_market_ingestion_gap(text, bigint, text, integer, text)
  from public, anon, authenticated;
revoke all on function public.finish_market_ingestion_run(uuid, text, uuid, text, bigint, integer, integer, text)
  from public, anon, authenticated;

grant execute on function public.claim_market_ingestion_run(text, integer)
  to service_role;
grant execute on function public.advance_market_ingestion_cursor(text, uuid, bigint, bigint, integer)
  to service_role;
grant execute on function public.record_market_ingestion_gap(text, bigint, text, integer, text)
  to service_role;
grant execute on function public.finish_market_ingestion_run(uuid, text, uuid, text, bigint, integer, integer, text)
  to service_role;
