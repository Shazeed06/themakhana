/* SERVER-SIDE source of truth for product prices + cart pricing.
   Used by the Vercel functions (create-order, verify-payment) so the amount a
   customer is charged and the order total that is recorded are computed on the
   server — never trusted from the browser. Keep prices in sync with the shop
   (catalog.js / script.js PRODUCTS). */

var PRODUCTS = {
  peri:    { name: "Peri Peri Punch",         price: 199 },
  pudina:  { name: "Chatpata Pudina",         price: 199 },
  cream:   { name: "Cream & Onion",           price: 199 },
  salt:    { name: "Salt & Pepper",           price: 179 },
  pink:    { name: "Himalayan Pink Salt",     price: 179 },
  classic: { name: "Classic Lightly Salted",  price: 169 },
  raw:     { name: "Raw Phool Makhana",       price: 249 },
  combo:   { name: "Variety Combo (3 packs)", price: 649 },
  test:    { name: "Test Product",            price: 1, freeShipping: true }
};

var FREE_SHIP_THRESHOLD = 599;
var FLAT_SHIPPING = 49;

// items: [{ id, qty }]  ->  { items:[{id,name,qty,price}], subtotal, shipping, total }
// Unknown ids are dropped. qty is clamped to 1..99. Same shipping rule as the cart.
function priceCart(items) {
  var lines = [], subtotal = 0, allFree = true, any = false;
  (Array.isArray(items) ? items : []).forEach(function (it) {
    var p = it && PRODUCTS[it.id];
    if (!p) return;
    var qty = Math.max(1, Math.min(99, Math.round(Number(it.qty) || 1)));
    subtotal += p.price * qty;
    if (!p.freeShipping) allFree = false;
    any = true;
    lines.push({ id: it.id, name: p.name, qty: qty, price: p.price });
  });
  if (!any) allFree = false;
  var shipping = (subtotal === 0 || subtotal >= FREE_SHIP_THRESHOLD || allFree) ? 0 : FLAT_SHIPPING;
  return { items: lines, subtotal: subtotal, shipping: shipping, total: subtotal + shipping };
}

module.exports = { PRODUCTS: PRODUCTS, priceCart: priceCart, FREE_SHIP_THRESHOLD: FREE_SHIP_THRESHOLD };
