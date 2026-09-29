<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClinicSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The settings the clinic owns: where it is on social media, and whether the
 * chat is on. These are the clinic's to change, so they are edited in the
 * office rather than in a config file a deployment would overwrite.
 */
class ClinicSettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/settings/index', [
            'socials' => collect(ClinicSetting::SOCIALS)
                ->map(fn (string $base, string $platform) => [
                    'platform' => $platform,
                    'label' => ucfirst($platform),
                    'base' => $base,
                    'handle' => ClinicSetting::get('social.'.$platform),
                ])
                ->values()
                ->all(),
            'chat_enabled' => ClinicSetting::flag('chat.enabled'),
            'chat_greeting' => ClinicSetting::get('chat.greeting', 'Hello. How can we help?'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'socials' => ['nullable', 'array'],
            'socials.*' => ['nullable', 'string', 'max:200'],
            'chat_enabled' => ['nullable', 'boolean'],
            'chat_greeting' => ['nullable', 'string', 'max:200'],
        ], [
            'socials.*.max' => 'That link is too long to be a profile URL.',
        ]);

        foreach (ClinicSetting::SOCIALS as $platform => $base) {
            ClinicSetting::put(
                'social.'.$platform,
                ClinicSetting::normaliseHandle($data['socials'][$platform] ?? null),
            );
        }

        ClinicSetting::put('chat.enabled', ($data['chat_enabled'] ?? false) ? '1' : null);
        ClinicSetting::put('chat.greeting', $data['chat_greeting'] ?? null);

        return back()->with('success', 'Clinic settings saved. The website picks them up on its next load.');
    }
}
