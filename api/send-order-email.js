/* Vercel serverless function: send order emails via Resend.
   Sends (1) a branded order confirmation to the customer and optionally
   (2) a new-order alert to the owner.
   Auth: either a valid ADMIN_PASSWORD (adminKey, for tests via /admin) OR a
   valid Razorpay signature (real post-payment call from checkout).
   Env: RESEND_API_KEY (required), ADMIN_PASSWORD, RAZORPAY_KEY_SECRET. */
const crypto = require("crypto");

function safeEqual(a, b) {
  const ab = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  try { return crypto.timingSafeEqual(ab, bb); } catch (e) { return false; }
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) {
    return ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c];
  });
}
function rupee(n) { return "&#8377;" + Number(n || 0).toLocaleString("en-IN"); }

function itemsRows(items) {
  if (!Array.isArray(items) || !items.length) return '<tr><td style="padding:8px 0;color:#6B7280">&mdash;</td><td></td></tr>';
  return items.map(function (it) {
    var name = esc(it.name || it.id || "Item");
    var qty = it.qty || it.quantity || 1;
    var line = (it.price != null) ? rupee(it.price * qty) : "";
    return '<tr><td style="padding:7px 0;border-bottom:1px solid #eef1ea;color:#1A1A1A">' + name + ' &times; ' + esc(qty) +
      '</td><td style="padding:7px 0;border-bottom:1px solid #eef1ea;text-align:right;color:#1A1A1A;white-space:nowrap">' + line + '</td></tr>';
  }).join("");
}

function shell(inner) {
  return '<div style="background:#f4f7ef;padding:24px 0;font-family:Inter,Segoe UI,Arial,sans-serif">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E6EBDF;border-radius:18px;overflow:hidden">' +
    '<div style="background:#74865b;padding:20px 26px;text-align:center">' +
      '<span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:.02em">The Makhana</span>' +
    '</div>' + inner +
    '<div style="padding:18px 26px;background:#f4f7ef;text-align:center;color:#6B7280;font-size:12px;line-height:1.6">' +
      'The Makhana &middot; Roasted, never fried<br>themakhana.official@gmail.com &middot; +91&nbsp;82871&nbsp;24651</div>' +
    '</div></div>';
}

function customerEmail(o) {
  var addr = [o.address, o.city, o.state, o.pincode].filter(Boolean).map(esc).join(", ");
  return shell(
    '<div style="padding:28px 26px 8px">' +
      '<h1 style="margin:0 0 6px;font-size:22px;color:#0D0D0D">Order confirmed! &#127881;</h1>' +
      '<p style="margin:0 0 18px;font-size:15px;color:#4f6b34;font-weight:600">Thank you' + (o.name ? ", " + esc(String(o.name).split(" ")[0]) : "") + " — we&#39;ve got your order.</p>" +
      '<p style="margin:0 0 4px;font-size:13px;color:#6B7280">Order number</p>' +
      '<p style="margin:0 0 18px;font-size:17px;font-weight:800;color:#0D0D0D">#' + esc(o.order_no || "") + '</p>' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px">' + itemsRows(o.items) + '</table>' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">' +
        '<tr><td style="padding:4px 0;color:#6B7280">Subtotal</td><td style="padding:4px 0;text-align:right">' + rupee(o.subtotal) + '</td></tr>' +
        '<tr><td style="padding:4px 0;color:#6B7280">Shipping</td><td style="padding:4px 0;text-align:right">' + (Number(o.shipping) ? rupee(o.shipping) : "FREE") + '</td></tr>' +
        '<tr><td style="padding:8px 0 0;font-weight:800;font-size:16px;color:#0D0D0D">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:800;font-size:16px;color:#0D0D0D">' + rupee(o.total) + '</td></tr>' +
      '</table>' +
      (addr ? '<p style="margin:18px 0 0;font-size:13px;color:#6B7280">Delivering to</p><p style="margin:2px 0 0;font-size:14px;color:#1A1A1A">' + addr + '</p>' : "") +
      '<p style="margin:22px 0 6px;font-size:14px;color:#1A1A1A;line-height:1.6">We&#39;re packing your foxnuts and will ship them soon. You&#39;ll get tracking once it&#39;s on the way. &#128230;</p>' +
    '</div>'
  );
}

