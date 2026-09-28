<?php

use App\Http\Controllers\Site\BookingController;
use App\Http\Controllers\Site\LeadController;
use App\Http\Controllers\Site\PageController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PageController::class, 'home'])->name('home');
Route::get('treatments', [PageController::class, 'treatments'])->name('treatments.index');
Route::get('treatments/{slug}', [PageController::class, 'treatment'])->name('treatments.show');

Route::get('book', [BookingController::class, 'create'])->name('book');
Route::get('book/slots', [BookingController::class, 'slots'])->middleware('throttle:60,1')->name('book.slots');
Route::post('book', [BookingController::class, 'store'])->middleware('throttle:10,1')->name('book.store');
Route::get('book/confirmed/{reference}', [BookingController::class, 'confirmed'])->middleware('signed')->name('book.confirmed');

Route::post('leads', [LeadController::class, 'store'])->middleware('throttle:10,1')->name('leads.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
