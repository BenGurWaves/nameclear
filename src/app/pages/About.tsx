import { useMemo } from "react";
import { usePageMeta } from "../lib/seo";
import { Reveal } from "../components/Reveal";

export function About() {
  usePageMeta({
    title: "About",
    description:
      "NameClear is a brand name availability checker that inspects domains, the USPTO trademark register, and social handles in one pass — free, with a one-time $9 full report.",
    path: "/about",
    schemas: useMemo(
      () => [
        {
          "@type": "AboutPage",
          name: "About NameClear",
          description: "How NameClear checks brand name availability across domains, trademarks, and social.",
        },
      ],
      [],
    ),
  });

  return (
    <>
      <section className="hero">
        <div className="page">
          <p className="kicker">01 — about</p>
          <h1 className="hero-title" style={{ maxWidth: "11ch" }}>
            Built to kill
            <br />
            <span className="flame">bad names</span>
            <br />
            fast.
          </h1>
          <p className="hero-lede">
            Naming a company should take an afternoon, not a month of scattered tabs. NameClear runs
            the checks a naming session really needs — domains, federal trademarks, social handles —
            in one pass, so you learn what's taken and what's free before you fall in love with a
            name.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="page">
          <Reveal>
            <div className="prose">
              <p>
                Most naming advice is: brainstorm, then go check six different websites and hope you
                covered everything. NameClear replaces that with one query and three honest
                answers: what's free, what's taken, and what's close enough that it matters.
              </p>
              <p>
                We query <strong>live registries</strong> over RDAP — Verisign for .com and .net,
                Google for .app, Identity Digital for .io — so "available" means the registry said
                so a second ago. We scan the <strong>live USPTO register</strong> for alive
                trademark records and link you straight to each official record. And we probe the{" "}
                <strong>four big social platforms</strong> for your handle, suggesting alternates
                when it's gone.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="page">
          <Reveal>
            <p className="kicker" style={{ marginBottom: 24 }}>
              02 — how it works
            </p>
            <ul className="ledger-list">
              <li>
                <span className="k">01 · Check</span>
                <span className="ledger-value">
                  Type a name. We query domains, trademarks, and social handles in parallel — each
                  section loads as its results land.
                </span>
              </li>
              <li>
                <span className="k">02 · Read</span>
                <span className="ledger-value">
                  A live ledger tells you exactly what's free, what's taken, and which USPTO records
                  are close enough to review.
                </span>
              </li>
              <li>
                <span className="k">03 · Decide</span>
                <span className="ledger-value">
                  Want the whole thing written up? Pay $9 once and a clean PDF — with alternatives
                  and record links — is emailed to you.
                </span>
              </li>
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="page">
          <Reveal>
            <p className="kicker" style={{ marginBottom: 24 }}>
              03 — contact
            </p>
            <div className="prose">
              <p>
                Questions, feedback, or a source we should be checking?{" "}
                <a href="mailto:contact@calyvent.com?subject=NameClear%20Inquiry">
                  contact@calyvent.com
                </a>
                .
              </p>
            </div>
            <p className="disclaimer" style={{ marginTop: 32 }}>
              NameClear is an automated screening tool, not a law firm, and nothing on this site is
              legal advice. Domain and social availability reflects live registry and platform state
              at the moment of each check and can change at any time. Trademark findings are a
              screening aid, not a clearance opinion — consult a licensed trademark attorney before
              filing or using a mark in commerce.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
