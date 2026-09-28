<?php

/*
| Brand and business settings for the clinic. The demo brand is fictional.
| Change the clinic here or in .env, never in components (plan.md §3).
*/

return [

    // Organization slug the public website belongs to.
    'organization' => env('CLINIC_ORGANIZATION', 'veloura'),

    'name' => env('CLINIC_NAME', 'Veloura Aesthetic Clinic'),
    'short_name' => env('CLINIC_SHORT_NAME', 'Veloura'),
    'tagline' => env('CLINIC_TAGLINE', 'Modern Beauty. Personalized Care.'),
    'logo' => env('CLINIC_LOGO', '/favicon.svg'),

    'colors' => [
        'primary' => '#173B35',
        'ivory' => '#F7F3EC',
        'accent' => '#C8A96B',
        'dark' => '#18201E',
        'muted' => '#68736F',
        'soft_green' => '#DDE9E2',
        'blush' => '#E9D8D1',
    ],

    'contact' => [
        'address' => env('CLINIC_ADDRESS', '28 Amorsolo Street, Legaspi Village, Makati City'),
        'phone' => env('CLINIC_PHONE', '+63 2 8123 4567'),
        'email' => env('CLINIC_EMAIL', 'hello@veloura.test'),
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
