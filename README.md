# Stellar Ecosystem Analytics

<p align="center">
  <img src="public/stellar-logo.svg" alt="Stellar logo" width="64" height="64">
</p>

A proof of concept for the Stellar Community Fund (SCF) web and API analytics RFP. The console lets reviewers explore ecosystem adoption, compare projects, and preview the experience of a project team or an SCF operator.

**[Open the demo](https://scf-console-production.up.railway.app)** · [Read the SCF RFP](https://stellar.gitbook.io/scf-handbook/scf-awards/build-award/rfp-track#web-and-api-analytics-for-stellar-ecosystem-projects) · [View changes](CHANGELOG.md)

## Reviewer walkthrough

Choose a perspective on the welcome screen. Use **Workspace** to switch perspectives from any dashboard.

| Perspective | What to review |
| --- | --- |
| **Public** | Browse aggregate web and API metrics for listed projects. This view is read-only and has no download control. |
| **SCF** | Compare projects in **Projects**, review enrollment and listing controls in **SCF managing**, and inspect the data management workflow in **Data & privacy**. **Export data** downloads aggregate JSON. In **API**, selecting a project limits the export to that project. |
| **Tenant** | Select **Northwind** or **Harbor**. Review that project's metrics and integration instructions, then use **Export data from your project** to download its analytics only. |

Open **Roadmap**, just after **Overview**, to see the proposed delivery plan. The interactive timeline covers weeks 8, 12, and 16. Each tranche shows its deliverables and completion criteria. The roadmap links to the SCF RFP on GitBook. Production is targeted for **week 16**, with **12 months of hosting and support** after approval of the final tranche.

## What the POC demonstrates

- **Web analytics** covers page views, visitors, bounce rate, session duration, referrers, countries, devices, and browsers. The console reads these metrics from Umami when configured and uses sample data as a fallback.
- **API analytics** uses sample request counts, HTTP statuses, normalized routes, and latency estimates. The **Integration** view documents the version-pinned tracker and the OpenTelemetry dual-export workflow.
- **Project operations** previews free enrollment and separately managed dashboard listing. The console forwards demo enrollment requests to the demo worker. Listing changes, metrics key controls, and data erasure actions in the console use browser session state and reset when the page reloads.

The source badge distinguishes **Live web · sample API** from **Sample data**. Reviewer perspectives control what the console displays. Production authorization, tenant isolation, durable erasure, and availability validation are delivery milestones. Connect only Umami demo properties whose aggregate metrics can be shared with reviewers.

## Run locally

Use Node.js 22 and npm. From the repository root, run the following commands.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The console uses the hosted demo worker for the roster and integration requests, so the reviewer experience requires network access to that worker. No local database is required.

### Optional Umami integration

Create an ignored `.env.local` file to enable live web metrics for the two demo projects. Keep credentials server-side and use a dedicated Umami account with access to the demo properties.

| Variable | Purpose |
| --- | --- |
| `UMAMI_URL` | Base URL of the Umami instance, without a trailing slash |
| `UMAMI_USER` | Umami account name. The current implementation defaults to `admin` if omitted. |
| `UMAMI_PASSWORD` | Password for the configured Umami account |
| `UMAMI_ALPHA` | Umami website ID for Northwind |
| `UMAMI_BETA` | Umami website ID for Harbor |

Restart the dev server after setting these variables. Without Umami configuration, the console uses its bundled web fixtures.

## Code map

| Path | Responsibility |
| --- | --- |
| [`src/components/Console.tsx`](src/components/Console.tsx) | Workspace navigation, reviewer modes, enrollment, and export scope |
| [`src/components/views.tsx`](src/components/views.tsx) | Analytics, integration, SCF operations, and privacy views |
| [`src/components/Roadmap.tsx`](src/components/Roadmap.tsx) | Delivery timeline, tranches, and acceptance criteria |
| [`src/lib/model.ts`](src/lib/model.ts) | Demo projects, metric fixtures, and scope calculations |
| [`src/app/api/umami/route.ts`](src/app/api/umami/route.ts) | Server-side endpoint for Umami dashboard metrics |
| [`next.config.ts`](next.config.ts) | Rewrites that connect the console to the hosted demo worker |

## Development checks

```sh
npm run lint
npx tsc --noEmit
npm run build
```
