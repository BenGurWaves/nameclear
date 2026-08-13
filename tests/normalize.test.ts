import { describe, expect, it } from "vitest";
import { normalizeToDomain, normalizeToHandle, normalizeToName } from "../server/normalize";

describe("normalizeToDomain", () => {
  it("lowercases and strips disallowed characters", () => {
    expect(normalizeToDomain("LucidMoss")).toBe("lucidmoss");
    expect(normalizeToDomain("  Foo Bar  ")).toBe("foobar");
    expect(normalizeToDomain("café")).toBe("cafe");
    expect(normalizeToDomain("a--b")).toBe("a-b");
  });
  it("rejects empties and overlong input", () => {
    expect(normalizeToDomain("")).toBeNull();
    expect(normalizeToDomain("!!!")).toBeNull();
    expect(normalizeToDomain("a".repeat(64))).toBeNull();
  });
});

describe("normalizeToHandle", () => {
  it("keeps letters, numbers, underscores", () => {
    expect(normalizeToHandle("LucidMoss_1")).toBe("lucidmoss_1");
    expect(normalizeToHandle("foo-bar")).toBe("foobar");
  });
  it("strips leading/trailing underscores", () => {
    expect(normalizeToHandle("_moss_")).toBe("moss");
  });
});

describe("normalizeToName", () => {
  it("collapses whitespace", () => {
    expect(normalizeToName("  lucid   moss  ")).toBe("lucid moss");
  });
  it("rejects overlong", () => {
    expect(normalizeToName("a".repeat(61))).toBeNull();
  });
});
