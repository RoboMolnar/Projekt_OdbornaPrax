<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

use App\Http\Controllers\Auth\RegisterStudentController;
use App\Http\Controllers\Auth\RegisterCompanyController;
use App\Http\Controllers\Auth\ForcedPasswordController;
use App\Http\Controllers\CompanyActivationController;

use App\Mail\InitialPasswordMail;
use App\Models\User;

Route::get('/', fn () => Inertia::render('landing'))->name('home');

Route::post('/register/student', [RegisterStudentController::class, 'store'])->name('register.student');
Route::post('/register/company', [RegisterCompanyController::class, 'store'])->name('register.company');

Route::middleware(['signed', 'throttle:10,1'])->group(function () {
    Route::get('/company/activate/{user}', [CompanyActivationController::class, 'activate'])->name('company.activate');
});

Route::middleware(['auth:web,company'])->group(function () {
    Route::get('/force-password', [ForcedPasswordController::class, 'form'])->name('password.force.form');
    Route::post('/force-password', [ForcedPasswordController::class, 'update'])->name('password.force.update');
});

Route::middleware(['auth:web,company', 'force.password.change'])->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('dashboard'))->name('dashboard');
    Route::get('/dashboard-student', fn () => Inertia::render('dashboardStudent'))->name('dashboard.student');
});

Route::post('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect()->route('home');
})->name('logout');

if (app()->environment('local')) {
    Route::get('/_mail-test', function () {
        $u = User::first() ?? User::create([
            'role' => 'student',
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => bcrypt('Secret123!'),
            'active' => 1,
            'must_change_password' => 1,
        ]);

        $plain = 'DocasneHeslo123!';
        Mail::to($u->email)->send(new InitialPasswordMail($u, $plain));

        return '✅ Testovací e-mail odoslaný.';
    });
}

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

Route::fallback(function () {
    abort(404);
});
