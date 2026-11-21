import { Console } from "@/components/Console";
import { API_METRICS_NOTICE } from "@/lib/model";
import { publicUmamiProjects } from "@/lib/umami";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Console
      publicProjects={publicUmamiProjects(process.env.UMAMI_PUBLIC_PROJECTS)}
      betaConfigured={Boolean(process.env.UMAMI_BETA?.trim())}
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
            Stellar projects such as Prism.fi will be added gradually so reviewers can explore their
            analytics in the dashboard.
          </p>
          <p>{API_METRICS_NOTICE}</p>
          <a href="https://scf.gitbook.io/scf-docs-1">Read the project GitBook</a>
        </header>
      }
    />
  );
}
