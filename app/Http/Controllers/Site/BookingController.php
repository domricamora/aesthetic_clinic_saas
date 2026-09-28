<?php

namespace App\Http\Controllers\Site;

use App\Actions\Booking\AvailableSlots;
use App\Actions\Booking\BookAppointment;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Specialist;
use App\Models\Treatment;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('book', [
            'treatments' => Treatment::where('is_active', true)->orderBy('sort')->with('category:id,name')
                ->get(['id', 'treatment_category_id', 'name', 'slug', 'duration_minutes', 'price', 'promo_price', 'image']),
            'branches' => Branch::where('is_active', true)->orderBy('id')->get(['id', 'name', 'slug', 'address', 'city']),
            'specialists' => Specialist::where('is_active', true)->orderBy('sort')->with('branches:id')->get(['id', 'name', 'title', 'photo'])
                ->map(fn (Specialist $s) => $s->only(['id', 'name', 'title', 'photo']) + ['branch_ids' => $s->branches->pluck('id')]),
            'initial' => $request->only(['treatment', 'branch', 'date', 'time']),
        ]);
    }

    public function slots(Request $request, AvailableSlots $slots): JsonResponse
    {
        $data = $request->validate([
            'treatment_id' => ['required', 'integer'],
            'branch_id' => ['required', 'integer'],
            'specialist_id' => ['nullable', 'integer'],
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today', 'before:+60 days'],
        ]);

        $branch = Branch::findOrFail($data['branch_id']);
        $date = CarbonImmutable::parse($data['date']);

        return response()->json([
            'date' => $data['date'],
            'open' => AvailableSlots::hours($branch, $date) !== null,
            'slots' => $slots(
                $branch,
                Treatment::findOrFail($data['treatment_id']),
                $date,
                empty($data['specialist_id']) ? null : Specialist::findOrFail($data['specialist_id']),
            ),
        ]);
    }

    public function store(Request $request, BookAppointment $book): RedirectResponse
    {
        $data = $request->validate([
            'treatment_id' => ['required', 'integer', 'exists:treatments,id'],
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'specialist_id' => ['nullable', 'integer', 'exists:specialists,id'],
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today', 'before:+60 days'],
            'time' => ['required', 'date_format:H:i'],
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['nullable', 'string', 'max:80'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^[0-9+()\s-]{7,}$/'],
            'email' => ['nullable', 'email', 'max:160'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'privacy_consent' => ['accepted'],
            'marketing_consent' => ['boolean'],
        ], [
            'privacy_consent.accepted' => 'Please agree to the privacy notice so we can hold your appointment.',
            'phone.regex' => 'Enter a mobile number we can text, for example 0917 123 4567.',
        ]);

        $appointment = $book($data + ['tracking' => $request->session()->get('attribution', [])]);

        return redirect()->to(URL::signedRoute('book.confirmed', $appointment->reference, now()->addDays(7)));
    }

    public function confirmed(string $reference): Response
    {
        $appointment = Appointment::where('reference', $reference)->with(['treatment:id,name,duration_minutes', 'branch:id,name,address,city,phone', 'specialist:id,name,title,photo', 'lead:id,first_name'])->firstOrFail();

        return Inertia::render('book-confirmed', [
            'appointment' => [
                'reference' => $appointment->reference,
                'starts_at' => $appointment->starts_at->toIso8601String(),
                'ends_at' => $appointment->ends_at->toIso8601String(),
                'status' => $appointment->status,
                'first_name' => $appointment->lead?->first_name,
                'treatment' => $appointment->treatment->only(['name', 'duration_minutes']),
                'branch' => $appointment->branch->only(['name', 'address', 'city', 'phone']),
                'specialist' => $appointment->specialist->only(['name', 'title', 'photo']),
            ],
        ]);
    }
}
