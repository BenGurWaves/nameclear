type Env = { SEC_USER_AGENT: string };
type SecTicker = { cik: number; ticker: string; name: string };
const trackedForms = new Set(["8-K", "4", "SCHEDULE 13D", "SCHEDULE 13G", "10-K", "10-Q"]);
// Fast fallback for the most searched public companies when the SEC ticker
// directory is rate-limited at an edge. Filing details still come live from SEC.
const commonCompanies: Record<string, SecTicker> = {
  AAPL: { cik: 320193, ticker: "AAPL", name: "Apple Inc." }, NVDA: { cik: 1045810, ticker: "NVDA", name: "NVIDIA CORP" },
  TSLA: { cik: 1318605, ticker: "TSLA", name: "Tesla, Inc." }, MSFT: { cik: 789019, ticker: "MSFT", name: "MICROSOFT CORP" },
  AMZN: { cik: 1018724, ticker: "AMZN", name: "AMAZON COM INC" }, GOOGL: { cik: 1652044, ticker: "GOOGL", name: "Alphabet Inc." },
  GOOG: { cik: 1652044, ticker: "GOOG", name: "Alphabet Inc." }, META: { cik: 1326801, ticker: "META", name: "Meta Platforms, Inc." },
  AMD: { cik: 2488, ticker: "AMD", name: "ADVANCED MICRO DEVICES INC" }, NFLX: { cik: 1065280, ticker: "NFLX", name: "NETFLIX INC" },
  INTC: { cik: 50863, ticker: "INTC", name: "INTEL CORP" }, JPM: { cik: 19617, ticker: "JPM", name: "JPMORGAN CHASE & CO" },
  V: { cik: 1403161, ticker: "V", name: "VISA INC." }, MA: { cik: 1141391, ticker: "MA", name: "Mastercard Inc" },
};
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
  const wanted = normalize(query);
  let match = commonCompanies[query.toUpperCase()];
  if (tickerResponse.ok) {
    const tickerDirectory = await tickerResponse.json() as { data: Array<[number, string, string, string]> };
    const companies = tickerDirectory.data.map(([cik, name, ticker]) => ({ cik, name, ticker } satisfies SecTicker));
    match = match ?? companies.find((company) => normalize(company.ticker) === wanted) ?? companies.find((company) => normalize(company.name).includes(wanted));
  }
  if (!match) return Response.json({ error: tickerResponse.ok ? `No SEC-listed company matched “${query}”. Try a ticker such as AAPL or NVDA.` : "The SEC company directory is temporarily rate-limited. Try a major ticker such as AAPL, NVDA, or TSLA." }, { status: tickerResponse.ok ? 404 : 503 });
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
