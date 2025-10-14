<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('landing'))->name('home');

// chránené stránky
Route::middleware(['auth', 'verified'])->group(function () {
    // názov komponentu musí sedieť s cestou súboru
    // ak máš resources/js/pages/dashboard.tsx (lowercase), renderuj 'dashboard'
    Route::get('/dashboard', fn () => Inertia::render('dashboard'))->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php'; // tu sú už /login, /register, /forgot-password, /reset-password
