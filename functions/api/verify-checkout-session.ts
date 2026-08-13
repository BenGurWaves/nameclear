type Env = { STRIPE_SECRET_KEY: string };

const encode = (value: ArrayBuffer | string) => {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return encode(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const sessionId = new URL(request.url).searchParams.get("session_id") || "";
  if (!env.STRIPE_SECRET_KEY || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return Response.json({ error: "Invalid checkout session" }, { status: 400 });
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } });
  if (!response.ok) return Response.json({ error: "Checkout session could not be verified" }, { status: 401 });
  const session = await response.json() as { status?: string; payment_status?: string; mode?: string; subscription?: string | null };
  if (session.status !== "complete" || session.payment_status !== "paid" || session.mode !== "subscription" || !session.subscription) return Response.json({ error: "Payment has not been completed" }, { status: 402 });
  const subscriptionId = session.subscription;
  if (!/^sub_[A-Za-z0-9_]+$/.test(subscriptionId)) return Response.json({ error: "Checkout subscription could not be verified" }, { status: 402 });
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 31;
  const value = `${sessionId}.${subscriptionId}.${expiresAt}`;
  const token = `${value}.${await sign(value, env.STRIPE_SECRET_KEY)}`;
  return new Response(JSON.stringify({ active: true }), { headers: { "Content-Type": "application/json", "Set-Cookie": `dm_plus=${token}; Max-Age=2678400; Path=/; HttpOnly; Secure; SameSite=Lax` } });
};
