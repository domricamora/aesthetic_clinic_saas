<?php

use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

it('never lets a browser store the document that names the assets', function () {
    // Otherwise a reload can be told "not modified" and the visitor keeps
    // running a build that is no longer on the server.
    $header = $this->get('/')->assertOk()->headers->get('Cache-Control');

    // Laravel appends its own directives, so check the part that matters.
    expect($header)->toContain('no-store')->toContain('max-age=0');
    $this->get('/about')->assertHeader('Cache-Control', $header);
});

it('leaves the hashed assets to be cached by their own name', function () {
    $header = $this->get('/build/assets/app-anything.js')->headers->get('Cache-Control');

    expect($header)->not->toContain('no-store');
});

it('leaves an API response alone', function () {
    expect($this->getJson('/up')->headers->get('Cache-Control'))->not->toContain('no-store');
});
