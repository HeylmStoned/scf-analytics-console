# Stellar ecosystem analytics

Next.js console for the SCF web and API analytics proof of concept.

- Web totals are read from Umami when available
- API charts use collector sample fixtures
- Reviewer modes: Public, SCF operator, and tenant
- Live demo: https://scf-console-production.up.railway.app

## Local

```bash
npm install
npm run dev
```

Copy `.env.local` from your deploy secrets. Do not commit env files.
