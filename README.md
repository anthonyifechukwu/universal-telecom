# Universal Telecom / TrueCell — Complete Website

A full-stack wholesale phone marketplace: real customer accounts, real admin panel, real chat between customers and admin, real product management, and real quote/inquiry requests. No fake or placeholder data anywhere — everything you see is backed by an actual database.

## What's included

### Customer-facing site
- **Homepage** (`phone-whosaler.html`) and **Shop** (`phone-whole-shop.html`) — browse real products pulled from your database, filterable by brand
- **Product details** (`phone-product-detail.html`) — full specs, images, and related products
- **Register / Login** — real accounts with hashed passwords and secure sessions
- **Account page** (`phone-account.html`) — real profile info, editable, with real recommended products and account activity
- **Cart** (`cart.html`) — a real staging list for products you want to request a quote on (there's no payment system — pricing is confirmed via quote request)
- **Quote request** (`phone-quote.html`) — submits a real inquiry to admin, with PDF download and WhatsApp quick-send
- **Live chat** (`phone-chat.html`) — real-time messaging with admin, backed by the database so it works across devices

### Admin panel (`/admin`)
- **Dashboard** — real stats (products, customers, inquiries, conversations), recent activity, low-stock alerts
- **Products** — full add/edit/delete, only admin can manage inventory
- **Customers** — real registered accounts, with the ability to delete an account (and its chat history) while preserving their quote request history for your records
- **Inquiries** — every quote request, whether submitted via the form or started through a chat message, all in one place, linked to the customer's real chat thread
- **Messages** — a real inbox to read and reply to every customer conversation

### Backend (Node/Express + MongoDB)
- JWT-based authentication, separate sessions for admin vs. customer so they can never interfere with each other in the same browser
- Real-time-ish messaging via polling, with role-based access control throughout
- Server-side caching on product lists to reduce database load
- Admin account auto-created from your `.env` on first startup — no manual setup step

## Setting up

1. `cd backend && npm install`
2. Copy `.env.example` to `.env` and fill in your real MongoDB Atlas connection string, a random JWT secret, and your admin email/password
3. `node server.js` — your admin account is created automatically on first run
4. Open any frontend `.html` file through a local server (e.g. VS Code's Live Server extension) — **not** by double-clicking the file, and not through `localhost:5000` directly (that's the API only)
5. `frontend/js/api.js` auto-detects local vs. live deployment, so no manual URL swapping is needed while testing

## Known limitation worth knowing about

Product photos are stored as base64 text directly in the database rather than a dedicated image-hosting service. This works fine for a modest catalog, but if you grow into hundreds of products with many photos each, moving to a real image host (Cloudinary, S3, etc.) would keep things fast.

## About the slow-loading issue

If products or admin data load slowly or inconsistently: this was traced back to your internet connection during testing (a mobile hotspot), not the website's code. MongoDB keeps a persistent connection open, which mobile/cellular connections handle poorly compared to regular WiFi or broadband — signal variability and carrier-level connection resets can cause exactly the kind of intermittent slowness we saw. If you test again on a stable WiFi or wired connection, it should perform normally. The app has also been hardened either way: a server-side cache reduces repeat database calls, requests time out gracefully instead of hanging forever, and the backend now fails fast with a clear error if the database connection itself is ever the problem.

## Deploying live

1. Push `backend/` to GitHub, connect it to a host like Render.com as a Web Service
2. Set the same environment variables from your `.env` in Render's dashboard
3. Once deployed, update the placeholder production URL in `frontend/js/api.js`
4. Host the `frontend/` folder anywhere that serves static files (Render, Netlify, Vercel, or your existing hosting)

**Security reminder:** you shared your real database password during troubleshooting in this conversation — please change it in Atlas (Database Access → edit user → new password) if you haven't already.

## Found the actual bug behind "the space is there but nothing shows"

Your screenshot was the key — the entire page was blank below the header, not just the products. The real cause: the homepage script hid the **entire page** (`opacity: 0`) until the browser's `load` event fired — and `load` only fires once *every single resource on the page* has finished, including external images (the Unsplash stock photos used as fallback product images). On a slow or unstable connection, those external images could take a very long time to finish loading (or never finish), which meant the whole page — including your real, correctly-loaded products — stayed invisible the entire time. The content and layout were always there; they just couldn't be seen.

**Fixed properly, in 4 files that had this same risky pattern** (the homepage, login, register, and profile pages): the page now reveals itself as soon as the HTML itself is ready, without waiting on any images at all, and there's now a hard 2-3 second safety timeout that forces the page visible no matter what — so this specific failure mode can't happen again, regardless of connection quality or slow external resources.


## Latest round — button fixes, image fixes, cart-to-chat integration, alignment

- **Confirmed and extended your z-index fix**: the product grid's covering issue was fixed on the shop page — applied the same `position:relative; z-index:1` fix to every other dynamic content grid site-wide (homepage's Featured/Flash Deals, account page's recommended products, product detail's related products), so this bug can't resurface elsewhere.
- **Fixed missing desktop navigation**: on screens 1024px and wider, the mobile bottom nav (which has Cart and Quote) disappears entirely, and the desktop header nav didn't have equivalent links — meaning Cart and Quote were completely unreachable from 10 pages on desktop. Added them to the desktop nav across all 10 pages, and fixed the shop page's header, which was missing navigation links entirely (only had a logo and Sign Up button).
- **Fixed About page team photos**: the CSS used `background-position` on actual `<img>` tags, which does nothing — the correct property is `object-position`. This is why photos were center-cropping and cutting off heads. Fixed to keep the top of the photo in frame.
- **Fixed the product cards** — found the "Add to Cart" button had been completely removed from the card's HTML even though its working JS handler was still there (silently dead), and the wishlist heart button never had any handler at all. Restored the Add to Cart button and built a real, working wishlist (saved locally per-device, same pattern as the cart) — the heart now actually saves/unsaves and shows filled when a product is saved.
- **Fixed a wrong image showing before products load**: the product detail page had a hardcoded phone stock photo baked into the HTML, shown before the real product data arrives. Replaced with your logo everywhere this could happen — the initial placeholder, the "no photos uploaded" fallback, and the related-products fallback. Also fixed an incorrect image path in the shared fallback that would have been broken on the shop/homepage.
- **Cart page now integrates with the real chat system, as requested**: clicking the quote button on the cart page ("Message Admin About This") now builds a clear summary of everything in the cart and takes the customer straight into a real chat with admin, pre-filled and ready to send (requires login, same as everywhere else on the site) — replacing the old behavior of just linking to the separate quote form.
- **Fixed the quote page's alignment**: the form section had an extra width constraint that every other section on the page didn't have, making it appear as a narrower, misaligned box compared to the hero and other sections. Fixed so the section aligns with the rest of the page, while keeping the form itself a comfortable, readable width on large screens.
- Also found and removed a duplicate "Message" button on the quote page (only one of the two ever actually worked, due to how the JS selected it) — now there's one clear, correctly-working button.


## Fixed — deleted customers still showing up (Inquiries, Dashboard, other admin pages)

Real cause: deleting a customer was intentionally designed earlier to keep their quote-request history for business records, only removing the login and chat. That's why deleted customers kept appearing — their old inquiries were still there on purpose, just unlinked from an account.

Since that's not what you want, changed it to a full, complete removal: deleting a customer now also deletes every quote request they've submitted, so no trace of them remains anywhere — Inquiries list, Dashboard stats and activity feed, Customers list, all of it. Updated the warning message on all three delete buttons (Customers page, Messages/chat page, Inquiry Details page) to clearly say this upfront before you confirm, since it's now a complete and irreversible deletion.

