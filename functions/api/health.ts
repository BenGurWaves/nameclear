import type { NameClearEnv } from "../../server/env";

export const onRequestGet: PagesFunction<NameClearEnv> = async () => {
  return new Response(
    JSON.stringify({
      ok: true,
      app: "nameclear",
      time: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
};
