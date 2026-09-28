<?php

use App\Actions\Setup\LoadClinicData;
use App\Models\Account;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Lead;
use App\Models\Organization;
use App\Models\Product;
use App\Models\Treatment;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\SiteContentSeeder;
use Spatie\Permission\Models\Role;

// The content seeders write into the signed-in clinic, so give them one to
// write into. Everything else is left empty on purpose: these tests are about
// what the button fills in, so they have to start from nothing.
beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $organization = Organization::create([
        'name' => config('clinic.name'),
        'slug' => config('clinic.organization'),
    ]);

    Branch::withoutGlobalScopes()->create([
        'organization_id' => $organization->id,
        'name' => 'Main',
        'slug' => 'main',
    ]);

    app()->instance('organization.default', $organization);
});

function administrator(): User
{
    $user = User::factory()->create([
        'organization_id' => Organization::current()?->id,
    ]);
    $user->assignRole('Clinic Administrator');

    return $user;
}

it('sends guests to the login page', function () {
    $this->get(route('admin.setup.index'))->assertRedirect(route('login'));
    $this->post(route('admin.setup.store'))->assertRedirect(route('login'));
});

it('lets an administrator open the setup screen', function () {
    $this->actingAs(administrator())
        ->get(route('admin.setup.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/setup'));
});

it('refuses a role without settings permission', function () {
    $user = User::factory()->create(['organization_id' => Organization::current()?->id]);
    $user->assignRole('Receptionist');

    $this->actingAs($user)->get(route('admin.setup.index'))->assertForbidden();
    $this->actingAs($user)->post(route('admin.setup.store'))->assertForbidden();
});

it('fills the lists the app needs', function () {
    $this->actingAs(administrator());

    expect(Treatment::count())->toBe(0);

    $this->post(route('admin.setup.store'))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Treatment::count())->toBeGreaterThan(0)
        ->and(Account::count())->toBeGreaterThan(0)
        ->and(Role::count())->toBeGreaterThan(0);

    // Products are shop stock, and the shop stock is demo stock. A clinic
    // enters its own, so the button must not invent any.
    expect(Product::count())->toBe(0);
});

it('never creates a login', function () {
    $this->actingAs(administrator());
    $users = User::count();

    $this->post(route('admin.setup.store'));

    // The demo seeder is what makes logins, and it must stay out of this.
    expect(User::count())->toBe($users);
});

it('can be pressed twice without duplicating anything', function () {
    $this->actingAs(administrator());

    $this->post(route('admin.setup.store'));
    $first = Treatment::count();

    $this->post(route('admin.setup.store'));

    expect(Treatment::count())->toBe($first);
});

it('tells every screen which build it is running', function () {
    // A stale tab is indistinguishable from a bug otherwise, and this is what
    // settles it: compare the number on the sidebar with the server's.
    $this->get('/')->assertOk()->assertInertia(
        fn ($page) => $page->where('build', fn ($build) => is_string($build) && strlen($build) > 0),
    );
});

it('reports what is loaded on the dashboard', function () {
    $this->actingAs(administrator());

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('content', fn ($content) => collect($content)
            ->contains(fn ($row) => $row['key'] === 'treatments' && $row['count'] === 0)));

    $this->post(route('admin.setup.store'));

    $this->get(route('dashboard'))->assertInertia(
        fn ($page) => $page->where('content', fn ($content) => collect($content)
            ->firstWhere('key', 'treatments')['count'] > 0),
    );
});

it('keeps the dashboard counts away from roles that cannot see content', function () {
    $user = User::factory()->create(['organization_id' => Organization::current()?->id]);
    $user->assignRole('Receptionist');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('content', null));
});

it('loads content and reference data but never the demo clinic', function () {
    (new LoadClinicData)();

    // SiteContentSeeder is in; the seeder that writes demo staff, leads and
    // logins is not, or a live clinic would come back full of fictional data.
    expect(LoadClinicData::SEEDERS)->toContain(SiteContentSeeder::class)
        ->not->toContain(DatabaseSeeder::class)
        ->and(Employee::count())->toBe(0)
        ->and(Lead::count())->toBe(0);
});
