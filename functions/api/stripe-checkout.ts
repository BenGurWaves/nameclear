type Env = { STRIPE_CHECKOUT_URL: string };

// Store the Stripe secret key only in Cloudflare secrets. The first production
// version can redirect to a Stripe Payment Link; no card fields belong here.
export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  if (!env.STRIPE_CHECKOUT_URL) return Response.json({ error: "Stripe checkout is not configured" }, { status: 500 });
  return Response.json({ url: env.STRIPE_CHECKOUT_URL });
};
