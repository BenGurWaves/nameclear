import { afterEach, describe, expect, it, vi } from "vitest";
import { checkAlternatives, checkDomain, KNOWN_BASES } from "../server/rdap";

describe("checkDomain", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("queries the fully-qualified domain against the registry base", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response('{"objectClassName":"domain"}', { status: 200 }));
    const result = await checkDomain("com", "apple");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://rdap.verisign.com/com/v1/domain/apple.com",
      expect.anything(),
    );
    expect(result).toEqual({ domain: "apple.com", tld: "com", status: "taken" });
  });

  it("maps a 404 to available", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not found", { status: 404 }));
    const result = await checkDomain("com", "zedkite");
    expect(result.status).toBe("available");
  });

  it("falls through to the next base when one errors", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => Promise.reject(new Error("ECONNRESET")))
      .mockResolvedValue(new Response("ok", { status: 200 }));
    const result = await checkDomain("co", "zedkite");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("rdap.nic.co"),
      expect.anything(),
    );
    expect(result.status).toBe("taken");
  });

  it("reports unknown only after every base fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network connection lost"));
    const result = await checkDomain("co", "zedkite");
    expect(result.status).toBe("unknown");
    expect(result.note).toBeTruthy();
  });

  it("prefers the last configured base for .co as fallback", () => {
    expect(KNOWN_BASES.co).toContain("https://rdap.identitydigital.services/rdap/");
    expect(KNOWN_BASES.co.length).toBeGreaterThan(1);
  });
});

describe("checkAlternatives", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns only variants that resolve available, with register links", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = String(input);
        const name = url.split("/domain/")[1];
        const taken = ["getapple", "appleapp"].some((v) => name.startsWith(v));
        return new Response("{}", { status: taken ? 200 : 404 });
      },
    );
    const found = await checkAlternatives("apple", ["getapple", "appleapp", "tryapple"], ["com", "io"]);
    expect(found.length).toBeGreaterThanOrEqual(1);
    for (const a of found) {
      expect(a.status).toBe("available");
      expect(a.registerUrl).toContain("namecheap.com");
    }
    expect(fetchMock.mock.calls.length).toBeGreaterThan(3);
  });

  it("returns an empty list when every variant is taken", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    const found = await checkAlternatives("apple", ["getapple", "appleapp"], ["com", "io"]);
    expect(found).toEqual([]);
  });
});
