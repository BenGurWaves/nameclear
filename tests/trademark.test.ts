import { describe, expect, it } from "vitest";
import { normalizeSimilarity, similarityScore } from "../server/trademark";

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
