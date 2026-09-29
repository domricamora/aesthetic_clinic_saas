<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Dashboard\ClinicAnalytics;
use App\Actions\Setup\LoadClinicData;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Lead;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Front desk view: today's agenda first, the leads waiting for a reply, and
 * the graphs underneath.
 *
 * The window is read from the query string so a clinic can look at a bad month
 * rather than only the one being lived in. Clamped at the top because a
 * dashboard is not a report generator, and a year of daily rows is a slow
 * page for a faster query.
 */
class DashboardController extends Controller
{
    private const WINDOWS = [7, 30, 90, 180];

    private int $days = 30;

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $canAppointments = $user->can('appointments.view');
        $canLeads = $user->can('leads.view');
        $today = fn () => Appointment::whereBetween('starts_at', [now()->startOfDay(), now()->endOfDay()]);

        $this->days = in_array((int) $request->integer('days', 30), self::WINDOWS, true)
            ? (int) $request->integer('days', 30)
            : 30;

        return Inertia::render('dashboard', [
            'today' => $canAppointments ? AppointmentController::rows($today()) : null,
            'content' => $user->can('content.view') ? LoadClinicData::counts() : null,
            'stats' => [
                'today' => $canAppointments ? $today()->whereNotIn('status', ['cancelled', 'rescheduled'])->count() : null,
                'to_confirm' => $canAppointments ? Appointment::where('status', 'pending')->where('starts_at', '>=', now())->count() : null,
                'new_leads' => $canLeads ? Lead::where('stage', 'new')->count() : null,
                'leads_week' => $canLeads ? Lead::where('created_at', '>=', now()->subDays(7))->count() : null,
            ],
            // Money and margin are not on a screen for a Doctor, and the
            // counter's takings are not on a receptionist's. Each part of the
            // analytics block is gated on its own permission so a user with
            // leads but not accounting still gets their charts.
            'analytics' => $this->analytics($user->can('accounting.view'), $user->can('pos.view')),
            'leads' => $canLeads ? Lead::latest()->limit(6)->with('treatment:id,name')->get()->map(LeadController::row(...)) : null,
            'statuses' => Appointment::STATUSES,
            'stages' => Lead::STAGES,
        ]);
    }

    /**
     * The charts, trimmed to what this user is allowed to see.
     *
     * The whole set is computed once and then blanked per part, rather than
     * running the queries only for the parts that are visible. The cost of
     * thirty days of grouped rows is small, the cost of running the same
     * aggregation five times because each key was asked for separately is not.
     */
    private function analytics(bool $money, bool $pos): array
    {
        $figures = (new ClinicAnalytics($this->days))->toArray();

        return [
            'window' => $figures['window'],
            'daily' => $figures['daily'],
            'bookings' => $figures['bookings'],
            'front_desk' => $figures['front_desk'],
            'money' => $money ? $figures['money'] : null,
            'top_treatments' => $pos ? $figures['top_treatments'] : null,
            'payment_mix' => $pos ? $figures['payment_mix'] : null,
        ];
    }
}
