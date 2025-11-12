<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class PasswordController extends Controller
{
    public function check(Request $request)
    {
        $u = $request->user();
        return response()->json([
            'must_change_password' => (bool)($u->must_change_password ?? false),
        ]);
    }

    public function update(Request $request)
    {
        $u = $request->user();

        $data = $request->validate([
            'current_password' => ['required','string'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        if (! Hash::check($data['current_password'], $u->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Nesprávne aktuálne heslo.'],
            ]);
        }

        $u->password = $data['password'];
        $u->must_change_password = 0;
        $u->save();

        return response()->json(['ok' => true]);
    }
}

