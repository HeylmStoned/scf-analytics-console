import styles from "./Roadmap.module.css";

const milestones = [
	{
		number: 1,
		title: "Architecture, infrastructure & core development",
		tranches: [
			{
				number: 0,
				label: "Design & setup",
				timing: "Upon approval",
				budget: 9800,
				deliverables: [
					{
						title: "Technical design and development setup",
						budget: null,
						scope:
							"Finalize the specifications, system architecture, infrastructure configuration and threat model. Set up development hosting, the initial PostgreSQL database and the deployment pipeline.",
						validation: null,
					},
				],
			},
			{
				number: 1,
				label: "Web analytics MVP",
				timing: "End of week 8",
				budget: 19600,
				deliverables: [
					{
						title: "Umami fork and multi-tenant core",
						budget: 11200,
						scope:
							"Add Stellar project enrollment, tenant management, project dashboards and PostgreSQL row-level security. Set up the core application and database on Supabase Enterprise.",
						validation:
							"Deploy to staging. Demonstrate project enrollment and dashboard access, test isolation between tenants, and verify that SCF operator access is separate.",
					},
					{
						title: "Privacy-first web analytics tracker",
						budget: 8400,
						scope:
							"Ship a version-pinned JavaScript tracker with immutable releases and subresource integrity. Collect pageviews, unique visitors, bounce rate, session duration, referrers, country, device and browser.",
						validation:
							"Show test events arriving in the correct dashboard after adding a script tag. Verify bot filtering, IP minimization, cookie and local storage behavior, and script pinning.",
					},
				],
			},
		],
	},
	{
		number: 2,
		title: "API analytics, security & ecosystem integration",
		tranches: [
			{
				number: 2,
				label: "API analytics & security",
				timing: "End of week 12",
				budget: 29400,
				deliverables: [
					{
						title: "OpenTelemetry API analytics pipeline",
						budget: 16000,
						scope:
							"Accept a second OpenTelemetry export and aggregate request counts, HTTP statuses and latency histograms hourly. Normalize routes with dynamic IDs, UUIDs, hashes and Stellar G, C and M addresses.",
						validation:
							"A test project exports metrics end to end. Verify route normalization and storage under tenant isolation and retention policies.",
					},
					{
						title: "SCF dashboard, security and reliability",
						budget: 13400,
						scope:
							"Complete cross-project dashboards and operator controls for scoped API keys, key revocation, project removal, enrollment approval, deletion and retention.",
						validation:
							"Test operator permissions, tenant isolation, revoked keys, privacy and ingestion. Validate the design target of about one million API requests per day, including peak loads.",
					},
				],
			},
		],
	},
	{
		number: 3,
		title: "Mainnet launch, adoption & handover",
		tranches: [
			{
				number: 3,
				label: "Mainnet & handover",
				timing: "End of week 16",
				budget: 39200,
				deliverables: [
					{
						title: "Production deployment and pilot onboarding",
						budget: 24000,
						scope:
							"Launch the complete analytics service. Onboard three SCF-awarded projects for web analytics and one for API analytics.",
						validation:
							"Pilots collect and visualize real usage, SCF sees ecosystem aggregates, and production monitoring, backups and security controls are operational.",
					},
					{
						title: "User testing, open-source release and SCF handover",
						budget: 15200,
						scope:
							"Run professional user tests and incorporate feedback. Release the MIT monorepo with the collector, tracker, Docker Compose, Terraform, tests, onboarding guides and runbooks.",
						validation:
							"Hand over repository ownership, a full PostgreSQL dump and restore instructions, domain transfer or redirect instructions, and a recorded demo of tenant and operator views.",
					},
				],
			},
		],
	},
];

const usd = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});
const tranches = milestones.flatMap((milestone) => milestone.tranches);
const requestedGrant = tranches.reduce(
	(total, tranche) => total + tranche.budget,
	0,
);

export function Roadmap() {
	return (
		<div className={styles.roadmap}>
			<dl className={styles.summary}>
				<div className="panel">
					<dt>Requested SCF grant</dt>
					<dd>
						{usd.format(requestedGrant)} USD<small>In XLM equivalent</small>
					</dd>
				</div>
				<div className="panel">
					<dt>Production target</dt>
					<dd>
						16 weeks<small>Estimated from project kickoff</small>
					</dd>
				</div>
				<div className="panel">
					<dt>Hosting and support</dt>
					<dd>
						12 months<small>From approval of the final tranche</small>
					</dd>
				</div>
			</dl>
			<section
				className={"panel " + styles.timeline}
				aria-labelledby="roadmap-timeline"
			>
				<h2 id="roadmap-timeline">Delivery timeline</h2>
				<ol>
					{tranches.map((tranche) => (
						<li key={tranche.number}>
							<button
								type="button"
								onClick={() => {
									const details = document.getElementById(
										`roadmap-tranche-${tranche.number}`,
									);
									if (!(details instanceof HTMLDetailsElement)) return;
									details.open = true;
									details
										.querySelector("summary")
										?.focus({ preventScroll: true });
									details.scrollIntoView({ block: "start" });
								}}
							>
								<span className={styles.timing}>{tranche.timing}</span>
								<span className={styles.marker} aria-hidden="true" />
								<strong>{tranche.label}</strong>
							</button>
						</li>
					))}
				</ol>
			</section>
			{milestones.map((milestone) => (
				<section
					key={milestone.number}
					className={styles.milestone}
					aria-labelledby={`milestone-${milestone.number}`}
				>
					<p className={styles.label}>Milestone {milestone.number}</p>
					<h2 id={`milestone-${milestone.number}`}>{milestone.title}</h2>
					{milestone.tranches.map((tranche) => (
						<details
							className={"panel " + styles.tranche}
							key={tranche.number}
							id={`roadmap-tranche-${tranche.number}`}
							open
						>
							<summary>
								<span>
									<strong>Tranche #{tranche.number}</strong>
									<small>{tranche.timing}</small>
								</span>
								<span className={styles.budget}>
									{usd.format(tranche.budget)}{" "}
									<small>{(tranche.budget / requestedGrant) * 100}%</small>
								</span>
							</summary>
							<ul className={styles.deliverables}>
								{tranche.deliverables.map((deliverable) => (
									<li key={deliverable.title}>
										<h3>{deliverable.title}</h3>
										{deliverable.budget !== null && (
											<p className={styles.amount}>
												{usd.format(deliverable.budget)}
											</p>
										)}
										<p>{deliverable.scope}</p>
										{deliverable.validation && (
											<p>
												<strong>Completion criteria</strong>{" "}
												{deliverable.validation}
											</p>
										)}
									</li>
								))}
							</ul>
						</details>
					))}
				</section>
			))}
			<p className={styles.source}>Estimates are relative to kickoff.</p>
		</div>
	);
}
