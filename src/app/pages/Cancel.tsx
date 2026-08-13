import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/seo";

export function Cancel() {
  usePageMeta({
    title: "Checkout cancelled",
    description: "Your NameClear checkout was cancelled. Checks stay free, so re-run any time.",
    path: "/cancel",
    noindex: true,
  });

  return (
    <main className="status-page">
      <div className="page">
        <div className="status-icon fail" aria-hidden="true">
          ×
        </div>
        <h1 className="status-title">Checkout cancelled.</h1>
        <p className="status-copy">
          No charge was made and nothing changed. The free check still stands — re-run it any time,
          or pick up the $9 report when you're ready.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link className="btn btn-ink" to="/">
            ← Back to your check
          </Link>
          <Link className="btn btn-paper" to="/pricing">
            Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
