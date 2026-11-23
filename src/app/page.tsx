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
            Reviewer console for a proposed shared, free web and API analytics service for
            Stellar projects.
          </p>
          <p>
            <strong>Available in the demo.</strong> Public, SCF, and Tenant dashboards, the roadmap,
            and live web metrics from Umami.
          </p>
          <p>
            Stellar projects appear in the analytics dashboards once Umami records their first pageview.
          </p>
          <p>
            <strong>API metrics.</strong> {API_METRICS_NOTICE} Enrollment, keys, and data
            erasure demonstrate the proposed workflows.
          </p>
          <p>
            <a href="https://scf.gitbook.io/scf-docs-1">Read the project GitBook</a>
            {" · "}
            <a href="https://github.com/HeylmStoned/scf-analytics-console">Console repository</a>
          </p>
        </header>
      }
    />
  );
}
