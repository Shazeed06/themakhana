/* Vercel serverless function: send a TEST order-confirmation email from the admin
   dashboard. Real post-payment emails are sent SERVER-SIDE by verify-payment from
   the verified order record — so this endpoint is gated ONLY by ADMIN_PASSWORD
   (the old razorpay-signature path was removed; it allowed replayed/forged emails).
   Env: RESEND_API_KEY, ADMIN_PASSWORD. */
var crypto = require("crypto");
var emailer = require("../lib/email");

function safeEqual(a, b) {
  var ab = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  try { return crypto.timingSafeEqual(ab, bb); } catch (e) { return false; }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  var RESEND = (process.env.RESEND_API_KEY || "").trim();
  if (!RESEND) { res.status(500).json({ error: "Email is not set up yet (RESEND_API_KEY missing in Vercel)." }); return; }
  var ADMIN = (process.env.ADMIN_PASSWORD || "").trim();

  var body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  if (!(body.adminKey && ADMIN && safeEqual(body.adminKey, ADMIN))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    var out = await emailer.sendOrderEmails(RESEND, body.order || {}, { notifyOwner: body.notifyOwner !== false });
    var anyFail = Object.keys(out).some(function (k) { return !out[k].ok; });
    res.status(anyFail ? 502 : 200).json({ ok: !anyFail, results: out });
  } catch (e) {
    res.status(500).json({ error: "Failed to send email" });
  }
};
