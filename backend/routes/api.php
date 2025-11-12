<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

// Token-based auth endpoints
Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);

// Registration via API (no cookies/CSRF)
Route::post('/register/student', [\App\Http\Controllers\Auth\RegisterStudentController::class, 'store']);
Route::post('/register/company', [\App\Http\Controllers\Auth\RegisterCompanyController::class, 'store']);

// Force password change flow
Route::middleware('auth:sanctum')->get('/password/force-change-check', [\App\Http\Controllers\Api\PasswordController::class, 'check']);
Route::middleware('auth:sanctum')->post('/password/force-change', [\App\Http\Controllers\Api\PasswordController::class, 'update']);
