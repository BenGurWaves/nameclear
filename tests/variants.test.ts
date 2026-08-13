import { describe, expect, it } from "vitest";
import { domainVariants, handleVariants, DOMAIN_TLDS } from "../server/variants";

describe("domainVariants", () => {
  it("returns prefix and suffix variants", () => {
    const variants = domainVariants("moss", 4);
    expect(variants).toContain("getmoss");
    expect(variants).toContain("mossapp");
    expect(variants).toHaveLength(4);
  });
  it("respects max", () => {
    expect(domainVariants("moss", 1)).toHaveLength(1);
  });
});

describe("handleVariants", () => {
  it("keeps handles within platform length limits", () => {
    const variants = handleVariants("moss", 10);
    expect(variants).toContain("mossofficial");
    expect(variants).toContain("mossapp");
    for (const v of variants) expect(v.length).toBeLessThanOrEqual(30);
  });
});

describe("DOMAIN_TLDS", () => {
  it("covers the promised extensions", () => {
    expect(DOMAIN_TLDS).toEqual(["com", "co", "io", "net", "app"]);
  });
});
