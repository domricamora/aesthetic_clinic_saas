<?php

namespace App\Providers;

use App\Models\Organization;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Guests and platform admins (no organization) see the clinic this install serves.
        // ponytail: one organization per user; add a switcher when users span organizations.
        $this->app->scoped('organization.default', fn () => Organization::where('slug', config('clinic.organization'))->first());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureAccess();
    }

    /**
     * Super Admin passes every gate; module flags resolve per organization.
     */
    protected function configureAccess(): void
    {
        Gate::before(fn (User $user) => $user->hasRole('Super Admin') ? true : null);

        Feature::resolveScopeUsing(fn () => Organization::current());

        foreach (config('clinic.modules') as $module => $default) {
            Feature::define($module, fn () => $default);
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
