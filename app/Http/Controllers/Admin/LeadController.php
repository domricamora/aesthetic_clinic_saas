<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\CrmActivity;
use App\Models\Lead;
use App\Models\Organization;
use App\Models\Treatment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** CRM leads: list by pipeline stage, open a profile, move the stage, log notes. */
class LeadController extends Controller
{
    /** @return array<string, mixed> */
    public static function row(Lead $lead): array
    {
        return [
            'id' => $lead->id,
            'name' => $lead->fullName(),
            'email' => $lead->email,
            'phone' => $lead->phone,
            'stage' => $lead->stage,
            'source' => $lead->source,
            'form' => $lead->form,
            'campaign' => $lead->utm_campaign,
            'treatment' => $lead->treatment?->name,
            'created_at' => $lead->created_at?->toIso8601String(),
        ];
    }

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'stage' => ['nullable', Rule::in(array_keys(Lead::STAGES))],
            'q' => ['nullable', 'string', 'max:80'],
        ]);

        $leads = Lead::query()
            ->with('treatment:id,name')
            ->when($filters['stage'] ?? null, fn (Builder $q, string $stage) => $q->where('stage', $stage))
            ->when($filters['q'] ?? null, fn (Builder $q, string $term) => $q->where(fn (Builder $q) => $q
                ->where('first_name', 'like', "%{$term}%")
                ->orWhere('last_name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%")))
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(self::row(...));

        return Inertia::render('admin/leads/index', [
            'leads' => $leads,
            'filters' => $filters,
            'stages' => Lead::STAGES,
            'counts' => Lead::query()->selectRaw('stage, count(*) as total')->groupBy('stage')->pluck('total', 'stage'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/leads/create', [
            'sources' => Lead::SOURCES,
            'treatments' => Treatment::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'branches' => Branch::where('is_active', true)->orderBy('id')->get(['id', 'name']),
        ]);
    }

    /** A phone call, walk-in or DM logged by staff. */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['nullable', 'string', 'max:80'],
            'phone' => ['required_without:email', 'nullable', 'string', 'max:30', 'regex:/^[0-9+()\s-]{7,}$/'],
            'email' => ['required_without:phone', 'nullable', 'email', 'max:160'],
            'source' => ['required', Rule::in(array_keys(Lead::SOURCES))],
            'treatment_id' => ['nullable', 'integer', Rule::exists('treatments', 'id')->where('organization_id', Organization::current()?->id)],
            'branch_id' => ['nullable', 'integer', Rule::exists('branches', 'id')->where('organization_id', Organization::current()?->id)],
            'message' => ['nullable', 'string', 'max:2000'],
            'privacy_consent' => ['boolean'],
            'marketing_consent' => ['boolean'],
        ], [
            'phone.required_without' => 'Add a phone number or an email so the team can reply.',
            'phone.regex' => 'Enter a mobile number, for example 0917 123 4567.',
        ]);

        $lead = Lead::create(Arr::except($data, ['privacy_consent']) + [
            'form' => 'admin',
            'stage' => 'new',
            'privacy_consent_at' => ($data['privacy_consent'] ?? false) ? now() : null,
            'marketing_consent' => $data['marketing_consent'] ?? false,
        ]);

        $this->log($request, $lead, 'created', 'Added by staff, via '.Lead::SOURCES[$data['source']]);

        return redirect()->to(route('admin.leads.show', $lead))->with('success', 'Lead added.');
    }

    /** Command palette lookup. */
    public function search(Request $request): JsonResponse
    {
        $term = trim($request->string('q')->limit(80, '')->toString());

        return response()->json($term === '' ? [] : Lead::query()
            ->where(fn (Builder $q) => $q
                ->where('first_name', 'like', "%{$term}%")
                ->orWhere('last_name', 'like', "%{$term}%")
                ->orWhereRaw("concat(first_name, ' ', coalesce(last_name, '')) like ?", ["%{$term}%"])
                ->orWhere('email', 'like', "%{$term}%")
                ->orWhere('phone', 'like', "%{$term}%"))
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Lead $l) => ['id' => $l->id, 'name' => $l->fullName(), 'phone' => $l->phone, 'stage' => Lead::STAGES[$l->stage] ?? $l->stage]));
    }

    public function show(Lead $lead): Response
    {
        $lead->load(['treatment:id,name', 'branch:id,name', 'activities.user:id,name']);

        return Inertia::render('admin/leads/show', [
            'lead' => self::row($lead) + [
                'message' => $lead->message,
                'branch' => $lead->branch?->name,
                'utm_source' => $lead->utm_source,
                'utm_medium' => $lead->utm_medium,
                'landing_page' => $lead->landing_page,
                'referrer' => $lead->referrer,
                'device' => $lead->device,
                'privacy_consent_at' => $lead->privacy_consent_at?->toIso8601String(),
                'marketing_consent' => $lead->marketing_consent,
            ],
            'activities' => $lead->activities->map(fn (CrmActivity $a) => [
                'id' => $a->id,
                'type' => $a->type,
                'description' => $a->description,
                'author' => $a->user?->name,
                'created_at' => $a->created_at?->toIso8601String(),
            ]),
            'appointments' => AppointmentController::rows(Appointment::where('lead_id', $lead->id)),
            'stages' => Lead::STAGES,
            'statuses' => Appointment::STATUSES,
        ]);
    }

    public function update(Request $request, Lead $lead): RedirectResponse
    {
        $data = $request->validate(['stage' => ['required', Rule::in(array_keys(Lead::STAGES))]]);

        if ($lead->stage !== $data['stage']) {
            $from = Lead::STAGES[$lead->stage] ?? $lead->stage;
            $lead->update($data);
            $this->log($request, $lead, 'stage', sprintf('Stage moved from %s to %s', $from, Lead::STAGES[$data['stage']]));
        }

        return back()->with('success', 'Stage updated.');
    }

    public function note(Request $request, Lead $lead): RedirectResponse
    {
        $data = $request->validate(['note' => ['required', 'string', 'max:2000']]);

        $this->log($request, $lead, 'note', $data['note']);

        return back()->with('success', 'Note added.');
    }

    private function log(Request $request, Lead $lead, string $type, string $description): void
    {
        CrmActivity::create(['lead_id' => $lead->id, 'user_id' => $request->user()->id, 'type' => $type, 'description' => $description]);
    }
}
