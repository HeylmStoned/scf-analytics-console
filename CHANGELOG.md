# Changelog

## Unreleased

### Reviewer experience

- Rendered the welcome text and project GitBook link in the initial HTML so reviewers can read them before JavaScript runs. The welcome page explains which metrics are live and which are simulated.
- Opened the Public, SCF, and Tenant demo perspectives without a sign-in step. The Workspace menu switches between perspectives.
- Added the SCF project rollout chart with the demo site, Lend.xyz awaiting its Umami website ID, and Prism.fi as a project to be added.
- Added the Roadmap after Overview, with delivery tranches at weeks 8, 12, and 16. Each tranche lists deliverables and completion criteria. The navigation also links directly to the project GitBook.
- Added Dark Reader compatibility metadata for the console's built-in dark theme.

### Analytics and privacy

- Added the Umami tracker and server-side API key support. The demo works with `UMAMI_ALPHA` alone, and `.env.example` documents the optional second site and live project allowlist.
- Limited Public to aggregate website totals and the period-level Web Activity chart. SCF and Tenant show web activity over time when available.
- Combined Top pages, Countries, Referrers, Devices, Browsers, and Operating systems into a single tabbed table. The Countries map supports zoom, drag, and selection.
- Limited Umami's geographic requests to country-level aggregates and documented the limit in the dashboard.
- Added distinct Live web and Sample API indicators and source labels throughout Overview. Web reports wait for Umami before rendering, and sample fallbacks are explicitly labeled.
- Kept API traffic simulated pending implementation of the OpenTelemetry Protocol (OTLP) collector. SCF shows sample API metrics for available projects, and Tenant shows the selected project's sample metrics.
- Hid exports in Public. SCF can export ecosystem totals or the selected project from the API view. Tenant exports include only the selected project's metrics.
