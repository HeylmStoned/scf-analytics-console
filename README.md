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
| **Public** | Compare aggregate web totals for listed projects with recorded traffic. |
| **SCF** | Compare active sites in **Projects** and review onboarding and listing in **SCF managing**. **Data & privacy** demonstrates erasure. **Export data** downloads JSON, scoped to the selected project when a project filter is applied in **API**. |
| **Tenant** | Review the selected project's web and sample API metrics. **Export data from your project** exports only that project's analytics. |

Projects appear in analytics, comparisons, and the Tenant selector after Umami records their first pageview. Once eligible, a site stays visible even when the selected reporting period has zero pageviews. Project tables display the names and domains registered in Umami.

Open **SCF → SCF managing → Projects** to see sites waiting for traffic. The **Umami status** column shows whether pageviews were recorded in the selected period. Check the website itself to verify script installation.

Project icons use locally served copies of the Prismfi.cc and Lend.xyz favicons. [Prismfi.cc favicon](https://prismfi.cc/favicon.ico) · [Lend.xyz favicon](https://lend.xyz/favicon.ico)

**Roadmap** follows **Overview** in the navigation. Its interactive timeline covers weeks 8, 12, and 16, with deliverables and completion criteria for each tranche. The proposal targets production in **week 16** and includes **12 months of hosting and support** after the final tranche is approved.

## Data sources and privacy

- **Live web** comes from Umami. The Public **Web activity** chart shows totals for the selected period. SCF and Tenant can view a time series when available and switch between Top pages, Countries, Referrers, Devices, Browsers, and Operating systems in **Web**. The Countries tab includes a zoomable map you can drag.
- **Sample API** uses deterministic fixtures for request counts, HTTP statuses, normalized routes, and latency. The **Projects → Routes** table labels its API data as simulated. The planned OpenTelemetry Protocol (OTLP) collector will provide live API metrics when implemented.
- Public receives only aggregate web totals. Geographic reporting in SCF and Tenant is limited to country-level aggregates. Tenant views and exports use the selected project's scope. These perspectives are open to reviewers for the POC.
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
| `UMAMI_URL` | Base URL for self-hosted username/password authentication |
| `UMAMI_USER` | Self-hosted account name. Defaults to `admin`. |
| `UMAMI_PASSWORD` | Self-hosted account password |

The server discovers Umami properties through `GET /websites` with the configured credentials. Project website IDs and the Public project list are resolved automatically. Use credentials scoped to websites intended for this demo.

The site directory and first-pageview checks are cached for one minute. Reload the page after that interval to pick up new properties or newly recorded first visits. Restart the development server after changing environment variables.

### Browser tracking by deployment

To record visits to the console itself, configure both variables on the Railway service for the target environment.

| Variable | Purpose |
| --- | --- |
| `UMAMI_TRACKER_WEBSITE_ID` | Public website ID from the Umami property for this deployment |
| `UMAMI_TRACKER_DOMAINS` | Comma-separated list of allowed hostnames, without schemes or paths |

The console loads the Umami tracker only when both values are present. Give each production domain its own Umami property to keep its traffic separate. Leave the tracker variables empty on pull request previews to disable collection there. Redeploy after changing the service variables.

Grant the server-side Umami credentials access to the deployment’s website property for its traffic to appear in the dashboard.

## Code map

| Path | Responsibility |
| --- | --- |
| [`src/components/Console.tsx`](src/components/Console.tsx) | Workspace navigation, reviewer modes, enrollment, and export scope |
| [`src/components/views.tsx`](src/components/views.tsx) | Analytics, integration, SCF operations, and privacy views |
| [`src/components/CountryMap.tsx`](src/components/CountryMap.tsx) | Country map, zoom, and pan controls |
| [`src/components/Roadmap.tsx`](src/components/Roadmap.tsx) | Delivery timeline, tranches, and acceptance criteria |
| [`src/lib/model.ts`](src/lib/model.ts) | Demo projects, metric fixtures, and scope calculations |
| [`src/lib/umami.ts`](src/lib/umami.ts) | Umami property discovery, first-pageview checks, and metric queries |
| [`src/app/api/umami/route.ts`](src/app/api/umami/route.ts) | Server-side endpoint for Umami dashboard metrics |
| [`src/app/metrics/api/route.ts`](src/app/metrics/api/route.ts) | Sample API metrics for the selected demo perspective |
| [`next.config.ts`](next.config.ts) | Rewrites that connect the console to the hosted demo worker |

## Development checks

```sh
npm run lint
npx tsc --noEmit
npm run build
```
