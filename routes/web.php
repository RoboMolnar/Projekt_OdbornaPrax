<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('landing'))->name('home');

// spoločný dashboard pre prihláseného študenta alebo firmu
Route::middleware(['auth:web,company'])->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('dashboard'))->name('dashboard');

    // Študentský dashboard
    Route::get('/dashboard-student', fn () => Inertia::render('dashboardStudent'))->name('dashboard.student');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
