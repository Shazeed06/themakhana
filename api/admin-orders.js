/* Vercel serverless function: admin — list ALL orders.
   Protected by ADMIN_PASSWORD. Uses the Supabase service_role key (bypasses RLS)
   so the owner can see every customer's orders. The service_role key NEVER
   reaches the browser — it lives only in Vercel env vars.
   Env vars (set in Vercel):
     ADMIN_PASSWORD             - password the owner chooses
     SUPABASE_SERVICE_ROLE_KEY  - Supabase service_role key (secret)
     SUPABASE_URL               - optional (defaults to the project URL) */
const crypto = require("crypto");

function safeEqual(a, b) {
  const ab = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  try { return crypto.timingSafeEqual(ab, bb); } catch (e) { return false; }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "").trim();
  const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const BASE = (process.env.SUPABASE_URL || "https://uwgbhizqyonmxkoncczd.supabase.co").trim().replace(/\/$/, "");

  if (!ADMIN_PASSWORD || !SERVICE) {
    res.status(500).json({ error: "Admin is not set up yet. Add ADMIN_PASSWORD and SUPABASE_SERVICE_ROLE_KEY in Vercel, then redeploy." });
    return;
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  if (!safeEqual(body.password || "", ADMIN_PASSWORD)) {
    res.status(401).json({ error: "Wrong password" });
    return;
  }

  try {
    const r = await fetch(BASE + "/rest/v1/orders?select=*&order=created_at.desc", {
      headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE }
    });
    const data = await r.json();
    if (!r.ok) {
      res.status(502).json({ error: (data && (data.message || data.hint)) || "Could not load orders" });
      return;
    }
    res.status(200).json({ orders: Array.isArray(data) ? data : [] });
  } catch (e) {
    res.status(500).json({ error: "Server error while loading orders" });
  }
};
