/* Vercel serverless function: verify a Razorpay payment AND record the order
   SERVER-SIDE. The browser never writes the order. After the HMAC signature
   passes, we re-load the authoritative cart + amount from the Razorpay order
   (notes set by create-order) and insert the row with the service-role key,
   then email the customer + owner from that trusted record. Idempotent on
   payment_id so a retry/double-submit can't duplicate an order.
   Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, SUPABASE_SERVICE_ROLE_KEY,
        RESEND_API_KEY (optional), SUPABASE_URL/SUPABASE_ANON_KEY (optional). */
var crypto = require("crypto");
var catalog = require("../lib/catalog");
var emailer = require("../lib/email");

var SB_URL = (process.env.SUPABASE_URL || "https://uwgbhizqyonmxkoncczd.supabase.co").trim().replace(/\/$/, "");
var SB_ANON = (process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Z2JoaXpxeW9ubXhrb25jY3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjQ0MDIsImV4cCI6MjA5ODAwMDQwMn0.oRdQKEmERADZfxJ0noBVNhz_VWRPa96PPLv4lqtfR-Q").trim();

async function getUserId(token) {
  if (!token) return null;
  try {
    var r = await fetch(SB_URL + "/auth/v1/user", { headers: { apikey: SB_ANON, Authorization: "Bearer " + token } });
    if (!r.ok) return null;
    var u = await r.json();
    return (u && u.id) || null;
  } catch (e) { return null; }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ valid: false, error: "Method not allowed" }); return; }
  var KEY_ID = (process.env.RAZORPAY_KEY_ID || "").trim();
  var KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  var SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  var RESEND = (process.env.RESEND_API_KEY || "").trim();
  if (!KEY_SECRET) { res.status(500).json({ valid: false, error: "Not configured" }); return; }

  try {
    var body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    var oid = body.razorpay_order_id, pid = body.razorpay_payment_id, sig = body.razorpay_signature;
    if (!oid || !pid || !sig) { res.status(400).json({ valid: false, error: "Missing fields" }); return; }

    // 1) verify the Razorpay HMAC signature (proves the payment is genuine)
    var expected = crypto.createHmac("sha256", KEY_SECRET).update(oid + "|" + pid).digest("hex");
    var eb = Buffer.from(expected), sb = Buffer.from(String(sig));
    var ok = eb.length === sb.length && crypto.timingSafeEqual(eb, sb);
    if (!ok) { res.status(200).json({ valid: false }); return; }

    var order_no = String(pid).replace("pay_", "");

    // 2) record the order SERVER-SIDE from authoritative data (never client-trusted)
    if (SERVICE && KEY_ID) {
      try {
        // idempotency — already recorded for this payment?
        var exist = await fetch(SB_URL + "/rest/v1/orders?payment_id=eq." + encodeURIComponent(pid) + "&select=order_no",
          { headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE } });
        var existRows = exist.ok ? await exist.json() : [];
        if (Array.isArray(existRows) && existRows.length) {
          res.status(200).json({ valid: true, order_no: existRows[0].order_no || order_no, recorded: true });
          return;
        }
        // authoritative cart + amount straight from the Razorpay order
        var auth = Buffer.from(KEY_ID + ":" + KEY_SECRET).toString("base64");
        var ro = await fetch("https://api.razorpay.com/v1/orders/" + encodeURIComponent(oid), { headers: { Authorization: "Basic " + auth } });
        var rod = ro.ok ? await ro.json() : {};
        var notes = (rod && rod.notes) || {};
        var cartItems = String(notes.cart || "").split(";").filter(Boolean).map(function (s) { var x = s.split(":"); return { id: x[0], qty: Number(x[1]) || 1 }; });
        var priced = catalog.priceCart(cartItems);
        var totalRupees = (rod && rod.amount) ? Math.round(rod.amount / 100) : priced.total;
        var userId = await getUserId(body.accessToken);

        var row = {
          user_id: userId,
          order_no: order_no,
          items: priced.items.length ? priced.items : null,
          subtotal: priced.subtotal,
          shipping: priced.shipping,
          total: totalRupees,
          payment_method: "online",
          payment_id: pid,
          status: "paid",
          name: notes.name || null,
          phone: notes.phone || null,
          email: notes.email || null,
          address: notes.addr || null
        };
        var ins = await fetch(SB_URL + "/rest/v1/orders", {
          method: "POST",
          headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(row)
        });
        if (ins.ok && RESEND) { try { await emailer.sendOrderEmails(RESEND, row, { notifyOwner: true }); } catch (e) {} }
        res.status(200).json({ valid: true, order_no: order_no, recorded: !!ins.ok });
        return;
      } catch (e) {
        // payment is genuine but server recording hit an error — still confirm to the
        // buyer so they aren't stuck; the payment exists in Razorpay for reconciliation.
        res.status(200).json({ valid: true, order_no: order_no, recorded: false });
        return;
      }
    }
    res.status(200).json({ valid: true, order_no: order_no, recorded: false });
  } catch (e) {
    res.status(500).json({ valid: false, error: "Server error" });
  }
};
