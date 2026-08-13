import { createCheckoutSession } from "../../server/checkout";
import type { NameClearEnv } from "../../server/env";
import { validateName } from "../../server/check";

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const onRequestPost: PagesFunction<NameClearEnv> = async ({ request, env }) => {
  let body: { name?: string } = {};
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const name = validateName(body.name ?? "");
  if (!name) {
    return json({ error: "Invalid name. Use 1-60 letters, numbers, spaces, or hyphens." }, 400);
  }

  try {
    const origin = request.headers.get("Origin") ?? new URL(request.url).origin;
    const { url } = await createCheckoutSession(env, { name, origin });
    return json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout unavailable";
    return json({ error: message }, 500);
  }
};
