import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCachedPart, setMemoryPart, CACHE_TTL_MS } from "../server/cache";

describe("in-memory cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and returns a part", () => {
    setMemoryPart("moss", "domains", { name: "moss", results: [] });
    expect(getCachedPart("moss", "domains")).toEqual({ name: "moss", results: [] });
  });

  it("keeps sibling parts separate", () => {
    setMemoryPart("moss", "domains", { a: 1 });
    setMemoryPart("moss", "social", { b: 2 });
    expect(getCachedPart("moss", "domains")).toEqual({ a: 1 });
    expect(getCachedPart("moss", "social")).toEqual({ b: 2 });
  });

  it("expires after the TTL", () => {
    setMemoryPart("moss", "domains", { a: 1 });
    vi.advanceTimersByTime(CACHE_TTL_MS + 1);
    expect(getCachedPart("moss", "domains")).toBeNull();
  });

  it("touching refreshes the expiry", () => {
    setMemoryPart("moss", "domains", { a: 1 });
    vi.advanceTimersByTime(CACHE_TTL_MS - 1);
    expect(getCachedPart("moss", "domains")).not.toBeNull();
    vi.advanceTimersByTime(5000);
    expect(getCachedPart("moss", "domains")).toBeNull();
  });
});
