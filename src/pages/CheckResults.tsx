import { useEffect, useState } from "react";
import { ArrowUpRight, Bell, Search } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type Filing = { ticker: string; company: string; type: string; date: string; time: string; title: string; detail: string; href: string; tone: string };
const types = ["All filings", "8-K", "Form 4", "13D / 13G", "10-K / 10-Q"];

function FilingRow({ filing }: { filing: Filing }) {
  return <a className="filing-row" href={filing.href} target="_blank" rel="noreferrer"><span className={`filing-dot ${filing.tone}`}></span><span className="filing-main"><strong>{filing.ticker} <em>{filing.type}</em></strong><span>{filing.title}</span></span><span className="filing-time"><b>{filing.date}</b>{filing.time}</span><ArrowUpRight size={16} className="row-arrow"/></a>;
}

export default function CheckResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All filings");
  const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") || "");
  const [result, setResult] = useState<{ ticker: string; company: string; filings: Filing[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(term = query) {
    const clean = term.trim();
    if (!clean) { setError("Enter a ticker or company name to search."); setResult(null); return; }
    setLoading(true); setError(""); setFilter("All filings");
    try {
      const response = await fetch(`/api/sec-search?q=${encodeURIComponent(clean)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The SEC search could not be completed.");
      setResult(body); navigate(`/check-results?query=${encodeURIComponent(clean.toUpperCase())}`, { replace: true });
    } catch (cause) { setResult(null); setError(cause instanceof Error ? cause.message : "The SEC search could not be completed."); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (query) void search(query); }, []);
  const visible = result?.filings.filter((filing) => filter === "All filings" || filter.includes(filing.type) || (filter === "10-K / 10-Q" && ["10-K", "10-Q"].includes(filing.type))) || [];

  return <><title>Recent SEC Filings by Company | FilingWatch</title><section className="page-shell results-page"><div className="page-heading"><div><p className="eyebrow">INSTANT CHECK</p><h1>Recent SEC filings</h1><p>Live results from the SEC's official EDGAR system.</p></div><Link to="/" className="button button-outline">New search <Search size={16}/></Link></div><form className="result-search" onSubmit={(event) => { event.preventDefault(); void search(); }}><Search size={20}/><input aria-label="Search another ticker or company" placeholder="Search another ticker or company" value={query} onChange={(event) => setQuery(event.target.value)}/><button className="button button-lime" disabled={loading}>{loading ? "Searching…" : <>Search <ArrowUpRight size={15}/></>}</button></form>{error && <div className="search-state error-state"><strong>We couldn't find that company.</strong><span>{error}</span></div>}{!error && loading && <div className="search-state">Checking live EDGAR filings for {query.toUpperCase()}…</div>}{!error && !loading && result && <><div className="filter-line"><span>Showing results for <strong>{result.company} ({result.ticker})</strong></span><div className="filter-buttons">{types.map((type) => <button type="button" className={filter === type ? "active" : ""} onClick={() => setFilter(type)} key={type}>{type}</button>)}</div></div>{visible.length ? <div className="results-list">{visible.map((filing) => <FilingRow filing={filing} key={filing.href}/>)}</div> : <div className="search-state">No tracked filing types were found for {result.ticker} in the SEC's recent feed.</div>}<div className="results-cta"><Bell size={21}/><div><strong>Want to know when {result.ticker} files again?</strong><span>Create a free watchlist and get a daily digest.</span></div><Link to="/dashboard" className="button button-dark">Create free account <ArrowUpRight size={15}/></Link></div></>}</section></>;
}
