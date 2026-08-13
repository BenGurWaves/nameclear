type Env = { STRIPE_SECRET_KEY: string };

const decode = (value: string) => { const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "="); const binary = atob(normalized); return Uint8Array.from(binary, (character) => character.charCodeAt(0)); };
async function validSignature(value: string, signature: string, secret: string) { const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]); return crypto.subtle.verify("HMAC", key, decode(signature), new TextEncoder().encode(value)); }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const cookie = request.headers.get("Cookie")?.match(/(?:^|;\s*)dm_plus=([^;]+)/)?.[1] || "";
  const [sessionId, subscriptionId, expiresAt, signature] = cookie.split(".");
  const tokenValid = Boolean(env.STRIPE_SECRET_KEY && /^cs_[A-Za-z0-9_]+$/.test(sessionId || "") && /^sub_[A-Za-z0-9_]+$/.test(subscriptionId || "") && Number(expiresAt) > Math.floor(Date.now() / 1000) && signature && await validSignature(`${sessionId}.${subscriptionId}.${expiresAt}`, signature, env.STRIPE_SECRET_KEY));
  let active = false;
  if (tokenValid) {
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } });
    if (response.ok) {
      const subscription = await response.json() as { status?: string };
      active = subscription.status === "active" || subscription.status === "trialing";
    }
  }
  return Response.json({ active });
};
