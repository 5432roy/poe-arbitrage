# Path of Exile Currency Exchange — Database Design

## 1. Purpose

This document defines the database schema for the Path of Exile Currency Exchange market-analysis system.

The design supports:

- hourly ingestion of completed Currency Exchange snapshots;
- durable historical market storage;
- efficient access to the latest completed market state;
- historical pair analysis;
- graph-based arbitrage and conversion analysis;
- precomputed opportunity storage;
- future volatility, persistence, and backtesting features.

The central design rule is:

> **The current market is not stored as a separate source of truth. It is the newest completed historical snapshot.**

This avoids duplicated state and keeps ingestion append-only and auditable.

---

## 2. Storage Architecture

The system uses two storage layers:

```text
Grinding Gear Games Currency Exchange API
                  |
                  v
         Supabase Object Storage
          raw *.json.gz payload
                  |
                  v
          Supabase Postgres
      normalized relational data
                  |
          +-------+--------+
          |                |
          v                v
   Latest-market views   Historical queries
          |                |
          +-------+--------+
                  |
                  v
            Analysis engine
                  |
                  v
        trade_opportunities
```

### 2.1 Supabase Object Storage

Raw hourly Currency Exchange responses should be stored as compressed files.

Current layout:

```text
currency-exchange/
  YYYY/
    MM/
      DD/
        <snapshot-epoch>.json.gz
```

Example:

```text
currency-exchange/
  2026/
    09/
      17/
        1789671600.json.gz
        1789675200.json.gz
        1789678800.json.gz
```

Each raw hourly payload contains markets for every active public league in the
realm. League is therefore a property of each market row, not of the snapshot
object itself.

The raw payload is retained for:

- parser recovery;
- schema changes;
- validation;
- auditing;
- algorithm changes;
- historical reprocessing.

The raw payload should not also be duplicated into Postgres as a large `jsonb` column unless a specific operational need appears later.

---

## 3. Core Data Model

The recommended core schema is:

```text
currencies
    |
    +---- market_pairs
              |
              +---- market_pair_snapshots
                        |
market_snapshots -------+
                        |
                        +---- latest_market_pairs view
                        |
                        +---- graph analysis
                                  |
                                  +---- trade_opportunities
```

The distinction is:

```text
market_pairs
    = stable identity of a pair

market_pair_snapshots
    = hourly measurements for that pair
```

For example:

```text
market_pairs:
    Chaos Orb <-> Divine Orb

market_pair_snapshots:
    Chaos Orb <-> Divine Orb @ 16:00
    Chaos Orb <-> Divine Orb @ 17:00
    Chaos Orb <-> Divine Orb @ 18:00
```

This separation makes historical analytics substantially easier.

---

## 4. `currencies`

`currencies` stores stable currency metadata.

```sql
create table currencies (
    id uuid primary key default gen_random_uuid(),

    realm text not null,
    metadata_id text not null,

    display_name text,
    icon_url text,
    category text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (realm, metadata_id)
);
```

### 4.1 Column semantics

| Column | Purpose |
|---|---|
| `id` | Internal database identifier |
| `realm` | PoE realm, such as PoE1 or future PoE2 support |
| `metadata_id` | GGG internal item identifier |
| `display_name` | Player-readable currency name |
| `icon_url` | Optional icon |
| `category` | Optional grouping |
| `created_at` | Record creation time |
| `updated_at` | Last metadata update |

### 4.2 Design rule

Currency metadata should be stored once.

Hourly snapshots should reference currency IDs instead of repeating names or metadata.

---

## 5. `market_pairs`

`market_pairs` represents the stable identity of a market pair within a realm and league.

```sql
create table market_pairs (
    id uuid primary key default gen_random_uuid(),

    realm text not null,
    league text not null,

    currency_a_id uuid not null
        references currencies(id),

    currency_b_id uuid not null
        references currencies(id),

    created_at timestamptz not null default now(),

    unique (
        realm,
        league,
        currency_a_id,
        currency_b_id
    )
);
```

### 5.1 Purpose

This table answers:

> What pair is this?

It does not answer:

> What were the rate, volume, or stock values during a particular hour?

