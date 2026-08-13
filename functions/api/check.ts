import { checkPart, validateName } from "../../server/check";
import type { NameClearEnv } from "../../server/env";
import type { CheckPart } from "../../server/types";

const PARTS: CheckPart[] = ["domains", "trademark", "social"];

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const onRequestGet: PagesFunction<NameClearEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const name = validateName(url.searchParams.get("name") ?? "");
  const part = url.searchParams.get("part") ?? "";

  if (!name) {
    return json({ error: "Invalid name. Use 1-60 letters, numbers, spaces, or hyphens." }, 400);
  }
  if (!PARTS.includes(part as CheckPart)) {
    return json({ error: "part must be one of: domains, trademark, social" }, 400);
  }

  const payload = await checkPart(env, part as CheckPart, name);
  return json(payload);
};
