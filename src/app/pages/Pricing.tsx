import { useMemo } from "react";
import { usePageMeta } from "../lib/seo";
import { Reveal } from "../components/Reveal";
import { Link } from "react-router-dom";

const FAQS = [
  {
    q: "Why is the full report $9 and the check free?",
    a: "The instant check hits the same live sources and is free forever — unlimited, no sign-up. The $9 is for the write-up: a clean PDF that packages the ledger, suggested alternatives, and USPTO record links, ready to download the moment payment clears.",
  },
  {
    q: "Do I need an account?",
    a: "No. NameClear has no accounts and no dashboard. Check as much as you want, and pay for a single report only when you want it.",
  },
  {
    q: "What payment methods are accepted?",
    a: "Stripe Checkout accepts all major cards and Apple Pay where available. It is a one-time payment — there is no subscription and nothing to cancel.",
  },
  {
    q: "How current is the data?",
    a: "Every check queries live registries and the USPTO register at the moment you run it. Search results are cached for an hour per name so repeated checks are instant; paid reports regenerate fresh on fulfillment.",
  },
  {
    q: "Is this legal advice?",
    a: "No. NameClear is an automated screening tool. Trademark findings are a starting point for your own review — always consult a licensed trademark attorney before filing or using a mark.",
  },
];

export function Pricing() {
  usePageMeta({
    title: "Pricing",
    description:
      "NameClear checks are free and unlimited. The full brand name report is a one-time $9 — no subscription, PDF ready to download after Stripe payment.",
    path: "/pricing",
    schemas: useMemo(
      () => [
        {
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@type": "WebPage",
          name: "NameClear pricing",
          description: "Free unlimited checks and a one-time $9 full brand name report.",
        },
      ],
      [],
    ),
  });

  return (
    <>
      <section className="hero">
        <div className="page">
          <p className="kicker">01 — pricing</p>
          <h1 className="hero-title" style={{ maxWidth: "12ch" }}>
            One report.
            <br />
            <span className="flame">Nine dollars.</span>
          </h1>
          <p className="hero-lede">
            NameClear is free to check and $9 when you want the full write-up. No subscription, no
            account, no surprises.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="page">
          <Reveal>
            <div className="price-grid">
              <div className="price-card">
                <p className="price-name">Instant check</p>
                <p className="price-amount">
                  <span className="currency">$</span>0<span className="period"> forever</span>
                </p>
                <p className="price-desc">
                  Everything you see on the home page. Run it as many times as you like.
                </p>
                <ul className="price-list">
                  <li>Domains — .com .co .io .net .app, live RDAP</li>
                  <li>USPTO trademark scan — alive records only</li>
                  <li>Social handles — X, Instagram, TikTok, YouTube</li>
                  <li>Suggested alternatives when your name is taken</li>
                  <li>No sign-up, no email required</li>
                </ul>
                <Link className="btn btn-paper" to="/" style={{ alignSelf: "flex-start" }}>
                  Check a name →
                </Link>
              </div>
              <div className="price-card featured">
                <p className="price-name" style={{ color: "var(--flame)" }}>
                  Full report
                </p>
                <p className="price-amount">
                  <span className="currency">$</span>9<span className="period"> one-time</span>
                </p>
                <p className="price-desc">
                  The same live data, packaged into a clean PDF, ready to download the moment
                  payment clears.
                </p>
                <ul className="price-list">
                  <li>Everything in the instant check</li>
                  <li>Complete availability ledger as a PDF</li>
                  <li>Suggested domain and handle alternatives</li>
                  <li>USPTO record links for every finding</li>
                  <li>Downloads instantly after payment — no email, no inbox</li>
                </ul>
                <Link className="btn btn-flame" to="/" style={{ alignSelf: "flex-start" }}>
                  Run a free check →
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="page">
          <Reveal>
            <p className="kicker" style={{ marginBottom: 28 }}>
              02 — questions
            </p>
            <div className="faq">
              {FAQS.map((f) => (
                <details className="faq-item" key={f.q}>
                  <summary>{f.q}</summary>
                  <p className="faq-body">{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
