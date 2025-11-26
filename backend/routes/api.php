<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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
| Info o prihlásenom používateľovi
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    $user = $request->user();

    return response()->json([
        // podľa DB máš primárny kľúč user_id
        'id'                  => $user->user_id ?? $user->id,
        'email'               => $user->email,
        'name'                => $user->name
            ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
        'role'                => $user->role ?? 'student',
        'must_change_password'=> (bool)($user->must_change_password ?? false),
    ]);
});

/*
|--------------------------------------------------------------------------
| Nútená zmena hesla
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/password/force-change-check', [PasswordController::class, 'check']);
    Route::post('/password/force-change', [PasswordController::class, 'update']);
});

/*
|--------------------------------------------------------------------------
| ŠTUDENT – praxe
|--------------------------------------------------------------------------
|
| !!! Dôležité:
|  - používame VÝHRADNE StudentInternshipController
|  - POST /student/internships očakáva company_id
|    a v kontroléri sa uloží do internship.company_id
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/student/internships', [StudentInternshipController::class, 'index']);
    Route::post('/student/internships', [StudentInternshipController::class, 'store']);
    Route::get('/student/internships/{internship}', [StudentInternshipController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| GARANT – praxe
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
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
|
| Firma vidí len praxe, kde internship.company_id = users.company_id
| (logika je v CompanyInternshipController@index + ensureBelongsToCompany)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    // zoznam praxí pre konkrétnu prihlásenú firmu
    Route::get('/company/internships', [CompanyInternshipController::class, 'index']);

    // detail jednej praxe
    Route::get('/company/internships/{internship}', [CompanyInternshipController::class, 'show']);

    // tie isté akcie ako má garant
    Route::post('/company/internships/{internship}/approve', [CompanyInternshipController::class, 'approve']);
    Route::post('/company/internships/{internship}/reject', [CompanyInternshipController::class, 'reject']);
    Route::post('/company/internships/{internship}/grade', [CompanyInternshipController::class, 'grade']);
    Route::patch('/company/internships/{internship}/state', [CompanyInternshipController::class, 'setState']);
    Route::delete('/company/internships/{internship}', [CompanyInternshipController::class, 'destroy']);

    // kontaktovanie garanta
    Route::post(
        '/company/internships/{internship}/contact-garant',
        [CompanyInternshipController::class, 'contactGarant']
    );
});