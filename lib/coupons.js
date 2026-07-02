/* SERVER-SIDE source of truth for coupons — the discount is computed and
   enforced here so a tampered client can never forge a bigger discount. The
   Vercel functions (validate-coupon, create-order) and the order recorder all
   recompute the discount from this module; the browser's numbers are ignored.
   To add a coupon, extend the COUPONS map below (no code changes needed). */

// type:"percent" -> value is a % of the (products-only) subtotal.
// minSubtotal -> minimum products subtotal (rupees) required to use the code.
// active:false disables a code without deleting it.
var COUPONS = {
  MAKHANA10: { type: "percent", value: 10, label: "10% OFF", minSubtotal: 0, active: true }
};

function normalize(code) {
  return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
}

function getCoupon(code) {
  var c = COUPONS[normalize(code)];
  if (!c || c.active === false) return null;
  return c;
}

// priced is { items, subtotal, shipping, total } from catalog.priceCart.
// Returns { code, label, discount } — discount is INTEGER rupees off the
// SUBTOTAL only (never shipping), capped at the subtotal. Invalid code or
// subtotal below minSubtotal -> { code:null, label:null, discount:0 }.
function applyCoupon(code, priced) {
  var none = { code: null, label: null, discount: 0 };
  var c = getCoupon(code);
  if (!c) return none;
  var subtotal = (priced && Number(priced.subtotal)) || 0;
  if (subtotal < (c.minSubtotal || 0)) return none;
  var discount = 0;
  if (c.type === "percent") {
    discount = Math.round(subtotal * c.value / 100);
  }
  discount = Math.min(discount, subtotal);
  if (discount <= 0) return none;
  return { code: normalize(code), label: c.label, discount: discount };
}

// Returns { ok, code, label, discount, reason }. ok=false carries a short
// human reason suitable for showing the customer.
function validate(code, priced) {
  var c = getCoupon(code);
  if (!c) return { ok: false, code: null, label: null, discount: 0, reason: "This code isn't valid." };
  var subtotal = (priced && Number(priced.subtotal)) || 0;
  if (subtotal < (c.minSubtotal || 0)) {
    return { ok: false, code: null, label: null, discount: 0, reason: "Add more to your cart to use this code." };
  }
  var cr = applyCoupon(code, priced);
  return { ok: true, code: cr.code, label: cr.label, discount: cr.discount, reason: null };
}

module.exports = { COUPONS: COUPONS, normalize: normalize, getCoupon: getCoupon, applyCoupon: applyCoupon, validate: validate };
