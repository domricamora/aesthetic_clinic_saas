<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Media\UploadPhoto;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\Organization;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** Who works here, when they were in, and their time off (plan.md §28). */
class HrController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:60'],
            'department' => ['nullable', 'string', 'max:60'],
            'branch' => ['nullable', 'integer'],
            'status' => ['nullable', Rule::in(array_keys(Employee::STATUSES))],
            'kind' => ['nullable', Rule::in(['all', 'doctors', 'admin'])],
        ]);

        $employees = Employee::with('branch:id,name')
            ->when($filters['q'] ?? null, fn (Builder $q, $term) => $q->where('name', 'like', "%{$term}%"))
            ->when($filters['department'] ?? null, fn (Builder $q, $d) => $q->where('department', $d))
            ->when($filters['branch'] ?? null, fn (Builder $q, $b) => $q->where('branch_id', $b))
            ->when($filters['status'] ?? null, fn (Builder $q, $s) => $q->where('status', $s))
            ->when(($filters['kind'] ?? 'all') === 'doctors', fn (Builder $q) => $q->where('practitioner', true))
            ->when(($filters['kind'] ?? 'all') === 'admin', fn (Builder $q) => $q->where('practitioner', false))
            ->orderByDesc('practitioner')
            ->orderBy('name')
            ->get()
            ->map(fn (Employee $e) => [
                'id' => $e->id,
                'name' => $e->name,
                'employee_no' => $e->employee_no,
                'position' => $e->position,
                'department' => $e->department,
                'branch' => $e->branch?->name,
                'employment_type' => $e->employment_type,
                'status' => $e->status,
                'practitioner' => (bool) $e->practitioner,
                'credentials' => $e->credentials,
                'base_salary' => $e->base_salary,
                'hire_date' => $e->hire_date->toDateString(),
            ]);

        return Inertia::render('admin/hr/index', [
            'employees' => $employees->values(),
            'branches' => Branch::where('is_active', true)->orderBy('id')->get(['id', 'name']),
            'departments' => Employee::orderBy('department')->distinct()->pluck('department')->values(),
            'query' => $filters['q'] ?? '',
            'department' => $filters['department'] ?? '',
            'branch' => isset($filters['branch']) ? (int) $filters['branch'] : null,
            'status' => $filters['status'] ?? null,
            'kind' => $filters['kind'] ?? 'all',
            'types' => Employee::TYPES,
            'statuses' => Employee::STATUSES,
            'headcount' => Employee::active()->count(),
            'doctors' => Employee::active()->where('practitioner', true)->count(),
            'payroll' => round((float) Employee::active()->sum('base_salary'), 2),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateStaff($request);

        Employee::create($data + ['status' => 'active']);

        return back()->with('success', $data['name'].' added to the staff roll.');
    }

    /**
     * Edits a staff record. Pay and the clinical details live on the same row,
     * so a correction is one form rather than two places that can disagree.
     */
    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $data = $this->validateStaff($request, $employee);

        $employee->update($data);

        return back()->with('success', $employee->name.' updated.');
    }

    /**
     * Leaving and coming back are both a thing that happens, and a payroll run
     * still has to be able to explain a year of history either way, so nobody
     * is deleted: they are stood down and stood back up.
     */
    public function resign(Request $request, Employee $employee): RedirectResponse
    {
        $data = $request->validate([
            'resigned_on' => ['nullable', 'date', 'after_or_equal:'.now()->subYears(10)->toDateString()],
        ]);

        $employee->update([
            'status' => 'resigned',
            'resigned_on' => $data['resigned_on'] ?? now()->toDateString(),
        ]);

        return back()->with('success', $employee->name.' stood down. Their history is kept.');
    }

    public function reinstate(Employee $employee): RedirectResponse
    {
        $employee->update(['status' => 'active', 'resigned_on' => null]);

        return back()->with('success', $employee->name.' is back on the roll.');
    }

    /**
     * A face on the record. Kept separate from the edit form so a large upload
     * does not have to travel with a dozen small fields.
     */
    public function photo(Request $request, Employee $employee, UploadPhoto $upload): JsonResponse
    {
        $data = $request->validate([
            'photo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:'.UploadPhoto::uploadLimitKilobytes()],
        ], [
            'photo.max' => 'Keep the photo under '.(round(UploadPhoto::uploadLimitKilobytes() / 1024).'MB').'.',
            'photo.required' => 'That photo was too large for this server to receive.',
            'photo.mimes' => 'A photo has to be a JPG, PNG or WebP.',
        ]);

        $path = $upload($data['photo'], $employee->name, $employee->photoPath());
        $employee->update(['photo' => $path]);

        return response()->json(['path' => $path, 'url' => asset(ltrim($path, '/'))]);
    }

    public function removePhoto(Employee $employee, UploadPhoto $upload): JsonResponse
    {
        $upload->discard($employee->photoPath());
        $employee->update(['photo' => null]);

        return response()->json(['path' => null, 'url' => null]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateStaff(Request $request, ?Employee $employee = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'employee_no' => [
                'required', 'string', 'max:20',
                Rule::unique('employees', 'employee_no')
                    ->where(fn ($q) => $q->where('organization_id', $employee?->organization_id ?? Organization::current()?->id))
                    ->ignore($employee?->id),
            ],
            'position' => ['required', 'string', 'max:80'],
            'department' => ['required', 'string', 'max:60'],
            'branch_id' => ['nullable', 'integer', Rule::exists('branches', 'id')],
            'hire_date' => ['required', 'date', 'before_or_equal:today'],
            'employment_type' => ['required', Rule::in(array_keys(Employee::TYPES))],
            'pay_schedule' => ['required', Rule::in(array_keys(Employee::SCHEDULES))],
            'base_salary' => ['required', 'numeric', 'min:0'],
            'monthly_allowance' => ['nullable', 'numeric', 'min:0'],
            'practitioner' => ['nullable', 'boolean'],
            'credentials' => ['nullable', 'string', 'max:120'],
            'focus' => ['nullable', 'string', 'max:160'],
            'phone' => ['nullable', 'string', 'max:30'],
            'show_on_site' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        // A clinician's credentials and focus only mean anything for a clinician.
        $isClinician = (bool) ($data['practitioner'] ?? false);
        $data['practitioner'] = $isClinician;
        $data['credentials'] = $isClinician ? ($data['credentials'] ?? null) : null;
        $data['focus'] = $isClinician ? ($data['focus'] ?? null) : null;

        return $data;
    }

    /** One person: who they are, their hours, their leave and their payslips. */
    public function show(Employee $employee): Response
    {
        $year = (int) now()->year;

        return Inertia::render('admin/hr/employee', [
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'employee_no' => $employee->employee_no,
                'position' => $employee->position,
                'department' => $employee->department,
                'branch' => $employee->branch?->name,
                'phone' => $employee->phone,
                'hire_date' => $employee->hire_date->toDateString(),
                'employment_type' => $employee->employment_type,
                'pay_schedule' => $employee->pay_schedule,
                'base_salary' => $employee->base_salary,
                'monthly_allowance' => $employee->monthly_allowance,
                'status' => $employee->status,
                'notes' => $employee->notes,
                'practitioner' => (bool) $employee->practitioner,
                'credentials' => $employee->credentials,
                'show_on_site' => (bool) $employee->show_on_site,
                'photo' => $employee->photo,
                'focus' => $employee->focus,
                'branch_id' => $employee->branch_id,
                'photo' => $employee->photo,
                'show_on_site' => (bool) $employee->show_on_site,
                'daily_rate' => $employee->dailyRate(),
                'hourly_rate' => $employee->hourlyRate(),
            ],
            'types' => Employee::TYPES,
            'statuses' => Employee::STATUSES,
            'schedules' => Employee::SCHEDULES,
            'attendance' => $employee->attendances()->orderByDesc('work_date')->limit(30)->get()
                ->map(fn (Attendance $a) => [
                    'work_date' => $a->work_date->toDateString(),
                    'time_in' => $a->time_in,
                    'time_out' => $a->time_out,
                    'hours' => $a->hours(),
                    'overtime_minutes' => $a->overtime_minutes,
                    'complete' => $a->isComplete(),
                ]),
            'month_hours' => round((float) $employee->attendances()
                ->whereYear('work_date', $year)->whereMonth('work_date', (int) now()->month)
                ->sum('minutes') / 60, 1),
            'month_overtime_hours' => round((float) $employee->attendances()
                ->whereYear('work_date', $year)->whereMonth('work_date', (int) now()->month)
                ->sum('overtime_minutes') / 60, 1),
            'leaves' => $employee->leaves()->orderByDesc('from_date')->limit(20)->get()
                ->map(fn (LeaveRequest $l) => [
                    'id' => $l->id,
                    'type' => $l->type,
                    'from_date' => $l->from_date->toDateString(),
                    'to_date' => $l->to_date->toDateString(),
                    'days' => $l->days,
                    'reason' => $l->reason,
                    'status' => $l->status,
                ]),
            'leave_days_taken' => round((float) $employee->leaves()
                ->approved()->whereIn('type', ['annual', 'sick'])->whereYear('from_date', $year)->sum('days'), 2),
            'payslips' => $employee->payslips()->with('run:id,label,period_start,period_end,status')
                ->orderByDesc('id')->limit(12)->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'label' => $p->run?->label,
                    'period' => $p->run?->period_start?->format('M Y'),
                    'gross' => $p->gross,
                    'net' => $p->net,
                    'status' => $p->run?->status,
                ]),
        ]);
    }

    /** Today's clock, and the button that stamps it (plan.md §28 timekeeping). */
    public function attendance(Request $request, ?string $date = null): Response
    {
        $day = CarbonImmutable::parse($date ?? now()->toDateString());
        $mine = Employee::where('user_id', $request->user()->id)->first();

        return Inertia::render('admin/hr/attendance', [
            'date' => $day->toDateString(),
            'me' => $mine ? ['id' => $mine->id, 'name' => $mine->name] : null,
            'today' => $mine
                ? Attendance::where('employee_id', $mine->id)->whereDate('work_date', $day)->first()?->only(['time_in', 'time_out', 'minutes', 'overtime_minutes'])
                : null,
            'rows' => Attendance::with('employee:id,name,position')
                ->whereDate('work_date', $day)
                ->join('employees', 'employees.id', '=', 'attendances.employee_id')
                ->orderBy('employees.name')
                ->get(['attendances.id', 'attendances.time_in', 'attendances.time_out', 'attendances.minutes', 'attendances.overtime_minutes', 'attendances.employee_id', 'employees.name', 'employees.position'])
                ->map(fn (Attendance $a) => [
                    'name' => $a->employee->name,
                    'position' => $a->employee->position,
                    'time_in' => $a->time_in,
                    'time_out' => $a->time_out,
                    'hours' => $a->hours(),
                    'overtime_minutes' => $a->overtime_minutes,
                    'complete' => $a->isComplete(),
                ]),
            'open_shifts' => Attendance::whereDate('work_date', $day)->whereNull('time_out')->count(),
        ]);
    }

    /** Clock in, or clock out of the day that is already open. */
    public function clock(Request $request): RedirectResponse
    {
        $data = $request->validate(['date' => ['nullable', 'date_format:Y-m-d']]);
        $day = $data['date'] ?? now()->toDateString();
        $employee = Employee::where('user_id', $request->user()->id)->firstOrFail();
        $now = now()->format('H:i');

        $attendance = Attendance::firstOrNew([
            'employee_id' => $employee->id,
            'work_date' => $day,
        ]);

        $attendance->fill([
            'time_in' => $attendance->time_in ?? $now,
            'time_out' => $attendance->time_in ? $now : null,
        ]);

        $attendance->minutes = $attendance->time_in && $attendance->time_out
            ? (int) max(0, (strtotime($attendance->time_out) - strtotime($attendance->time_in)) / 60)
            : 0;
        $attendance->overtime_minutes = (int) max(0, $attendance->minutes - 480);
        $attendance->save();

        return back()->with('success', $attendance->time_out && $attendance->time_in
            ? 'Clocked out at '.$attendance->time_out.'.'
            : 'Clocked in at '.$attendance->time_in.'.');
    }

    public function leave(Request $request): Response
    {
        return Inertia::render('admin/hr/leave', [
            'requests' => LeaveRequest::with(['employee:id,name,position', 'reviewer:id,name'])
                ->orderByRaw("case when status = 'pending' then 0 else 1 end")
                ->orderByDesc('from_date')
                ->limit(60)
                ->get()
                ->map(fn (LeaveRequest $l) => [
                    'id' => $l->id,
                    'employee' => $l->employee->name,
                    'position' => $l->employee->position,
                    'type' => $l->type,
                    'from_date' => $l->from_date->toDateString(),
                    'to_date' => $l->to_date->toDateString(),
                    'days' => $l->days,
                    'reason' => $l->reason,
                    'status' => $l->status,
                    'reviewer' => $l->reviewer?->name,
                ]),
            'employees' => Employee::active()->orderBy('name')->get(['id', 'name'])->map(fn ($e) => $e->only(['id', 'name'])),
            'types' => LeaveRequest::TYPES,
            'statuses' => LeaveRequest::STATUSES,
            'pending' => LeaveRequest::pending()->count(),
        ]);
    }

    public function requestLeave(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'integer', Rule::exists('employees', 'id')],
            'type' => ['required', Rule::in(array_keys(LeaveRequest::TYPES))],
            'from_date' => ['required', 'date'],
            'to_date' => ['required', 'date', 'after_or_equal:from_date'],
            'days' => ['required', 'numeric', 'min:0.5', 'max:60'],
            'reason' => ['nullable', 'string', 'max:200'],
        ]);

        LeaveRequest::create($data + ['status' => 'pending']);

        return back()->with('success', 'Leave request filed.');
    }

    public function reviewLeave(Request $request, LeaveRequest $leave): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['approved', 'declined'])],
            'review_note' => ['nullable', 'string', 'max:200'],
        ]);

        $leave->update([
            'status' => $data['status'],
            'review_note' => $data['review_note'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Leave '.($data['status'] === 'approved' ? 'approved' : 'declined').'.');
    }
}
