import { describe, expect, it } from "vitest";
import { inflateSync } from "node:zlib";
import { buildReportPdf } from "../server/pdf";
import type { CheckResultsJson } from "../server/types";

function extractPdfText(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString("latin1");
  const out: string[] = [];
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(raw)) !== null) {
    const data = Buffer.from(m[1], "latin1");
    try {
      let stream = inflateSync(data).toString("latin1");
      stream = stream.replace(/<([0-9A-Fa-f]{2,})> Tj/g, (_s, hex: string) =>
        Buffer.from(hex, "hex").toString("latin1"),
      );
      out.push(stream);
    } catch {
      // not a deflate stream; skip
    }
  }
  return out.join("\n");
}

const sample: CheckResultsJson = {
  domains: {
    name: "apple",
    results: [
      { tld: "com", domain: "apple.com", status: "taken", registerUrl: null },
      { tld: "io", domain: "apple.io", status: "taken", registerUrl: null },
      { tld: "net", domain: "apple.net", status: "taken", registerUrl: null },
      {
        tld: "co",
        domain: "apple.co",
        status: "available",
        registerUrl: "https://www.namecheap.com/domains/registration/results/?domain=apple",
      },
    ],
    alternatives: [
      {
        domain: "getapple.io",
        status: "available",
        registerUrl: "https://www.namecheap.com/domains/registration/results/?domain=getapple",
      },
    ],
  },
  trademark: {
    name: "apple",
    conflictsFound: true,
    results: [
      {
        serialNumber: "sn123",
        mark: "APPLE",
        owner: "Apple Inc.",
        status: "REGISTERED",
        statusDate: null,
        classes: ["9"],
        registrationNumber: "1234567",
        exact: true,
        usptoUrl: "https://tsdr.uspto.gov/documentviewer?caseId=sn123",
      },
    ],
  },
  social: {
    name: "apple",
    results: [
      { platform: "X / Twitter", handle: "apple", url: "https://x.com/apple", status: "taken" },
      {
        platform: "X / Twitter",
        handle: "appleofficial",
        url: "https://x.com/appleofficial",
        status: "available",
        variant: true,
      },
    ],
  },
};

describe("buildReportPdf", () => {
  it("produces a valid PDF with the full promised report contents", async () => {
    const bytes = await buildReportPdf("apple", "customer", sample);
    const text = extractPdfText(bytes);

    expect(bytes[0]).toBe(0x25); // %PDF
    expect(bytes[1]).toBe(0x50); // P
    expect(text).toContain("DOMAIN AVAILABILITY");
    expect(text).toContain("apple.com");
    expect(text).toContain("SUGGESTED ALTERNATIVES");
    expect(text).toContain("getapple.io");
    expect(text).toContain("USPTO TRADEMARK SCAN");
    expect(text).toContain("tsdr.uspto.gov");
    expect(text).toContain("SOCIAL HANDLES");
    expect(text).toContain("appleofficial");
    expect(text).toContain("DISCLAIMER");
  });
});
