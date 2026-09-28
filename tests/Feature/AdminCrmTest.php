<?php

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\CrmActivity;
use App\Models\Lead;
use App\Models\Organization;
use App\Models\Treatment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    CarbonImmutable::setTestNow(CarbonImmutable::parse('next monday 08:00'));
    $this->post('/book', [
        'treatment_id' => Treatment::where('slug', 'hydra-facial')->value('id'),
        'branch_id' => Branch::where('slug', 'makati')->value('id'),
        'date' => now()->toDateString(),
        'time' => '10:00',
        'first_name' => 'Ana',
        'phone' => '0917 123 4567',
        'privacy_consent' => '1',
    ])->assertRedirect();
});

function staff(string $email): User
{
    return User::where('email', $email)->firstOrFail();
}

it('shows a website booking on the dashboard and the day agenda right away', function () {
    $reception = staff('reception@patrice.test');
    $reference = Appointment::withoutGlobalScopes()->sole()->reference;

    $this->actingAs($reception)->get('/dashboard')->assertOk()
        ->assertInertia(fn ($page) => $page->component('dashboard')->where('today.0.reference', $reference)->where('stats.to_confirm', 1));

    $this->get('/admin/appointments?date='.now()->toDateString())->assertOk()
        ->assertInertia(fn ($page) => $page->where('appointments.0.client', 'Ana'));
});

it('lets reception move a lead stage and log a note', function () {
    $lead = Lead::withoutGlobalScopes()->sole();

    $this->actingAs(staff('reception@patrice.test'))
        ->patch("/admin/leads/{$lead->id}", ['stage' => 'contacted'])->assertRedirect();
    $this->post("/admin/leads/{$lead->id}/notes", ['note' => 'Called, prefers afternoons.'])->assertRedirect();

    expect($lead->fresh()->stage)->toBe('contacted')
        ->and(CrmActivity::withoutGlobalScopes()->where('lead_id', $lead->id)->where('type', 'note')->value('description'))->toBe('Called, prefers afternoons.');

    $this->get("/admin/leads/{$lead->id}")->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/leads/show')->has('activities', 3)->has('appointments', 1));
});

it('filters and searches leads', function () {
    $this->actingAs(staff('owner@patrice.test'))->get('/admin/leads?stage=consultation_booked&q=Ana')->assertOk()
        ->assertInertia(fn ($page) => $page->has('leads.data', 1));
    $this->get('/admin/leads?q=nobody')->assertInertia(fn ($page) => $page->has('leads.data', 0));
});

it('updates an appointment status and records it on the lead', function () {
    $appointment = Appointment::withoutGlobalScopes()->sole();

    $this->actingAs(staff('reception@patrice.test'))
        ->patch("/admin/appointments/{$appointment->id}", ['status' => 'confirmed'])->assertRedirect();

    expect($appointment->fresh()->status)->toBe('confirmed')
        ->and(CrmActivity::withoutGlobalScopes()->where('type', 'appointment')->exists())->toBeTrue();

    $this->patch("/admin/appointments/{$appointment->id}", ['status' => 'teleported'])->assertSessionHasErrors('status');
});

it('blocks staff without the permission', function () {
    $doctor = User::factory()->create(['organization_id' => Organization::sole()->id]);
    $doctor->assignRole('Doctor');
    $lead = Lead::withoutGlobalScopes()->sole();
    $appointment = Appointment::withoutGlobalScopes()->sole();

    $this->actingAs($doctor)->get('/admin/leads')->assertForbidden();
    $this->get("/admin/leads/{$lead->id}")->assertForbidden();
    $this->get('/admin/appointments')->assertOk();
    $this->patch("/admin/appointments/{$appointment->id}", ['status' => 'cancelled'])->assertForbidden();
    $this->get('/dashboard')->assertOk()->assertInertia(fn ($page) => $page->where('leads', null));
});

it('keeps other clinics out', function () {
    $other = Organization::create(['name' => 'Other Clinic', 'slug' => 'other']);
    $intruder = User::factory()->create(['organization_id' => $other->id]);
    $intruder->assignRole('Organization Owner');
    $lead = Lead::withoutGlobalScopes()->sole();

    $this->actingAs($intruder)->get("/admin/leads/{$lead->id}")->assertNotFound();
    $this->patch("/admin/leads/{$lead->id}", ['stage' => 'vip'])->assertNotFound();
    $this->get('/admin/leads')->assertInertia(fn ($page) => $page->has('leads.data', 0));
});