Those time-varying values belong in `market_pair_snapshots`.

### 5.2 Pair orientation

The pair orientation should be normalized deterministically.

For example, the ingestion layer may choose one of:

```text
lower currency UUID first
```

or:

```text
preserve canonical GGG pair orientation
```

The exact choice is less important than consistency.

The system should never create both:

```text
Chaos / Divine
Divine / Chaos
```

as separate pair identities if they represent the same GGG market.

Directional exchange rates should be derived later.

---

## 6. `market_snapshots`

`market_snapshots` represents one completed hourly market dataset containing
all active public leagues for a realm.

```sql
create table market_snapshots (
    id uuid primary key default gen_random_uuid(),

    realm text not null,

    snapshot_hour timestamptz not null,
    next_change_id bigint not null,

    raw_object_path text,

    market_row_count integer not null default 0,

    status text not null default 'processing'
        check (status in ('processing', 'ready', 'failed')),

    created_at timestamptz not null default now(),
    processed_at timestamptz,

    unique (realm, snapshot_hour)
);
```

Recommended cursor lookup index:

```sql
create index market_snapshots_next_change_id_idx
on market_snapshots (
    realm,
    next_change_id
);
```

Latest-snapshot access:

```sql
create index market_snapshots_latest_idx
on market_snapshots (
    realm,
    snapshot_hour desc
)
where status = 'ready';
```

### 6.1 Column semantics

| Column | Purpose |
|---|---|
| `id` | Snapshot identifier |
| `realm` | Realm |
| `snapshot_hour` | Hour represented by the dataset |
| `next_change_id` | GGG cursor returned as `next_change_id` in the source payload; consecutive tip responses may share this value |
| `raw_object_path` | Supabase Storage path to raw `.json.gz` |
| `market_row_count` | Number of market observation rows in the payload across all included leagues |
| `status` | Ingestion state |
| `created_at` | Insert time |
| `processed_at` | Time ingestion completed |

### 6.2 Snapshot lifecycle

A snapshot should move through:

```text
processing
    |
    +--> ready
    |
    +--> failed
```

A snapshot must not be exposed as the latest market until all normalized rows have been persisted successfully.

---

## 7. `market_pair_snapshots`

This table is the main historical fact table.

Every row stores one pair's measurements for one completed hourly snapshot.

```sql
create table market_pair_snapshots (
    snapshot_id uuid not null
        references market_snapshots(id)
        on delete cascade,

    pair_id uuid not null
        references market_pairs(id),

    raw_market_id text,

    volume_a numeric,
    volume_b numeric,

    lowest_stock_a numeric,
    lowest_stock_b numeric,

    highest_stock_a numeric,
    highest_stock_b numeric,

    lowest_ratio_a numeric,
    lowest_ratio_b numeric,

    highest_ratio_a numeric,
    highest_ratio_b numeric,

    primary key (
        snapshot_id,
        pair_id
    )
);
```

Recommended indexes:

```sql
create index market_pair_snapshots_snapshot_idx
on market_pair_snapshots (
    snapshot_id
);
```

```sql
create index market_pair_snapshots_pair_idx
on market_pair_snapshots (
    pair_id,
    snapshot_id
);
```

### 7.1 Purpose

This table answers questions such as:

```text
What were the Chaos/Divine market values at 18:00?

How has Divine/Exalted volume changed during the past 24 hours?

What was the 7-day volatility of a pair?

How often did a potential arbitrage route persist?
```

### 7.2 Append-only rule

Historical rows should normally be immutable.

New snapshots append new rows.

Existing historical records should only be modified to correct:

- an ingestion bug;
- a parser bug;
- a known source-corruption issue.

Routine collection must not update old snapshots.

---

## 8. Current Market Representation

The current market should initially be implemented as views over the newest completed snapshot.

Do not maintain separate authoritative tables such as:

```text
current_market_pairs
historical_market_pairs
```

That would duplicate state and create synchronization risk.

---

## 9. `latest_market_snapshots` View

