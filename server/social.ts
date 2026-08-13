import type { CheckStatus, SocialResult } from "./types";
import { handleVariants } from "./variants";

const FETCH_TIMEOUT_MS = 15000;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface PlatformSpec {
  key: string;
  label: string;
  url: (handle: string) => string;
  headers?: Record<string, string>;
  detect: (res: Response, text: string) => CheckStatus;
}

function normalizeTikTokText(text: string): Record<string, unknown> | null {
  const normalized = text.replace(/\\u002F/g, "/");
  const tiktokDictMatch = normalized.match(/<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!tiktokDictMatch) return null;
  const json = tiktokDictMatch[1].replace(/&quot;/g, '"');
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function tiktokDetect(res: Response, text: string): CheckStatus {
  if (res.status === 404) return "available";
  const parsed = normalizeTikTokText(text);
  if (!parsed) return "unknown";
  const scope = (parsed.__DEFAULT_SCOPE__ as Record<string, unknown> | undefined)?.[
    "webapp.user-detail"
  ] ?? (parsed.__DEFAULT_SCOPE__ as Record<string, unknown> | undefined);
  const userInfo = (scope as Record<string, unknown> | undefined)?.userInfo as
    | Record<string, unknown>
    | undefined;
  const user = userInfo?.user as Record<string, unknown> | undefined;
  if (user?.uniqueId) return "taken";
  const statusCode = (scope as Record<string, unknown> | undefined)?.statusCode;
  if (statusCode === 10221 || statusCode === 10202) return "available";
  return "unknown";
}

const PLATFORMS: PlatformSpec[] = [
  {
    key: "instagram",
    label: "Instagram",
    url: (h) => `https://www.instagram.com/api/v1/users/web_profile_info/?username=${h}`,
    headers: {
      "X-IG-App-ID": "936619743392459",
      "User-Agent": UA,
      Accept: "*/*",
    },
    detect: (res, text) => {
      if (res.status === 404) return "available";
      if (res.status === 200 && /"user"\s*:\s*\{/.test(text)) return "taken";
      return "unknown";
    },
  },
  {
    key: "x",
    label: "X / Twitter",
    url: (h) => `https://x.com/${h}`,
    headers: { "User-Agent": UA, Accept: "text/html" },
    detect: (res) => (res.status === 404 ? "available" : res.status === 200 ? "taken" : "unknown"),
  },
  {
    key: "tiktok",
    label: "TikTok",
    url: (h) => `https://www.tiktok.com/@${h}`,
    headers: { "User-Agent": UA, Accept: "text/html" },
    detect: tiktokDetect,
  },
  {
    key: "youtube",
    label: "YouTube",
    url: (h) => `https://www.youtube.com/@${h}`,
    headers: { "User-Agent": UA, Accept: "text/html" },
    detect: (res) => (res.status === 404 ? "available" : res.status === 200 ? "taken" : "unknown"),
  },
];

interface RateBucket {
  limit: number;
  windowMs: number;
  hits: number[];
}

const rateBuckets = new Map<string, RateBucket>();
const DEFAULT_RATE = { limit: 30, windowMs: 60_000 };

function rateLimited(platform: string): boolean {
  let bucket = rateBuckets.get(platform);
  if (!bucket) {
    bucket = { ...DEFAULT_RATE, hits: [] };
    rateBuckets.set(platform, bucket);
  }
  const now = Date.now();
  bucket.hits = bucket.hits.filter((t) => now - t < bucket.windowMs);
  if (bucket.hits.length >= bucket.limit) return true;
  bucket.hits.push(now);
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const perPlatformConcurrency = new Map<string, Promise<unknown>>();

async function probePlatform(spec: PlatformSpec, handle: string): Promise<SocialResult> {
  const url = spec.url(handle);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html", ...spec.headers },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const text = await res.text();
    const status = spec.detect(res, text);
    return {
      platform: spec.label,
      handle,
      url,
      status,
    };
  } catch {
    return { platform: spec.label, handle, url, status: "unknown", note: "unreachable" };
  }
}

async function serializedProbe(spec: PlatformSpec, handle: string): Promise<SocialResult> {
  const prior = perPlatformConcurrency.get(spec.key) ?? Promise.resolve();
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const chain = prior.then(() => gate);
  perPlatformConcurrency.set(spec.key, chain.then(() => undefined));
  await prior;
  try {
    const result = await probePlatform(spec, handle);
    return result;
  } finally {
    release();
  }
}

export async function checkSocial(name: string): Promise<{ results: SocialResult[] }> {
  const results: SocialResult[] = [];
  const pending: Promise<void>[] = [];

  for (const spec of PLATFORMS) {
    pending.push(
      (async () => {
        if (rateLimited(spec.key)) {
          results.push({
            platform: spec.label,
            handle: name,
            url: spec.url(name),
            status: "unknown",
            note: "rate-limited",
          });
          return;
        }
        const exact = await serializedProbe(spec, name);
        results.push(exact);

        if (exact.status === "taken") {
          const variants = handleVariants(name);
          let checked = 0;
          for (const v of variants) {
            if (checked >= 2) break;
            if (rateLimited(spec.key)) break;
            const vRes = await serializedProbe(spec, v);
            results.push({ ...vRes, variant: true });
            checked++;
            await sleep(250);
          }
        }
      })(),
    );
  }

  await Promise.all(pending);

  const order: Record<string, number> = { instagram: 0, x: 1, tiktok: 2, youtube: 3 };
  results.sort((a, b) => {
    const ai = order[a.platform] ?? 99;
    const bi = order[b.platform] ?? 99;
    return ai - bi;
  });
  return { results };
}
