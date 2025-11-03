<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('landing'))->name('home');

Route::middleware(['auth:web,company'])->group(function () {
    // ✅ GARANT: nechávame /dashboard ako existujúcu stránku garanta
    Route::get('/dashboard', fn () => Inertia::render('dashboard'))
        ->name('dashboard');

    // 🎓 ŠTUDENT
    Route::get('/dashboard-student', fn () => Inertia::render('dashboardStudent'))
        ->name('dashboard.student');

    // 🏢 FIRMA
    Route::get('/dashboard-company', fn () => Inertia::render('dashboardCompany'))
        ->name('dashboard.company');

    // 🔀 POVLOG-IN PRESMERNIE podľa guardu/role
    Route::get('/redirect-dashboard', function () {
        // Ak používaš samostatný guard 'company' pre firmy:
        if (Auth::guard('company')->check()) {
            return redirect()->route('dashboard.company');
        }

        // Ak používaš jeden guard a máš na userovi stĺpec 'role'
        $user = Auth::user();
        if ($user && ($user->role ?? null) === 'company') {
            return redirect()->route('dashboard.company');
        }

        // default: študent
        return redirect()->route('dashboard.student');
    })->name('dashboard.redirect');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
