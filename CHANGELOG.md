# Changelog

## Unreleased

### Reviewer experience

- Rendered the welcome text and project GitBook link in the initial HTML so reviewers can read them before JavaScript runs. The welcome page explains which metrics are live and which are simulated.
- Opened the Public, SCF, and Tenant demo perspectives without a sign-in step. The Workspace menu switches between perspectives.
- Added the SCF project rollout chart and an Umami status column in SCF managing. Project tables display website names and domains from Umami.
- Added the official Prismfi.cc and Lend.xyz favicons to Overview, project tables, and the workspace selector. The console serves them locally and uses contrasting tiles for the dark theme.
- Added the Roadmap after Overview, with delivery tranches at weeks 8, 12, and 16. Each tranche lists deliverables and completion criteria. The navigation also links directly to the project GitBook.
- Added Dark Reader compatibility metadata for the console's built-in dark theme.

### Analytics and privacy

- Made browser tracking configurable per deployment with a Umami website ID and a hostname allowlist. The tracker loads only when both variables are set.
- Discovered sites automatically through Umami’s `GET /websites` endpoint and removed the per-project website ID settings.
- Removed the Public project environment variable. Public now includes aggregate web totals by default for listed sites with recorded traffic. Tenant reports remain scoped to the selected project.
- Restricted sites without a recorded pageview to SCF managing. Sites with prior traffic remain eligible when the selected period has zero pageviews.
- Based the SCF managing status on Umami registration and pageview counts for the selected period.
- Showed period totals in the Public Web Activity chart and time series in SCF and Tenant when available.
- Combined Top pages, Countries, Referrers, Devices, Browsers, and Operating systems into a single tabbed table. The Countries map supports zoom, drag, and selection.
- Limited Umami's geographic requests to country-level aggregates and documented the limit in the dashboard.
- Added distinct Live web and Sample API indicators and source labels throughout Overview. Web reports wait for Umami before rendering, and sample fallbacks are explicitly labeled.
- Labeled routes and API metrics as simulated in Projects. The planned OpenTelemetry Protocol (OTLP) collector will provide live metrics.
- Hid exports in Public. SCF can export ecosystem totals or the selected project from the API view. Tenant exports include only the selected project's metrics.
