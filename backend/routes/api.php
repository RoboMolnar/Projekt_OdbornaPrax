<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\InternshipController;
use App\Http\Controllers\Api\GarantInternshipController;

Route::get('/health', function () {
    return response()->json([
        'ok' => true,
        'time' => now()->toIso8601String(),
        'app' => config('app.name', 'Laravel'),
    ]);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    $user = $request->user();
    return response()->json([
        'id' => $user->id,
        'email' => $user->email,
        'name' => $user->name ?? trim(($user->first_name ?? '').' '.($user->last_name ?? '')),
        'role' => $user->role ?? 'student',
        'must_change_password' => (bool)($user->must_change_password ?? false),
    ]);
});

Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);

Route::post('/register/student', [\App\Http\Controllers\Auth\RegisterStudentController::class, 'store']);
Route::post('/register/company', [\App\Http\Controllers\Auth\RegisterCompanyController::class, 'store']);

Route::middleware('auth:sanctum')->get('/password/force-change-check', [\App\Http\Controllers\Api\PasswordController::class, 'check']);
Route::middleware('auth:sanctum')->post('/password/force-change', [\App\Http\Controllers\Api\PasswordController::class, 'update']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/student/internships', [InternshipController::class, 'index']);
    Route::post('/student/internships', [InternshipController::class, 'store']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/student/internships', [InternshipController::class, 'index']);
    Route::post('/student/internships', [InternshipController::class, 'store']);
    Route::get('/student/internships/{internship}', [InternshipController::class, 'show']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/garant/internships', [GarantInternshipController::class, 'indexAll']);
    Route::get('/garant/internships/{internship}', [GarantInternshipController::class, 'show']);
    Route::post('/garant/internships/{internship}/approve', [GarantInternshipController::class, 'approve']);
    Route::post('/garant/internships/{internship}/reject', [GarantInternshipController::class, 'reject']);
    Route::post('/garant/internships/{internship}/grade', [GarantInternshipController::class, 'grade']);
    Route::patch('/garant/internships/{internship}/state', [GarantInternshipController::class, 'setState']);
    Route::delete('/garant/internships/{internship}', [GarantInternshipController::class, 'destroy']);
});
