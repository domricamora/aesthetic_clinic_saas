<?php

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\CrmActivity;
use App\Models\Lead;
use App\Models\Treatment;
use Carbon\CarbonImmutable;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
    // A Monday well inside the booking window, before opening hours.
    CarbonImmutable::setTestNow(CarbonImmutable::parse('next monday 08:00'));
});

function booking(array $overrides = []): array
{
    return $overrides + [
        'treatment_id' => Treatment::where('slug', 'hydra-facial')->value('id'),
        'branch_id' => Branch::where('slug', 'makati')->value('id'),
        'date' => now()->toDateString(),
        'time' => '10:00',
        'first_name' => 'Ana',
        'phone' => '0917 123 4567',
        'privacy_consent' => '1',
    ];
}

it('renders the public pages', function () {
    $this->get('/')->assertOk();
    $this->get('/treatments')->assertOk();
    $this->get('/treatments/hydra-facial')->assertOk();
    $this->get('/book')->assertOk();
});

it('lists open slots for a day', function () {
    $this->getJson('/book/slots?'.http_build_query([
        'treatment_id' => booking()['treatment_id'],
        'branch_id' => booking()['branch_id'],
        'date' => now()->toDateString(),
    ]))->assertOk()->assertJsonPath('slots.0', '10:00');
});

it('creates a lead, an appointment and a CRM activity from one booking', function () {
    $this->post('/book', booking())->assertRedirect();

    $appointment = Appointment::sole();
    expect($appointment->status)->toBe('pending')
        ->and($appointment->starts_at->format('H:i'))->toBe('10:00')
        ->and(Lead::sole()->stage)->toBe('consultation_booked')
        ->and(CrmActivity::where('lead_id', Lead::sole()->id)->where('type', 'booking')->exists())->toBeTrue();
});

it('never double books a doctor', function () {
    // Makati has two doctors, so the same slot can be booked twice, not three times.
    $this->post('/book', booking())->assertRedirect();
    $this->post('/book', booking(['first_name' => 'Bea']))->assertRedirect();
    $this->post('/book', booking(['first_name' => 'Cai']))->assertSessionHasErrors('time');

    expect(Appointment::count())->toBe(2)
        ->and(Appointment::pluck('specialist_id')->unique())->toHaveCount(2);
});

it('requires privacy consent', function () {
    $this->post('/book', booking(['privacy_consent' => null]))->assertSessionHasErrors('privacy_consent');
    expect(Appointment::count())->toBe(0);
});
