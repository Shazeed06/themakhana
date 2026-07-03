/* Shared order-email rendering + sending via Resend. Used by api/verify-payment
   (server-side, built from the VERIFIED order record) and api/send-order-email. */
var LOGO = "https://www.themakhana.in/images/logo.png?v=5";

function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) {
    return ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c];
  });
}
function rupee(n) { return "&#8377;" + Number(n || 0).toLocaleString("en-IN"); }

function itemsRows(items) {
  if (!Array.isArray(items) || !items.length) return '<tr><td style="padding:10px 0;color:#9A9A9A">&mdash;</td><td></td></tr>';
  return items.map(function (it) {
    var name = esc(it.name || it.id || "Item");
    var qty = it.qty || it.quantity || 1;
    var line = (it.price != null) ? rupee(it.price * qty) : "";
    return '<tr>' +
      '<td style="padding:11px 0;border-bottom:1px solid #F7F7F7;color:#1A1A1A;font-size:14.5px">' + name + ' <span style="color:#9A9A9A">&times; ' + esc(qty) + '</span></td>' +
      '<td style="padding:11px 0;border-bottom:1px solid #F7F7F7;text-align:right;color:#1A1A1A;font-size:14.5px;white-space:nowrap;font-weight:600">' + line + '</td>' +
      '</tr>';
  }).join("");
}

function shell(preheader, inner) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#F7F7F7;-webkit-font-smoothing:antialiased">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F7F7F7">' + esc(preheader) + '</div>' +
    '<div style="background:#F7F7F7;padding:30px 14px;font-family:-apple-system,BlinkMacSystemFont,&#39;Segoe UI&#39;,Roboto,Helvetica,Arial,sans-serif">' +
      '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 10px 32px rgba(20,20,20,.08)">' +
        '<div style="padding:34px 30px 24px;text-align:center;border-bottom:1px solid #FFBC0D">' +
          '<img src="' + LOGO + '" width="210" height="42" alt="The Makhana" style="display:inline-block;width:100%;max-width:210px;height:auto;border:0;outline:none;text-decoration:none">' +
        '</div>' +
        inner +
        '<div style="padding:26px 30px 30px;background:#FFF8E7;text-align:center;border-top:1px solid #FFBC0D">' +
          '<p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#DB0007;letter-spacing:.14em">THE MAKHANA</p>' +
          '<p style="margin:0 0 12px;font-size:12px;color:#9A9A9A">Roasted, never fried &middot; Sourced from Bihar</p>' +
          '<p style="margin:0;font-size:12.5px;color:#9A9A9A;line-height:1.8">' +
            '<a href="mailto:themakhana.official@gmail.com" style="color:#DB0007;text-decoration:none">themakhana.official@gmail.com</a><br>' +
            '<a href="tel:+918287124651" style="color:#DB0007;text-decoration:none">+91 82871 24651</a></p>' +
          '<p style="margin:16px 0 0;font-size:11px;color:#B8B8B8">&copy; The Makhana &middot; <a href="https://www.themakhana.in" style="color:#B8B8B8;text-decoration:underline">themakhana.in</a></p>' +
        '</div>' +
      '</div>' +
    '</div></body></html>';
}

