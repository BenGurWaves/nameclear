type Env = {
  STRIPE_SECRET_KEY: string;
  PUBLIC_SITE_URL?: string;
};

// Stripe secret key is server-only. Never expose it to the browser bundle.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe Checkout is not configured" }, { status: 500 });
  }

  const origin = env.PUBLIC_SITE_URL || new URL(request.url).origin;
  const body = new URLSearchParams({
    mode: "subscription",
    // Product pricing is intentionally defined here: $4.99 USD per month.
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "499",
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": "DecisionMath Plus",
    "line_items[0][price_data][product_data][description]": "Saved scenarios, PDF exports, and scenario comparisons",
    "line_items[0][quantity]": "1",
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  });

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const session = await stripeResponse.json() as { url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !session.url) {
    return Response.json({ error: session.error?.message || "Stripe could not create a checkout session" }, { status: 502 });
  }
  return Response.json({ url: session.url });
};
