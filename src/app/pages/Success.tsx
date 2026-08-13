import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { ReportStatus } from "../lib/api";
import { reportDownloadUrl, reportStatus } from "../lib/api";
import { usePageMeta } from "../lib/seo";

type Phase = "loading" | "unpaid" | "done" | "error";

export function Success() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id") ?? "";
  const [phase, setPhase] = useState<Phase>("loading");
  const [status, setStatus] = useState<ReportStatus | null>(null);

  usePageMeta({
    title: "Payment complete",
    description: "Your NameClear brand name report is on its way.",
    path: "/success",
    noindex: true,
  });

  useEffect(() => {
    if (!sessionId) {
      setPhase("error");
      return;
    }
    reportStatus(sessionId)
      .then((s) => {
        setStatus(s);
        setPhase(s.paid ? "done" : "unpaid");
      })
      .catch(() => setPhase("error"));
  }, [sessionId]);

  return (
    <main className="status-page">
      <div className="page">
        {phase === "loading" && (
          <>
            <div className="status-icon" style={{ animation: "pulse 1.1s infinite" }} aria-hidden="true">
              ✓
            </div>
            <h1 className="status-title">Verifying payment…</h1>
            <p className="status-copy">
              Checking your Stripe session and preparing your report. This takes a few seconds.
            </p>
          </>
        )}

        {phase === "unpaid" && (
          <>
            <div className="status-icon fail" aria-hidden="true">
              !
            </div>
            <h1 className="status-title">Payment not completed</h1>
            <p className="status-copy">
              We couldn't confirm a successful payment for this session. If you were charged, your
              report email is on its way — otherwise run your check again and try once more.
            </p>
            <Link className="btn btn-ink" to="/">
              ← Back to check
            </Link>
          </>
        )}

        {phase === "error" && (
          <>
            <div className="status-icon fail" aria-hidden="true">
              !
            </div>
            <h1 className="status-title">We couldn't load your report</h1>
            <p className="status-copy">
              This can happen if the link is stale. If you paid, your report PDF was emailed to the
              address you entered at checkout. Contact us any time at{" "}
              <a href="mailto:contact@calyvent.com?subject=NameClear%20Report%20Issue">
                contact@calyvent.com
              </a>
              .
            </p>
            <Link className="btn btn-ink" to="/">
              ← Back to check
            </Link>
          </>
        )}

        {phase === "done" && status && (
          <>
            <div className="status-icon ok" aria-hidden="true">
              ✓
            </div>
            <h1 className="status-title">
              Paid. Your report for "{status.name}"
              <br />
              is ready.
            </h1>
            <p className="status-copy">
              {status.emailed
                ? `The PDF is on its way to ${status.email ?? "your inbox"} right now — and you can download it here too.`
                : status.pdfUrl
                  ? "The PDF is generated and ready to download below."
                  : "Your report is ready to download below."}
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a className="btn btn-flame" href={reportDownloadUrl(sessionId)}>
                Download report ↓
              </a>
              <Link className="btn btn-paper" to="/">
                ← Check another name
              </Link>
            </div>
            <p
              className="mono"
              style={{
                marginTop: 24,
                fontSize: 11,
                letterSpacing: "0.08em",
                color: "var(--ink)",
                opacity: 0.55,
              }}
            >
              Want more checks? Run them free, any time — reports are per-name.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
