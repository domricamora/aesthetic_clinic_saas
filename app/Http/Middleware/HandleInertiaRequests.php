<?php

namespace App\Http\Middleware;

use App\Models\ClinicSetting;
use Illuminate\Foundation\Vite;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Middleware;
use Laravel\Pennant\Feature;
use Spatie\Permission\Models\Permission;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'clinic' => fn () => Arr::except(config('clinic'), ['organization', 'modules']),
            // The clinic's own handles, which the office edits. The config
            // values are the fallback for an installation that has never
            // saved any, so a fresh one still shows whatever it was configured
            // with rather than nothing at all.
            'socials' => fn () => ClinicSetting::socials(),
            // A short fingerprint of the compiled assets, so "my screen does
            // not match the server" can be settled by reading it off the page
            // instead of guessing from a stale tab.
            'build' => app(Vite::class)->manifestHash(),
            'modules' => fn () => Feature::values(array_keys(config('clinic.modules'))),
            'mediaUrl' => asset('media/photos'),
            'flash' => fn () => ['success' => $request->session()->get('success')],
            'auth' => [
                'user' => $request->user(),
                // Super Admin passes every gate via Gate::before, so it gets every permission here too.
                'permissions' => fn () => match (true) {
                    $request->user() === null => [],
                    $request->user()->hasRole('Super Admin') => Permission::pluck('name'),
                    default => $request->user()->getAllPermissions()->pluck('name'),
                },
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