function customerEmail(o) {
  var addr = [o.address, o.city, o.state, o.pincode].filter(Boolean).map(esc).join(", ");
  var first = o.name ? esc(String(o.name).split(" ")[0]) : "there";
  var inner =
    '<div style="padding:34px 30px 10px">' +
      '<div style="text-align:center;margin-bottom:26px">' +
        '<div style="width:58px;height:58px;line-height:58px;border-radius:50%;background:#e8f6ee;margin:0 auto 14px;text-align:center">' +
          '<span style="color:#1e8a4c;font-size:30px;font-weight:700;line-height:58px">&#10003;</span>' +
        '</div>' +
        '<h1 style="margin:0;font-size:24px;color:#0D0D0D;font-weight:800;letter-spacing:-.01em">Order confirmed</h1>' +
        '<p style="margin:8px 0 0;font-size:15px;color:#6B7280;line-height:1.5">Thanks, ' + first + '! We&#39;ve received your order and we&#39;re on it.</p>' +
      '</div>' +
      '<div style="background:#FFF8E7;border-radius:14px;padding:16px 18px;text-align:center;margin-bottom:24px">' +
        '<div style="font-size:11.5px;color:#6B7280;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px">Order number</div>' +
        '<div style="font-size:19px;font-weight:800;color:#0D0D0D">#' + esc(o.order_no || "") + '</div>' +
      '</div>' +
      '<div style="font-size:11.5px;color:#6B7280;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Order summary</div>' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' + itemsRows(o.items) + '</table>' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;font-size:14.5px">' +
        '<tr><td style="padding:5px 0;color:#6B7280">Subtotal</td><td style="padding:5px 0;text-align:right;color:#1A1A1A">' + rupee(o.subtotal) + '</td></tr>' +
        '<tr><td style="padding:5px 0;color:#6B7280">Shipping</td><td style="padding:5px 0;text-align:right;font-weight:700;color:' + (Number(o.shipping) ? "#1A1A1A" : "#1e8a4c") + '">' + (Number(o.shipping) ? rupee(o.shipping) : "FREE") + '</td></tr>' +
        '<tr><td style="padding:13px 0 0;border-top:2px solid #FFBC0D;font-weight:800;font-size:16px;color:#0D0D0D">Total paid</td><td style="padding:13px 0 0;border-top:2px solid #FFBC0D;text-align:right;font-weight:800;font-size:16px;color:#0D0D0D">' + rupee(o.total) + '</td></tr>' +
      '</table>' +
      (addr ? '<div style="margin-top:24px;background:#FFF8E7;border-radius:14px;padding:16px 18px"><div style="font-size:11.5px;color:#6B7280;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px">Delivering to</div><div style="font-size:14.5px;color:#1A1A1A;line-height:1.55">' + addr + '</div></div>' : "") +
      '<p style="margin:26px 0 20px;font-size:14.5px;color:#4a4438;line-height:1.65;text-align:center">We&#39;re hand-packing your foxnuts &#127881; and will ship them shortly &mdash; you&#39;ll get tracking once it&#39;s on the way.</p>' +
      '<div style="text-align:center;padding-bottom:6px">' +
        '<a href="https://www.themakhana.in/shop" style="display:inline-block;background:#DB0007;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:50px">Shop more makhana</a>' +
      '</div>' +
    '</div>';
  return shell("Your order #" + (o.order_no || "") + " is confirmed — thanks for shopping with The Makhana.", inner);
}

function ownerEmail(o) {
  var addr = [o.address, o.city, o.state, o.pincode].filter(Boolean).map(esc).join(", ");
  var inner =
    '<div style="padding:34px 30px 10px">' +
      '<div style="text-align:center;margin-bottom:24px">' +
        '<span style="display:inline-block;background:#FFBC0D;color:#1A1A1A;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:7px 16px;border-radius:50px">New order &#128276;</span>' +
        '<h1 style="margin:14px 0 0;font-size:23px;color:#0D0D0D;font-weight:800">#' + esc(o.order_no || "") + ' &middot; ' + rupee(o.total) + '</h1>' +
      '</div>' +
      '<div style="background:#FFF8E7;border-radius:14px;padding:18px 20px;margin-bottom:20px">' +
        '<div style="font-size:11.5px;color:#6B7280;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px">Customer</div>' +
        '<div style="font-size:15.5px;color:#0D0D0D;font-weight:700">' + esc(o.name || "") + '</div>' +
        (o.phone ? '<div style="margin-top:4px;font-size:14px"><a href="tel:' + esc(o.phone) + '" style="color:#DB0007;text-decoration:none">' + esc(o.phone) + '</a></div>' : "") +
        (o.email ? '<div style="margin-top:2px;font-size:14px"><a href="mailto:' + esc(o.email) + '" style="color:#DB0007;text-decoration:none">' + esc(o.email) + '</a></div>' : "") +
        (addr ? '<div style="margin-top:10px;font-size:14px;color:#6B7280;line-height:1.55">' + addr + '</div>' : "") +
      '</div>' +
      '<div style="font-size:11.5px;color:#6B7280;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Items</div>' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' + itemsRows(o.items) + '</table>' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;font-size:15px"><tr><td style="padding:12px 0 0;border-top:2px solid #FFBC0D;font-weight:800;color:#0D0D0D">Total</td><td style="padding:12px 0 0;border-top:2px solid #FFBC0D;text-align:right;font-weight:800;color:#0D0D0D">' + rupee(o.total) + '</td></tr></table>' +
      '<div style="text-align:center;margin:26px 0 6px">' +
        '<a href="https://www.themakhana.in/admin" style="display:inline-block;background:#DB0007;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:50px">Open orders dashboard</a>' +
      '</div>' +
    '</div>';
  return shell("New order #" + (o.order_no || "") + " — Rs " + (o.total || 0) + (o.name ? " from " + o.name : ""), inner);
}

