type Env = {
  STRIPE_SECRET_KEY: string;
  PUBLIC_SITE_URL?: string;
};

const allowedOrigin = (request: Request, env: Env) => {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  // Accept the current Pages deployment origin and the configured canonical origin.
  // This supports preview deployments without allowing arbitrary cross-site requests.
  return origin === requestOrigin || (configuredOrigin ? origin === configuredOrigin : false);
};

// Stripe secret key is server-only. Never expose it to the browser bundle.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe Checkout is not configured" }, { status: 500 });
  }
  if (!allowedOrigin(request, env)) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const origin = env.PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  const body = new URLSearchParams({
    mode: "subscription",
    // Product pricing is intentionally defined here: $4.99 USD per month.
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "499",
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": "DecisionMath Plus",
    "line_items[0][price_data][product_data][description]": "Saved scenarios, PDF exports, and scenario comparisons",
    "line_items[0][quantity]": "1",
    success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal: controller.signal,
  });
  clearTimeout(timeout);

  const session = await stripeResponse.json() as { url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !session.url) {
    return Response.json({ error: session.error?.message || "Stripe could not create a checkout session" }, { status: 502 });
  }
  return Response.json({ url: session.url });
};