```sql
create view latest_market_snapshots
with (security_invoker = true) as
select distinct on (realm)
    id,
    realm,
    snapshot_hour,
    next_change_id,
    raw_object_path,
    market_row_count,
    processed_at
from market_snapshots
where status = 'ready'
order by
    realm,
    snapshot_hour desc;
```

This returns one latest completed all-league snapshot per realm.

---

## 10. `latest_market_pairs` View

```sql
create view latest_market_pairs as
select
    ps.snapshot_id,
    ps.pair_id,
    ps.raw_market_id,

    p.realm,
    p.league,

    p.currency_a_id,
    p.currency_b_id,

    s.snapshot_hour,

    ps.volume_a,
    ps.volume_b,

    ps.lowest_stock_a,
    ps.lowest_stock_b,

    ps.highest_stock_a,
    ps.highest_stock_b,

    ps.lowest_ratio_a,
    ps.lowest_ratio_b,

    ps.highest_ratio_a,
    ps.highest_ratio_b

from latest_market_snapshots s

join market_pair_snapshots ps
    on ps.snapshot_id = s.id

join market_pairs p
    on p.id = ps.pair_id;
```

The latest market can then be queried with:

```sql
select *
from latest_market_pairs
where league = $1;
```

---

## 11. Historical Pair Query

A historical pair chart should query the fact table directly.

Example:

```sql
select
    s.snapshot_hour,

    ps.volume_a,
    ps.volume_b,

    ps.lowest_ratio_a,
    ps.lowest_ratio_b,

    ps.highest_ratio_a,
    ps.highest_ratio_b

from market_pair_snapshots ps

join market_snapshots s
    on s.id = ps.snapshot_id

where ps.pair_id = $1
  and s.status = 'ready'
  and s.snapshot_hour >= now() - interval '24 hours'

order by s.snapshot_hour;
```

This structure naturally supports:

```text
1 hour
6 hours
24 hours
7 days
30 days
custom range
```

without changing the schema.

---

## 12. Directed Market Edges

The raw Currency Exchange pair is not itself the graph representation.

A pair may produce two directed graph edges:

```text
Currency A --> Currency B
Currency B --> Currency A
```

A logical derived edge may contain:

```text
from_currency_id
to_currency_id

exchange_rate

estimated_volume
estimated_liquidity

snapshot_id
```

### 12.1 MVP recommendation

Do not persist `market_edges` initially.

Instead:

```text
market_pair_snapshots
        |
        v
load latest snapshot
        |
        v
normalize into directed edges in memory
        |
        v
build graph
        |
        v
run arbitrage / conversion analysis
```

The graph is small enough that rebuilding it hourly is cheap.

### 12.2 Why edges are derived

The underlying source fields are:

```text
lowest_ratio_*
highest_ratio_*
stock
volume
```

The directional exchange rate depends on interpretation and normalization logic.

If the interpretation changes later, persisted source observations remain intact and all derived graph edges can be regenerated.

---

## 13. Optional `market_edges` Cache

If future profiling shows that persisting edges is useful, add:

```sql
create table market_edges (
    snapshot_id uuid not null
        references market_snapshots(id)
        on delete cascade,

    from_currency_id uuid not null
        references currencies(id),

    to_currency_id uuid not null
        references currencies(id),

    exchange_rate numeric not null,

    estimated_volume numeric,
    estimated_liquidity numeric,

    rate_source text,

    created_at timestamptz not null default now(),

    primary key (
        snapshot_id,
        from_currency_id,
        to_currency_id
    )
);
```

This table must be treated as:

```text
derived cache
```

not:

```text
authoritative market history
```

It should always be possible to rebuild it from historical pair snapshots.

---

## 14. `trade_opportunities`

Precomputed analysis results should be persisted separately from market facts.

```sql
create table trade_opportunities (
    id uuid primary key default gen_random_uuid(),

    snapshot_id uuid not null
        references market_snapshots(id)
        on delete cascade,

    realm text not null,
    league text not null,

    opportunity_type text not null
        check (
            opportunity_type in (
                'ARBITRAGE',
                'CONVERSION'
            )
        ),

    start_currency_id uuid
        references currencies(id),

    end_currency_id uuid
        references currencies(id),

    path jsonb not null,

    gross_return numeric,
    profit_percent numeric,

    minimum_volume numeric,

    liquidity_score numeric,
    stability_score numeric,
    freshness_score numeric,
    confidence_score numeric,
    ranking_score numeric,

    calculated_at timestamptz not null default now()
);
```

