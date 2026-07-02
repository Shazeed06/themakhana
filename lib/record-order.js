/* Shared "record a paid order" logic, used by api/verify-payment (after the
   checkout HMAC passes) and api/razorpay-webhook (the safety net if the browser
   never confirms). All amounts/cart come from the authoritative Razorpay order;
   the client never supplies price/total here. Idempotent on payment_id. If a
   captured payment can't be recorded, the owner is emailed so it's never lost.
   Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, SUPABASE_SERVICE_ROLE_KEY,
        RESEND_API_KEY (optional), SUPABASE_URL/SUPABASE_ANON_KEY (optional). */
var catalog = require("./catalog");
var coupons = require("./coupons");
var emailer = require("./email");

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

// opts: { oid, pid, accessToken, verifyCaptured }
// verifyCaptured=true -> independently confirm the payment is genuine + captured via
// the Razorpay API before recording (used by the webhook, which has no checkout HMAC).
// Returns { recorded, duplicate, order_no, row, error }. Never throws.
async function recordPaidOrder(opts) {
  opts = opts || {};
  var oid = opts.oid, pid = opts.pid;
  var KEY_ID = (process.env.RAZORPAY_KEY_ID || "").trim();
  var KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  var SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  var RESEND = (process.env.RESEND_API_KEY || "").trim();
  var order_no = String(pid || "").replace("pay_", "");
  var out = { recorded: false, duplicate: false, order_no: order_no, row: null, error: null };

  try {
    if (!SERVICE || !KEY_ID) { out.error = "service/key not configured"; throw new Error(out.error); }
    var auth = Buffer.from(KEY_ID + ":" + KEY_SECRET).toString("base64");

    // (webhook path) re-confirm the payment is real + captured for OUR account before
    // recording — a forged webhook referencing a bogus/foreign payment can't create an order
    if (opts.verifyCaptured) {
      var pr = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(pid), { headers: { Authorization: "Basic " + auth } });
      var pj = pr.ok ? await pr.json() : {};
      if (!pr.ok || pj.status !== "captured" || pj.order_id !== oid) {
        out.error = "payment not captured / mismatch"; return out; // not genuine -> ignore silently, no alert
      }
    }

    // idempotency — already recorded for this payment?
    var exist = await fetch(SB_URL + "/rest/v1/orders?payment_id=eq." + encodeURIComponent(pid) + "&select=order_no,user_id",
      { headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE } });
    var existRows = exist.ok ? await exist.json() : [];
    if (Array.isArray(existRows) && existRows.length) {
      // webhook-first rows have user_id=null; attach the logged-in buyer now (best-effort)
      if (opts.accessToken && existRows[0].user_id == null) {
        try {
          var attachId = await getUserId(opts.accessToken);
          if (attachId) {
            await fetch(SB_URL + "/rest/v1/orders?payment_id=eq." + encodeURIComponent(pid) + "&user_id=is.null", {
              method: "PATCH",
              headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json", Prefer: "return=minimal" },
              body: JSON.stringify({ user_id: attachId })
            });
          }
        } catch (ePatch) {}
      }
      return { recorded: true, duplicate: true, order_no: existRows[0].order_no || order_no, row: null, error: null };
    }

    // authoritative cart + amount (Razorpay order) and the buyer's id — fetched in parallel
    var roP = fetch("https://api.razorpay.com/v1/orders/" + encodeURIComponent(oid), { headers: { Authorization: "Basic " + auth } });
    var userP = getUserId(opts.accessToken);
    var ro = await roP;
    var rod = ro.ok ? await ro.json() : {};
    // if the authoritative order can't be fetched, do NOT insert a corrupted zero-total
    // row — throw so the owner alert fires and the webhook retry records it correctly
    if (!ro.ok) { out.error = "razorpay order fetch failed (" + ro.status + ")"; throw new Error(out.error); }
    var notes = (rod && rod.notes) || {};
    var cartItems = String(notes.cart || "").split(";").filter(Boolean).map(function (s) { var x = s.split(":"); return { id: x[0], qty: Number(x[1]) || 1 }; });
    var priced = catalog.priceCart(cartItems);
    // recompute the discount server-side from the coupon code in notes — do NOT
    // trust notes.disc. Append a coupon line AFTER the products subtotal is set.
    var cr = coupons.applyCoupon(notes.coup, priced);
    if (cr.discount > 0) {
      priced.items.push({ id: "coupon", name: "Coupon " + cr.code, qty: 1, price: -cr.discount });
    }
    var totalRupees = (rod && rod.amount) ? Math.round(rod.amount / 100) : priced.total;
    var userId = await userP;

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
    out.row = row;

    var ins = await fetch(SB_URL + "/rest/v1/orders", {
      method: "POST",
      headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row)
    });
    // 409 = unique-violation on payment_id (a concurrent call won the race) -> already recorded
    if (ins.status === 409) return { recorded: true, duplicate: true, order_no: order_no, row: row, error: null };
    if (!ins.ok) { out.error = "db insert failed (" + ins.status + ")"; throw new Error(out.error); }
    out.recorded = true;

    // confirmation emails — best-effort, parallel, only on a fresh insert
    if (RESEND) { try { await emailer.sendOrderEmails(RESEND, row, { notifyOwner: true }); } catch (e) {} }
    return out;
  } catch (e) {
    out.recorded = false;
    if (!out.error) out.error = (e && e.message) || "record error";
    // a captured payment that didn't record must never be silent — alert the owner
    if (RESEND && pid) { try { await emailer.ownerAlert(RESEND, { oid: oid, pid: pid, error: out.error }); } catch (e2) {} }
    return out;
  }
}

module.exports = { recordPaidOrder: recordPaidOrder, getUserId: getUserId };
