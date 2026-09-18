"use client";

import { Suspense, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  CurrencyOption,
  MarketPairFilters,
} from "@/lib/market/types";

const MARKET_PATH = "/market";

const controlClassName =
  "min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground";

const primaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-fast ease-standard hover:bg-primary-hover";

const secondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors duration-fast ease-standard hover:bg-surface-muted";

type MarketFiltersProps = {
  leagues: string[];
  currencies: CurrencyOption[];
  values: MarketPairFilters;
};

export function MarketFilters(props: MarketFiltersProps) {
  return (
    <Suspense fallback={<MarketFiltersFallback />}>
      <MarketFiltersForm {...props} />
    </Suspense>
  );
}

function MarketFiltersForm({
  leagues,
  currencies,
  values,
}: MarketFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leagueOptions = leagues.includes(values.league)
    ? leagues
    : [values.league, ...leagues];
  const currencyOptions = currencies.toSorted((left, right) =>
    left.displayName.localeCompare(right.displayName),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    setOrDelete(params, "league", readFormString(formData, "league"));
    setOrDelete(params, "currencyA", readFormString(formData, "currencyA"));
    setOrDelete(params, "currencyB", readFormString(formData, "currencyB"));
    setOrDelete(params, "minVolume", readFormString(formData, "minVolume"));
    setOrDelete(params, "minSpread", readFormString(formData, "minSpread"));

    const query = params.toString();
    router.push(query ? `${MARKET_PATH}?${query}` : MARKET_PATH);
  }

  function handleReset() {
    router.push(MARKET_PATH);
  }

  return (
    <section
      aria-labelledby="market-filters-heading"
      className="rounded-md border border-border bg-surface p-6"
    >
      <h2
        id="market-filters-heading"
        className="mb-4 text-sm font-medium tracking-wide text-foreground"
      >
        Filters
      </h2>
      <form
        key={searchParams.toString()}
        autoComplete="off"
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <FilterField id="market-league" label="League">
            <select
              id="market-league"
              name="league"
              className={controlClassName}
              defaultValue={values.league}
            >
              {leagueOptions.map((league) => (
                <option key={league} value={league}>
                  {league}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="market-currency-a" label="Currency A">
            <select
              id="market-currency-a"
              name="currencyA"
              className={controlClassName}
              defaultValue={toIdValue(values.currencyAId)}
            >
              <option value="">Any</option>
              {currencyOptions.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.displayName}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="market-currency-b" label="Currency B">
            <select
              id="market-currency-b"
              name="currencyB"
              className={controlClassName}
              defaultValue={toIdValue(values.currencyBId)}
            >
              <option value="">Any</option>
              {currencyOptions.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.displayName}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="market-min-volume" label="Min volume">
            <input
              id="market-min-volume"
              name="minVolume"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              className={controlClassName}
              defaultValue={toOptionalNumberValue(values.minVolume)}
            />
          </FilterField>
          <FilterField id="market-min-spread" label="Min bid spread (%)">
            <input
              id="market-min-spread"
              name="minSpread"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              className={controlClassName}
              defaultValue={toSpreadPercentValue(values.minBidSpread)}
            />
          </FilterField>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className={primaryButtonClassName}>
            Apply
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </form>
    </section>
  );
}

function MarketFiltersFallback() {
  return (
    <section
      aria-busy="true"
      aria-labelledby="market-filters-heading"
      className="rounded-md border border-border bg-surface p-6"
    >
      <h2
        id="market-filters-heading"
        className="mb-4 text-sm font-medium tracking-wide text-foreground"
      >
        Filters
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="h-11 animate-pulse rounded-md bg-surface-muted" />
        <div className="h-11 animate-pulse rounded-md bg-surface-muted" />
        <div className="h-11 animate-pulse rounded-md bg-surface-muted" />
        <div className="h-11 animate-pulse rounded-md bg-surface-muted" />
        <div className="h-11 animate-pulse rounded-md bg-surface-muted" />
      </div>
    </section>
  );
}

function FilterField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground-muted"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}

function toIdValue(id: number | null): string {
  return id == null ? "" : String(id);
}

function toOptionalNumberValue(value: number | null): string {
  return value == null ? "" : String(value);
}

function toSpreadPercentValue(minBidSpread: number | null): string {
  if (minBidSpread == null) {
    return "";
  }

  return String(Number((minBidSpread * 100).toFixed(6)));
}