Recommended index:

```sql
create index trade_opportunities_rank_idx
on trade_opportunities (
    league,
    snapshot_id,
    opportunity_type,
    ranking_score desc
);
```

### 14.1 Example `path`

```json
{
  "legs": [
    {
      "from": "Chaos Orb",
      "to": "Divine Orb",
      "input": 1000,
      "output": 6.25,
      "rate": 0.00625
    },
    {
      "from": "Divine Orb",
      "to": "Exalted Orb",
      "input": 6.25,
      "output": 937.5,
      "rate": 150
    },
    {
      "from": "Exalted Orb",
      "to": "Chaos Orb",
      "input": 937.5,
      "output": 1063,
      "rate": 1.1338666667
    }
  ]
}
```

### 14.2 Derived-data rule

`trade_opportunities` is disposable.

If scoring logic changes:

```text
historical snapshots
        |
        v
rebuild graph
        |
        v
rerun analysis
        |
        v
replace opportunity results
```

The normalized historical facts should never depend on the current opportunity algorithm.

---

## 15. Optional Current-Market Cache

A dedicated `current_market_pairs` table is not recommended for the MVP.

A view provides:

- simpler correctness;
- no synchronization logic;
- no duplicated source of truth;
- no race between history and current state.

A cache table should only be introduced if frontend load justifies it.

Possible future shape:

```sql
create table current_market_pairs (
    pair_id uuid primary key
        references market_pairs(id),

    snapshot_id uuid not null
        references market_snapshots(id),

    rate_a_to_b numeric,
    rate_b_to_a numeric,

    volume_a numeric,
    volume_b numeric,

    updated_at timestamptz not null default now()
);
```

This must still be treated as a cache.

---

## 16. Ingestion Transaction

Each completed hourly digest should be normalized atomically.

### 16.1 Execution model

Use the protected `GET /api/cron/poe-currency` Next.js route on Vercel as the
workflow orchestrator. Vercel Cron invokes it every 15 minutes with
`Authorization: Bearer <CRON_SECRET>`. The route runs in the Node.js runtime,
fetches and validates PoE responses, stores each compressed raw object, and
then calls one database function that owns the relational transaction.

The route is configured with a 300-second maximum duration and stops starting
new source requests after a shorter soft deadline. It returns only after the
batch has completed or failed, so the HTTP result describes the actual batch
outcome rather than merely acknowledging that background work was started.

The database function should be callable only by `service_role`. It should use
`SECURITY INVOKER`, rely on the service role's database privileges, and perform
the snapshot, pair-identity, and pair-observation writes in one transaction.

Implemented RPC:

```sql
ingest_market_snapshot(
    p_realm text,
    p_snapshot_hour timestamptz,
    p_next_change_id bigint,
    p_raw_object_path text,
    p_markets jsonb
)
```

The function validates that every payload currency resolves through
`currencies`, deterministically orders each pair by currency ID, swaps the
directional measurements when the input order is reversed, rejects duplicate
normalized pairs, validates the inserted row count, and only then marks the
snapshot `ready`.

Do not use a trigger on `storage.objects` for ingestion. Storage metadata is
service-owned, while validation, retrying, and logging are workflow
responsibilities rather than database-trigger work.

Preferred invocation order:

```text
Vercel collector uploads raw object
        |
        v
collector calls ingestion database function with
cursor, next_change_id, object path, and parsed markets
        |
        v
service-role-only database function performs atomic writes
```

The durable cursor checkpoint must advance only after both the raw object
upload and the relational ingestion succeed. Because the raw upload uses an
idempotent path and relational rows have uniqueness constraints, a failure can
safely retry the same cursor on the next run.

### 16.2 Ingestion control tables

`market_ingestion_state` stores one durable cursor and one expiring worker
lease per realm. The lease prevents overlapping or duplicate Vercel Cron
deliveries from processing the same cursor concurrently.

