import { getSessionForReport } from "../../server/checkout";
import { fulfillReport } from "../../server/fulfill";
import { checkPart } from "../../server/check";
import { buildReportPdf } from "../../server/pdf";
import type { NameClearEnv } from "../../server/env";

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const onRequestGet: PagesFunction<NameClearEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id") ?? "";
  if (!sessionId) {
    return json({ error: "Missing session_id" }, 400);
  }

  let session;
  try {
    session = await getSessionForReport(env, sessionId);
  } catch {
    return json({ error: "Invalid or unknown session" }, 404);
  }

  if (!session.paid) {
    return json({ paid: false, name: session.name }, 200);
  }

  const { name, email, paymentId } = session;

  if (url.searchParams.get("download") === "1") {
    if (!name) {
      return json({ error: "No name recorded for this session" }, 404);
    }
    const [domains, trademark, social] = await Promise.all([
      checkPart(env, "domains", name),
      checkPart(env, "trademark", name),
      checkPart(env, "social", name),
    ]);
    const pdfBytes = await buildReportPdf(name, email || "customer", {
      domains: domains as never,
      trademark: trademark as never,
      social: social as never,
    });
    return new Response(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="nameclear-${name.replace(/[^a-z0-9]/gi, "")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const fulfillment = paymentId
    ? await fulfillReport(env, { name, email, paymentId })
    : null;

  return json({
    paid: true,
    name,
    pdfUrl: fulfillment?.pdfUrl ?? null,
    stored: fulfillment?.stored ?? false,
    reportId: fulfillment?.reportId ?? null,
  });
};
