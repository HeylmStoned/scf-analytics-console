# Stellar Ecosystem Analytics

<p align="center">
  <img src="public/stellar-logo.svg" alt="Stellar logo" width="64" height="64">
</p>

A proof of concept for the Stellar Community Fund (SCF) web and API analytics RFP. The console lets reviewers explore ecosystem adoption, compare projects, and preview the experience of a project team or an SCF operator.

**[Open the demo](https://scf-console-production.up.railway.app)** · [Read the SCF RFP](https://stellar.gitbook.io/scf-handbook/scf-awards/build-award/rfp-track#web-and-api-analytics-for-stellar-ecosystem-projects) · [Project GitBook](https://scf.gitbook.io/scf-docs-1) · [View changes](CHANGELOG.md)

## Reviewer walkthrough

The welcome page explains the demo and links to the project GitBook in its initial HTML. Choose any perspective without signing in. Use **Workspace** to switch perspectives.

| Perspective | What to review |
| --- | --- |
| **Public** | View aggregate web totals for the selected period and compare publicly listed sites. |
| **SCF** | See available and planned projects in **Projects**, compare their analytics, and preview listing, enrollment, and erasure in **SCF managing** and **Data & privacy**. **Export data** downloads aggregate JSON. Selecting a project in **API** limits the export to that project. |
| **Tenant** | Review the selected project's web and sample API metrics. **Export data from your project** exports only that project's analytics. |

**SCF → Projects** shows the demo site, Lend.xyz awaiting its Umami website ID, and Prism.fi as a project to be added. New Stellar projects will appear as their analytics are connected.

**Roadmap** follows **Overview** in the navigation. Its interactive timeline covers weeks 8, 12, and 16, with deliverables and completion criteria for each tranche. The proposal targets production in **week 16** and includes **12 months of hosting and support** after the final tranche is approved.

## Data sources and privacy

- **Live web** comes from Umami. **Overview** shows aggregate visitor and pageview totals in Public and a time series when available in SCF and Tenant. In **Web**, switch between Top pages, Countries, Referrers, Devices, Browsers, and Operating systems using one table. The Countries tab includes a zoomable map you can drag.
- **Sample API** uses deterministic fixtures for request counts, HTTP statuses, normalized routes, and latency. Live API metrics are planned for implementation of the OpenTelemetry Protocol (OTLP) collector.
- The server retrieves **country-level aggregates** as its only geographic dimension. The Public perspective shows aggregate web totals. SCF and Tenant are open demo perspectives. Tenant views and exports use the selected project's scope.
- Reports show a loading state before Umami responds. When a report is unavailable, the console clearly labels any sample figures it displays. Overview distinguishes live, sample, and mixed figures.

The POC demonstrates free enrollment, listing controls, metrics keys, and data erasure workflows. Listing changes, generated metrics keys, and erasure actions use browser session state and reset on reload.

## Run locally

Use Node.js 22 and npm. From the repository root, run the following commands.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The console uses the hosted demo worker for the roster and integration requests, so the reviewer experience requires network access to that worker. No local database is required.

### Optional Umami integration

Copy [`.env.example`](.env.example) to `.env.local` and fill in the settings for your Umami instance. Git ignores `.env.local`. Use properties whose aggregated web metrics can be shared with demo reviewers.

| Variable | Purpose |
| --- | --- |
| `UMAMI_API_KEY` | Server-side [Umami Cloud API key](https://docs.umami.is/docs/cloud/api-key) |
| `UMAMI_API_CLIENT_ENDPOINT` | API endpoint for key-based authentication. Defaults to `https://api.umami.is/v1`. |
| `UMAMI_ALPHA` | Umami website ID for scf-umami-poc-production.up.railway.app |
| `UMAMI_BETA` | Optional Umami website ID for Lend.xyz |
| `UMAMI_PUBLIC_PROJECTS` | Comma-separated project IDs approved for live Umami reporting in the POC. Defaults to `alpha`. Set it to an empty value to disable live reporting. |
| `UMAMI_URL` | Base URL for self-hosted username/password authentication |
| `UMAMI_USER` | Self-hosted account name. Defaults to `admin`. |
| `UMAMI_PASSWORD` | Self-hosted account password |

Set `UMAMI_ALPHA` to connect the demo site. Add `UMAMI_BETA` when the Lend.xyz property is ready, and include `beta` in `UMAMI_PUBLIC_PROJECTS` once its aggregate metrics are approved for the demo. Restart the dev server after changing the configuration.

## Code map

| Path | Responsibility |
| --- | --- |
| [`src/components/Console.tsx`](src/components/Console.tsx) | Workspace navigation, reviewer modes, enrollment, and export scope |
| [`src/components/views.tsx`](src/components/views.tsx) | Analytics, integration, SCF operations, and privacy views |
| [`src/components/CountryMap.tsx`](src/components/CountryMap.tsx) | Country map, zoom, and pan controls |
| [`src/components/Roadmap.tsx`](src/components/Roadmap.tsx) | Delivery timeline, tranches, and acceptance criteria |
| [`src/lib/model.ts`](src/lib/model.ts) | Demo projects, metric fixtures, and scope calculations |
| [`src/app/api/umami/route.ts`](src/app/api/umami/route.ts) | Server-side endpoint for Umami dashboard metrics |
| [`src/app/metrics/api/route.ts`](src/app/metrics/api/route.ts) | Sample API metrics for the selected demo perspective |
| [`next.config.ts`](next.config.ts) | Rewrites that connect the console to the hosted demo worker |

## Development checks

```sh
npm run lint
npx tsc --noEmit
npm run build
```