```text
market_ingestion_state
    realm
    next_cursor
    lease_token
    lease_expires_at
```

`market_ingestion_runs` stores the durable outcome of each scheduled
invocation, including skipped duplicate invocations, counts, cursor range, and
the last error.

`market_ingestion_gaps` records recent missing payloads, confirmed historical
gaps, and later recoveries. A historical 404 must be recorded before the
cursor advances so missing hours never exist only in transient server logs.

The service-role-only control functions are:

```text
claim_market_ingestion_run
advance_market_ingestion_cursor
record_market_ingestion_gap
finish_market_ingestion_run
```

They use `SECURITY INVOKER`. The operational tables have RLS enabled and grant
no access to `anon` or `authenticated`.

### 16.3 Scheduler ownership

Vercel owns the active 15-minute schedule. The previous Supabase `pg_cron` job
and `fetch-poe-currency` Edge Function are not part of the active architecture
after the Vercel production path has been verified. Keep the old function only
through the cutover observation window, then remove it.

A separate replay worker may be added later for historical objects. That worker
will download and decompress the stored wrapper, then call the same ingestion
database function.

Recommended flow:

```text
1. Fetch Currency Exchange digest
2. Compress and persist raw payload to Storage
3. Create market_snapshots row with status = processing
4. Resolve currencies
5. Resolve stable market_pairs
6. Insert market_pair_snapshots
7. Validate inserted rows against market_row_count
8. Set snapshot status = ready
9. Trigger analysis
```

Relational writes should use one transaction where practical:

```sql
begin;

-- insert snapshot
-- upsert currencies
-- upsert pair identities
-- insert pair snapshot facts
-- mark snapshot ready

commit;
```

If normalization fails:

```text
rollback relational transaction

mark ingestion as failed
retain raw .json.gz
log error
```

The raw file gives the system the ability to replay the hour later.

---

## 17. Idempotency

The collector may retry the same source digest.

The database must reject duplicates.

Primary protections:

```text
market_snapshots
unique (realm, snapshot_hour)

market_pair_snapshots
primary key (snapshot_id, pair_id)
```

The collector should therefore be safe to retry.

Pseudo-flow:

```text
if snapshot already exists and status = ready:
    skip

if snapshot exists and status = processing/failed:
    recover or retry

otherwise:
    ingest
```

---

## 18. Recommended Query Patterns

### 18.1 Latest completed market

```sql
select *
from latest_market_pairs
where realm = $1
  and league = $2;
```

### 18.2 Latest snapshot metadata

```sql
select *
from latest_market_snapshots
where realm = $1;
```

### 18.3 One pair over 24 hours

```sql
select
    s.snapshot_hour,
    ps.*
from market_pair_snapshots ps
join market_snapshots s
    on s.id = ps.snapshot_id
where ps.pair_id = $1
  and s.snapshot_hour >= now() - interval '24 hours'
  and s.status = 'ready'
order by s.snapshot_hour;
```

### 18.4 Load entire snapshot for graph construction

```sql
select
    ps.*,
    p.currency_a_id,
    p.currency_b_id

from market_pair_snapshots ps

join market_pairs p
    on p.id = ps.pair_id

where ps.snapshot_id = $1;
```

### 18.5 Top arbitrage opportunities

```sql
select *
from trade_opportunities
where snapshot_id = $1
  and opportunity_type = 'ARBITRAGE'
order by ranking_score desc
limit 50;
```

---

## 19. Historical Analytics

This schema supports future rolling calculations without changing the base model.

Potential derived metrics:

```text
1h rate
6h moving average
24h moving average
7d moving average

hourly volume
24h volume
7d volume

standard deviation
coefficient of variation
rate change
volume change
```

Potential opportunity-history metrics:

```text
first_seen
last_seen
consecutive_snapshots
observed_snapshot_count
average_profit
minimum_profit
maximum_profit
```

These should initially be calculated from raw history or stored in separate derived tables.

---

## 20. Optional Aggregate Tables

If historical queries eventually become expensive, add aggregate tables.

Examples:

```text
market_pair_hourly_stats
market_pair_daily_stats
market_pair_rolling_stats
```

Possible structure:

