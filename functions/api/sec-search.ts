type Env = { SEC_USER_AGENT: string };

// Cloudflare Pages Function: keeps the SEC-required User-Agent off the browser.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return Response.json({ error: "Missing q" }, { status: 400 });
  const userAgent = env.SEC_USER_AGENT;
  if (!userAgent) return Response.json({ error: "SEC_USER_AGENT is not configured" }, { status: 500 });

  const response = await fetch(`https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(query)}&dateRange=all&from=0&size=20`, {
    headers: { "User-Agent": userAgent, Accept: "application/json" },
  });
  if (!response.ok) return Response.json({ error: "SEC search unavailable" }, { status: 502 });
  return new Response(response.body, { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } });
};
