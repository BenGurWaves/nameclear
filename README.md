# FilingWatch

FilingWatch is a React + Vite SEC filing alert interface for tracking public filings from EDGAR. The client includes a live-check experience, results feed, watchlist dashboard, pricing surface, and informational About page.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4 conventions with project-local CSS tokens
- Cloudflare-ready API boundary for SEC requests and Stripe Checkout
- Supabase Auth/database placeholders for the production account layer

## Environment

Copy `.env.example` to `.env.local`. Never put SEC private credentials, Stripe secret keys, or Supabase service-role keys in the browser bundle. The SEC User-Agent must be set server-side in the Cloudflare function that proxies EDGAR.

## Run locally

```bash
npm install
npm run dev
```

The UI currently uses representative filing rows so the product can be previewed without credentials. Production wiring should connect `/api/sec-search` to `efts.sec.gov` or `data.sec.gov` with `SEC_USER_AGENT`, Supabase Auth for login, scheduled Cloudflare jobs for watchlist polling, and Stripe Checkout for the Signal plan.
