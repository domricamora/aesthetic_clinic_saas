<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\CrmActivity;
use App\Models\Lead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/** Contact, enquiry and newsletter forms: each creates a CRM lead (plan.md 55). */
class LeadController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'form' => ['required', 'in:contact,enquiry,newsletter,promotion'],
            'first_name' => ['required_unless:form,newsletter', 'nullable', 'string', 'max:80'],
            'email' => ['required_if:form,newsletter', 'nullable', 'email', 'max:160'],
            'phone' => ['nullable', 'string', 'max:30'],
            'treatment_id' => ['nullable', 'integer', 'exists:treatments,id'],
            'message' => ['nullable', 'string', 'max:2000'],
            'privacy_consent' => ['accepted'],
        ], ['privacy_consent.accepted' => 'Please agree to the privacy notice before sending.']);

        $lead = Lead::create([
            'first_name' => $data['first_name'] ?? 'Subscriber',
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'treatment_id' => $data['treatment_id'] ?? null,
            'message' => $data['message'] ?? null,
            'form' => $data['form'],
            'source' => 'website',
            'stage' => 'new',
            'privacy_consent_at' => now(),
            'marketing_consent' => $data['form'] === 'newsletter',
        ] + $request->session()->get('attribution', []));

        CrmActivity::create(['lead_id' => $lead->id, 'type' => $data['form'], 'description' => 'Website '.$data['form'].' form submitted']);

        return back()->with('success', $data['form'] === 'newsletter'
            ? 'You are on the list. Watch your inbox for our next update.'
            : 'Thank you. Our team will reply within one business day.');
    }
}
