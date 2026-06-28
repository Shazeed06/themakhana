/* Vercel serverless function: Razorpay webhook — the safety net that guarantees a
   captured payment is recorded EVEN IF the browser never calls verify-payment (e.g.
   the customer closed the tab right after paying, or the network dropped during
   confirmation). Razorpay POSTs payment.captured / order.paid here; we record the
   order via the shared, idempotent recorder. recordPaidOrder({verifyCaptured:true})
   independently re-confirms the payment with the Razorpay API before saving, so a
   forged webhook can't create an order — therefore raw-body signature verification
   (awkward on Vercel) is not relied upon.
   Setup: Razorpay Dashboard > Settings > Webhooks > add
          https://www.themakhana.in/api/razorpay-webhook for the
          `payment.captured` (and optionally `order.paid`) events. */
var recorder = require("../lib/record-order");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  var body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  try {
    var ev = body.event;
    var pay = body.payload && body.payload.payment && body.payload.payment.entity;
    if ((ev === "payment.captured" || ev === "order.paid") && pay && pay.id && pay.order_id) {
      await recorder.recordPaidOrder({ oid: pay.order_id, pid: pay.id, accessToken: null, verifyCaptured: true });
    }
  } catch (e) { /* swallow — always 200 below so Razorpay doesn't retry-storm */ }

  res.status(200).json({ ok: true });
};
