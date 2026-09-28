# SESSION_STATE.md — HAND-OFF, START HERE

Updated 2026-09-28 (session saved after live deploy).

## Where things are

- **Brand:** Patrice Beauty Lounge Aesthetics (client of the owner). All brand values in `config/clinic.php`; palette in `resources/css/app.css` `@theme` (plum #3E1459, violet #7822B8, champagne gold #D4AE6A). Fonts: Bodoni Moda (display) + Jost (body), self-hosted via `vite.config.ts` bunny().
- **Built (Phase 1, marketing):** home (`pages/home.tsx`) with full-width Mixkit video hero + live appointment card, trust, bento featured treatments, categories, why, before/after (labelled illustrative), specialists, technology, membership, testimonials, locations (live open/closed), FAQ, enquiry form. Treatments index + detail. Booking (`/book`) with live slots, first-available doctor, confirmation (signed URL). Every form creates a CRM lead with UTM attribution (`CaptureAttribution`).
- **Booking engine:** `app/Actions/Booking/AvailableSlots.php` + `BookAppointment.php` (transaction, row locks, unique specialist+start). Tests: `tests/Feature/BookingTest.php`.
- **Tests:** 49 passing (`php artisan test`, MySQL `veloura_testing`).
- **Git:** `main` → https://github.com/domricamora/aesthetic_clinic_saas.git

## Live

- https://patrice.deskpulse.click (server `ssh ck-live`, folder `~/public_html/patrice.deskpulse.click`, PHP `/opt/cpanel/ea-php83/root/usr/bin/php`, DB `htrjymuo_patrice`). Server keeps its own `.env` (never overwrite).
- Root `.htaccess` = cPanel php block + repo `.htaccess` (routes into `public/`, blocks source/dotfiles, re-asserts CSP).
- **Deploy an update:** `APP_URL=https://patrice.deskpulse.click npm run build` → tar over ssh (exclude .env .git node_modules tests storage logs) → on server `php artisan migrate --force && php artisan optimize`. Then rebuild locally with `MSYS_NO_PATHCONV=1 ASSET_URL=/aesthetic/public npm run build`.
- A test booking "Demo" (PT-V4BLBH) exists on live.

## Demo logins (password `password`)

admin@patrice.test (Super Admin), owner@patrice.test, reception@patrice.test. Local: http://localhost/aesthetic/public

## Next

1. Admin screens for leads and appointments (plan.md §71-72: booking must show in admin immediately). Dashboard still the starter placeholder.
2. Pages still missing from plan.md §2: About, Membership page, Before and After, Promotions, Blog, Contact, Privacy, Terms, Data Privacy Notice; SEO sitemap/robots/LocalBusiness schema.
3. Replace starter-kit bits in admin (Laravel logo, rounded cards).
4. 3D hero from plan.md §6 was replaced by the video hero at the owner's request.
5. Run impeccable finish review + documenter (DESIGN.md) — not done yet.

## Gotchas

- Bash heredocs break on unpaired apostrophes in this harness; write source files with the Write tool.
- Unsplash search needs curl with a curl user agent; images download fine via PHP.
- Wayfinder bakes APP_URL into generated routes at build time: build with the right APP_URL.
