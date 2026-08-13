import { createClient } from "@supabase/supabase-js";
import type { NameClearEnv } from "./env";
import { checkPart } from "./check";
import { buildReportPdf } from "./pdf";
import type { CheckResultsJson } from "./types";

const REPORT_BUCKET = "reports";

async function supabase(env: NameClearEnv) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadFullResults(
  env: NameClearEnv,
  name: string,
): Promise<CheckResultsJson> {
  const [domains, trademark, social] = await Promise.all([
    checkPart(env, "domains", name),
    checkPart(env, "trademark", name),
    checkPart(env, "social", name),
  ]);
  return {
    domains: domains as CheckResultsJson["domains"],
    trademark: trademark as CheckResultsJson["trademark"],
    social: social as CheckResultsJson["social"],
  };
}

export interface FulfillmentResult {
  name: string;
  email: string;
  paymentId: string | null;
  pdfUrl: string | null;
  reportId: string | null;
  stored: boolean;
}

export async function fulfillReport(
  env: NameClearEnv,
  input: { name: string; email: string; paymentId: string },
): Promise<FulfillmentResult> {
  const { name, email, paymentId } = input;
  const results = await loadFullResults(env, name);
  const pdfBytes = await buildReportPdf(name, email, results);

  const db = await supabase(env);
  let pdfUrl: string | null = null;
  let stored = false;

  if (db && pdfBytes.length > 0) {
    const bucket = db.storage.from(REPORT_BUCKET);
    const path = `${paymentId}.pdf`;
    const { error: uploadError } = await bucket.upload(path, pdfBytes, {
      contentType: "application/pdf",
      cacheControl: "3600",
    });
    if (uploadError) {
      await bucket.upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
    }
    const { data: urlData } = await bucket.createSignedUrl(path, 60 * 60 * 24 * 7);
    pdfUrl = urlData?.signedUrl ?? null;
    stored = true;
  }

  let reportId: string | null = null;
  if (db) {
    const { data, error } = await db
      .from("paid_reports")
      .upsert(
        {
          searched_name: name,
          email,
          stripe_payment_id: paymentId,
          pdf_url: pdfUrl,
          created_at: new Date().toISOString(),
        },
        { onConflict: "stripe_payment_id" },
      )
      .select("id")
      .single();
    if (!error && data) reportId = data.id;
  }

  return { name, email, paymentId, pdfUrl, reportId, stored };
}