```sql
create table market_pair_daily_stats (
    pair_id uuid not null
        references market_pairs(id),

    day date not null,

    average_rate numeric,
    minimum_rate numeric,
    maximum_rate numeric,

    total_volume numeric,

    volatility numeric,

    primary key (
        pair_id,
        day
    )
);
```

These are derived analytics and can always be regenerated from historical snapshots.

---

## 21. Time Partitioning

At low data volume, `market_pair_snapshots` should remain a normal table.

Partition only when actual scale justifies it.

Possible future strategy:

```text
market_pair_snapshots
PARTITION BY RANGE (snapshot_hour)
```

However, the current normalized schema stores `snapshot_hour` in `market_snapshots`, not directly in `market_pair_snapshots`.

If native PostgreSQL time partitioning is later needed, there are two reasonable options:

### Option A — Denormalize `snapshot_hour`

Add:

```sql
snapshot_hour timestamptz not null
```

to `market_pair_snapshots`.

This duplicates one value per row but enables direct range partitioning.

### Option B — Partition through a redesigned historical fact table

Move snapshot time directly into the fact table's partition key while retaining `snapshot_id`.

Do not make this optimization during the MVP unless data growth proves it necessary.

---

## 22. Expected Data Growth

Illustrative example:

```text
2,000 active pair rows / hour
x 24 hours
= 48,000 rows / day

x 365
≈ 17.5 million rows / year
```

This is a normal PostgreSQL workload when:

- indexes are selective;
- historical rows are append-only;
- large raw JSON blobs are kept out of the fact table;
- historical chart queries use pair/time indexes;
- aggregation or partitioning is introduced only when needed.

---

## 23. Recommended Index Summary

```sql
create index market_snapshots_latest_idx
on market_snapshots (
    realm,
    snapshot_hour desc
)
where status = 'ready';
```

```sql
create index market_snapshots_next_change_id_idx
on market_snapshots (
    realm,
    next_change_id
);
```

```sql
create index market_pair_snapshots_snapshot_idx
on market_pair_snapshots (
    snapshot_id
);
```

```sql
create index market_pair_snapshots_pair_idx
on market_pair_snapshots (
    pair_id,
    snapshot_id
);
```

```sql
create index trade_opportunities_rank_idx
on trade_opportunities (
    league,
    snapshot_id,
    opportunity_type,
    ranking_score desc
);
```

Do not add speculative indexes before profiling real queries.

---

## 24. Data Ownership Classification

Each data object should be classified explicitly.

### 24.1 Authoritative source data

```text
Supabase Storage raw snapshot files
market_snapshots
market_pair_snapshots
```

These must be preserved.

### 24.2 Stable dimension data

```text
currencies
market_pairs
```

These define identity and metadata.

### 24.3 Derived data

```text
market_edges
trade_opportunities
rolling statistics
aggregate tables
current-market cache
```

These may be deleted and rebuilt.

This distinction is important because algorithm changes should never require recollecting historical market data.

---

## 25. Failure Recovery

### Raw payload stored, normalization failed

```text
raw .json.gz exists
snapshot status = failed
```

The system can replay the payload later.

The cursor remains unchanged, so the next Vercel Cron run retries the same
deterministic object path and ingestion transaction.

### Database commit failed

No snapshot should become `ready`.

The cursor remains unchanged. If the database commit succeeded but the cursor
checkpoint failed, retrying is still safe because the ingestion RPC returns an
already-ingested result for the ready snapshot.

### Cron invocation failed or never ran

Vercel Cron does not retry failed invocations. The next 15-minute invocation
claims the expired lease and resumes from the last committed cursor. A batch
can process up to 24 source payloads, allowing it to catch up faster than new
hourly payloads are produced.

### Duplicate or overlapping cron invocation

Only one invocation can own the realm lease. A duplicate invocation records a
`skipped` run and exits without fetching or mutating market data.

### Missing PoE payload

A recent 404 is recorded as a pending gap and retried without advancing the
cursor. An old 404 is recorded as confirmed missing before advancing. A replay
can later mark the gap recovered from either the PoE endpoint or the retained
raw Storage object.

### Analysis failed

