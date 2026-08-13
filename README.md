# DecisionMath

DecisionMath is a React + Vite hub of standalone financial decision calculators. Every calculator is self-contained and runs with pure math in the browser; saved scenarios and PDF export are paid features.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4 conventions with project-local CSS tokens
- Cloudflare-ready deployment
- Supabase Auth/database for the optional paid account layer
- Stripe Checkout or Payment Links for paid upgrades

## Environment

Copy `.env.example` to `.env.local`. Public browser configuration may use `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_STRIPE_PUBLISHABLE_KEY`. Keep `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_MONTHLY`, and any Supabase service-role key server-side in Cloudflare secrets only. Stripe Checkout is created by `functions/api/create-checkout-session.ts`; the secret key never enters the browser bundle.

## Run locally

```bash
npm install
npm run dev
```

The calculator UI works without credentials or external APIs. Production account wiring should connect Supabase Auth/database to the save actions and use a Cloudflare serverless function to create Stripe Checkout sessions. The cost-of-living city index is intentionally static and should be manually refreshed roughly annually from a public source.
