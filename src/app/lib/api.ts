import type { CheckPart, DomainsPayload, SocialPayload, TrademarkPayload } from "../types";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export function checkPartApi(
  name: string,
  part: CheckPart,
): Promise<DomainsPayload | TrademarkPayload | SocialPayload> {
  return getJson(`/api/check?name=${encodeURIComponent(name)}&part=${part}`);
}

export interface CheckoutResponse {
  url: string;
}

export async function createCheckout(name: string): Promise<CheckoutResponse> {
  const res = await fetch(`/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = (await res.json()) as CheckoutResponse & { error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? `Checkout failed (${res.status})`);
  }
  return data;
}

export interface ReportStatus {
  paid: boolean;
  name: string;
  pdfUrl?: string | null;
  stored?: boolean;
  reportId?: string | null;
  error?: string;
}

export async function reportStatus(sessionId: string): Promise<ReportStatus> {
  return getJson(`/api/report?session_id=${encodeURIComponent(sessionId)}`);
}

export function reportDownloadUrl(sessionId: string): string {
  return `/api/report?session_id=${encodeURIComponent(sessionId)}&download=1`;
}
