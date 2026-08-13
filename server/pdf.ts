import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { CheckResultsJson } from "./types";

const FLAME = rgb(0.97, 0.38, 0.1);
const INK = rgb(0.09, 0.09, 0.09);
const MUTED = rgb(0.42, 0.42, 0.42);
const LINE = rgb(0.85, 0.85, 0.85);
const OK = rgb(0.13, 0.45, 0.26);
const TAKEN = rgb(0.72, 0.13, 0.13);

function label(status: string): string {
  return status === "available" ? "FREE" : status === "taken" ? "TAKEN" : "UNKNOWN";
}

function color(status: string) {
  return status === "available" ? OK : status === "taken" ? TAKEN : MUTED;
}

export async function buildReportPdf(name: string, email: string, data: CheckResultsJson): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const mono = await doc.embedFont(StandardFonts.Courier);
  const monoBold = await doc.embedFont(StandardFonts.CourierBold);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 64;

  page.drawText("NAMECLEAR", { x: 56, y, size: 16, font: monoBold, color: INK });
  page.drawText("BRAND NAME REPORT", { x: 56 + 150, y, size: 9, font: mono, color: MUTED });
  page.drawLine({ start: { x: 56, y: y - 12 }, end: { x: width - 56, y: y - 12 }, thickness: 1.5, color: FLAME });
  y -= 40;

  page.drawText("NAME", { x: 56, y, size: 8, font: mono, color: MUTED });
  page.drawText(name.toUpperCase(), { x: 160, y: y - 2, size: 13, font: monoBold, color: INK });
  y -= 26;
  page.drawText("EMAIL", { x: 56, y, size: 8, font: mono, color: MUTED });
  page.drawText(email, { x: 160, y: y - 2, size: 10, font: mono, color: INK });
  y -= 26;
  page.drawText("DATE", { x: 56, y, size: 8, font: mono, color: MUTED });
  page.drawText(new Date().toUTCString(), { x: 160, y: y - 2, size: 10, font: mono, color: INK });
  y -= 44;

  function sectionHeader(title: string, index: number) {
    page.drawText(`${index} — ${title}`, { x: 56, y, size: 12, font: monoBold, color: INK });
    page.drawLine({ start: { x: 56, y: y - 8 }, end: { x: width - 56, y: y - 8 }, thickness: 0.8, color: LINE });
    y -= 30;
  }

  function row(labelText: string, value: string, status: string | null, availableDomain: string | null) {
    if (y < 90) {
      const next = doc.addPage([595.28, 841.89]);
      y = next.getSize().height - 56;
    }
    if (status) {
      page.drawText(value, { x: 56, y, size: 10, font: mono, color: INK });
      page.drawText(label(status), { x: 400, y, size: 10, font: monoBold, color: color(status) });
    } else {
      page.drawText(labelText, { x: 56, y, size: 8, font: mono, color: MUTED });
      page.drawText(value, { x: 160, y, size: 10, font: mono, color: INK });
    }
    if (availableDomain) {
      page.drawText(`-> ${availableDomain}`, { x: 56, y: y - 14, size: 8, font: mono, color: OK });
    }
    y -= 24;
  }

  const domains = data.domains?.results ?? [];
  sectionHeader("DOMAIN AVAILABILITY", 1);
  for (const d of domains) {
    row(d.tld, `${d.domain}`, d.status, null);
    if (d.status === "available") {
      page.drawText(`   register: ${d.registerUrl ?? ""}`, { x: 56, y: y - 8, size: 8, font: mono, color: MUTED });
      y -= 16;
    }
    y -= 2;
  }
  if (domains.length === 0) row("domains", "no data", null, null);
  y -= 14;

  const tm = data.trademark;
  sectionHeader("USPTO TRADEMARK SCAN", 2);
  if (tm?.unavailable) {
    row("status", `USPTO unavailable (${tm.unavailable})`, null, null);
  } else if (tm?.results?.length === 0) {
    row("conflicts", "none found — name appears clear", null, null);
  } else {
    row("conflicts", tm?.conflictsFound ? "POTENTIAL CONFLICTS" : "possible close matches", null, null);
    for (const r of (tm?.results ?? []).slice(0, 8)) {
      const cls = r.classes.length > 0 ? ` [${r.classes.slice(0, 3).join(", ")}]` : "";
      row("mark", `${r.mark}${cls}`, null, null);
      row("owner", r.owner, null, null);
      row("status", `${r.status}${r.registrationNumber ? ` / REG #${r.registrationNumber}` : ""}`, null, null);
      row("record", r.usptoUrl, null, null);
      y -= 6;
    }
  }
  y -= 14;

  const social = data.social?.results ?? [];
  sectionHeader("SOCIAL HANDLES", 3);
  for (const s of social) {
    row(s.platform, s.variant ? `@${s.handle} (variant)` : `@${s.handle}`, s.status, null);
  }
  if (social.length === 0) row("handles", "no data", null, null);
  y -= 10;

  page.drawLine({ start: { x: 56, y: y }, end: { x: width - 56, y }, thickness: 1.5, color: FLAME });
  y -= 24;
  page.drawText("DISCLAIMER", { x: 56, y, size: 8, font: monoBold, color: MUTED });
  y -= 16;
  page.drawText(
    "This report is an automated availability scan and is not legal advice. Domain and social checks", { x: 56, y, size: 8, font: helv, color: MUTED });
  y -= 12;
  page.drawText(
    "reflect live registry/platform state at generation time and can change. Trademark findings are a", { x: 56, y, size: 8, font: helv, color: MUTED });
  y -= 12;
  page.drawText(
    "screening aid only; consult a licensed trademark attorney before filing or using a mark.", { x: 56, y, size: 8, font: helv, color: MUTED });

  const bytes = await doc.save();
  return bytes;
}
