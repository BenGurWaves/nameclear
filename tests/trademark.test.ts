import { afterEach, describe, expect, it, vi } from "vitest";
import { checkTrademark, normalizeSimilarity, similarityScore } from "../server/trademark";

const hit = (overrides: Record<string, unknown>) => ({ id: "sn1", source: { wordmark: "Apple" }, ...overrides });

describe("checkTrademark", () => {
  afterEach(() => vi.restoreAllMocks());

  it("handles a wordmark returned as a plain string (USPTO shape varies)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ hits: { totalValue: 1, hits: [{ id: "sn1", source: { wordmark: "APPLE" } }] } }),
        { status: 200 },
      ),
    );
    const payload = await checkTrademark("apple");
    expect(payload.conflictsFound).toBe(true);
    expect(payload.results[0]).toMatchObject({ mark: "APPLE", exact: true, serialNumber: "sn1" });
  });

  it("still works when the registry returns queued (202)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("queued", { status: 202 }));
    const payload = await checkTrademark("apple");
    expect(payload.conflictsFound).toBe(false);
    expect(payload.unavailable).toBe("queued");
    expect(payload.results).toEqual([]);
  });
});


describe("normalizeSimilarity", () => {
  it("normalizes case, accents, and separators", () => {
    expect(normalizeSimilarity("Lucid Moss®", "x")).toBe("lucidmoss");
    expect(normalizeSimilarity("Café", "x")).toBe("cafe");
  });
});

describe("similarityScore", () => {
  it("is 1 for identical strings", () => {
    expect(similarityScore("lucidmoss", "lucidmoss")).toBe(1);
  });
  it("is high for one-char edits", () => {
    expect(similarityScore("lucidmoss", "lucidmossx")).toBeGreaterThan(0.8);
  });
  it("is low for unrelated words", () => {
    expect(similarityScore("lucidmoss", "banana")).toBeLessThan(0.5);
  });
});
