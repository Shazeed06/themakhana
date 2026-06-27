# The Makhana — Project Status & Handoff

Premium D2C roasted/raw makhana (foxnut) brand. **Static** site (vanilla HTML/CSS/JS, no build) + **Vercel** serverless functions. Deploys from GitHub `main` → **https://www.themakhana.in**.

_Last updated: 2026-06-27_

---

## ✅ Done (live)

### SEO / analytics
- **Google Search Console**: verified (HTML tag), sitemap.xml submitted (27→32 URLs).
- **Bing Webmaster**: imported from GSC, sitemap crawled.
- **GA4**: `G-65LLGWV84Q` (gtag on all pages).
- **Microsoft Clarity**: `xcq456q0xc` (heatmaps/recordings).
- Clean URLs (`vercel.json` cleanUrls), JSON-LD (Organization, WebSite, Product, Article, FAQPage, Breadcrumb), `sitemap.xml`, `robots.txt`, `llms.txt`, 404 page, favicons.
- **Ahrefs** site audit Health Score 93 ("Excellent").

### AEO / GEO (AI search)
- `robots.txt` explicitly allows 20+ AI crawlers (OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, etc.).
- Homepage **FAQ section + FAQPage JSON-LD**; enriched Organization schema (description, slogan, knowsAbout, areaServed).
- `llms.txt` with brand facts + FAQ + all products/blogs.

### Content
- **15 blog posts** (`blog-*.html`) — 10 original + 5 new trending (side-effects, per-day, fasting, vs-almonds, skin-hair). Each has a **unique hero image** (`images/blog/<slug>.jpg`), BlogPosting + FAQPage schema, PAA FAQs, internal links, and a **local/GEO** ("best makhana brand in India/Delhi/Bihar/cities") section.
- Blog index (`blog.html`) with **pagination** (10/page).

### Contact / NAP
- Email **themakhana.official@gmail.com**, phone **+91 82871 24651** in the footer of every page, contact page card, and Organization/contactPoint JSON-LD. Old `hello@`/`gifting@` removed.

### Payments — Razorpay (TEST mode working)
- Files: `api/create-order.js`, `api/verify-payment.js` (Vercel functions, no SDK — call Razorpay REST API with built-in fetch + crypto), `checkout.js` ("Pay Online" option + modal + verify, alongside COD).
- Env vars **set in Vercel**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (TEST keys). `create-order` returns real orders; modal opens; verified end-to-end in **test mode**.
- `.env` holds test keys locally (gitignored); `.env.example` documents them.

### Customer accounts — Supabase (live)
- Project **the-makhana**, ref `uwgbhizqyonmxkoncczd` (URL `https://uwgbhizqyonmxkoncczd.supabase.co`).
- Tables `profiles` + `orders` with **RLS** (each customer sees only their own data) + auto-profile trigger. Email **auto-confirm ON**. Schema in `supabase-schema.sql`.
- `auth.js` — email/password login/signup modal with **success-confirmation screens** + header account state. `account.html` — order history + saved address. `checkout.js` — **login required before ordering**, prefills from profile, writes each order to Supabase.
- Config in `supabase-config.js` (project URL + **anon** key — public-safe; RLS protects data).
- Admin: brand views customers/orders in **Supabase Dashboard → Table Editor** (`profiles`, `orders`).

---

## ⏳ Pending / next steps

1. **Razorpay LIVE mode** (to take real money):
   - Complete Razorpay **KYC** (PAN + bank account; GST not required for Individual/Proprietor) — _user must do; involves financial/identity details._
   - Generate **live keys** (`rzp_live_...`) → replace `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in **Vercel env vars** → Redeploy. No code change needed.
   - (Optional) make "Pay Online" the default payment method instead of COD.
2. **Google Business Profile** + **Merchant Center** — need real Delhi address + phone + Google verification (postcard/phone). Content pack in `SEO-NEXT-STEPS.md`.
3. **Off-page / backlinks / PR** — plan in `SEO-NEXT-STEPS.md` (directories, listicles, Reddit/Quora, citations).
4. **COD order capture** — COD orders currently save to Supabase only when the customer is logged in (login is now required, so this is covered); consider an email/WhatsApp order notification.
5. Traffic growth — Instagram reels, Meta/Google ads, Amazon/quick-commerce (see chat summary / `SEO-NEXT-STEPS.md`).

---

## 🔑 Keys & where they live (no secrets in this repo)
| Thing | Value / location |
|------|------|
| GA4 | `G-65LLGWV84Q` (in HTML) |
| Clarity | `xcq456q0xc` (in HTML) |
| Supabase URL + anon key | `supabase-config.js` (public-safe) |
| Supabase service_role | **only** in Supabase dashboard — never in repo |
| Razorpay TEST keys | local `.env` (gitignored) + **Vercel env vars** |
| Razorpay LIVE keys | _to be generated after KYC → Vercel env vars only_ |

## 🧩 Key files
`api/create-order.js`, `api/verify-payment.js`, `checkout.js`, `auth.js`, `account.html`, `supabase-config.js`, `supabase-schema.sql`, `catalog.js`, `product.js`, `vercel.json`, `robots.txt`, `llms.txt`, `sitemap.xml`.

## Dashboards
- Supabase: https://supabase.com/dashboard/project/uwgbhizqyonmxkoncczd
- GSC: https://search.google.com/search-console (property https://www.themakhana.in/)
- Bing: https://www.bing.com/webmasters · GA4: https://analytics.google.com · Clarity: https://clarity.microsoft.com
