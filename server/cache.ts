import { createClient } from "@supabase/supabase-js";
import type { NameClearEnv } from "./env";
import type { CheckPart, CheckResultsJson } from "./types";

export const CACHE_TTL_MS = 60 * 60 * 1000;
const SUPABASE_TABLE = "search_cache";

// Bump when the payload schema or check logic changes so stale Supabase rows
// (keyed by searched_name) are ignored instead of served.
const CACHE_KEY_VERSION = "v2";

const cacheKey = (name: string): string => `${CACHE_KEY_VERSION}:${name.toLowerCase()}`;

interface MemoryEntry {
  expiresAt: number;
  data: CheckResultsJson;
}

const memory = new Map<string, MemoryEntry>();

export function touchMemoryCache(name: string): void {
  const now = Date.now();
  const stale: string[] = [];
  for (const [k, v] of memory) {
    if (v.expiresAt < now) stale.push(k);
  }
  for (const k of stale) memory.delete(k);
  const entry = memory.get(name);
  if (entry) {
    entry.expiresAt = now + CACHE_TTL_MS;
  }
}

export function getCachedPart(name: string, part: CheckPart): unknown | null {
  const entry = memory.get(name);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memory.delete(name);
    return null;
  }
  return entry.data[part] ?? null;
}

export function setMemoryPart(name: string, part: CheckPart, payload: unknown): void {
  const now = Date.now();
  const existing = memory.get(name);
  const data: CheckResultsJson = { ...(existing?.data ?? {}) };
  (data as Record<string, unknown>)[part] = payload;
  memory.set(name, { expiresAt: now + CACHE_TTL_MS, data });
}

async function getSupabaseClient(env: NameClearEnv) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "nameclear-pages-functions" } },
  });
}

export async function getSupabasePart(
  env: NameClearEnv,
  name: string,
  part: CheckPart,
): Promise<unknown | null> {
  const client = await getSupabaseClient(env);
  if (!client) return null;
  const { data, error } = await client
    .from(SUPABASE_TABLE)
    .select("results_json, checked_at")
    .eq("searched_name", cacheKey(name))
    .maybeSingle();
  if (error || !data || !data.results_json) return null;
  const json = data.results_json as CheckResultsJson;
  const partData = json[part];
  if (!partData) return null;
  const checkedAt = data.checked_at ? new Date(data.checked_at).getTime() : 0;
  if (Date.now() - checkedAt > CACHE_TTL_MS) return null;
  return partData;
}

export async function setSupabasePart(
  env: NameClearEnv,
  name: string,
  part: CheckPart,
  payload: unknown,
): Promise<void> {
  const client = await getSupabaseClient(env);
  if (!client) return;
  const { data } = await client
    .from(SUPABASE_TABLE)
    .select("results_json")
    .eq("searched_name", cacheKey(name))
    .maybeSingle();
  const json: CheckResultsJson = data?.results_json ?? {};
  (json as Record<string, unknown>)[part] = payload;
  await client
    .from(SUPABASE_TABLE)
    .upsert(
      {
        searched_name: cacheKey(name),
        results_json: json,
        checked_at: new Date().toISOString(),
      },
      { onConflict: "searched_name" },
    )
    .select();
}

export async function getCachedPartSmart(
  env: NameClearEnv,
  name: string,
  part: CheckPart,
): Promise<{ payload: unknown | null; source: "memory" | "supabase" | "none" }> {
  const mem = getCachedPart(name, part);
  if (mem) return { payload: mem, source: "memory" };
  const sup = await getSupabasePart(env, name, part);
  if (sup) {
    setMemoryPart(name, part, sup);
    return { payload: sup, source: "supabase" };
  }
  return { payload: null, source: "none" };
}

export async function persistPart(
  env: NameClearEnv,
  name: string,
  part: CheckPart,
  payload: unknown,
): Promise<void> {
  setMemoryPart(name, part, payload);
  await setSupabasePart(env, name, part, payload);
}
