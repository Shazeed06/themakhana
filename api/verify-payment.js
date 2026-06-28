/* Vercel serverless function: verify a Razorpay payment AND record the order
   SERVER-SIDE. The browser never writes the order. After the HMAC signature
   passes (proving the payment is genuine), the shared recorder re-loads the
   authoritative cart + amount from the Razorpay order and inserts the row with
   the service-role key, then emails the customer + owner. Idempotent on
   payment_id; if recording fails the owner is alerted (see lib/record-order).
   Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, SUPABASE_SERVICE_ROLE_KEY,
        RESEND_API_KEY (optional). */
var crypto = require("crypto");
var recorder = require("../lib/record-order");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ valid: false, error: "Method not allowed" }); return; }
  var KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!KEY_SECRET) { res.status(500).json({ valid: false, error: "Not configured" }); return; }

  try {
    var body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    var oid = body.razorpay_order_id, pid = body.razorpay_payment_id, sig = body.razorpay_signature;
    if (!oid || !pid || !sig) { res.status(400).json({ valid: false, error: "Missing fields" }); return; }

    // verify the Razorpay HMAC signature (proves the payment is genuine)
    var expected = crypto.createHmac("sha256", KEY_SECRET).update(oid + "|" + pid).digest("hex");
    var eb = Buffer.from(expected), sb = Buffer.from(String(sig));
    var ok = eb.length === sb.length && crypto.timingSafeEqual(eb, sb);
    if (!ok) { res.status(200).json({ valid: false }); return; }

    var order_no = String(pid).replace("pay_", "");
    // signature already proved genuineness -> record (idempotent; owner-alerted on failure)
    var rr = await recorder.recordPaidOrder({ oid: oid, pid: pid, accessToken: body.accessToken });
    res.status(200).json({ valid: true, order_no: rr.order_no || order_no, recorded: !!rr.recorded });
  } catch (e) {
    res.status(500).json({ valid: false, error: "Server error" });
  }
};
