import Stripe from "stripe";
import type { NameClearEnv } from "../../../server/env";
import { fulfillReport } from "../../../server/fulfill";

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const onRequestPost: PagesFunction<NameClearEnv> = async ({ request, env, waitUntil }) => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: "Webhook not configured" }, 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return json({ error: "Missing signature" }, 400);
  }

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "");
    event = stripe.webhooks.constructEvent(raw, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return json({ error: "Invalid signature" }, 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const name = session.metadata?.searched_name ?? "";
    const email = (session.customer_details?.email ?? "").toLowerCase();
    const paymentIntent =
      typeof session.payment_intent === "object" ? session.payment_intent : null;
    const paymentId = paymentIntent?.id ?? session.payment_intent?.toString() ?? "";

    if (name && email && paymentId) {
      waitUntil(fulfillReport(env, { name, email, paymentId }).catch(() => {}));
    }
  }

  return json({ received: true });
};
