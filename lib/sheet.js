/* Best-effort mirror of orders + leads into the owner's Google Sheet, via a
   Google Apps Script Web App bound to that sheet (no service-account creds in
   Vercel). Dependency-free, defensive: a sheet failure must NEVER block or error
   the order/email/lead flow. Env: SHEET_WEBHOOK_URL (the deployed /exec URL),
   SHEET_SECRET (shared secret). If not configured -> silently skip. Never throws. */
var URL = (process.env.SHEET_WEBHOOK_URL || "").trim();
var SECRET = (process.env.SHEET_SECRET || "").trim();

// type: "order" | "lead"; data: the row object. Returns {ok} — never throws.
async function pushToSheet(type, data) {
  if (!URL) return { ok: false, skipped: "not configured" };
  try {
    var r = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: type, secret: SECRET, data: data }),
      signal: AbortSignal.timeout(4000)
    });
    return { ok: !!(r && r.ok) };
  } catch (e) {
    return { ok: false };
  }
}

module.exports = { pushToSheet: pushToSheet };
