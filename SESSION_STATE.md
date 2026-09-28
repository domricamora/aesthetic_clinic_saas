# SESSION_STATE.md — HAND-OFF, START HERE

Updated 2026-09-29 (session saved after Phase B public content).

## Where things are

- **Brand:** Patrice Beauty Lounge Aesthetics (client of the owner). All brand values in `config/clinic.php`; palette in `resources/css/app.css` `@theme` (plum #3E1459, violet #7822B8, champagne gold #D4AE6A). Fonts: Bodoni Moda (display) + Jost (body), self-hosted via `vite.config.ts` bunny().
- **Built (Phase 1, marketing):** home (`pages/home.tsx`) with full-width Mixkit video hero + live appointment card, trust, bento featured treatments, categories, why, before/after (labelled illustrative), specialists, technology, membership, testimonials, locations (live open/closed), FAQ, enquiry form. Treatments index + detail. Booking (`/book`) with live slots, first-available doctor, confirmation (signed URL). Every form creates a CRM lead with UTM attribution (`CaptureAttribution`).
- **Booking engine:** `app/Actions/Booking/AvailableSlots.php` + `BookAppointment.php` (transaction, row locks, unique specialist+start). Tests: `tests/Feature/BookingTest.php`.
- **Built (admin CRM, deployed to live 2026-09-28):** `/dashboard` (today agenda with Bodoni times, gold "now" line, inline status change; stats; latest enquiries), `/admin/leads` (stage tabs with counts, search, pagination), `/admin/leads/{id}` (clickable 9-stage pipeline, notes, activity timeline with author, appointments, source/UTM/consent), `/admin/appointments` (day view, prev/today/next, date + branch filter). Controllers in `app/Http/Controllers/Admin`, pages in `resources/js/pages/admin`, shared `resources/js/lib/admin.ts` + `components/admin/{agenda,status-select}.tsx`. Routes guarded by `can:leads.*` / `can:appointments.*`. Sidebar filtered by permission, Patrice mark, square inset panel.
- **Demo CRM data:** `CrmDemoSeeder` (40 fictional leads, 32 appointments around today, 16 today). Skipped in tests. Migration `2026_09_28_200000` adds `crm_activities.user_id` and makes `description` text.
- **Tenant fix:** `Organization::current()` now reads the signed-in user on every call; only the guest fallback is cached (`organization.default`). Super Admin gets every permission name in the shared `auth.permissions` prop.
- **Built (Phase B, public content — committed):** About, Membership, Promotions, Before/After, Contact, Journal (index + article with category filter), legal pages (privacy policy, terms, data privacy notice) from the database; `sitemap.xml`, `robots.txt`, LocalBusiness JSON-LD in the site layout. New tables `membership_tiers`, `promotions`, `posts`, `pages` (migration `2026_09_29_100000`), seeded by `MarketingContentSeeder` (3 tiers, 4 promos, 6 posts, 3 legal pages). Controllers `Site\{PageController,BlogController,SeoController}`; `Page` content is plain text and rendered as paragraphs, never as HTML. Legal catch-all `Route::get('{page}')` must stay last in `routes/web.php`.
- **Admin extras (Phase A, committed 1987be3):** add lead / new appointment from the dashboard and index pages, move or check in a visit, Ctrl+K command palette (permission aware, debounced CRM search).
- **Tests:** 67 passing (incl. `tests/Feature/SitePagesTest.php`: public pages, blog filter, legal pages, sitemap, robots).
- **Fixed (page expired):** a 419 from a stale CSRF token (a tab left open, a cleared session) used to dump the user on a dead "Page Expired" page. `bootstrap/app.php` now renders 419s as a redirect back to a freshly rendered form with "Your session expired. Please try again." Laravel maps the token mismatch to a 419 `HttpException` *before* render callbacks, so the callback matches on `HttpExceptionInterface` and the status code. Inertia sends `X-Requested-With`, so the JSON branch must exclude requests carrying `X-Inertia`.
- **Fixed (login passkeys):** the sign-in page showed "Request failed with status 404" because `laravel/passkeys` defaults to `/passkeys/login/options` on the domain root. `pages/auth/login.tsx` now passes `loginOptions()` / `passkeyLogin()` to `<PasskeyVerify>`, like `confirm-password.tsx` already did.
- **Admin → site:** sidebar "View website" is a plain `<a target="_blank">` (`nav-footer.tsx`) and opens the marketing home in a new tab. It is not an Inertia visit, so the Inertia `Link` no-op seen in QA was a false alarm.
- **Git:** `main` → https://github.com/domricamora/aesthetic_clinic_saas.git

## Live

- https://patrice.deskpulse.click (server `ssh ck-live`, folder `~/public_html/patrice.deskpulse.click`, PHP `/opt/cpanel/ea-php83/root/usr/bin/php`, DB `htrjymuo_patrice`). Server keeps its own `.env` (never overwrite).
- Root `.htaccess` = cPanel php block + repo `.htaccess` (routes into `public/`, blocks source/dotfiles, re-asserts CSP).
- **Deploy an update:** `APP_URL=https://patrice.deskpulse.click npm run build` → tar over ssh (exclude .env .git node_modules tests storage logs) → on server `php artisan migrate --force && php artisan optimize`. Then rebuild locally with `MSYS_NO_PATHCONV=1 ASSET_URL=/aesthetic/public npm run build`.
- A test booking "Demo" (PT-V4BLBH) exists on live.

## Demo logins (password `password`)

admin@patrice.test (Super Admin), owner@patrice.test, reception@patrice.test. Local: http://localhost/aesthetic/public

## Next

1. Remaining starter-kit bits: settings pages and auth screens still use the stock layout; the settings nav should match the brand like the site nav does.
2. Next from plan.md: sections that are still untouched (e.g. #33 notifications, #34 automation, #40 analytics, #42 reporting) — pick one only on request.
3. PHPStan still reports 11 pre-existing errors in Phase 1 files (AvailableSlots, BookAppointment, AssetUrl, Site/BookingController, Site/PageController::specialists docblock, SiteContentSeeder); Phase A and B code is clean. Do not claim PHPStan passes.
4. Browser QA without the Playwright MCP: `playwright-core` in the session scratchpad + `~/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe`.
5. 3D hero from plan.md §6 was replaced by the video hero at the owner's request.
6. Run impeccable finish review + documenter (DESIGN.md) — not done yet.

## Gotchas

- Models that hold a photo path (`/media/photos/x.jpg`) need the `AssetUrl` cast or the browser requests the wrong absolute URL when the app is served from a subfolder.
- Date-only columns must be cast `date:Y-m-d` when they cross to the browser, otherwise a `T12:00:00+08:00` helper builds an invalid date.
- Bash heredocs break on unpaired apostrophes in this harness; write source files with the Write tool.
- Unsplash search needs curl with a curl user agent; images download fine via PHP.
- Wayfinder bakes APP_URL into generated routes at build time: build with the right APP_URL.
- The site URL ends in `/public`; `http://localhost/aesthetic` (the WAMP web-root folder) is a Laravel 404 by design. The root `.htaccess` cannot fix it: it rewrites the file path but Laravel routes on `REQUEST_URI`.
- `<PasskeyVerify>` must be given `routes` (`loginOptions()`, `passkeyLogin()`); the passkeys package defaults to `/passkeys/...` on the domain root, which 404s under a sub-folder.