var FROM = "The Makhana <orders@themakhana.in>";
var OWNER = "themakhana.official@gmail.com";

async function send(resendKey, to, subject, html, replyTo) {
  var r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + resendKey, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject: subject, html: html, reply_to: replyTo })
  });
  var data = await r.json().catch(function () { return {}; });
  return { ok: r.ok, status: r.status, id: data && data.id, error: data && data.message };
}

// o = order record. opts.notifyOwner (default true). Sends customer + owner emails
// concurrently (both go out in one round-trip instead of two).
async function sendOrderEmails(resendKey, o, opts) {
  opts = opts || {};
  var tasks = [];
  if (o.email) tasks.push(send(resendKey, o.email, "Your The Makhana order is confirmed — #" + (o.order_no || ""), customerEmail(o), OWNER).then(function (r) { return ["customer", r]; }));
  if (opts.notifyOwner !== false) tasks.push(send(resendKey, OWNER, "New order — #" + (o.order_no || "") + " (₹" + (o.total || 0) + ")", ownerEmail(o), o.email || undefined).then(function (r) { return ["owner", r]; }));
  var results = await Promise.all(tasks);
  var out = {};
  results.forEach(function (p) { out[p[0]] = p[1]; });
  return out;
}

// Sent to the owner when a payment was captured but the order could not be recorded,
// so a paid order is never silently lost (manual reconciliation from Razorpay).
async function ownerAlert(resendKey, info) {
  info = info || {};
  var inner =
    '<div style="padding:32px 30px 14px;text-align:center">' +
      '<span style="display:inline-block;background:#fdecea;color:#DB0007;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:7px 16px;border-radius:50px">Action needed</span>' +
      '<h1 style="margin:14px 0 6px;font-size:21px;color:#0D0D0D;font-weight:800">Payment captured, order NOT recorded</h1>' +
      '<p style="margin:0 0 18px;font-size:14px;color:#6B7280;line-height:1.6">A Razorpay payment went through but the order could not be saved. Please open the Razorpay dashboard and reconcile / fulfil this order manually.</p>' +
      '<div style="background:#F7F7F7;border-radius:12px;padding:16px 18px;text-align:left;font-size:13.5px;color:#1A1A1A;line-height:1.9">' +
        'Payment ID: <b>' + esc(info.pid || "") + '</b><br>' +
        'Order ID: <b>' + esc(info.oid || "") + '</b><br>' +
        'Reason: ' + esc(info.error || "unknown") +
      '</div>' +
    '</div>';
  return send(resendKey, OWNER, "⚠ ACTION NEEDED — payment captured but order not recorded", shell("A captured payment did not record — please reconcile.", inner), undefined);
}

module.exports = { sendOrderEmails: sendOrderEmails, ownerAlert: ownerAlert, customerEmail: customerEmail, ownerEmail: ownerEmail, OWNER: OWNER };
