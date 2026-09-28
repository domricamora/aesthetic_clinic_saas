<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Setup\LoadClinicData;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Loads the clinic's data from the dashboard, so an installation does not have
 * to wait for someone to find a shell.
 *
 * This is the same seeder `php artisan db:seed` runs, so a demonstration
 * installation here looks the same as one built on a laptop. It is safe to
 * press repeatedly: the seeders match on their own keys and update in place.
 * What it will not do is change the password of an account that already
 * exists, or rename a branch -- see LoadClinicData.
 */
class SetupController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/setup', [
            'counts' => LoadClinicData::counts(),
            'seeder' => class_basename(LoadClinicData::SEEDER),
        ]);
    }

    public function store(): RedirectResponse
    {
        $result = (new LoadClinicData)();
        $rows = array_sum(array_column($result['counts'], 'count'));

        return back()->with('success', "Clinic data loaded: {$rows} rows across ".count($result['counts']).' lists.');
    }
}
