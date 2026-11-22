import { Console } from "@/components/Console";
import { API_METRICS_NOTICE } from "@/lib/model";
import { activeUmamiProjects } from "@/lib/umami";

export const dynamic = "force-dynamic";

export default async function Page() {
  const umamiSites = await activeUmamiProjects(process.env).catch(() => null);

  return (
    <Console
      umamiSites={umamiSites}
      introduction={
        <header className="gate-intro">
          <h1>Stellar ecosystem analytics</h1>
          <p className="lede">
            This proof of concept shows how the Stellar Community Fund and project teams can
            explore and compare web and API usage across the Stellar ecosystem.
          </p>
          <p>
            Live web totals come from Umami. The Public, SCF, and Tenant demo views are open to reviewers.
            Reviewer roles, operator controls, and data erasure demonstrate proposed workflows.
          </p>
          <p>
            Stellar projects appear in the analytics dashboards once Umami records their first pageview.
          </p>
          <p>{API_METRICS_NOTICE}</p>
          <a href="https://scf.gitbook.io/scf-docs-1">Read the project GitBook</a>
        </header>
      }
    />
  );
}
