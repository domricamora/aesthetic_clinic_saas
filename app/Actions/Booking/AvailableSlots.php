<?php

namespace App\Actions\Booking;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Specialist;
use App\Models\Treatment;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Start times a treatment can be booked at a branch on a day. A slot is open
 * when at least one eligible specialist has no overlapping appointment.
 */
class AvailableSlots
{
    public const STEP_MINUTES = 30;

    /** @return list<string> "HH:MM" start times */
    public function __invoke(Branch $branch, Treatment $treatment, CarbonImmutable $date, ?Specialist $specialist = null): array
    {
        $hours = self::hours($branch, $date);
        if ($hours === null) {
            return [];
        }

        $specialists = $this->specialists($branch, $specialist);
        $booked = $this->booked($specialists, $date)->get()->groupBy('specialist_id');

        $now = CarbonImmutable::now();
        $close = $date->setTimeFromTimeString($hours[1]);
        $slots = [];
        for ($start = $date->setTimeFromTimeString($hours[0]); $start->addMinutes($treatment->duration_minutes) <= $close; $start = $start->addMinutes(self::STEP_MINUTES)) {
            $end = $start->addMinutes($treatment->duration_minutes);
            if ($start > $now && $this->freeSpecialist($specialists, $booked, $start, $end) !== null) {
                $slots[] = $start->format('H:i');
            }
        }

        return $slots;
    }

    /**
     * Opening window for a day, or null when closed.
     * ponytail: fixed hours per weekday; move to a branch_hours table when branches differ more.
     *
     * @return array{0: string, 1: string}|null
     */
    public static function hours(Branch $branch, CarbonImmutable $date): ?array
    {
        return match (true) {
            $date->isSunday() => null,
            $date->isSaturday() => ['10:00', $branch->slug === 'cebu' ? '19:00' : '18:00'],
            default => ['10:00', $branch->slug === 'cebu' ? '19:00' : '20:00'],
        };
    }

    /** @return Collection<int, int> */
    public function specialists(Branch $branch, ?Specialist $specialist): Collection
    {
        return $specialist
            ? collect([$specialist->id])
            : $branch->specialists()->where('is_active', true)->orderBy('sort')->pluck('specialists.id');
    }

    /**
     * Active appointments of these specialists on the day.
     *
     * @param  Collection<int, int>  $specialists
     * @return Builder<Appointment>
     */
    public function booked(Collection $specialists, CarbonImmutable $date)
    {
        return Appointment::query()
            ->select(['specialist_id', 'starts_at', 'ends_at'])
            ->whereIn('specialist_id', $specialists)
            ->whereDate('starts_at', $date->toDateString())
            ->whereNotIn('status', ['cancelled', 'rescheduled']);
    }

    /**
     * @param  Collection<int, int>  $specialists
     * @param  Collection<array-key, Collection<int, Appointment>>  $booked
     */
    public function freeSpecialist(Collection $specialists, Collection $booked, CarbonImmutable $start, CarbonImmutable $end): ?int
    {
        return $specialists->first(fn (int $id) => ($booked[$id] ?? collect())
            ->doesntContain(fn (Appointment $a) => $a->starts_at < $end && $a->ends_at > $start));
    }
}
