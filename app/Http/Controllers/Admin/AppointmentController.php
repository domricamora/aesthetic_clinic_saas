<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Booking\BookAppointment;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\CrmActivity;
use App\Models\Lead;
use App\Models\Specialist;
use App\Models\Treatment;
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

    /** Staff booking: a phone or walk-in client, an existing lead (?lead=), or moving a visit (?reschedule=). */
    public function create(Request $request): Response
    {
        $lead = $request->integer('lead') ? Lead::whereKey($request->integer('lead'))->firstOrFail() : null;
        $moving = $request->integer('reschedule') ? Appointment::whereKey($request->integer('reschedule'))->with('lead')->firstOrFail() : null;
        $lead ??= $moving?->lead;

        return Inertia::render('admin/appointments/create', [
            'treatments' => Treatment::where('is_active', true)->orderBy('sort')->get(['id', 'name', 'duration_minutes']),
            'branches' => Branch::where('is_active', true)->orderBy('id')->get(['id', 'name']),
            'specialists' => Specialist::where('is_active', true)->orderBy('sort')->with('branches:id')->get(['id', 'name', 'title'])
                ->map(fn (Specialist $s) => $s->only(['id', 'name', 'title']) + ['branch_ids' => $s->branches->pluck('id')]),
            'lead' => $lead ? ['id' => $lead->id, 'name' => $lead->fullName(), 'phone' => $lead->phone] : null,
            'moving' => $moving ? [
                'id' => $moving->id,
                'reference' => $moving->reference,
                'treatment_id' => $moving->treatment_id,
                'branch_id' => $moving->branch_id,
                'specialist_id' => $moving->specialist_id,
                'starts_at' => $moving->starts_at->toIso8601String(),
            ] : null,
            'sources' => Lead::SOURCES,
        ]);
    }

    public function store(Request $request, BookAppointment $book): RedirectResponse
    {
        $newClient = ! $request->filled('lead_id') && ! $request->filled('reschedule_id');
        $data = $request->validate([
            'treatment_id' => ['required', 'integer'],
            'branch_id' => ['required', 'integer'],
            'specialist_id' => ['nullable', 'integer'],
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'time' => ['required', 'date_format:H:i'],
            'status' => ['required', Rule::in(['pending', 'confirmed'])],
            'notes' => ['nullable', 'string', 'max:1000'],
            'lead_id' => ['nullable', 'integer'],
            'reschedule_id' => ['nullable', 'integer'],
            'first_name' => [Rule::requiredIf($newClient), 'nullable', 'string', 'max:80'],
            'last_name' => ['nullable', 'string', 'max:80'],
            'phone' => [Rule::requiredIf($newClient), 'nullable', 'string', 'max:30', 'regex:/^[0-9+()\s-]{7,}$/'],
            'email' => ['nullable', 'email', 'max:160'],
            'source' => ['nullable', Rule::in(array_keys(Lead::SOURCES))],
            'privacy_consent' => ['boolean'],
        ], ['phone.regex' => 'Enter a mobile number, for example 0917 123 4567.']);

        abort_if(! empty($data['reschedule_id']) && ! $request->user()->can('appointments.edit'), 403);

        $appointment = $book(array_filter($data, fn ($v) => $v !== null) + ['user_id' => $request->user()->id]);

        return redirect()->to(route('admin.appointments.index', ['date' => $appointment->starts_at->toDateString()]))
            ->with('success', empty($data['reschedule_id']) ? 'Appointment booked.' : 'Appointment moved.');
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
