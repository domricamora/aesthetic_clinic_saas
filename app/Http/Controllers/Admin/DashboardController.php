<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Setup\LoadClinicData;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Lead;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Front desk view: today's agenda first, then the leads waiting for a reply. */
class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $canAppointments = $user->can('appointments.view');
        $canLeads = $user->can('leads.view');
        $today = fn () => Appointment::whereBetween('starts_at', [now()->startOfDay(), now()->endOfDay()]);

        return Inertia::render('dashboard', [
            'today' => $canAppointments ? AppointmentController::rows($today()) : null,
            'content' => $user->can('content.view') ? LoadClinicData::counts() : null,
            'stats' => [
                'today' => $canAppointments ? $today()->whereNotIn('status', ['cancelled', 'rescheduled'])->count() : null,
                'to_confirm' => $canAppointments ? Appointment::where('status', 'pending')->where('starts_at', '>=', now())->count() : null,
                'new_leads' => $canLeads ? Lead::where('stage', 'new')->count() : null,
                'leads_week' => $canLeads ? Lead::where('created_at', '>=', now()->subDays(7))->count() : null,
            ],
            'leads' => $canLeads ? Lead::latest()->limit(6)->with('treatment:id,name')->get()->map(LeadController::row(...)) : null,
            'statuses' => Appointment::STATUSES,
            'stages' => Lead::STAGES,
        ]);
    }
}
