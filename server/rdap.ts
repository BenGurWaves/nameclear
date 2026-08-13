const BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";

// Primary registry RDAP bases, hardcoded (verified working). The IANA bootstrap
// has no entries for .co or .io, so it adds nothing for our TLD set — we only
// consult it lazily for TLDs we don't know, and never in the hot path.
export const KNOWN_BASES: Record<string, string[]> = {
  com: ["https://rdap.verisign.com/com/v1/"],
  net: ["https://rdap.verisign.com/net/v1/"],
  app: ["https://pubapi.registry.google/rdap/"],
  dev: ["https://pubapi.registry.google/rdap/"],
  io: ["https://rdap.identitydigital.services/rdap/"],
  co: ["https://rdap.nic.co/rdap/", "https://rdap.cointernet.com/rdap/"],
};

const FETCH_TIMEOUT_MS = 15000;

let bootstrapCache: Record<string, string[]> | null = null;
let bootstrapFetchedAt = 0;

export async function basesForTld(tld: string): Promise<string[]> {
  if (KNOWN_BASES[tld]) return KNOWN_BASES[tld];
  const now = Date.now();
  if (bootstrapCache && now - bootstrapFetchedAt < 60 * 60 * 1000) {
    return bootstrapCache[tld] ?? [];
  }
  try {
    const res = await fetch(BOOTSTRAP_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`bootstrap ${res.status}`);
    const json = (await res.json()) as { services: [string[], string[]][] };
    const map: Record<string, string[]> = {};
    for (const [tlds, urls] of json.services ?? []) {
      for (const t of tlds) {
        map[t] = (map[t] ?? []).concat(urls.map((u) => (u.endsWith("/") ? u : `${u}/`)));
      }
    }
    bootstrapCache = map;
    bootstrapFetchedAt = now;
    return map[tld] ?? [];
  } catch {
    return [];
  }
}

export interface RdapDomainCheck {
  domain: string;
  tld: string;
  status: "available" | "taken" | "unknown";
  note?: string;
}

async function queryEndpoint(base: string, domain: string): Promise<{ status: number | null; err?: string }> {
  const url = `${base.replace(/\/+$/, "/")}domain/${domain}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/rdap+json, application/json",
        "User-Agent": "NameClear/1.0 (brand availability checker)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return { status: res.status };
  } catch (err) {
    return { status: null, err: String(err).slice(0, 200) };
  }
}

export async function checkDomain(tld: string, domain: string): Promise<RdapDomainCheck> {
  const bases = await basesForTld(tld);
  if (bases.length === 0) {
    return { domain: `${domain}.${tld}`, tld, status: "unknown", note: "No RDAP endpoint known" };
  }
  for (const base of bases) {
    const { status, err } = await queryEndpoint(base, domain);
    if (status === 200) {
      return { domain: `${domain}.${tld}`, tld, status: "taken" };
    }
    if (status === 404) {
      return { domain: `${domain}.${tld}`, tld, status: "available" };
    }
    if (err) return { domain: `${domain}.${tld}`, tld, status: "unknown", note: "Registry unreachable" };
  }
  return { domain: `${domain}.${tld}`, tld, status: "unknown", note: "Registry unreachable" };
}

export const REGISTER_URLS: Record<string, string> = {
  com: "https://www.namecheap.com/domains/registration/results/?domain=",
  net: "https://www.namecheap.com/domains/registration/results/?domain=",
  io: "https://www.namecheap.com/domains/registration/results/?domain=",
  app: "https://domains.google/registrar/",
  dev: "https://domains.google/registrar/",
  co: "https://www.namecheap.com/domains/registration/results/?domain=",
};
