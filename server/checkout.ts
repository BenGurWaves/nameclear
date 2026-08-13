import Stripe from "stripe";
import type { NameClearEnv } from "./env";

let stripeClient: Stripe | null = null;

export function getStripe(env: NameClearEnv): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });
  }
  return stripeClient;
}

export interface CheckoutResult {
  url: string;
}

export async function createCheckoutSession(
  env: NameClearEnv,
  input: { name: string; origin: string },
): Promise<CheckoutResult> {
  const stripe = getStripe(env);
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  if (!env.STRIPE_PRICE_ID) {
    throw new Error("STRIPE_PRICE_ID not configured");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    metadata: {
      searched_name: input.name,
      app: "nameclear",
    },
    payment_intent_data: {
      description: `NameClear brand name report for "${input.name}"`,
      metadata: { searched_name: input.name, app: "nameclear" },
    },
    submit_type: "pay",
    success_url: `${input.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/?cancelled=1`,
  });

  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return { url: session.url };
}

export async function getSessionForReport(
  env: NameClearEnv,
  sessionId: string,
): Promise<{ name: string; email: string; paid: boolean; paymentId: string | null }> {
  const stripe = getStripe(env);
  if (!stripe) throw new Error("STRIPE_SECRET_KEY not configured");

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  const name = session.metadata?.searched_name ?? "";
  const email = (session.customer_details?.email ?? session.metadata?.email ?? "").toLowerCase();
  const paymentIntent =
    typeof session.payment_intent === "object" ? session.payment_intent : null;
  const paid = session.payment_status === "paid";
  return {
    name,
    email,
    paid,
    paymentId: paymentIntent?.id ?? session.payment_intent?.toString() ?? null,
  };
}
