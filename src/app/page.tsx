import { Console } from "@/components/Console";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Console
      betaConfigured={Boolean(process.env.UMAMI_BETA?.trim())}
      introduction={
        <header className="gate-intro">
          <h1>Stellar ecosystem analytics</h1>
          <p className="lede">
            This proof of concept shows how the Stellar Community Fund and project teams can
            explore and compare web and API usage across the Stellar ecosystem.
          </p>
          <p>
            Web metrics come from Umami when connected, with sample web metrics
            as a fallback. API charts and project profiles use sample data. Reviewer roles,
            operator controls, and data erasure demonstrate proposed workflows.
          </p>
          <a href="https://scf.gitbook.io/scf-docs-1">Read the project GitBook</a>
        </header>
      }
    />
  );
}
