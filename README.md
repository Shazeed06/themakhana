# 🪷 The Makhana

A premium, fully responsive **D2C e-commerce website** for **The Makhana** — a brand selling roasted &amp; raw makhana (foxnuts / phool makhana), handpicked in Madhubani, Bihar.

White + golden-yellow + black premium theme · editorial serif typography · crafted inline-SVG product pouches (no stock photos) · working cart · SEO-optimized.

---

## ✨ Features

- **Homepage** — hero, trust strip, **shop-by-flavour** explorer, product grid with category filter, benefits, brand story / farm-to-bowl journey, **as featured in**, impact stats, reviews, **Instagram** feed, gifting, newsletter & closing CTA.
- **Product detail pages** (`product.html?id=<id>`) — gallery + thumbnails, pack/size variants, qty stepper, highlights, description, **Makhana vs Popcorn**, nutrition + ingredients + info tables, how-to, FAQ accordion, related products.
- **Dedicated About Us page** (`about.html`) — story, founder note, heritage, journey, values, FAQ.
- **Working cart** — slide-in drawer, qty +/− , remove, live subtotal/savings/total, free-shipping nudge, `localStorage` persistence (shared across all pages).
- **SEO** — unique titles/meta, Open Graph + Twitter cards, canonical, JSON-LD (Organization, WebSite, Product, BreadcrumbList, FAQPage), `sitemap.xml`, `robots.txt`, `site.webmanifest`.
- **Fully responsive** — mobile / tablet / desktop, accessible (semantic HTML, ARIA, focus states, `prefers-reduced-motion`).

## 🗂️ Structure

| File | Purpose |
|------|---------|
| `index.html` | Homepage |
| `product.html` + `product.js` | Product detail page template (renders any product by `?id=`) |
| `about.html` | About Us page |
| `catalog.js` | Shared product data + SVG pouch art + cart store |
| `script.js` | Homepage logic (products, filter, cart, reveals) |
| `styles.css` | Shared design system |
| `cursor-demo.html` | Internal demo to preview custom cursor effects |
| `sitemap.xml` · `robots.txt` · `site.webmanifest` | SEO infra |

## 🚀 Run locally

Pure static site — no build step. Serve the folder with any static server:

```bash
python -m http.server 8080
# then open http://localhost:8080
```

## 🛠️ Tech

Vanilla **HTML5 + CSS3 + JavaScript** (no framework, no build). Fonts: Fraunces + Plus Jakarta Sans.

## 📝 Placeholders to replace

- Domain `https://www.themakhana.in/` (canonical / OG / sitemap) → your real domain
- `og-image.jpg` and product OG images
- "As featured in" press names &amp; the Instagram handle/posts
- Contact / FSSAI / address details

---

Built with 💛 for The Makhana.
