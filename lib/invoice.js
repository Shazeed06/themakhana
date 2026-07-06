/* Dependency-free PDF invoice generator for The Makhana.
   Writes raw PDF 1.4 syntax (base-14 Helvetica fonts, WinAnsiEncoding, uncompressed
   content stream, byte-offset-correct xref). buildInvoicePdf(order) -> Buffer.
   Must NEVER throw — falls back to a minimal valid PDF on any internal error. */

"use strict";

/* ---------------------------------------------------------------- metrics */
/* AFM advance widths (1/1000 em) for chars 32..126. */
var W_REG = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
var W_BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];

function textWidth(s, size, bold) {
  var tbl = bold ? W_BOLD : W_REG, w = 0, i, c;
  s = String(s);
  for (i = 0; i < s.length; i++) {
    c = s.charCodeAt(i);
    w += (c >= 32 && c <= 126) ? tbl[c - 32] : 556;
  }
  return w * size / 1000;
}

/* ------------------------------------------------------------- utilities */
function clean(t) {
  if (t == null || t === "") return "-";
  return String(t)
    .replace(/₹/g, "Rs.")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E]/g, "?");
}
function escPdf(t) {
  return String(t).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function num(n) { n = Number(n); return isFinite(n) ? n : 0; }

/* Indian grouping: 1,299 / 1,00,000. Decimals only when needed. */
function fmtIN(n) {
  n = num(n);
  var neg = n < 0; n = Math.abs(n);
  n = Math.round(n * 100) / 100;
  var whole = Math.floor(n);
  var frac = Math.round((n - whole) * 100);
  var s = String(whole);
  var last3 = s.slice(-3), rest = s.slice(0, -3);
  if (rest) last3 = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  var out = last3;
  if (frac > 0) out += "." + (frac < 10 ? "0" + frac : String(frac));
  return (neg ? "-" : "") + out;
}

function dateIST() {
  try {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata"
    });
  } catch (e) { return new Date().toDateString(); }
}

function wrapText(s, max) {
  s = clean(s);
  var words = s.split(/\s+/), lines = [], cur = "";
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    if (!cur) { cur = w; }
    else if ((cur + " " + w).length <= max) { cur += " " + w; }
    else { lines.push(cur); cur = w; }
    while (cur.length > max) { lines.push(cur.slice(0, max)); cur = cur.slice(max); }
  }
  if (cur) lines.push(cur);
  return lines;
}

function truncate(s, size, bold, maxW) {
  s = String(s);
  if (textWidth(s, size, bold) <= maxW) return s;
  while (s.length > 1 && textWidth(s + "...", size, bold) > maxW) s = s.slice(0, -1);
  return s + "...";
}

/* ---------------------------------------------------------------- colors */
var C = {
  cream: "1 0.973 0.906",
  red: "0.859 0 0.027",
  yellow: "1 0.737 0.051",
  ink: "0.051 0.051 0.051",
  orange: "0.96 0.62 0.04",
  gray: "0.42 0.447 0.502",
  lightGray: "0.63 0.63 0.63",
  hairline: "0.88 0.88 0.88"
};

/* ------------------------------------------------------------ pdf output */
function pad10(n) { var s = String(n); while (s.length < 10) s = "0" + s; return s; }

function assemblePdf(content) {
  var objs = [];
  objs[1] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  objs[2] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  objs[3] = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] " +
    "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n";
  objs[4] = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n";
  objs[5] = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n";
  objs[6] = "6 0 obj\n<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream\nendobj\n";
  var body = "%PDF-1.4\n", offsets = [0], i;
  for (i = 1; i <= 6; i++) { offsets[i] = body.length; body += objs[i]; }
  var xrefPos = body.length;
  body += "xref\n0 7\n0000000000 65535 f \n";
  for (i = 1; i <= 6; i++) body += pad10(offsets[i]) + " 00000 n \n";
  body += "trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n" + xrefPos + "\n%%EOF";
  return Buffer.from(body, "latin1");
}

