import { getCachedPartSmart, persistPart } from "./cache";
import type { NameClearEnv } from "./env";
import { normalizeToName } from "./normalize";
import { checkDomain, REGISTER_URLS } from "./rdap";
import { checkTrademark } from "./trademark";
import { checkSocial } from "./social";
import { DOMAIN_TLDS } from "./variants";
import type { CheckPart, DomainsPayload } from "./types";

export function validateName(raw: string): string | null {
  return normalizeToName(raw);
}

async function runDomains(env: NameClearEnv, name: string): Promise<DomainsPayload> {
  const slug = name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  const results = await Promise.all(
    DOMAIN_TLDS.map(async (tld) => {
      const check = await checkDomain(tld, slug);
      return {
        tld,
        domain: check.domain,
        status: check.status,
        note: check.note,
        registerUrl:
          check.status === "available"
            ? `${REGISTER_URLS[tld] ?? "https://domains.google/registrar/"}${encodeURIComponent(slug)}`
            : null,
      };
    }),
  );
  return { name, results };
}

export async function checkPart(
  env: NameClearEnv,
  part: CheckPart,
  name: string,
): Promise<unknown> {
  const { payload, source } = await getCachedPartSmart(env, name, part);
  if (payload) return payload;

  let computed: unknown;
  if (part === "domains") {
    computed = await runDomains(env, name);
  } else if (part === "trademark") {
    computed = await checkTrademark(name);
  } else {
    computed = await checkSocial(name);
  }

  await persistPart(env, name, part, computed);
  void source;
  return computed;
}
