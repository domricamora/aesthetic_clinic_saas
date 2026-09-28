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
 * One transaction books a visit and logs it on the lead (plan.md 72). The
 * website creates a new lead; staff may book an existing lead, set the
 * status, or move an appointment (the old one is marked rescheduled and
 * gives its slot back). Double booking is blocked by locking the day of the
 * candidate specialists and by the unique index on specialist + live start.
 */
class BookAppointment
{
    public function __construct(private AvailableSlots $slots) {}

    /**
     * @param  array<string, mixed>  $data  validated input; optional lead_id, status, reschedule_id, user_id, source
     */
    public function __invoke(array $data): Appointment
    {
        $branch = Branch::whereKey($data['branch_id'])->firstOrFail();
        $treatment = Treatment::whereKey($data['treatment_id'])->firstOrFail();
        $specialist = empty($data['specialist_id']) ? null : Specialist::whereKey($data['specialist_id'])->firstOrFail();
        $start = CarbonImmutable::parse($data['date'].' '.$data['time']);
        $end = $start->addMinutes($treatment->duration_minutes);

        $taken = ValidationException::withMessages(['time' => 'That time was just taken. Please choose another slot.']);

        try {
            return DB::transaction(function () use ($data, $branch, $treatment, $specialist, $start, $end, $taken) {
                $previous = empty($data['reschedule_id']) ? null : Appointment::whereKey($data['reschedule_id'])->lockForUpdate()->firstOrFail();
                // Free the old slot first so a visit can move to an overlapping time.
                $previous?->update(['status' => 'rescheduled']);

                if (! in_array($start->format('H:i'), ($this->slots)($branch, $treatment, $start->startOfDay(), $specialist), true)) {
                    throw $taken;
                }

                $candidates = $this->slots->specialists($branch, $specialist);
                $booked = $this->slots->booked($candidates, $start)->lockForUpdate()->get()->groupBy('specialist_id');
                $specialistId = $this->slots->freeSpecialist($candidates, $booked, $start, $end) ?? throw $taken;

                $lead = $this->lead($data, $branch, $treatment, $previous);

                $appointment = Appointment::create([
                    'reference' => 'PT-'.Str::upper(Str::random(6)),
                    'lead_id' => $lead->id,
                    'branch_id' => $branch->id,
                    'treatment_id' => $treatment->id,
                    'specialist_id' => $specialistId,
                    'starts_at' => $start,
                    'ends_at' => $end,
                    'status' => $data['status'] ?? 'pending',
                    'notes' => $data['notes'] ?? $previous?->notes,
                ]);

                CrmActivity::create([
                    'lead_id' => $lead->id,
                    'user_id' => $data['user_id'] ?? null,
                    'type' => 'booking',
                    'description' => $previous
                        ? sprintf('Moved %s to %s (%s)', $previous->reference, $start->format('D j M, g:i A'), $appointment->reference)
                        : sprintf('Booked %s at %s for %s (%s)', $treatment->name, $branch->name, $start->format('D j M, g:i A'), $appointment->reference),
                ]);

                return $appointment;
            });
        } catch (UniqueConstraintViolationException) {
            throw $taken;
        }
    }

    /** @param array<string, mixed> $data */
    private function lead(array $data, Branch $branch, Treatment $treatment, ?Appointment $previous): Lead
    {
        $leadId = $data['lead_id'] ?? $previous?->lead_id;

        if ($leadId) {
            $lead = Lead::whereKey($leadId)->firstOrFail();
            if (in_array($lead->stage, ['new', 'contacted'], true)) {
                $lead->update(['stage' => 'consultation_booked']);
            }

            return $lead;
        }

        return Lead::create([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'],
            'source' => $data['source'] ?? 'website',
            'stage' => 'consultation_booked',
            'form' => isset($data['user_id']) ? 'admin' : 'booking',
            'treatment_id' => $treatment->id,
            'branch_id' => $branch->id,
            'message' => $data['notes'] ?? null,
            'privacy_consent_at' => empty($data['privacy_consent']) ? null : now(),
            'marketing_consent' => (bool) ($data['marketing_consent'] ?? false),
        ] + ($data['tracking'] ?? []));
    }
}
