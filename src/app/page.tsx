import { Console } from "@/components/Console";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      {/*
        Server-rendered so automated reviewers and no-JS browsers see the
        plain-text landing without waiting for the client console to hydrate.
      */}
      <section className="poc-ssr-landing" aria-label="Proof of concept summary">
        <p className="eyebrow">Proof of concept</p>
        <h1>Stellar ecosystem analytics</h1>
        <p>
          Reviewer console for a shared, free web and API analytics service for Stellar
          projects. This deployment is a UI prototype — not production hosting, ingest, or
          tenant isolation.
        </p>
        <p>
          <strong>Real today.</strong> Interactive Public / SCF / Tenant layouts, roadmap, and
          (when configured) live web aggregates from Umami.
        </p>
        <p>
          <strong>Fictional / sample.</strong> API request counts, latency, and most enrollment /
          key / erase flows use demo fixtures or session state that resets on reload.
        </p>
        <p>
          <strong>Design docs.</strong>{" "}
          <a href="https://scf.gitbook.io/scf-docs-1" target="_blank" rel="noreferrer">
            GitBook technical design
          </a>
          {" · "}
          <a href="https://github.com/HeylmStoned/scf-analytics-console" target="_blank" rel="noreferrer">
            Console repository
          </a>
        </p>
      </section>
      <Console />
    </>
  );
}
