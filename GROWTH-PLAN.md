# The Makhana — SEO Growth Plan (2026-07-02)

> Produced by a 3-expert multi-agent audit (technical SEO + keyword strategy + off-page authority).
> Verdict: **nothing blocks indexing technically** — the site is new (June 2026) with near-zero authority.
> The game: instant indexing pushes (done), penalty-risk cleanup (done), long-tail/Hinglish content wins (7-day sprint below), and 30 days of entity/authority building.

---

## ✅ EXECUTED TODAY (2026-07-02)

1. **IndexNow live** — key `8562fcd8f58df47d531eb20e8d0549b6.txt` hosted at root; all 32 sitemap URLs submitted (`202 Accepted`) → Bing/Yandex/Seznam/Naver crawl within hours. Re-submit after future publishes:
   `POST https://api.indexnow.org/indexnow` with host/key/urlList (see scripts in repo history).
2. **Fake `aggregateRating` stripped** from all 9 product pages + homepage ItemList (was a manual-action risk: fabricated, mutually contradicting ratings with no visible reviews). Homepage ItemList now `ListItem+url` only (Google's correct pattern for category pages).
3. **Crawlable product links** — shop `#productGrid` now ships 8 static anchors (pink was a full orphan before; JS replaces them on load, crawlers see them).
4. **Thin/duplicate pages noindexed** — `/products/test` (noindex,nofollow + cross-canonical removed + unique title), `/product` template (noindex,follow).
5. **Homepage H1 keyworded** — "Roasted Makhana, never fried — delivered to your doorstep".
6. **Sitemap lastmod refreshed** to 2026-07-02 (matched real content changes).

## 🔲 OWNER: 10-MINUTE GSC ACTIONS (do today, in browser)

1. search.google.com/search-console → property themakhana.in
2. **Sitemaps** → resubmit `sitemap.xml`.
3. **URL Inspection** → paste each URL → **Request Indexing** (quota ~10/day — today do):
   `/` · `/shop` · `/products/peri` · `/products/raw` · `/products/combo` · `/blog-makhana-fasting` · `/blog-makhana-per-day` · `/blog-what-is-makhana` · `/about` · `/blog`
4. Tomorrow: the remaining 5 product pages + 5 more blogs.
5. **Pages report** → note "Why pages aren't indexed" reasons — that's our ground truth next session.

## Honest expectation

- Indexing of all 32 URLs: **days–2 weeks** (Bing faster via IndexNow; Google needs the GSC requests + authority).
- Page 1–5 entries within ~2 weeks are realistic ONLY for the long-tail/Hinglish queries below — not for "makhana".
- "makhana online" class keywords: month 2–3, after the authority plan compounds.

---

## PART 1 — 25 WINNABLE QUERIES (keyword strategist)

**[FAST] = page 1–5 possible in ~2 weeks after indexing.**

### Hindi/Hinglish (near-zero Roman-Hindi competition)
| Query | Page | One change |
|---|---|---|
| makhana roast kaise kare | /blog-how-to-roast-makhana | Add H2 "Makhana roast kaise kare? (2-minute recap)" + 45-word Hinglish answer |
| 1 din me kitna makhana khana chahiye | /blog-makhana-per-day | Hinglish FAQ (visible + JSON-LD): "Roz 25–30 gram (ek chhota bowl)…" |
| pregnancy me makhana khane ke fayde | /blog-makhana-pregnancy | Hinglish FAQ now; full Hindi post (new piece 2) later |
| makhana ki taseer garam ya thandi **[FAST]** | /blog-makhana-side-effects | H2 "Makhana ki taseer: garam ya thandi?" + cooling/neutral answer |
| bina ghee ke makhana kaise bhune | /blog-how-to-roast-makhana | Hinglish FAQ with exact phrase |
| makhana se vajan kam hota hai kya | /blog-makhana-weight-loss | Hinglish FAQ |
| vrat me makhana kha sakte hain kya | /blog-makhana-fasting | Add Hinglish FAQ variant |

### English questions
| Query | Page | One change |
|---|---|---|
| can we eat makhana at night **[FAST]** | /blog-makhana-per-day | H3 + 40-word yes-answer + FAQ |
| how many makhana per day for weight loss | /blog-makhana-per-day | Exact-phrase sub-bullet "25–30g (one bowl)" |
| is makhana good for diabetes patients | /blog-makhana-diabetes | Exact phrase in intro + FAQ |
| can pregnant lady eat roasted makhana | /blog-makhana-pregnancy | FAQ with exact phrase, link /products/pink |
| is flavoured makhana healthy | /products/peri → new post | Static FAQ block in peri.html |
| why is makhana so expensive | /blog-what-is-makhana → price post | FAQ: hand-harvest, ~40% popping yield |

### Seasonal — **SAWAN STARTS THIS MONTH (most time-sensitive!)**
| Query | Page | One change |
|---|---|---|
| sawan somvar vrat me makhana kha sakte hai **[FAST]** | /blog-makhana-fasting | Promote Sawan to its own H2 + exact-phrase FAQ |
| vrat wale makhana recipe **[FAST]** | /blog-makhana-fasting | Rename H2 → "Vrat wale makhana recipe: 3 easy ways" |
| sendha namak makhana | /blog-makhana-fasting | Retitle H2 "Sendha namak makhana: the right salt for vrat" |
| ekadashi me makhana kha sakte hain | /blog-makhana-fasting | Hinglish FAQ |

### Commercial
| Query | Page | One change |
|---|---|---|
| peri peri makhana online **[FAST]** | /products/peri | H1 → "Peri Peri Makhana – Peri Peri Punch (80g)" |
| peri peri makhana 80g price | /products/peri | Title w/ 80g + ₹199 (below) |
| pudina makhana online **[FAST]** | /products/pudina | H1 → "Pudina Makhana – Chatpata Pudina (80g)" |
| cream and onion makhana | /products/cream | H1 → "Cream & Onion Makhana (80g)" |
| raw phool makhana 100g price | /products/raw | Title w/ 100g ₹249 |
| makhana combo pack / gift box | /products/combo | H1 → "Makhana Gift Combo – 5 Flavours (400g)" |
| roasted makhana online delhi | /shop | Intro line: "Made in Delhi… ships pan-India" |
| best makhana brand in india | /about → new listicle | 50-word snippet block on /about |

### Title rewrites (5 money pages)
- **/** → `Buy Makhana Online – Roasted Foxnuts from ₹169 | The Makhana`
- **/shop** → `Roasted Makhana Online – 6 Flavours + Raw & Combo | The Makhana`
- **/products/peri** → `Peri Peri Makhana 80g – Spicy Roasted Foxnuts ₹199 | The Makhana`
- **/products/raw** → `Buy Raw Phool Makhana 100g – Handpicked Bihar ₹249 | The Makhana`
- **/products/combo** → `Makhana Gift Pack – 5 Flavour Combo 400g ₹799 | The Makhana`

### 5 new content pieces (exact H1s)
1. "Makhana Price Guide 2026: 100g, 250g, 500g aur 1kg ka Sahi Rate" (+price table = snippet bait)
2. "Pregnancy Me Makhana Khane Ke Fayde: Kitna, Kab aur Kaise Khayein" (full Hinglish)
3. "Flavoured Makhana vs Plain Makhana: Kaunsa Zyada Healthy Hai?"
4. "Best Makhana Brands in India (2026): 7 Brands Compared Honestly"
5. "Makhana Kheer Recipe: Creamy, Vrat-Friendly Kheer in 20 Minutes" (+**Recipe schema** — site has none; big rich-result play)

### 7-day sprint
- **D1:** 5 title/meta rewrites + GSC request-indexing
- **D2:** 8 PDP H1s + static FAQs on peri/raw/combo
- **D3:** **SAWAN update** on fasting post (retitle "Sawan, Navratri, Ekadashi (2026 Guide)")
- **D4:** per-day post: night H3 + Hinglish FAQ + snippet para
- **D5:** taseer H2 + roast-post Hinglish + HowTo schema
- **D6:** publish Makhana Kheer Recipe (Recipe schema)
- **D7:** internal-link pass + sitemap resubmit
(Full 30-day calendar in the keyword agent's report — days 8–30 cover the 5 new posts, GSC position-8–30 harvesting on D17, Raksha Bandhan prep D25.)

---

## PART 2 — 30-DAY AUTHORITY PLAN (off-page strategist)

**Canonical NAP:** The Makhana | New Delhi | +91 82871 24651 | themakhana.official@gmail.com | https://www.themakhana.in

### Week 1 foundations
- **Google Business Profile** (biggest impact/hour): category "Food products supplier", service-area business (hide address), Delhi NCR areas, video verification, 10 photos, products with prices, 3 seeded Q&As. **Needs: real street address.**
- **Bing Places** — "Import from GBP" (10 min).
- **sameAs cleanup:** facebook.com/themakhana + x.com/themakhana are unverified/dead — claim or DELETE from schema. Unify Organization block across index/about/contact. Target 8-10 live profiles by day 10.
- **FSSAI number** in footer + About (legal + trust).
- LinkedIn Company Page → Crunchbase → F6S. (Wikidata: NOT yet.)

### 15 citation/link targets (brand/naked-URL anchors only)
Justdial · IndiaMART (storefront + catalog) · TradeIndia · ExportersIndia · Sulekha · IndianYellowPages · Grotal+AskLaila · Crunchbase · F6S · StartupTalky (startup-story pitch) · YourStory/SMBStory · Medium (brand pub, republish 2 blogs w/ canonical note) · Quora (founder, 2 ans/week) · Reddit (2 weeks karma first, then farm-photo value post) · Vocal.media (2 originals).

### Marketplaces
- **Amazon.in this month** (GST+FSSAI; file ₹4,500 TM application → Brand Registry). Owns brand-SERP + review trust.
- Flipkart week 3-4. JioMart optional. **Blinkit/Zepto: NOT yet** (margin/inventory demands).

### Digital PR angles (pitch-ready)
1. Makhana Board (Budget 2025) + GI-tag Mithila makhana + D2C farmer sourcing → YourStory SMBStory, 30Stades, The Better India
2. Export boom / "popped water lily seeds" trend vs Indian snacking → Indian Retailer, Moneycontrol SME
3. **Sawan 2026 fasting-food guide (send THIS WEEK)** → NDTV Food, Slurrp, Herzindagi, So Delhi

### Social cadence (SEO-supporting minimum)
IG 3 Reels/wk · YouTube Shorts 2/wk (re-upload) · Pinterest 5 pins/wk (blog heroes → posts) · LinkedIn 1 founder post/wk.

### Don't
No Fiverr link gigs, PBNs, Web2.0 blasts, bulk directory software, comment spam. 20 real Indian citations > 2000 junk links.

---

## Remaining technical to-dos (nice-to-have, from audit)
- Per-product schema images (8 products share one generic image) — compress /product/*.png to WebP first
- Trim Google Fonts from 16 variants → 3-4 (LCP win)
- og:image → 1200×630 product shot (currently logo)
- Consider pre-rendering full shop cards (current static links are the minimum viable fix)

## 30-day success metrics
GBP verified + 10 reviews · 15+ citations · 8-10 sameAs · Amazon+Flipkart live · 1-2 press mentions · brand SERP fully owned · GSC brand impressions ↑ · first long-tail queries in top 20.
