# Mandali — QR Menu Website

A mobile-first, bilingual (العربية / English) digital menu for **Mandali Kabab Restaurant**, Isa Town, Bahrain, with a built-in staff admin panel. The site is **view-only**: customers browse the menu by scanning a QR code at their table. There is intentionally **no ordering, cart, checkout, payment, or reservation** feature.

---

## What's in the box

```
mandali-menu/
├── index.html            ← customer menu (the QR-code landing page)
├── admin.html            ← staff admin panel
├── robots.txt
├── site.webmanifest
├── .nojekyll             ← lets GitHub Pages serve the /assets folder
└── assets/
    ├── css/style.css     ← customer styles
    ├── css/admin.css     ← admin styles
    ├── js/seed.js        ← the PUBLISHED menu data (edit via admin → Publish)
    ├── js/store.js       ← shared data layer (localStorage + seed)
    ├── js/menu.js        ← customer rendering
    ├── js/admin.js       ← admin dashboard logic
    └── img/              ← logo, hero, dish & ambiance photos
```

No build step, no framework, no server. It is plain HTML/CSS/JavaScript and runs on any static host.

---

## Deploy it

Pick any one of these. All work the same.

**Netlify / Vercel (drag-and-drop)**
1. Go to the host's "deploy" page.
2. Drag the whole `mandali-menu` folder onto it.
3. You get a live URL in seconds. Done.

**GitHub Pages**
1. Create a repo and upload the contents of `mandali-menu` (keep the `.nojekyll` file — it ensures the `assets` folder is served).
2. Repo → Settings → Pages → deploy from your branch root.
3. Your site appears at `https://<user>.github.io/<repo>/`.

**Any cPanel / shared host**
Upload the folder contents to `public_html` (or a subfolder). That's it.

### Make the QR code
Once you have the live URL, generate a QR code that points to it (any free QR generator works) and print it for the tables. The QR should point at the site root (which serves `index.html`).

---

## The admin panel

Open **`/admin.html`** on your live site (there's also a discreet "Staff login" link in the customer page footer).

- **Default password:** `mandali2024`
- Change it under **Backup & publish → Change password**.

### What you can manage
- **Menu tab** — add / edit / delete / reorder categories; add / edit / delete dishes; show or hide a dish; upload a dish photo; set price, description (AR + EN), and labels (Popular, Chef's pick, New, Spicy); attach option groups.
- **Option groups tab** — create groups like *Portion*, *Choice of side*, *Add-ons*, *Spice level*; add/edit/remove individual options and their extra price; mark a group required or multi-select. (Customers see these as read-only — the site never takes orders.)
- **Restaurant info tab** — business hours, phone, WhatsApp number, Instagram, Google Maps link, address (AR + EN), currency.
- **Backup & publish tab** — publish your changes (see below), download/restore a JSON backup, change password, or reset to the original menu.

---

## How editing & publishing works (important)

This is a **static** site, so it has no shared database. Here's the model:

- Your edits in the admin panel are saved **in that browser** (via `localStorage`) and take effect immediately on that same device.
- To push your changes to **every customer**, use **Backup & publish → Publish menu file**. This downloads a fresh `seed.js`.
- Replace `assets/js/seed.js` in your deployment with that downloaded file, then redeploy (re-drag the folder, or commit the file on GitHub).
- Each publish automatically bumps a version number, so returning customers' phones pick up the new menu instead of showing a stale cached copy.

> **Tip:** Always do your editing on one "manager" device, then publish from it. Keep a JSON backup (Backup tab) before big changes.

---

## A note on security (please read)

The admin password is a **light lock implemented in the browser**, not real server-side security. It keeps casual users out of the admin screen, but a determined technical person could bypass it because everything runs on the client. That's an inherent limit of a no-backend static site. For a menu (low-risk, public content) this is usually fine.

### If you later want real accounts + a live database
Upgrade path without rewriting the front end:
- Stand up a small backend (e.g. **Supabase**, **Firebase**, or a tiny serverless API).
- Move the menu data there and replace the `Store` calls in `store.js` with `fetch()` calls to that backend.
- Put the admin behind real authentication (the backend's auth).
The customer rendering (`menu.js`) and all the styling stay as-is.

---

## Customization quick reference
- **Colors / fonts:** CSS variables at the top of `assets/css/style.css` (`:root`).
- **Default menu content:** `assets/js/seed.js` — but prefer editing through the admin panel and publishing, so you don't hand-edit JSON.
- **Photos:** drop new images into `assets/img/` and set them on dishes via the admin image upload.

---

## Languages
Full Arabic (RTL) and English (LTR) support with a toggle in the top bar. Arabic uses Arabic-Indic numerals for prices and 24-hour times; English uses 12-hour times. The chosen language is remembered per device.

---

*Built for Mandali — 90 years of hospitality, since 1930.*
