# Exile Routes

A market-analysis and conversion-routing tool built from the latest completed [Path of Exile Currency Exchange](https://www.pathofexile.com/trade/exchange) data.

Recommendations are historical estimates from the last finished hourly digest. The official API does not expose the current hour, so this is not a live Faustus feed and it does not guarantee in-game profit.

## What it answers

1. **Opportunities** — which sequence of exchanges would have produced the highest return on the latest completed snapshot.
2. **Conversion** — given currency A and a desired currency B, whether an indirect path offered better purchasing power than exchanging A directly for B.

The landing page is in place. Opportunities and Conversion are still coming soon; the analysis engine is not connected yet.

## Stack

- Next.js 16 App Router and React 19
- Tailwind CSS 4
- GSAP for motion

Shared code will sit beside `app/` as the product grows (`lib/`, `components/`, …). Server Components fetch from the database or internal services; the browser never calls Grinding Gear Games or poe.ninja.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Docs

| File | Covers |
| --- | --- |
| [design.md](design.md) | System design: ingest, graph, scoring, and product scope |
| [docs/README.md](docs/README.md) | Frontend, API, architecture, and engineering conventions |
