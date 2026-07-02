/* Vercel serverless function: capture a lead (partial or complete) from the
   site's forms. Upserts by lead_key with the SERVICE ROLE key so the browser
   never touches the leads table. Legal/consent: the forms carry a notice and
   the privacy policy discloses this capture. Env: SUPABASE_SERVICE_ROLE_KEY,
   SUPABASE_URL (optional). */
var SB_URL = (process.env.SUPABASE_URL || "https://uwgbhizqyonmxkoncczd.supabase.co").trim().replace(/\/$/, "");

function clean(v, max) {
  if (v == null) return null;
  var s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max || 160);
}

module.exports = async (req, res) => {
  // sendBeacon may not preflight; keep it POST-only, same-origin, always 200-ish for beacons
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  var SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!SERVICE) { res.status(200).json({ ok: false, skipped: "not configured" }); return; }

  try {
    var body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    var name = clean(body.name, 120);
    var phone = clean(body.phone, 20);
    var email = clean(body.email, 160);
    // ignore empty leads (no identifying detail yet)
    if (!name && !phone && !email) { res.status(200).json({ ok: true, skipped: "empty" }); return; }

    var leadKey = clean(body.lead_key, 80) || ("lk-" + Date.now());
    var status = body.status === "complete" ? "complete" : "partial";
    var row = {
      lead_key: leadKey,
      name: name,
      phone: phone,
      email: email,
      source: clean(body.source, 40) || "form",
      page: clean(body.page, 200) || "/",
      status: status,
      updated_at: new Date().toISOString()
    };

    // Upsert on lead_key (one row per visitor session, updated as they type/submit).
    var r = await fetch(SB_URL + "/rest/v1/leads?on_conflict=lead_key", {
      method: "POST",
      headers: {
        apikey: SERVICE,
        Authorization: "Bearer " + SERVICE,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(row)
    });
    res.status(200).json({ ok: r.ok });
  } catch (e) {
    // never surface internals; a failed lead capture must not error the page
    res.status(200).json({ ok: false });
  }
};
