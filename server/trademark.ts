import type { TrademarkPayload, TrademarkResult } from "./types";

const SEARCH_URL = "https://tmsearch.uspto.gov/prod-stage-v1-0-0/tmsearch";
const RESULTS_LIMIT = 25;

interface TmsearchHit {
  id: string;
  source: {
    id?: string;
    wordmark?: string[];
    ownerName?: string[];
    ownerFullText?: string;
    registrationId?: string[];
    internationalClass?: string[];
    alive?: boolean;
    markType?: string[];
    statusDescription?: string[];
    statusCode?: string[];
    filedDate?: string;
    registrationDate?: string;
  };
}

interface TmsearchResponse {
  hits?: {
    totalValue?: number;
    hits?: TmsearchHit[];
  };
}

export function normalizeSimilarity(a: string, b: string): string {
  return a
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export function similarityScore(a: string, b: string): number {
  const max = Math.max(a.length, b.length, 1);
  return 1 - editDistance(a, b) / max;
}

async function searchMarks(name: string): Promise<TmsearchResponse> {
  const body = {
    query: {
      bool: {
        must: [{ match: { wordmark: name } }],
        filter: [{ term: { alive: true } }],
      },
    },
    from: 0,
    size: RESULTS_LIMIT,
    track_total_hits: true,
  };

  const headers: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    Origin: "https://tmsearch.uspto.gov",
    Referer: "https://tmsearch.uspto.gov/",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  };

  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const reason =
      res.status === 403
        ? "blocked"
        : res.status === 202
          ? "queued"
          : res.status === 429
            ? "rate-limited"
            : `http-${res.status}`;
    throw new Error(`tmsearch ${reason}`);
  }
  return (await res.json()) as TmsearchResponse;
}

function cleanClasses(classes: string[] | undefined): string[] {
  return (classes ?? [])
    .map((c) => c.replace(/^IC\s+/i, "").trim())
    .filter((c) => c.length > 0);
}

export async function checkTrademark(
  name: string,
): Promise<TrademarkPayload> {
  let resp: TmsearchResponse;
  try {
    resp = await searchMarks(name);
  } catch (err) {
    const reason = err instanceof Error ? err.message.replace(/^tmsearch /, "") : "unreachable";
    return {
      name,
      conflictsFound: false,
      unavailable: reason,
      results: [],
    };
  }

  const target = normalizeSimilarity(name, name);
  const candidates: TrademarkResult[] = [];
  for (const hit of resp?.hits?.hits ?? []) {
    const source = hit.source ?? {};
    const raw = (source.wordmark ?? []).join(" ") || "";
    const mark = raw.trim();
    if (!mark) continue;
    const norm = normalizeSimilarity(mark, mark);
    if (norm.length < 3 && !(target.length >= 3 && norm === target)) continue;
    const exact = norm === target || norm === target.replace(/\s+/g, "");
    const score = similarityScore(norm, target);
    if (!exact && score < 0.55) continue;

    candidates.push({
      serialNumber: source.id ?? hit.id ?? "",
      mark,
      owner: (source.ownerName ?? []).join(", ") || source.ownerFullText || "—",
      status: (source.statusDescription ?? []).join(", ") || "Unknown",
      statusDate: source.registrationDate || source.filedDate || null,
      classes: cleanClasses(source.internationalClass),
      registrationNumber: (source.registrationId ?? [])[0] ?? null,
      exact,
      usptoUrl: `https://tsdr.uspto.gov/documentviewer?caseId=sn${source.id ?? hit.id ?? ""}`,
    });
  }

  candidates.sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1;
    return similarityScore(normalizeSimilarity(b.mark, b.mark), target) -
      similarityScore(normalizeSimilarity(a.mark, a.mark), target);
  });

  const results = candidates.slice(0, 8);
  return {
    name,
    conflictsFound: results.some((r) => r.exact),
    results,
  };
}
