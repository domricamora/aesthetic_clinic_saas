<?php

use App\Models\Employee;
use App\Models\Specialist;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

it('shows the marketing pages from the seeded content', function () {
    $this->get('/about')->assertOk()
        ->assertInertia(fn ($page) => $page->component('about')
            // The roster is the staff roll now, filtered to the clinicians the
            // seeder ticked for the website, rather than the three seeded
            // specialist rows the office cannot edit.
            ->has('specialists', 7)
            ->has('branches', 3)
            ->has('testimonials', 3)
            ->has('faqs', 4));

    $this->get('/membership')->assertOk()
        ->assertInertia(fn ($page) => $page->component('membership')
            ->has('tiers', 3)
            ->where('tiers.0.price_monthly', 2990));

    $this->get('/promotions')->assertOk()
        ->assertInertia(fn ($page) => $page->component('promotions')
            ->has('promotions', 4)
            ->has('tiers', 3));

    $this->get('/before-after')->assertOk()
        ->assertInertia(fn ($page) => $page->component('before-after')->has('cases', 7));

    $this->get('/contact')->assertOk()
        ->assertInertia(fn ($page) => $page->component('contact')
            ->has('branches', 3)
            ->has('treatments', 21));
});

it('serves the journal with a topic filter and an article', function () {
    $this->get('/journal')->assertOk()
        ->assertInertia(fn ($page) => $page->component('blog/index')
            ->has('posts.data', 6)
            ->has('categories', 5));

    $this->get('/journal?category=Aftercare')
        ->assertInertia(fn ($page) => $page
            ->has('posts.data', 1)
            ->where('filter', 'Aftercare'));

    $this->get('/journal/aftercare-for-injectables')->assertOk()
        ->assertInertia(fn ($page) => $page->component('blog/show')
            ->where('post.title', 'Aftercare for injectables: the first 48 hours')
            ->has('post.paragraphs', 4)
            ->has('post.takeaways', 3)
            ->has('related'));

    $this->get('/journal/not-a-post')->assertNotFound();
});

it('serves the legal pages from the database and links the others', function () {
    $this->get('/privacy-policy')->assertOk()
        ->assertInertia(fn ($page) => $page->component('legal')
            ->where('page.slug', 'privacy-policy')
            ->has('page.sections', 10)
            ->has('others', 2));

    $this->get('/terms')->assertOk()
        ->assertInertia(fn ($page) => $page->where('page.slug', 'terms')->has('page.sections', 10));
    $this->get('/data-privacy-notice')->assertOk()
        ->assertInertia(fn ($page) => $page->where('page.slug', 'data-privacy-notice'));

    $this->get('/not-a-real-page')->assertNotFound();
});

it('serves the sitemap and keeps the admin out of the index', function () {
    $this->get('/sitemap.xml')->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
        ->assertSee('<loc>', false)
        ->assertSee('treatments/hydra-facial', false)
        ->assertSee('journal/choosing-your-first-facial', false)
        ->assertSee('privacy-policy', false)
        ->assertDontSee('/admin', false);

    $this->get('/robots.txt')->assertOk()
        ->assertSee('Disallow: /admin', false)
        ->assertSee('Sitemap: '.route('sitemap'), false);
});

it('shows only the staff the office has ticked for the website', function () {
    Employee::query()->update(['show_on_site' => false]);

    $chosen = Employee::query()->firstOrFail();
    $chosen->update(['show_on_site' => true]);
    $other = Employee::query()->whereKeyNot($chosen->id)->firstOrFail();

    $this->get('/about')
        ->assertOk()
        ->assertSee($chosen->name)
        ->assertDontSee($other->name);
});

it('hides somebody the office has unticked', function () {
    Employee::query()->update(['show_on_site' => true]);

    $dropped = Employee::query()->firstOrFail();
    $dropped->update(['show_on_site' => false]);

    $this->get('/about')->assertOk()->assertDontSee($dropped->name);
});

it('shows nobody who has been stood down', function () {
    Employee::query()->update(['show_on_site' => true]);

    $gone = Employee::query()->firstOrFail();
    $gone->update(['status' => 'resigned']);

    $this->get('/about')->assertOk()->assertDontSee($gone->name);
});

it('publishes the title the office set rather than the seeded copy', function () {
    Employee::query()->update(['show_on_site' => true]);

    Employee::where('name', 'Dr. Adrian Santos')->firstOrFail()->update([
        'position' => 'Medical Director and Founder',
    ]);

    // The same person also exists as a seeded specialist row. The staff record
    // has to be the one that reaches the page, or an edit made in the office
    // never appears on the site.
    $this->get('/about')->assertOk()->assertSee('Medical Director and Founder');
});

it('still lists a visiting specialist who is not on the payroll', function () {
    // With the roll emptied the seeded specialists can only be reaching the
    // page as visitors, which is the case that has to keep working.
    Employee::query()->update(['show_on_site' => false]);

    $visitor = Specialist::query()->firstOrFail();

    $this->get('/about')->assertOk()->assertSee($visitor->name);
});

it('does not list the same person twice', function () {
    Employee::query()->update(['show_on_site' => true]);

    $html = $this->get('/about')->assertOk()->getContent();

    foreach (Employee::query()->get() as $person) {
        expect(substr_count($html, e($person->name).'"'))->toBeLessThanOrEqual(1);
    }
});
