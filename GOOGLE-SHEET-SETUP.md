# Google Sheet mirror — setup guide

This connects your website to your Google Sheet so that **every order and every lead
also appears as a row in the sheet** — a plain, human-readable copy you can open any
time. You do this once. No coding needed; just follow the steps in order.

It will create **three tabs** in your sheet:

- **Orders** — columns: Timestamp · Order No · Payment ID · Status · Name · Phone ·
  Email · Address · Items · Subtotal (Rs) · Shipping (Rs) · Total (Rs) · Payment Method
- **Payments** — a fraud-verification / audit view: Timestamp · Order No · Payment ID ·
  Amount (Rs) · Method · Status · Verified · Razorpay Link · Checked
- **Leads** — columns: Timestamp · Lead Key · Status · Name · Phone · Email · Source · Page

**About the Payments tab.** Your website already blocks fake payments *before* anything
reaches this sheet: an order is only recorded server-side after Razorpay verifies the
payment's HMAC signature and the "captured" webhook re-confirms it. So every row in the
Payments tab is a genuinely verified, captured payment — the tab is a convenient
cross-check log, not the thing that stops fraud. To independently confirm any payment,
click its **"Open in Razorpay"** link (it opens that exact payment in your Razorpay
dashboard), then tick the **Checked** box once you've eyeballed it.

---

## 1. Open the Apps Script editor

1. Open your Google Sheet (the one with id ending `…RgmU20k4ekE`).
2. In the top menu click **Extensions → Apps Script**.
   A new tab opens with a code editor.

## 2. Paste in the script

1. In that editor, select **all** the sample code shown (it usually says
   `function myFunction() {}`) and **delete** it.
2. Open the file **`GOOGLE-SHEET-APPS-SCRIPT.gs`** (from your project), copy its
   entire contents, and paste it into the empty editor.

## 3. Set your secret and save

1. Near the top of the pasted code find this line:

   ```js
   var SHEET_SECRET = "PASTE_YOUR_SECRET_HERE"; // <-- change me, must match Vercel SHEET_SECRET
   ```

2. Replace `PASTE_YOUR_SECRET_HERE` with your own strong, random secret — keep the
   quotes. It should be long and hard to guess, e.g. a 24-character string like:

   ```
   mk_9fA3xQ72Lp0Zk4Rt8Wn6Yb1
   ```

   **Do not reuse that example — make up your own.** Write it down; you'll paste the
   *same* value into Vercel in step 6.
3. Click the **Save** icon (💾) at the top.

## 4. Run `setup()` once (and approve the permission)

1. At the top of the editor there's a **function dropdown** — choose **`setup`**.
2. Click **Run**.
3. Google will ask for permission the first time:
   - Click **Review permissions**, pick your Google account.
   - You may see **“Google hasn't verified this app.”** This is normal — it's *your
     own* script. Click **Advanced**, then **“Go to (project name) (unsafe)”**, then
     **Allow**.
4. When it finishes you'll see a small **“Setup complete”** toast in the sheet, and the
   **Orders**, **Payments** and **Leads** tabs will now exist with styled headers.

> **Already set this up before?** If you're *updating* an existing script to add the new
> **Payments** tab, you must **re-run `setup()`** (it creates the Payments tab — it won't
> touch your existing Orders/Leads rows). Then, if you deploy with a **versioned** Web-App
> deployment, push the new code to the live `/exec` URL: **Deploy → Manage deployments →**
> (edit, the pencil) **→ Version: New version → Deploy**. The URL stays the same; it just
> starts running the updated code.

## 5. Deploy it as a Web App

1. Top-right, click **Deploy → New deployment**.
2. Click the gear ⚙️ next to “Select type” and choose **Web app**.
3. Fill in:
   - **Description:** anything, e.g. `Makhana sheet mirror`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
4. Click **Deploy**, approve if asked, then **copy the Web app URL** — it ends in
   **`/exec`**. Keep this handy for the next step.

## 6. Add the two values in Vercel

1. Go to **Vercel → your project → Settings → Environment Variables**.
2. Add:
   - **`SHEET_WEBHOOK_URL`** = the `/exec` URL you copied.
   - **`SHEET_SECRET`** = the *exact same* secret you set in step 3.
3. **Redeploy** the project so the new variables take effect.

## 7. Test it

1. Open the **`/exec`** URL in a browser. You should see:

   ```json
   {"ok":true,"service":"the-makhana-sheet"}
   ```

   That confirms the script is live.
2. Place a small **test order** on the site (or submit a form). Within a moment a new
   row should appear in the **Orders** tab (or **Leads** tab). Done.

---

### Notes

- **Safe to re-run `setup()`** later — it won't erase existing rows. (Re-running it is
  also how you add the new **Payments** tab to a sheet you set up earlier.)
- Orders are **de-duplicated by Payment ID**: the same order will never appear twice.
- The **Payments** tab is likewise **de-duplicated by Payment ID**, and each row is an
  already-server-verified captured payment. Use the **Razorpay Link** to cross-check it,
  then tick **Checked**. It's an audit view — the server, not this sheet, blocks fakes.
- Leads are **keyed by Lead Key**: as a visitor fills in more details, their existing
  row is updated in place rather than duplicated.
- If the sheet ever fails, your **orders, emails and leads keep working normally** — the
  sheet copy is best-effort only and never blocks a sale.
- To change the secret later, update it in **both** the Apps Script and Vercel, then
  **redeploy the Web app** (Deploy → Manage deployments → edit → new version) and
  redeploy Vercel.
