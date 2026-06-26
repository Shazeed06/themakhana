/* Vercel serverless function: verify a Razorpay payment signature.
   HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) must equal the signature. */
const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ valid: false, error: "Method not allowed" });
    return;
  }
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  if (!KEY_SECRET) { res.status(500).json({ valid: false, error: "Not configured" }); return; }
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const oid = body.razorpay_order_id;
    const pid = body.razorpay_payment_id;
    const sig = body.razorpay_signature;
    if (!oid || !pid || !sig) { res.status(400).json({ valid: false }); return; }

    const expected = crypto.createHmac("sha256", KEY_SECRET).update(oid + "|" + pid).digest("hex");
    let valid = false;
    try {
      const a = Buffer.from(expected);
      const b = Buffer.from(String(sig));
      valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch (e) { valid = false; }

    res.status(200).json({ valid: valid });
  } catch (e) {
    res.status(200).json({ valid: false });
  }
};
