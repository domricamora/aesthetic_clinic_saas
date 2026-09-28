<?php

/*
| Brand and business settings for the clinic. The demo brand is fictional.
| Change the clinic here or in .env, never in components (plan.md §3).
*/

return [

    // Organization slug the public website belongs to.
    'organization' => env('CLINIC_ORGANIZATION', 'patrice'),

    'name' => env('CLINIC_NAME', 'Patrice Beauty Lounge Aesthetics'),
    'short_name' => env('CLINIC_SHORT_NAME', 'Patrice'),
    'tagline' => env('CLINIC_TAGLINE', 'Beauty that enhances who you already are.'),
    'logo' => env('CLINIC_LOGO', '/favicon.svg'),

    'colors' => [
        'primary' => '#3E1459',
        'primary_deep' => '#2A0B3D',
        'violet' => '#7822B8',
        'accent' => '#D4AE6A',
        'lilac' => '#E7DAF2',
        'ink' => '#1E0F2B',
    ],

    'contact' => [
        'address' => env('CLINIC_ADDRESS', '28 Amorsolo Street, Legaspi Village, Makati City'),
        'phone' => env('CLINIC_PHONE', '0917 177 7201'),
        'email' => env('CLINIC_EMAIL', 'hello@patrice.test'),
    ],

    'social' => [
        'facebook' => env('CLINIC_FACEBOOK'),
        'instagram' => env('CLINIC_INSTAGRAM'),
        'tiktok' => env('CLINIC_TIKTOK'),
    ],

    'currency' => env('CLINIC_CURRENCY', 'PHP'),
    'currency_symbol' => env('CLINIC_CURRENCY_SYMBOL', '₱'),
    'timezone' => env('CLINIC_TIMEZONE', 'Asia/Manila'),

    'hours' => [
        'mon-fri' => '10:00-20:00',
        'sat' => '10:00-18:00',
        'sun' => 'closed',
    ],

    // Default for each module flag (Laravel Pennant, per organization).
    'modules' => [
        'booking' => true,
        'crm' => true,
        'pos' => true,
        'inventory' => true,
        'accounting' => true,
        'payroll' => true,
        'ai' => true,
        'multi_branch' => true,
    ],

];
