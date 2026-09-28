<?php

namespace App\Actions\Booking;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\CrmActivity;
use App\Models\Lead;
use App\Models\Specialist;
use App\Models\Treatment;
use Carbon\CarbonImmutable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Website booking: one transaction creates the lead, the appointment and the
 * CRM activity (plan.md 72). Double booking is blocked by locking the day of
 * the candidate specialists and by the unique index on specialist + start.
 */
class BookAppointment
{
    public function __construct(private AvailableSlots $slots) {}

    /** @param array<string, mixed> $data validated input */
    public function __invoke(array $data): Appointment
    {
        $branch = Branch::findOrFail($data['branch_id']);
        $treatment = Treatment::findOrFail($data['treatment_id']);
        $specialist = empty($data['specialist_id']) ? null : Specialist::findOrFail($data['specialist_id']);
        $start = CarbonImmutable::parse($data['date'].' '.$data['time']);
        $end = $start->addMinutes($treatment->duration_minutes);

        $taken = ValidationException::withMessages(['time' => 'That time was just taken. Please choose another slot.']);

        if (! in_array($data['time'], ($this->slots)($branch, $treatment, $start->startOfDay(), $specialist), true)) {
            throw $taken;
        }

        try {
            return DB::transaction(function () use ($data, $branch, $treatment, $specialist, $start, $end, $taken) {
                $candidates = $this->slots->specialists($branch, $specialist);
                $booked = $this->slots->booked($candidates, $start)->lockForUpdate()->get()->groupBy('specialist_id');
                $specialistId = $this->slots->freeSpecialist($candidates, $booked, $start, $end) ?? throw $taken;

                $lead = Lead::create([
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'] ?? null,
                    'email' => $data['email'] ?? null,
                    'phone' => $data['phone'],
                    'source' => 'website',
                    'stage' => 'consultation_booked',
                    'form' => 'booking',
                    'treatment_id' => $treatment->id,
                    'branch_id' => $branch->id,
                    'message' => $data['notes'] ?? null,
                    'privacy_consent_at' => now(),
                    'marketing_consent' => (bool) ($data['marketing_consent'] ?? false),
                ] + ($data['tracking'] ?? []));

                $appointment = Appointment::create([
                    'reference' => 'PT-'.Str::upper(Str::random(6)),
                    'lead_id' => $lead->id,
                    'branch_id' => $branch->id,
                    'treatment_id' => $treatment->id,
                    'specialist_id' => $specialistId,
                    'starts_at' => $start,
                    'ends_at' => $end,
                    'status' => 'pending',
                    'notes' => $data['notes'] ?? null,
                ]);

                CrmActivity::create([
                    'lead_id' => $lead->id,
                    'type' => 'booking',
                    'description' => sprintf('Booked %s at %s for %s (%s)', $treatment->name, $branch->name, $start->format('D j M, g:i A'), $appointment->reference),
                ]);

                return $appointment;
            });
        } catch (UniqueConstraintViolationException) {
            throw $taken;
        }
    }
}
