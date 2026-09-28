<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Setup\LoadClinicData;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Loads the clinic's reference and content rows from the dashboard, so an
 * installation does not have to wait for someone to find a shell.
 *
 * Everything this writes is reference data or marketing copy that the seeders
 * update in place, so pressing it twice leaves the clinic as it was. It never
 * creates a login, which is the one thing that would make this button unsafe
 * to hand to a browser.
 */
class SetupController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/setup', [
            'counts' => LoadClinicData::counts(),
            'seeders' => array_map(
                fn (string $seeder) => class_basename($seeder),
                LoadClinicData::SEEDERS,
            ),
        ]);
    }

    public function store(): RedirectResponse
    {
        $result = (new LoadClinicData)();
        $rows = array_sum(array_column($result['counts'], 'count'));

        return back()->with('success', "Clinic data loaded: {$rows} rows across ".count($result['counts'])." lists, from {$result['seeders']} seeders.");
    }
}
