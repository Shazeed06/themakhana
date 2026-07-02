/* Vercel serverless function: fetch all captured leads for the owner dashboard.
   Gated by ADMIN_PASSWORD (timing-safe), reads with the service role.
   Env: ADMIN_PASSWORD, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL (optional). */
var crypto = require("crypto");
var SB_URL = (process.env.SUPABASE_URL || "https://uwgbhizqyonmxkoncczd.supabase.co").trim().replace(/\/$/, "");

function safeEqual(a, b) {
  var ab = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  try { return crypto.timingSafeEqual(ab, bb); } catch (e) { return false; }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  var ADMIN = (process.env.ADMIN_PASSWORD || "").trim();
  var SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!ADMIN || !SERVICE) { res.status(500).json({ error: "Not configured" }); return; }

  var body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  if (!(body.adminKey && safeEqual(body.adminKey, ADMIN))) { res.status(401).json({ error: "Wrong password" }); return; }

  try {
    var r = await fetch(SB_URL + "/rest/v1/leads?select=*&order=updated_at.desc&limit=1000",
      { headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE } });
    var rows = r.ok ? await r.json() : [];
    res.status(200).json({ leads: Array.isArray(rows) ? rows : [] });
  } catch (e) {
    res.status(500).json({ error: "Failed to load leads" });
  }
};
