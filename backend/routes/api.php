<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

use App\Http\Controllers\Api\StudentInternshipController;
use App\Http\Controllers\Api\GarantInternshipController;
use App\Http\Controllers\Api\CompanyInternshipController;
use App\Http\Controllers\Auth\RegisterCompanyController;
use App\Http\Controllers\Auth\RegisterStudentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordController;

Route::get('/health', function () {
    return response()->json([
        'ok'   => true,
        'time' => now()->toIso8601String(),
        'app'  => config('app.name', 'Laravel'),
    ]);
});

/*
|--------------------------------------------------------------------------
| Registrácia
|--------------------------------------------------------------------------
*/
Route::post('/register/student', [RegisterStudentController::class, 'store']);
Route::post('/register/company', [RegisterCompanyController::class, 'store']);

/*
|--------------------------------------------------------------------------
| Autentifikácia
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

/*
|--------------------------------------------------------------------------
| Zabudnuté heslo (bez prihlásenia)
|--------------------------------------------------------------------------
*/
Route::post('/password/forgot', [PasswordController::class, 'forgot']);
Route::post('/password/reset-with-temp', [PasswordController::class, 'resetWithTemp']);

/*
|--------------------------------------------------------------------------
| Spoločné pre všetkých prihlásených
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Info o prihlásenom používateľovi
    |--------------------------------------------------------------------------
    */
    Route::get('/user', function (Request $request) {
        $user = $request->user();

        return response()->json([
            'id'                   => $user->user_id ?? $user->id,
            'email'                => $user->email,
            'name'                 => $user->name
                ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
            'role'                 => $user->role ?? 'student',
            'must_change_password' => (bool)($user->must_change_password ?? false),
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Nútená zmena hesla (spoločné)
    |--------------------------------------------------------------------------
    */
    Route::get('/password/force-change-check', [PasswordController::class, 'check']);
    Route::post('/password/force-change', [PasswordController::class, 'update']);
});

/*
|--------------------------------------------------------------------------
| ŠTUDENT – praxe
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:student'])->group(function () {
    Route::get('/student/internships', [StudentInternshipController::class, 'index']);
    Route::post('/student/internships', [StudentInternshipController::class, 'store']);
    Route::get('/student/internships/{internship}', [StudentInternshipController::class, 'show']);
    Route::patch('/student/internships/{internship}', [StudentInternshipController::class, 'update']);
    Route::delete('/student/internships/{internship}', [StudentInternshipController::class, 'destroy']);


    /*
    |--------------------------------------------------------------------------
    | FIRMY – zoznam pre študenta (výber firmy pri tvorbe praxe)
    |--------------------------------------------------------------------------
    */
    Route::get('/companies', function () {
        return DB::table('company')
            ->leftJoin('address', 'address.address_id', '=', 'company.address_id')
            ->orderBy('company.company_name')
            ->select([
                'company.company_id as company_id',
                'company.company_name as company_name',
                'address.street',
                'address.city',
                'address.zip',
                'address.country',
            ])
            ->get();
    });
});

/*
|--------------------------------------------------------------------------
| GARANT – praxe
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:garant'])->group(function () {
    Route::get('/garant/internships', [GarantInternshipController::class, 'indexAll']);
    Route::get('/garant/internships/{internship}', [GarantInternshipController::class, 'show']);
    Route::post('/garant/internships/{internship}/approve', [GarantInternshipController::class, 'approve']);
    Route::post('/garant/internships/{internship}/reject', [GarantInternshipController::class, 'reject']);
    Route::post('/garant/internships/{internship}/grade', [GarantInternshipController::class, 'grade']);
    Route::patch('/garant/internships/{internship}/state', [GarantInternshipController::class, 'setState']);
    Route::delete('/garant/internships/{internship}', [GarantInternshipController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| FIRMA – praxe
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:company'])->group(function () {
    Route::get('/company/internships', [CompanyInternshipController::class, 'index']);
    Route::get('/company/internships/{internship}', [CompanyInternshipController::class, 'show']);

    Route::post('/company/internships/{internship}/approve', [CompanyInternshipController::class, 'approve']);
    Route::post('/company/internships/{internship}/reject', [CompanyInternshipController::class, 'reject']);
    Route::post('/company/internships/{internship}/grade', [CompanyInternshipController::class, 'grade']);
    Route::patch('/company/internships/{internship}/state', [CompanyInternshipController::class, 'setState']);
    Route::delete('/company/internships/{internship}', [CompanyInternshipController::class, 'destroy']);

    Route::post(
        '/company/internships/{internship}/contact-garant',
        [CompanyInternshipController::class, 'contactGarant']
    );
});
