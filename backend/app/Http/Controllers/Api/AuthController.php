<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required','email'],
            'password' => ['required','string'],
        ]);

        $user = User::where('email', $data['email'])->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Nesprávne prihlasovacie údaje.'],
            ]);
        }

        if ($user->role === 'company' && ! $user->active) {
            throw ValidationException::withMessages([
                'email' => ['Účet firmy nie je ešte aktivovaný.'],
            ]);
        }

        // Revoke old tokens optionally
        $user->tokens()->where('name', 'spa')->delete();

        $token = $user->createToken('spa', ['*'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name
                           ?? trim(($user->first_name ?? '').' '.($user->last_name ?? ''))
                           ?: ($user->email ?? 'Používateľ'),
                'role' => $user->role ?? 'student',
            ],
            'must_change_password' => (bool)($user->must_change_password ?? false),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['ok' => true]);
    }
}
