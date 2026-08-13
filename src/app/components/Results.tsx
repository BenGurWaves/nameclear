import type {
  CheckStatus,
  DomainsPayload,
  PartState,
  SocialPayload,
  TrademarkPayload,
} from "../types";
import { StatusPill } from "./StatusPill";

export function CheckingLine({ text }: { text: string }) {
  return (
    <div className="checking" role="status">
      <span className="checking-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>{text}</span>
    </div>
  );
}

export function Panel({
  index,
  title,
  statusText,
  loading,
  children,
}: {
  index: string;
  title: string;
  statusText: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="report-section" aria-busy={loading}>
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">
            <span className="idx">{index}</span>
            {title}
          </h3>
          <span className="kicker">{loading ? "checking" : statusText}</span>
        </div>
        {loading ? <CheckingLine text="querying registries …" /> : children}
      </div>
    </section>
  );
}

function tldStatusCount(results: DomainsPayload["results"]): [CheckStatus, number][] {
  const counts = new Map<CheckStatus, number>();
  for (const r of results) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

export function DomainsSection({ state }: { state: PartState<DomainsPayload> }) {
  if (state.status === "idle") return null;
  return (
    <Panel
      index="01"
      title="Domains"
      loading={state.status === "loading"}
      statusText={
        state.status === "done"
          ? tldStatusCount(state.data.results)
              .map(([s, n]) => `${n} ${s}`)
              .join(" · ")
          : state.status === "error"
            ? "error"
            : "waiting"
      }
    >
      {state.status === "error" ? (
        <p className="panel-note">Registry check failed — {state.error}. Retry in a moment.</p>
      ) : state.status === "done" ? (
        <div className="panel-body">
          {state.data.results.map((d) => (
            <div className="ledger-row" key={d.tld}>
              <span className="ledger-key">.{d.tld}</span>
              <span className="ledger-value">
                {d.domain}
                {d.status === "available" && d.registerUrl && (
                  <span className="ledger-sub">
                    <br />
                    <a href={d.registerUrl} target="_blank" rel="noreferrer noopener">
                      register →
                    </a>
                  </span>
                )}
                {d.note && <span className="ledger-sub"> · {d.note}</span>}
              </span>
              <StatusPill status={d.status} />
            </div>
          ))}
        </div>
      ) : (
        <p className="panel-note">Run a check to see domain availability.</p>
      )}
    </Panel>
  );
}

export function TrademarkSection({ state }: { state: PartState<TrademarkPayload> }) {
  if (state.status === "idle") return null;
  return (
    <Panel
      index="02"
      title="USPTO Trademark Scan"
      loading={state.status === "loading"}
      statusText={
        state.status === "done"
          ? state.data.conflictsFound
            ? "conflicts found"
            : "no conflicts"
          : state.status === "error"
            ? "error"
            : "waiting"
      }
    >
      {state.status === "error" ? (
        <p className="panel-note">USPTO scan failed — {state.error}. Retry in a moment.</p>
      ) : state.status === "done" ? (
        <div className="panel-body">
          {state.data.unavailable ? (
            <p className="panel-note">
              USPTO is temporarily unavailable ({state.data.unavailable}). Trademark screening will
              resume shortly — re-run your check.
            </p>
          ) : state.data.results.length === 0 ? (
            <p className="panel-note">
              No live USPTO records matched "{state.data.name}". The name appears clear on the
              federal trademark register — still worth an attorney review before you file.
            </p>
          ) : (
            <>
              <p className="panel-note" style={{ padding: "8px 0 4px" }}>
                {state.data.conflictsFound
                  ? "Potential conflicts found on the live register (alive records only)."
                  : "No exact conflicts — these close matches are worth reading before you commit."}
              </p>
              {state.data.results.map((r) => (
                <div className="ledger-row" key={r.serialNumber || r.mark}>
                  <span className="ledger-key">{r.exact ? "exact" : "close"}</span>
                  <span className="ledger-value">
                    {r.mark}
                    <span className="ledger-sub">
                      <br />
                      {r.status}
                      {r.registrationNumber ? ` · reg #${r.registrationNumber}` : ""}
                      {r.classes.length > 0 ? ` · ${r.classes.slice(0, 3).join(", ")}` : ""} ·{" "}
                      <a href={r.usptoUrl} target="_blank" rel="noreferrer noopener">
                        uspto record →
                      </a>
                    </span>
                  </span>
                  <span className="ledger-value" style={{ opacity: 0.75 }}>
                    {r.owner}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <p className="panel-note">Run a check to scan the federal trademark register.</p>
      )}
    </Panel>
  );
}

export function SocialSection({ state }: { state: PartState<SocialPayload> }) {
  if (state.status === "idle") return null;
  const takenCount =
    state.status === "done" ? state.data.results.filter((r) => r.status === "taken").length : 0;
  return (
    <Panel
      index="03"
      title="Social Handles"
      loading={state.status === "loading"}
      statusText={
        state.status === "done"
          ? `${takenCount} taken`
          : state.status === "error"
            ? "error"
            : "waiting"
      }
    >
      {state.status === "error" ? (
        <p className="panel-note">Social check failed — {state.error}. Retry in a moment.</p>
      ) : state.status === "done" ? (
        <div className="panel-body">
          {state.data.results.map((s, i) => (
            <div className="ledger-row" key={`${s.platform}-${s.handle}-${i}`}>
              <span className="ledger-key">
                {s.variant ? `${s.platform} (alt)` : s.platform}
              </span>
              <span className="ledger-value">
                <a href={s.url} target="_blank" rel="noreferrer noopener">
                  @{s.handle}
                </a>
                {s.note && <span className="ledger-sub"> · {s.note}</span>}
              </span>
              <StatusPill status={s.status} />
            </div>
          ))}
        </div>
      ) : (
        <p className="panel-note">Run a check to probe social handles.</p>
      )}
    </Panel>
  );
}
