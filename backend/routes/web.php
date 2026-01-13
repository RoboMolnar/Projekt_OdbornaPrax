<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

use App\Http\Controllers\Auth\RegisterStudentController;
use App\Http\Controllers\Auth\RegisterCompanyController;
use App\Http\Controllers\Auth\ForcedPasswordController;
use App\Http\Controllers\CompanyActivationController;
use App\Http\Controllers\ForgotPasswordController;

use App\Mail\InitialPasswordMail;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Forgot password (INERTIA)
|--------------------------------------------------------------------------
| URL musí presne sedieť s frontendom: /forgot-password
*/
Route::middleware('guest')->group(function () {
    Route::get('/forgot-password', [ForgotPasswordController::class, 'form'])
        ->name('password.forgot.form');

    Route::post('/forgot-password', [ForgotPasswordController::class, 'send'])
        ->name('password.forgot.send');
});

/*
|--------------------------------------------------------------------------
| Landing page
|--------------------------------------------------------------------------
*/
Route::get('/', fn () => Inertia::render('landing'))
    ->name('home');

/*
|--------------------------------------------------------------------------
| Registrácia
|--------------------------------------------------------------------------
*/
Route::post('/register/student', [RegisterStudentController::class, 'store'])
    ->name('register.student');

Route::post('/register/company', [RegisterCompanyController::class, 'store'])
    ->name('register.company');

/*
|--------------------------------------------------------------------------
| Aktivácia firmy
|--------------------------------------------------------------------------
*/
Route::middleware(['signed', 'throttle:10,1'])->group(function () {
    Route::get('/company/activate/{user}', [CompanyActivationController::class, 'activate'])
        ->name('company.activate');
});

/*
|--------------------------------------------------------------------------
| Vynútená zmena hesla
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:web,company'])->group(function () {
    Route::get('/force-password', [ForcedPasswordController::class, 'form'])
        ->name('password.force.form');

    Route::post('/force-password', [ForcedPasswordController::class, 'update'])
        ->name('password.force.update');
});

/*
|--------------------------------------------------------------------------
| Dashboardy (chránené + must_change_password)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:web,company', 'force.password.change'])->group(function () {

    Route::get('/dashboard', function () {
        $user = Auth::user() ?? Auth::guard('company')->user();

        if (!$user) {
            return redirect()->route('home');
        }

        $role = $user->role ?? null;

        return match ($role) {
            'student'               => redirect()->route('dashboard.student'),
            'company', 'firma'      => redirect()->route('dashboard.company'),
            'garant', 'teacher'     => redirect()->route('dashboard.garant'),
            default                 => redirect()->route('dashboard.garant'),
        };
    })->name('dashboard');

    Route::get('/dashboard-garant', fn () => Inertia::render('dashboard'))
        ->name('dashboard.garant');

    Route::get('/dashboard-student', fn () => Inertia::render('dashboardStudent'))
        ->name('dashboard.student');

    Route::get('/dashboard-company', fn () => Inertia::render('dashboardCompany'))
        ->name('dashboard.company');
});

/*
|--------------------------------------------------------------------------
| Logout – SPA friendly
|--------------------------------------------------------------------------
*/
Route::post('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();

    return response()->noContent(); // 204
})->name('logout');

/*
|--------------------------------------------------------------------------
| Lokálny test mailu
|--------------------------------------------------------------------------
*/
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

/*
|--------------------------------------------------------------------------
| Ostatné routes
|--------------------------------------------------------------------------
*/
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

/*
|--------------------------------------------------------------------------
| Fallback 404
|--------------------------------------------------------------------------
*/
Route::fallback(function () {
    abort(404);
});
