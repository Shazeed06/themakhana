/************************************************************************
 * THE MAKHANA — Google Sheet mirror (Apps Script Web App)
 * ---------------------------------------------------------------------
 * This script turns your Google Sheet into a human-readable copy of every
 * ORDER and LEAD that the website records. Your website sends a small POST
 * request here each time; this script writes/updates a row in the sheet.
 *
 * It is bound to ONE spreadsheet (the one you opened Extensions > Apps
 * Script from). It creates two tabs: "Orders" and "Leads".
 *
 * >>> HOW TO USE (non-technical, full steps are in GOOGLE-SHEET-SETUP.md):
 *   1) Paste this whole file into the Apps Script editor.
 *   2) Change SHEET_SECRET below to your own strong secret, then Save.
 *   3) Run > setup()  (approve the Google permission prompt once).
 *   4) Deploy > New deployment > Web app > Execute as: Me,
 *      Who has access: Anyone > Deploy > copy the /exec URL.
 *   5) Put that URL + the same secret into Vercel (SHEET_WEBHOOK_URL,
 *      SHEET_SECRET) and redeploy.
 ************************************************************************/

/* =====================================================================
 * 1) SHARED SECRET  —  ⚠️ CHANGE THIS ⚠️
 * ---------------------------------------------------------------------
 * This must be EXACTLY the same string you set as SHEET_SECRET in Vercel.
 * It stops strangers who guess your /exec URL from writing to your sheet.
 * Use a long random value, e.g. a 24+ character string. Example format:
 *   "mk_9fA3xQ72Lp0Zk4Rt8Wn6Yb1"
 * (Do NOT reuse that example — generate your own.)
 * ===================================================================== */
var SHEET_SECRET = "PASTE_YOUR_SECRET_HERE"; // <-- change me, must match Vercel SHEET_SECRET

/* Tab names and their column headers. These must match the website's
 * field mapping exactly — do not rename columns unless you also update
 * the mapping in appendOrder() / upsertLead() below. */
var ORDERS_TAB = "Orders";
var LEADS_TAB  = "Leads";

var ORDERS_HEADERS = [
  "Timestamp", "Order No", "Payment ID", "Status", "Name", "Phone",
  "Email", "Address", "Items", "Subtotal (Rs)", "Shipping (Rs)",
  "Total (Rs)", "Payment Method"
];
var LEADS_HEADERS = [
  "Timestamp", "Lead Key", "Status", "Name", "Phone", "Email",
  "Source", "Page"
];

var TIMEZONE = "Asia/Kolkata";
var TS_FORMAT = "dd MMM yyyy, HH:mm"; // e.g. "06 Jul 2026, 14:32"

/* =====================================================================
 * 2) setup()  —  run this ONCE to create the tabs + headers + formatting
 * ---------------------------------------------------------------------
 * Running this is also how you authorise the script (Google will ask for
 * permission the first time). Safe to run again later — it won't wipe data.
 * ===================================================================== */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // If the workbook is still the untouched default (only "Sheet1", empty),
  // reuse it as the Orders tab instead of leaving a stray blank sheet.
  var sheets = ss.getSheets();
  if (sheets.length === 1 && sheets[0].getName() === "Sheet1" && sheets[0].getLastRow() === 0) {
    sheets[0].setName(ORDERS_TAB);
  }

  var orders = getOrCreateSheet_(ss, ORDERS_TAB);
  var leads  = getOrCreateSheet_(ss, LEADS_TAB);

  // Write headers + style them. Orders header = cream; Leads header = light grey.
  writeHeader_(orders, ORDERS_HEADERS, "#FFF8E7");
  writeHeader_(leads,  LEADS_HEADERS,  "#F1F3F4");

  // Sensible column widths (pixels) so the sheet is readable out of the box.
  setColumnWidths_(orders, [130, 100, 150, 70, 140, 120, 200, 260, 260, 100, 100, 100, 120]);
  setColumnWidths_(leads,  [130, 160, 90, 140, 120, 200, 110, 220]);

  ss.toast("Setup complete — 'Orders' and 'Leads' tabs are ready.", "The Makhana", 5);
  Logger.log("Setup complete: 'Orders' and 'Leads' tabs created/verified.");
}

/* Get a tab by name, creating it if it doesn't exist. */
function getOrCreateSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

/* Write the header row, bold it, colour it, and freeze row 1. */
function writeHeader_(sheet, headers, bgColor) {
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight("bold");
  range.setBackground(bgColor);
  range.setVerticalAlignment("middle");
  sheet.setFrozenRows(1);
}

/* Apply a list of column widths (skips any missing entries). */
function setColumnWidths_(sheet, widths) {
  for (var i = 0; i < widths.length; i++) {
    if (widths[i]) sheet.setColumnWidth(i + 1, widths[i]);
  }
}

/* =====================================================================
 * 3) doPost(e)  —  the endpoint your website calls
 * ---------------------------------------------------------------------
 * Expects a JSON body like:
 *   { "secret": "...", "type": "order", ...order fields... }
 *   { "secret": "...", "type": "lead",  ...lead fields...  }
 * Always replies with JSON. A sheet failure here must never crash the
 * website — the website already treats this call as best-effort.
 * ===================================================================== */