/* -------------------------------------------------------- content stream */
function buildContent(o) {
  var PW = 595, M = 40, R = PW - M; /* page width, margin, right edge */
  var c = [];
  function r2(n) { return Math.round(n * 100) / 100; }
  function rect(x, y, w, h, color) {
    c.push(color + " rg", r2(x) + " " + r2(y) + " " + r2(w) + " " + r2(h) + " re f");
  }
  function line(x1, x2, y, w, color) {
    c.push(color + " RG", w + " w", r2(x1) + " " + r2(y) + " m", r2(x2) + " " + r2(y) + " l", "S");
  }
  function text(x, y, s, size, bold, color) {
    c.push(color + " rg", "BT", "/" + (bold ? "F2" : "F1") + " " + size + " Tf",
      r2(x) + " " + r2(y) + " Td", "(" + escPdf(s) + ") Tj", "ET");
  }
  function textR(rx, y, s, size, bold, color) { /* right-aligned to rx */
    text(rx - textWidth(s, size, bold), y, s, size, bold, color);
  }

  /* ---- top brand band ---- */
  rect(0, 772, PW, 70, C.cream);
  text(M, 798, "THE MAKHANA", 22, true, C.orange);
  textR(R, 798, "INVOICE", 26, true, C.ink);
  rect(M, 762, R - M, 3, C.red);

  /* ---- meta row: sold-by (left) / invoice meta (right) ---- */
  text(M, 740, "SOLD BY", 8, true, C.lightGray);
  text(M, 726, "The Makhana", 10, true, C.ink);
  text(M, 713, "New Delhi, India", 9, false, C.gray);
  text(M, 700, "FSSAI Lic. 23326005001818", 9, false, C.gray);
  text(M, 687, "themakhana.official@gmail.com", 9, false, C.gray);
  text(M, 674, "+91 82871 24651", 9, false, C.gray);

  function metaPair(y, label, value) {
    value = clean(value);
    var size = 9;
    var wl = textWidth(label, size, false), wv = textWidth(value, size, true);
    var x0 = R - wl - wv;
    text(x0, y, label, size, false, C.gray);
    text(x0 + wl, y, value, size, true, C.ink);
  }
  metaPair(726, "Invoice No: ", "TM-" + clean(o.order_no));
  metaPair(713, "Invoice Date: ", dateIST());
  metaPair(700, "Payment: ", "Online (Razorpay)");
  metaPair(687, "Payment ID: ", clean(o.payment_id));

  /* ---- bill to ---- */
  var y = 648;
  text(M, y, "BILL TO", 8, true, C.lightGray);
  y -= 16;
  text(M, y, truncate(clean(o.name), 11, true, R - M), 11, true, C.ink);
  var addrLines = wrapText(o.address, 60).slice(0, 3);
  for (var a = 0; a < addrLines.length; a++) {
    y -= 14;
    text(M, y, addrLines[a], 9.5, false, C.gray);
  }
  y -= 14; text(M, y, "Phone: " + clean(o.phone), 9.5, false, C.gray);
  y -= 14; text(M, y, "Email: " + clean(o.email), 9.5, false, C.gray);

  /* ---- items table ---- */
  var colNo = M + 8;        /* '#' left            */
  var colItem = M + 30;     /* item name left      */
  var colQtyR = 385;        /* qty right edge      */
  var colRateR = 465;       /* rate right edge     */
  var colAmtR = R - 8;      /* amount right edge   */

  var headY = 520;
  rect(M, headY, R - M, 20, C.yellow);
  text(colNo, headY + 6, "#", 9, true, C.ink);
  text(colItem, headY + 6, "Item", 9, true, C.ink);
  textR(colQtyR, headY + 6, "Qty", 9, true, C.ink);
  textR(colRateR, headY + 6, "Rate (Rs.)", 9, true, C.ink);
  textR(colAmtR, headY + 6, "Amount (Rs.)", 9, true, C.ink);

  var items = Array.isArray(o.items) ? o.items : [];
  var rows = items, extra = 0;
  if (items.length > 14) { rows = items.slice(0, 13); extra = items.length - 13; }

  var rowY = headY;
  function itemRow(idxLabel, name, qty, rate, amount, isDiscount) {
    rowY -= 16;
    var by = rowY + 4; /* baseline */
    text(colNo, by, idxLabel, 9, false, C.gray);
    text(colItem, by, truncate(name, 9, false, colQtyR - 45 - colItem), 9, false,
      isDiscount ? C.red : C.ink);
    if (qty !== "") textR(colQtyR, by, String(qty), 9, false, C.ink);
    if (rate !== "") textR(colRateR, by, rate, 9, false, C.ink);
    if (amount !== "") textR(colAmtR, by, amount, 9, isDiscount, isDiscount ? C.red : C.ink);
    line(M, R, rowY, 0.5, C.hairline);
  }

  if (!rows.length) {
    itemRow("-", "No line items on record", "", "", "", false);
  } else {
    for (var i = 0; i < rows.length; i++) {
      var it = rows[i] || {};
      var qty = num(it.qty || it.quantity || 1);
      var price = num(it.price);
      var name = clean(it.name || it.id || "Item");
      var amount = price * qty;
      var disc = price < 0;
      itemRow(String(i + 1), name, qty, fmtIN(price),
        disc ? "-Rs." + fmtIN(Math.abs(amount)) : fmtIN(amount), disc);
    }
    if (extra > 0) itemRow("...", "... and " + extra + " more items", "", "", "", false);
  }

  /* ---- totals block (right-aligned) ---- */
  var labR = 465; /* labels right edge */
  var ty = rowY - 26;
  var discountTotal = 0;
  for (var d = 0; d < items.length; d++) {
    var pd = num(items[d] && items[d].price);
    if (pd < 0) discountTotal += pd * num(items[d].qty || items[d].quantity || 1);
  }
  textR(labR, ty, "Subtotal", 10, false, C.gray);
  textR(colAmtR, ty, "Rs. " + fmtIN(o.subtotal), 10, false, C.ink);
  if (discountTotal < 0) {
    ty -= 16;
    textR(labR, ty, "Discount", 10, false, C.red);
    textR(colAmtR, ty, "- Rs. " + fmtIN(Math.abs(discountTotal)), 10, false, C.red);
  }
  ty -= 16;
  textR(labR, ty, "Shipping", 10, false, C.gray);
  var ship = num(o.shipping);
  textR(colAmtR, ty, ship ? "Rs. " + fmtIN(ship) : "FREE", 10, false, C.ink);
  ty -= 10;
  line(370, colAmtR, ty, 1.5, C.red);
  ty -= 18;
  textR(labR, ty, "GRAND TOTAL", 13, true, C.ink);
  textR(colAmtR, ty, "Rs. " + fmtIN(o.total), 13, true, C.ink);

  /* ---- footer ---- */
  line(M, R, 104, 0.5, C.hairline);
  function centered(y2, s, size, bold, color) {
    text((PW - textWidth(s, size, bold)) / 2, y2, s, size, bold, color);
  }
  centered(90, "All prices are inclusive of applicable taxes.", 7.5, false, C.lightGray);
  centered(78, "This is a computer-generated invoice and does not require a signature.", 7.5, false, C.lightGray);
  centered(66, "Questions? themakhana.official@gmail.com | +91 82871 24651 | www.themakhana.in", 7.5, false, C.lightGray);
  centered(46, "Roasted, never fried. Sourced from Bihar.", 9, true, C.red);

  return c.join("\n");
}

/* --------------------------------------------------------------- exports */
function buildInvoicePdf(order) {
  try {
    return assemblePdf(buildContent(order || {}));
  } catch (e) {
    try {
      var fallback = [
        C.ink + " rg", "BT", "/F2 16 Tf", "40 780 Td", "(THE MAKHANA - INVOICE) Tj", "ET",
        C.gray + " rg", "BT", "/F1 10 Tf", "40 750 Td",
        "(Invoice for order " + escPdf(clean(order && order.order_no)) + " - total Rs. " +
        escPdf(fmtIN(order && order.total)) + ") Tj", "ET"
      ].join("\n");
      return assemblePdf(fallback);
    } catch (e2) {
      /* last-resort static PDF (offsets precomputed for this exact byte layout) */
      return Buffer.from(
        "%PDF-1.4\n" +
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> >>\nendobj\n" +
        "xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n" +
        "trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n205\n%%EOF", "latin1");
    }
  }
}

module.exports = { buildInvoicePdf: buildInvoicePdf };
