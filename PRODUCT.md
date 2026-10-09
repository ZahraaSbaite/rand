# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
A mixed audience with no single dominant group (confirmed): trend-led younger shoppers buying bags and totes for style; gift buyers of all ages looking for scarves, gloves, cardigans and commissions; and craft lovers who value the handmade process. Most arrive browsing, not searching for a specific SKU.

## Product Purpose
Strand is an online shop for a small crochet studio. It sells finished, small-batch handmade bags, tote bags, scarves, cardigans and gloves (confirmed product range) and takes custom commissions. Success is a visitor finding a piece they love, trusting that it is genuinely handmade, and either buying it or starting a custom order.

## Positioning
Every piece is crocheted by hand in small batches and sold as it is finished; pieces sell out and don't always return the same way twice. No mass production, no factories.

## Operating Context
- React 18 + Vite frontend (`frontend/`), Express + Postgres backend (`backend/`) with products, categories, collections, reviews, FAQs, journal, process steps, story blocks, orders, custom orders and uploads.
- Storefront flows: browse home → shop/category → product → cart → checkout → order confirmation/tracking; wishlist and recently viewed are client-side.
- Content pages: Collections, Custom Orders, Lookbook, Our Story, The Process, Reviews, FAQ, Contact, Shipping, Returns, Privacy, Terms.
- Admin dashboard (`/admin`, "Studio") controls everything the site shows: products, categories, orders and tracking stage, custom order requests, contact messages, review moderation, collections, FAQs, Our Story, The Process, Lookbook, and site settings (homepage text, ticker, socials, policy page text).

## Capabilities and Constraints
- Light/dark theme toggle must remain (confirmed).
- Product imagery comes from admin uploads; placeholders appear when missing.
- No animation library is installed; motion today is CSS plus small hooks (`useReveal`, `useTilt`, `useParallax`).

## Brand Commitments
- Name: **Strand** (confirmed). Tagline in use: "A World of Color + Thread".
- Voice: warm, unhurried, maker-first ("one skein at a time", "slow, deliberate making").
- Everything else visual (palette, type, layout) is open to replacement (confirmed).

## Evidence on Hand
- Photography: `frontend/src/assets/hero-crochet-hands.jpg`, `frontend/src/assets/hero-granny-square.jpg`; test product shots in `frontend/public/test-images/`.
- Reviews come from the backend; no testimonials, press, sales figures or maker name exist in the repo. Do not fabricate them.

## Product Principles
1. The hand is the proof: show the making, not just the made.
2. Scarcity is honest: small batches and sold-out pieces are a feature, stated plainly.
3. Browsing should feel like a pleasure, not a catalog.
4. Commissions are a first-class path, not a footer link.