function ownerEmail(o) {
  var addr = [o.address, o.city, o.state, o.pincode].filter(Boolean).map(esc).join(", ");
  return shell(
    '<div style="padding:28px 26px 8px">' +
      '<h1 style="margin:0 0 14px;font-size:21px;color:#0D0D0D">New order received! &#128276;</h1>' +
      '<p style="margin:0 0 4px;font-size:13px;color:#6B7280">Order</p>' +
      '<p style="margin:0 0 16px;font-size:17px;font-weight:800;color:#0D0D0D">#' + esc(o.order_no || "") + ' &middot; ' + rupee(o.total) + '</p>' +
      '<p style="margin:0;font-size:14px;color:#1A1A1A"><b>' + esc(o.name || "") + '</b></p>' +
      (o.phone ? '<p style="margin:2px 0 0;font-size:14px;color:#1A1A1A">' + esc(o.phone) + '</p>' : "") +
      (o.email ? '<p style="margin:2px 0 0;font-size:14px;color:#1A1A1A">' + esc(o.email) + '</p>' : "") +
      (addr ? '<p style="margin:8px 0 0;font-size:14px;color:#6B7280">' + addr + '</p>' : "") +
      '<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">' + itemsRows(o.items) + '</table>' +
      '<p style="margin:18px 0 0"><a href="https://www.themakhana.in/admin" style="display:inline-block;background:#0D0D0D;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:50px">Open orders dashboard</a></p>' +
    '</div>'
  );
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  const RESEND = (process.env.RESEND_API_KEY || "").trim();
  if (!RESEND) { res.status(500).json({ error: "Email is not set up yet (RESEND_API_KEY missing in Vercel)." }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  // ---- auth: admin key (test) OR valid Razorpay signature (real payment) ----
  const ADMIN = (process.env.ADMIN_PASSWORD || "").trim();
  const SECRET = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  let authed = false;
  if (body.adminKey && ADMIN && safeEqual(body.adminKey, ADMIN)) authed = true;
  else if (body.razorpay_order_id && body.razorpay_payment_id && body.razorpay_signature && SECRET) {
    const expected = crypto.createHmac("sha256", SECRET).update(body.razorpay_order_id + "|" + body.razorpay_payment_id).digest("hex");
    if (safeEqual(expected, body.razorpay_signature)) authed = true;
  }
  if (!authed) { res.status(401).json({ error: "Unauthorized" }); return; }

  const o = body.order || {};
  const FROM = "The Makhana <orders@themakhana.in>";
  const OWNER = "themakhana.official@gmail.com";

  async function send(to, subject, html, replyTo) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + RESEND, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject: subject, html: html, reply_to: replyTo })
    });
    const data = await r.json().catch(function () { return {}; });
    return { ok: r.ok, status: r.status, id: data && data.id, error: data && data.message };
  }

  try {
    const out = {};
    if (o.email) {
      out.customer = await send(o.email, "Your The Makhana order is confirmed — #" + (o.order_no || ""), customerEmail(o), OWNER);
    }
    if (body.notifyOwner !== false) {
      out.owner = await send(OWNER, "New order — #" + (o.order_no || "") + " (" + "₹" + (o.total || 0) + ")", ownerEmail(o), o.email || undefined);
    }
    const anyFail = Object.keys(out).some(function (k) { return !out[k].ok; });
    res.status(anyFail ? 502 : 200).json({ ok: !anyFail, results: out });
  } catch (e) {
    res.status(500).json({ error: "Failed to send email" });
  }
};
