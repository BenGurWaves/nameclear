export const DOMAIN_TLDS = ["com", "co", "io", "net", "app"] as const;

export const DOMAIN_PREFIXES = ["get", "try", "go", "use"];
export const DOMAIN_SUFFIXES = ["app", "hq", "co", "official", "labs", "now"];

export const HANDLE_SUFFIXES = ["official", "app", "hq", "co", "get", "usa"];

export function domainVariants(name: string, max = 4): string[] {
  const out: string[] = [];
  const prefixLen = DOMAIN_PREFIXES.length;
  for (let i = 0; out.length < max && i < Math.max(prefixLen, DOMAIN_SUFFIXES.length); i++) {
    if (i < prefixLen) out.push(`${DOMAIN_PREFIXES[i]}${name}`);
    if (out.length >= max) break;
    if (i < DOMAIN_SUFFIXES.length) out.push(`${name}${DOMAIN_SUFFIXES[i]}`);
  }
  return out.slice(0, max);
}

export function handleVariants(name: string, max = 3): string[] {
  const out: string[] = [];
  for (const s of HANDLE_SUFFIXES) {
    if (out.length >= max) break;
    const v = `${name}${s}`;
    if (v.length <= 30) out.push(v);
  }
  return out.slice(0, max);
}

export function isValidHandleLength(handle: string): boolean {
  return handle.length >= 1 && handle.length <= 30;
}
