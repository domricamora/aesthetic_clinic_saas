<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\CrmActivity;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** Day agenda for the front desk and status changes (plan.md 72). */
class AppointmentController extends Controller
{
    /**
     * @param  Builder<Appointment>  $query
     * @return array<int, array<string, mixed>>
     */
    public static function rows(Builder $query): array
    {
        return $query
            ->with(['lead:id,first_name,last_name,phone', 'treatment:id,name', 'specialist:id,name', 'branch:id,name'])
            ->orderBy('starts_at')
            ->get()
            ->map(fn (Appointment $a) => [
                'id' => $a->id,
                'reference' => $a->reference,
                'starts_at' => $a->starts_at->toIso8601String(),
                'ends_at' => $a->ends_at->toIso8601String(),
                'status' => $a->status,
                'notes' => $a->notes,
                'lead_id' => $a->lead_id,
                'client' => $a->lead?->fullName() ?? 'Walk-in',
                'phone' => $a->lead?->phone,
                'treatment' => $a->treatment->name,
                'specialist' => $a->specialist->name,
                'branch' => $a->branch->name,
            ])
            ->values()
            ->all();
    }

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
            'branch' => ['nullable', 'integer'],
        ]);

        $day = CarbonImmutable::parse($filters['date'] ?? now()->toDateString());

        return Inertia::render('admin/appointments/index', [
            'date' => $day->toDateString(),
            'branch' => isset($filters['branch']) ? (int) $filters['branch'] : null,
            'branches' => Branch::orderBy('id')->get(['id', 'name']),
            'appointments' => self::rows(Appointment::query()
                ->whereBetween('starts_at', [$day->startOfDay(), $day->endOfDay()])
                ->when($filters['branch'] ?? null, fn (Builder $q, $branch) => $q->where('branch_id', $branch))),
            'statuses' => Appointment::STATUSES,
        ]);
    }

    public function update(Request $request, Appointment $appointment): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(array_keys(Appointment::STATUSES))]]);

        if ($appointment->status !== $data['status']) {
            $appointment->update($data);

            if ($appointment->lead_id) {
                CrmActivity::create([
                    'lead_id' => $appointment->lead_id,
                    'user_id' => $request->user()->id,
                    'type' => 'appointment',
                    'description' => sprintf('Appointment %s marked %s', $appointment->reference, Appointment::STATUSES[$data['status']]),
                ]);
            }
        }

        return back()->with('success', 'Appointment updated.');
    }
}
