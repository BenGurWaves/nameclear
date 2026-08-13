import { afterEach, describe, expect, it, vi } from "vitest";
import { checkSocial } from "../server/social";

function tiktokHtml(body: Record<string, unknown>): string {
  return `<html><head><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">${JSON.stringify(body)}</script></head><body></body></html>`;
}

function fetchMock(routes: { match: (url: string) => boolean; respond: () => Response }[]) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const route of routes) {
      if (route.match(url)) return route.respond();
    }
    return new Response("not found", { status: 404 });
  });
}

const TAKEN_TIKTOK = {
  __DEFAULT_SCOPE__: {
    "webapp.user-detail": {
      userInfo: { user: { uniqueId: "moss" } },
      statusCode: 0,
    },
  },
};

const FREE_TIKTOK = {
  __DEFAULT_SCOPE__: {
    "webapp.user-detail": { statusCode: 10221 },
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkSocial", () => {
  it("marks all platforms taken when every platform reports taken", async () => {
    vi.stubGlobal(
      "fetch",
      fetchMock([
        {
          match: (u) => u.includes("instagram.com/api"),
          respond: () => new Response(JSON.stringify({ user: { username: "moss" } }), { status: 200 }),
        },
        {
          match: (u) => u.includes("x.com/"),
          respond: () => new Response("<html></html>", { status: 200 }),
        },
        {
          match: (u) => u.includes("tiktok.com"),
          respond: () => new Response(tiktokHtml(TAKEN_TIKTOK), { status: 200 }),
        },
        {
          match: (u) => u.includes("youtube.com"),
          respond: () => new Response("<html></html>", { status: 200 }),
        },
      ]),
    );
    const { results } = await checkSocial("moss");
    expect(results.filter((r) => r.status === "taken" && !r.variant)).toHaveLength(4);
    expect(results.some((r) => r.variant)).toBe(true);
  });

  it("marks all platforms available when every platform reports free", async () => {
    vi.stubGlobal(
      "fetch",
      fetchMock([
        {
          match: (u) => u.includes("instagram.com/api"),
          respond: () => new Response("{}", { status: 404 }),
        },
        {
          match: (u) => u.includes("x.com/"),
          respond: () => new Response("{}", { status: 404 }),
        },
        {
          match: (u) => u.includes("tiktok.com"),
          respond: () => new Response(tiktokHtml(FREE_TIKTOK), { status: 200 }),
        },
        {
          match: (u) => u.includes("youtube.com"),
          respond: () => new Response("{}", { status: 404 }),
        },
      ]),
    );
    const { results } = await checkSocial("moss");
    expect(results.filter((r) => r.status === "available")).toHaveLength(4);
  });

  it("adds variant handles for a taken platform", async () => {
    vi.stubGlobal(
      "fetch",
      fetchMock([
        {
          match: (u) => u.includes("instagram.com/api"),
          respond: () => new Response(JSON.stringify({ user: { username: "moss" } }), { status: 200 }),
        },
        {
          match: (u) => u.includes("x.com/"),
          respond: () => new Response("{}", { status: 404 }),
        },
        {
          match: (u) => u.includes("tiktok.com"),
          respond: () => new Response(tiktokHtml(FREE_TIKTOK), { status: 200 }),
        },
        {
          match: (u) => u.includes("youtube.com"),
          respond: () => new Response("{}", { status: 404 }),
        },
      ]),
    );
    const { results } = await checkSocial("moss");
    const instagramRows = results.filter((r) => r.platform === "Instagram");
    expect(instagramRows.some((r) => r.status === "taken" && !r.variant)).toBe(true);
    expect(instagramRows.some((r) => r.variant)).toBe(true);
  });
});
