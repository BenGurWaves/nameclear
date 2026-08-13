import type { CheckStatus } from "../types";

const LABELS: Record<CheckStatus, string> = {
  available: "Available",
  taken: "Taken",
  unknown: "Unknown",
};

export function StatusPill({ status }: { status: CheckStatus }) {
  const cls =
    status === "available" ? "status-available" : status === "taken" ? "status-taken" : "status-unknown";
  return (
    <span className={`status-pill ${cls}`} role="status">
      {LABELS[status]}
    </span>
  );
}