The snapshot remains valid.

Only opportunity generation should be retried.

```text
market data status = ready
analysis status = failed
```

A later schema may add a separate analysis job table if operational tracking becomes necessary.

---

## 26. RLS and Access Model

Market data is expected to be public read-only application data.

Recommended access:

```text
Browser:
    read approved views / API routes

Vercel collector:
    server-only Supabase secret key / service-role access

Analysis worker:
    server-side privileged access
```

Do not expose the Supabase service-role key to the browser.

If direct Supabase reads are later allowed:

- enable RLS;
- allow `SELECT` on approved public market views;
- deny anonymous mutation;
- keep ingestion tables server-managed.

---

## 27. Schema Migration Strategy

Schema changes should preserve the ability to rebuild derived data.

For example:

```text
v1 parser
    |
historical source data
    |
v2 parser
    |
rebuilt directed graph
    |
rebuilt opportunities
```

Changes to:

```text
rate interpretation
liquidity scoring
volatility calculation
opportunity ranking
```

should not require changing or recollecting the raw historical snapshots.

---

## 28. Recommended MVP Tables

Implement initially:

```text
currencies
market_pairs
market_snapshots
market_pair_snapshots
trade_opportunities
```

Views:

```text
latest_market_snapshots
latest_market_pairs
```

Storage:

```text
raw hourly .json.gz payloads
```

Do not implement initially unless needed:

```text
market_edges
current_market_pairs
daily aggregate tables
rolling-statistic tables
partitioning
```

---

## 29. Final Architecture

```text
Vercel Cron
        |
        v
Next.js Node.js collector
        |
        +------------------------------+
        |                              |
        v                              v
Supabase Object Storage
raw hourly .json.gz
        |
        v
ingest_market_snapshot RPC
        |
        v
market_snapshots
        |
        +------------------------------+
        |                              |
        v                              v
market_pair_snapshots           snapshot metadata
        |
        v
market_pairs
        |
        v
currencies
```

Workflow state:

```text
market_ingestion_state
        |
        +---- market_ingestion_runs
        |
        +---- market_ingestion_gaps
```

Read paths:

```text
latest_market_snapshots
        |
        v
latest_market_pairs
        |
        v
frontend / API
```

Analysis path:

```text
market_pair_snapshots
        |
        v
directed edges in memory
        |
        v
market graph
        |
        +-------------------+
        |                   |
        v                   v
arbitrage analysis    conversion analysis
        |                   |
        +---------+---------+
                  |
                  v
         trade_opportunities
```

---

## 30. Core Design Decisions

### Decision 1 — Historical data is the source of truth

The current market is the latest completed historical snapshot.

### Decision 2 — Raw source payloads belong in Object Storage

Compressed raw files are cheaper and easier to replay than duplicating large JSON documents in Postgres.

### Decision 3 — Separate pair identity from pair observations

`market_pairs` represents stable identity.

`market_pair_snapshots` represents hourly measurements.

### Decision 4 — Keep ingestion append-only

Historical market observations should normally never be updated.

### Decision 5 — Treat graph edges as derived

Directed edges can be regenerated whenever exchange-rate interpretation changes.

### Decision 6 — Treat opportunities as disposable analysis output

`trade_opportunities` must be reproducible from historical market data.

### Decision 7 — Avoid premature caching

Use views for the latest market first.

Add a dedicated current-market table only after profiling proves it necessary.

### Decision 8 — Avoid premature partitioning

A properly indexed PostgreSQL table can handle substantial historical volume before partitioning is necessary.

---

## 31. Summary

The recommended schema is:

```text
currencies
    |
market_pairs
    |
market_pair_snapshots
    |
market_snapshots
```

with:

```text
latest_market_snapshots
latest_market_pairs
```

providing the current completed market state.

Raw source files remain in Supabase Object Storage.

Derived graph edges and opportunity results are rebuilt from authoritative historical snapshots.

The most important architectural property is:

> **There is one historical source of truth. “Current market” is simply a query over its latest completed snapshot.**

This keeps the system consistent, replayable, and suitable for future historical analysis, graph algorithms, volatility modeling, opportunity persistence, and backtesting.
