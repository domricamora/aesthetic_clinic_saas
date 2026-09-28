<?php

/*
 * Philippine payroll rates (plan.md 26).
 *
 * THESE ARE DEFAULTS, NOT ADVICE. Contribution ceilings and the withholding
 * tax table are adjusted by law and by Circulars that change through the
 * year. Have a payroll specialist or accountant review these before the
 * first real pay run, and keep them configurable rather than hard coded so a
 * change is a config edit and not a code change. Nothing here is a claim of
 * BIR compliance (plan.md 25).
 */
return [

    'work_days' => [
        'standard' => 22,      // divisor for a daily rate
        'hours_per_day' => 8,   // anything past this is overtime
    ],

    'sss' => [
        'employee_rate' => 0.05,
        'monthly_salary_ceiling' => 35000,  // maximum monthly salary credited
        'maximum_contribution' => 1750,
    ],

    'philhealth' => [
        'employee_rate' => 0.025,
        'monthly_salary_ceiling' => 10000,
        'maximum_contribution' => 250,
    ],

    'pagibig' => [
        'employee_rate' => 0.01,
        'monthly_salary_ceiling' => 5000,
        'maximum_contribution' => 50,
    ],

    // TRAIN monthly withholding on compensation, as a table of bands.
    'withholding_tax' => [
        ['up_to' => 20833, 'rate' => 0.00, 'base' => 0],
        ['up_to' => 33333, 'rate' => 0.15, 'base' => 20833],
        ['up_to' => 66667, 'rate' => 0.20, 'base' => 33333],
        ['up_to' => 250000, 'rate' => 0.25, 'base' => 66667],
        ['up_to' => 800000, 'rate' => 0.30, 'base' => 250000],
        ['up_to' => 2000000, 'rate' => 0.32, 'base' => 250000],
        ['up_to' => null, 'rate' => 0.35, 'base' => 2000000],
    ],

];
