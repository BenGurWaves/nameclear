type Env = { SEC_USER_AGENT: string };
type SecTicker = { cik: number; ticker: string; name: string };
const trackedForms = new Set(["8-K", "4", "SCHEDULE 13D", "SCHEDULE 13G", "10-K", "10-Q"]);
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
function filingDescription(form: string) {
  if (form === "8-K") return "Material event disclosed by the company";
  if (form === "4") return "An insider bought or sold shares";
  if (form.includes("13D") || form.includes("13G")) return "A large stake or ownership position changed";
  if (form === "10-K") return "The company filed its annual financial report";
  return "The company filed its quarterly financial report";
}

// Cloudflare Pages Function: resolves a company and reads its live SEC submissions.
// The SEC-required User-Agent stays server-side on every SEC request.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return Response.json({ error: "Enter a ticker or company name." }, { status: 400 });
  if (!env.SEC_USER_AGENT) return Response.json({ error: "SEC_USER_AGENT is not configured." }, { status: 500 });
  const headers = { "User-Agent": env.SEC_USER_AGENT, Accept: "application/json" };
  // This CDN-backed exchange index is reliable from Cloudflare edges.
  const tickerResponse = await fetch("https://www.sec.gov/files/company_tickers_exchange.json", { headers });
  if (!tickerResponse.ok) return Response.json({ error: "The SEC company directory is unavailable right now." }, { status: 502 });
  const tickerDirectory = await tickerResponse.json() as { data: Array<[number, string, string, string]> };
  const wanted = normalize(query);
  const companies = tickerDirectory.data.map(([cik, name, ticker]) => ({ cik, name, ticker } satisfies SecTicker));
  const match = companies.find((company) => normalize(company.ticker) === wanted) ?? companies.find((company) => normalize(company.name).includes(wanted));
  if (!match) return Response.json({ error: `No SEC-listed company matched “${query}”. Try a ticker such as AAPL or NVDA.` }, { status: 404 });
  const cik = String(match.cik).padStart(10, "0");
  const submissionsResponse = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers });
  if (!submissionsResponse.ok) return Response.json({ error: "The SEC filing feed is unavailable right now." }, { status: 502 });
  const submissions = await submissionsResponse.json() as { filings: { recent: Record<string, string[]> } };
  const recent = submissions.filings.recent;
  const filings = recent.form.map((form, index) => {
    const accession = recent.accessionNumber[index];
    const accessionPath = accession.replaceAll("-", "");
    const primaryDocument = recent.primaryDocument[index];
    return { ticker: match.ticker, company: match.name, type: form === "4" ? "Form 4" : form.replace("SCHEDULE ", ""), date: recent.filingDate[index], time: "", title: recent.primaryDocDescription[index] || form, detail: filingDescription(form), href: `https://www.sec.gov/Archives/edgar/data/${match.cik}/${accessionPath}/${primaryDocument}`, tone: form === "8-K" ? "lime" : form === "4" ? "orange" : form.includes("13") ? "blue" : "purple" };
  }).filter((_, index) => trackedForms.has(recent.form[index])).slice(0, 20);
  return Response.json({ ticker: match.ticker, company: match.name, cik, filings }, { headers: { "Cache-Control": "public, max-age=60" } });
};
