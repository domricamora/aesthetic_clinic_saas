<?php

use App\Http\Controllers\Admin\AppointmentController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\LeadController as AdminLeadController;
use App\Http\Controllers\Admin\PosController;
use App\Http\Controllers\Site\BlogController;
use App\Http\Controllers\Site\BookingController;
use App\Http\Controllers\Site\LeadController;
use App\Http\Controllers\Site\PageController;
use App\Http\Controllers\Site\SeoController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PageController::class, 'home'])->name('home');
Route::get('treatments', [PageController::class, 'treatments'])->name('treatments.index');
Route::get('treatments/{slug}', [PageController::class, 'treatment'])->name('treatments.show');

Route::get('about', [PageController::class, 'about'])->name('about');
Route::get('membership', [PageController::class, 'membership'])->name('membership');
Route::get('promotions', [PageController::class, 'promotions'])->name('promotions');
Route::get('before-after', [PageController::class, 'beforeAfter'])->name('before-after');
Route::get('contact', [PageController::class, 'contact'])->name('contact');
Route::get('journal', [BlogController::class, 'index'])->name('blog.index');
Route::get('journal/{slug}', [BlogController::class, 'show'])->name('blog.show');

Route::get('privacy-policy', [PageController::class, 'page'])->defaults('page', 'privacy-policy')->name('legal.privacy');
Route::get('terms', [PageController::class, 'page'])->defaults('page', 'terms')->name('legal.terms');
Route::get('data-privacy-notice', [PageController::class, 'page'])->defaults('page', 'data-privacy-notice')->name('legal.data-privacy');

Route::get('sitemap.xml', [SeoController::class, 'sitemap'])->name('sitemap');
Route::get('robots.txt', [SeoController::class, 'robots'])->name('robots');

Route::get('book', [BookingController::class, 'create'])->name('book');
Route::get('book/slots', [BookingController::class, 'slots'])->middleware('throttle:60,1')->name('book.slots');
Route::post('book', [BookingController::class, 'store'])->middleware('throttle:10,1')->name('book.store');
Route::get('book/confirmed/{reference}', [BookingController::class, 'confirmed'])->middleware('signed')->name('book.confirmed');

Route::post('leads', [LeadController::class, 'store'])->middleware('throttle:10,1')->name('leads.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('search', [AdminLeadController::class, 'search'])->middleware(['can:leads.view', 'throttle:120,1'])->name('search');
        Route::get('leads', [AdminLeadController::class, 'index'])->middleware('can:leads.view')->name('leads.index');
        Route::get('leads/create', [AdminLeadController::class, 'create'])->middleware('can:leads.create')->name('leads.create');
        Route::post('leads', [AdminLeadController::class, 'store'])->middleware('can:leads.create')->name('leads.store');
        Route::get('leads/{lead}', [AdminLeadController::class, 'show'])->middleware('can:leads.view')->name('leads.show');
        Route::patch('leads/{lead}', [AdminLeadController::class, 'update'])->middleware('can:leads.edit')->name('leads.update');
        Route::post('leads/{lead}/notes', [AdminLeadController::class, 'note'])->middleware('can:leads.edit')->name('leads.notes.store');

        Route::get('appointments', [AppointmentController::class, 'index'])->middleware('can:appointments.view')->name('appointments.index');
        Route::get('appointments/create', [AppointmentController::class, 'create'])->middleware('can:appointments.create')->name('appointments.create');
        Route::post('appointments', [AppointmentController::class, 'store'])->middleware('can:appointments.create')->name('appointments.store');
        Route::patch('appointments/{appointment}', [AppointmentController::class, 'update'])->middleware('can:appointments.edit')->name('appointments.update');

        // The counter: ring up a sale, take payment, print a receipt (plan.md 19).
        Route::get('pos', [PosController::class, 'index'])->middleware('can:pos.view')->name('pos.index');
        Route::post('pos', [PosController::class, 'store'])->middleware('can:pos.create')->name('pos.store');
        Route::get('pos/sales', [PosController::class, 'sales'])->middleware('can:pos.view')->name('pos.sales.index');
        Route::get('pos/sales/{sale}', [PosController::class, 'show'])->middleware('can:pos.view')->name('pos.sales.show');
        Route::post('pos/sales/{sale}/refund', [PosController::class, 'refund'])->middleware('can:pos.refund')->name('pos.sales.refund');
    });
});

require __DIR__.'/settings.php';

// Last resort: any other single-segment path is a database backed page, or a
// 404. It has to stay below every named route above.
Route::get('{page}', [PageController::class, 'page'])
    ->where('page', '[a-z0-9-]+')
    ->name('legal');
