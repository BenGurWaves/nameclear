import { useMemo, useRef, useState } from "react";
import type {
  DomainsPayload,
  PartState,
  SocialPayload,
  TrademarkPayload,
} from "../types";
import { checkPartApi, createCheckout } from "../lib/api";
import { SITE_NAME, SITE_TAGLINE, usePageMeta } from "../lib/seo";
import { CheckForm } from "../components/CheckForm";
import {
  DomainsSection,
  SocialSection,
  TrademarkSection,
} from "../components/Results";
import { Reveal } from "../components/Reveal";

export function Home() {
  const [query, setQuery] = useState("");
  const [domains, setDomains] = useState<PartState<DomainsPayload>>({ status: "idle" });
  const [trademark, setTrademark] = useState<PartState<TrademarkPayload>>({ status: "idle" });
  const [social, setSocial] = useState<PartState<SocialPayload>>({ status: "idle" });
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  usePageMeta({
    title: "Is your brand name available?",
    description: SITE_TAGLINE,
    path: "/",
    schemas: useMemo(
      () => [
        {
          "@type": "WebSite",
          name: SITE_NAME,
          url: "https://nameclear.pages.dev",
          description: SITE_TAGLINE,
        },
        {
          "@type": "WebPage",
          name: "NameClear — brand name availability checker",
          description: SITE_TAGLINE,
        },
      ],
      [],
    ),
  });

  const handleCheck = async (name: string) => {
    setQuery(name);
    setChecking(true);
    setCheckError(null);
    setCheckoutError(null);
    setDomains({ status: "loading" });
    setTrademark({ status: "loading" });
    setSocial({ status: "loading" });

    await Promise.allSettled([
      checkPartApi(name, "domains").then((d) =>
        setDomains({ status: "done", data: d as DomainsPayload }),
      ),
      checkPartApi(name, "trademark").then((d) =>
        setTrademark({ status: "done", data: d as TrademarkPayload }),
      ),
      checkPartApi(name, "social").then((d) =>
        setSocial({ status: "done", data: d as SocialPayload }),
      ),
    ]);

    setChecking(false);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGetReport = async () => {
    if (!query) return;
    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      const { url } = await createCheckout(query);
      window.location.assign(url);
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Checkout is unavailable right now. Try again shortly.",
      );
      setCheckoutBusy(false);
    }
  };

  const allDone =
    domains.status === "done" || trademark.status === "done" || social.status === "done";

  return (
    <>
      <section className="hero">
        <div className="page">
          <div className="hero-grid">
            <div>
              <p className="kicker">01 — name inspector · live checks</p>
              <h1 className="hero-title">
                Is your brand name
                <br />
                <span className="flame">available?</span>
                <br />
                Check everywhere, at once.
              </h1>
              <p className="hero-lede">
                NameClear checks your name across five domain extensions, the live USPTO federal
                trademark register, and the four biggest social platforms — in a single pass, no
                sign-up, free forever. Get answers in seconds, not a weekend of tab-switching.
              </p>
            </div>
            <div className="hero-side" aria-hidden="true">
              <span className="hero-side-vertical">rdap · uspto · social</span>
              <span className="hero-side-meta">free · unlimited<br />no sign-up</span>
            </div>
          </div>

          <Reveal>
            <CheckForm onSubmit={handleCheck} busy={checking} />
            {checkError && (
              <p className="console-error" style={{ marginTop: 14 }}>
                {checkError}
              </p>
            )}
          </Reveal>
        </div>
      </section>

      <section id="results" aria-live="polite" ref={resultsRef}>
        <div className="page" style={{ paddingTop: 24 }}>
          {query && (
            <p className="kicker" style={{ marginBottom: 24 }}>
              {checking ? "running" : "report"} — for "{query}"
            </p>
          )}
          <DomainsSection state={domains} />
          <TrademarkSection state={trademark} />
          <SocialSection state={social} />
        </div>
      </section>

      {query && allDone && (
        <section className="section">
          <div className="page">
            <Reveal>
              <div className="cta-band">
                <div className="cta-grid">
                  <div>
                    <p className="cta-price">$9 · one-time · no subscription</p>
                    <h2 className="cta-title">The full write-up, yours to download.</h2>
                    <p className="cta-copy">
                      Your free check covers the essentials. The full NameClear report packages it
                      into a clean PDF — complete ledger, suggested alternatives, and USPTO record
                      links — ready to download the moment payment clears.
                    </p>
                    <ul className="cta-ticks">
                      <li>PDF delivered instantly after payment</li>
                      <li>Suggested domain and handle alternatives</li>
                      <li>USPTO record links for every finding</li>
                    </ul>
                    {checkoutError && (
                      <p className="console-error" style={{ marginTop: 14 }}>
                        {checkoutError}
                      </p>
                    )}
                  </div>
                  <div>
                    <button
                      className="btn btn-flame"
                      onClick={handleGetReport}
                      disabled={checkoutBusy}
                    >
                      {checkoutBusy ? "Opening checkout…" : "Get full report →"}
                    </button>
                    <p
                      className="mono"
                      style={{
                        marginTop: 14,
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        color: "#a99f8c",
                        maxWidth: 220,
                      }}
                    >
                      Secure card payment via Stripe. Report for "{query}".
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section className="section">
        <div className="page">
          <Reveal>
            <p className="kicker" style={{ marginBottom: 28 }}>
              02 — the sources
            </p>
            <div className="sources">
              <div className="source">
                <p className="source-name">
                  <span className="live-dot" aria-hidden="true" /> Live registry (RDAP)
                </p>
                <p className="source-desc">
                  Availability queried directly against each registry's RDAP endpoint — Verisign
                  for .com/.net, Google for .app, Identity Digital for .io.
                </p>
              </div>
              <div className="source">
                <p className="source-name">
                  <span className="live-dot" aria-hidden="true" /> USPTO TMSearch
                </p>
                <p className="source-desc">
                  Live federal trademark search on the USPTO register — alive records only, with
                  direct links to each official record.
                </p>
              </div>
              <div className="source">
                <p className="source-name">
                  <span className="live-dot" aria-hidden="true" /> X · Instagram · TikTok · YouTube
                </p>
                <p className="source-desc">
                  Exact handle probes plus suggested alternatives when your handle is already taken.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