function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Reject anyone who doesn't know the shared secret.
    if (body.secret !== SHEET_SECRET) {
      return jsonOut_({ ok: false, error: "unauthorized" });
    }

    if (body.type === "order") {
      appendOrder(body);
      return jsonOut_({ ok: true, type: "order" });
    }
    if (body.type === "lead") {
      upsertLead(body);
      return jsonOut_({ ok: true, type: "lead" });
    }
    return jsonOut_({ ok: false, error: "unknown type" });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message || err) });
  }
}

/* =====================================================================
 * 4) doGet(e)  —  open the /exec URL in a browser to health-check it
 * ===================================================================== */
function doGet(e) {
  return jsonOut_({ ok: true, service: "the-makhana-sheet" });
}

/* Helper: return a JSON response. */
function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* =====================================================================
 * 5) appendOrder(data)  —  add one order row (idempotent on Payment ID)
 * ---------------------------------------------------------------------
 * If a row with the same Payment ID already exists we do nothing, so the
 * same order is never written twice (the website may call more than once).
 * ===================================================================== */
function appendOrder(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet_(ss, ORDERS_TAB);

  // Ensure headers exist even if setup() was somehow skipped.
  if (sheet.getLastRow() === 0) writeHeader_(sheet, ORDERS_HEADERS, "#FFF8E7");

  var paymentId = data.payment_id || "";

  // --- Idempotency: scan the "Payment ID" column (column C = index 3). ---
  var lastRow = sheet.getLastRow();
  if (paymentId && lastRow > 1) {
    var ids = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // rows below header
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(paymentId)) {
        return; // already recorded — do nothing
      }
    }
  }

  var timestamp = Utilities.formatDate(new Date(), TIMEZONE, TS_FORMAT);
  var itemsText = formatItems_(data.items);
  var shipping = shippingDisplay_(data.shipping);

  // Column order MUST match ORDERS_HEADERS.
  var row = [
    timestamp,                       // Timestamp
    data.order_no || "",             // Order No
    paymentId,                       // Payment ID
    data.status || "paid",           // Status
    data.name || "",                 // Name
    data.phone || "",                // Phone
    data.email || "",                // Email
    data.address || "",              // Address
    itemsText,                       // Items (multiline)
    numberOrBlank_(data.subtotal),   // Subtotal (Rs)
    shipping,                        // Shipping (Rs)  — number or "FREE"
    numberOrBlank_(data.total),      // Total (Rs)
    data.payment_method || "online"  // Payment Method
  ];

  sheet.appendRow(row);
}

/* Build the readable multiline Items string.
 *   normal line:  "Roasted Makhana x 2 = Rs.398"
 *   coupon line:  "Coupon SAVE50 = -Rs.50"   (negative price)
 * Returns "-" when there are no items. */
function formatItems_(items) {
  if (!items || !items.length) return "-";
  var lines = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i] || {};
    var qty = Number(it.qty) || 0;
    var price = Number(it.price) || 0;
    if (price < 0) {
      // coupon / discount line
      lines.push((it.name || "Discount") + " = -Rs." + Math.abs(price));
    } else {
      lines.push((it.name || "Item") + " x " + qty + " = Rs." + (price * qty));
    }
  }
  return lines.join("\n");
}

/* Shipping shown as the number, or the word "FREE" when it's 0. */
function shippingDisplay_(shipping) {
  var n = Number(shipping);
  if (!n) return "FREE"; // 0, null, undefined, "" all become FREE
  return n;
}

/* Return a real number for the cell, or "" if not a valid number. */
function numberOrBlank_(v) {
  var n = Number(v);
  return isNaN(n) ? "" : n;
}

/* =====================================================================
 * 6) upsertLead(data)  —  add OR update a lead row, keyed by Lead Key
 * ---------------------------------------------------------------------
 * Mirrors the website's "upsert on lead_key": if a row already has this
 * Lead Key (column B), we UPDATE that same row (keeping its original
 * Timestamp) so a partial lead becoming complete stays on one row.
 * Otherwise we append a new row with the current timestamp.
 * ===================================================================== */
function upsertLead(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet_(ss, LEADS_TAB);

  if (sheet.getLastRow() === 0) writeHeader_(sheet, LEADS_HEADERS, "#F1F3F4");

  var leadKey = data.lead_key || "";

  // --- Find an existing row by Lead Key (column B = index 2). ---
  var lastRow = sheet.getLastRow();
  var foundRow = -1;
  if (leadKey && lastRow > 1) {
    var keys = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === String(leadKey)) {
        foundRow = i + 2; // +2: skip header, and getValues is 0-indexed
        break;
      }
    }
  }

  if (foundRow > 0) {
    // UPDATE the existing row — keep its original Timestamp (column A),
    // overwrite columns B..H (Lead Key through Page).
    var updated = [
      leadKey,                 // Lead Key
      data.status || "",       // Status
      data.name || "",         // Name
      data.phone || "",        // Phone
      data.email || "",        // Email
      data.source || "",       // Source
      data.page || ""          // Page
    ];
    sheet.getRange(foundRow, 2, 1, updated.length).setValues([updated]);
    return;
  }

  // APPEND a brand-new lead with the current timestamp.
  var timestamp = Utilities.formatDate(new Date(), TIMEZONE, TS_FORMAT);
  var row = [
    timestamp,               // Timestamp
    leadKey,                 // Lead Key
    data.status || "",       // Status
    data.name || "",         // Name
    data.phone || "",        // Phone
    data.email || "",        // Email
    data.source || "",       // Source
    data.page || ""          // Page
  ];
  sheet.appendRow(row);
}
