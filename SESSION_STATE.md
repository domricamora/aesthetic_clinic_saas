# SESSION_STATE.md — HAND-OFF, START HERE

Updated 2026-09-28 (session saved after live deploy).

## Where things are

- **Brand:** Patrice Beauty Lounge Aesthetics (client of the owner). All brand values in `config/clinic.php`; palette in `resources/css/app.css` `@theme` (plum #3E1459, violet #7822B8, champagne gold #D4AE6A). Fonts: Bodoni Moda (display) + Jost (body), self-hosted via `vite.config.ts` bunny().
- **Built (Phase 1, marketing):** home (`pages/home.tsx`) with full-width Mixkit video hero + live appointment card, trust, bento featured treatments, categories, why, before/after (labelled illustrative), specialists, technology, membership, testimonials, locations (live open/closed), FAQ, enquiry form. Treatments index + detail. Booking (`/book`) with live slots, first-available doctor, confirmation (signed URL). Every form creates a CRM lead with UTM attribution (`CaptureAttribution`).
- **Booking engine:** `app/Actions/Booking/AvailableSlots.php` + `BookAppointment.php` (transaction, row locks, unique specialist+start). Tests: `tests/Feature/BookingTest.php`.
- **Built (admin CRM, deployed to live 2026-09-28):** `/dashboard` (today agenda with Bodoni times, gold "now" line, inline status change; stats; latest enquiries), `/admin/leads` (stage tabs with counts, search, pagination), `/admin/leads/{id}` (clickable 9-stage pipeline, notes, activity timeline with author, appointments, source/UTM/consent), `/admin/appointments` (day view, prev/today/next, date + branch filter). Controllers in `app/Http/Controllers/Admin`, pages in `resources/js/pages/admin`, shared `resources/js/lib/admin.ts` + `components/admin/{agenda,status-select}.tsx`. Routes guarded by `can:leads.*` / `can:appointments.*`. Sidebar filtered by permission, Patrice mark, square inset panel.
- **Demo CRM data:** `CrmDemoSeeder` (40 fictional leads, 32 appointments around today, 16 today). Skipped in tests. Migration `2026_09_28_200000` adds `crm_activities.user_id` and makes `description` text.
- **Tenant fix:** `Organization::current()` now reads the signed-in user on every call; only the guest fallback is cached (`organization.default`). Super Admin gets every permission name in the shared `auth.permissions` prop.
- **Tests:** 55 passing (incl. `tests/Feature/AdminCrmTest.php`: permissions, cross-clinic 404s) (`php artisan test`, MySQL `veloura_testing`).
- **Git:** `main` → https://github.com/domricamora/aesthetic_clinic_saas.git

## Live

- https://patrice.deskpulse.click (server `ssh ck-live`, folder `~/public_html/patrice.deskpulse.click`, PHP `/opt/cpanel/ea-php83/root/usr/bin/php`, DB `htrjymuo_patrice`). Server keeps its own `.env` (never overwrite).
- Root `.htaccess` = cPanel php block + repo `.htaccess` (routes into `public/`, blocks source/dotfiles, re-asserts CSP).
- **Deploy an update:** `APP_URL=https://patrice.deskpulse.click npm run build` → tar over ssh (exclude .env .git node_modules tests storage logs) → on server `php artisan migrate --force && php artisan optimize`. Then rebuild locally with `MSYS_NO_PATHCONV=1 ASSET_URL=/aesthetic/public npm run build`.
- A test booking "Demo" (PT-V4BLBH) exists on live.

## Demo logins (password `password`)

admin@patrice.test (Super Admin), owner@patrice.test, reception@patrice.test. Local: http://localhost/aesthetic/public

## Next

1. Admin extras: create lead / manual booking from admin, reschedule, command palette (plan.md §59).
2. Pages still missing from plan.md §2: About, Membership page, Before and After, Promotions, Blog, Contact, Privacy, Terms, Data Privacy Notice; SEO sitemap/robots/LocalBusiness schema.
3. Remaining starter-kit bits: settings pages and auth screens still use the stock layout.
4. PHPStan has 24 pre-existing errors in Phase 1 files (AvailableSlots, BookAppointment, AssetUrl, Site controllers, SiteContentSeeder); new admin code is clean.
5. Browser QA without the Playwright MCP: `playwright-core` in the session scratchpad + `~/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe`.
6. 3D hero from plan.md §6 was replaced by the video hero at the owner's request.
7. Run impeccable finish review + documenter (DESIGN.md) — not done yet.

## Gotchas

- Bash heredocs break on unpaired apostrophes in this harness; write source files with the Write tool.
- Unsplash search needs curl with a curl user agent; images download fine via PHP.
- Wayfinder bakes APP_URL into generated routes at build time: build with the right APP_URL.
