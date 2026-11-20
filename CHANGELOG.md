# Changelog

## Unreleased

- Rendered the welcome text and project GitBook link in the initial HTML so reviewers can read them before JavaScript runs.
- Added the Umami tracker to the POC and server-side Umami Cloud API key support. The web dashboard can load analytics for the Railway demo with `UMAMI_ALPHA` alone. `.env.example` documents the configuration.
- Added live visits, bounces, period comparisons, and available Umami breakdowns for traffic sources, events, pages, and audience. API analytics continue to use sample data.
- Showed Lend.xyz only in SCF managing until its Umami website ID is configured.

- Added a Roadmap view immediately after Overview. The delivery timeline links to tranches 1 to 3 at weeks 8, 12, and 16. Each tranche lists its deliverables and completion criteria. The roadmap links to the SCF RFP, and the project GitBook is accessible directly from the navigation.
- Consolidated reviewer mode switching in the Workspace menu. Analytics views still show the data source and offer a date range where applicable.
- Hid the export button in Public mode. SCF can export ecosystem totals or the selected project from the API view. In Tenant mode, **Export data from your project** downloads analytics for that project only.
- Added Dark Reader compatibility metadata for the console's built-in dark theme.
