export function normalizeToDomain(value: string): string | null {
  const out = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  if (out.length < 1 || out.length > 63) return null;
  return out;
}

export function normalizeToHandle(value: string): string | null {
  const out = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^_+|_+$/g, "");
  if (out.length < 1 || out.length > 30) return null;
  return out;
}

export function normalizeToName(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < 1 || trimmed.length > 60) return null;
  return trimmed;
}

export function isPunycodeSafe(value: string): boolean {
  return !/xn--/i.test(value);
}
