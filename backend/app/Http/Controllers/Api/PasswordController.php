<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Mail\ResetTempPasswordMail;

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

        $u->password = Hash::make($data['password']);
        $u->must_change_password = 0;
        $u->save();

        return response()->json([
            'ok' => true,
            'user' => [
                'id' => $u->id,
                'email' => $u->email,
                'name' => $u->name,
                'role' => $u->role,
            ],
        ]);
    }

    /**
     * Zabudnuté heslo: pošle dočasné heslo na registrovaný e-mail.
     * Pôvodné heslo NEMENÍ – dočasné uloží do reset_temp_* stĺpcov + expirácia.
     */
    public function forgot(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        // podľa tvojho zadania: len registrované emaily
        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['Tento e-mail nie je zaregistrovaný.'],
            ]);
        }

        $plain = Str::password(14, true, true, false, false);

        $user->reset_temp_password = Hash::make($plain);
        $user->reset_temp_expires_at = now()->addMinutes(15);
        $user->save();

        Mail::to($user->email)->send(new ResetTempPasswordMail($user, $plain));

        return response()->json(['ok' => true]);
    }

    /**
     * Reset hesla pomocou dočasného hesla z e-mailu.
     */
    public function resetWithTemp(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'temp_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['Tento e-mail nie je zaregistrovaný.'],
            ]);
        }

        if (! $user->reset_temp_password || ! $user->reset_temp_expires_at) {
            throw ValidationException::withMessages([
                'temp_password' => ['Reset hesla nie je aktívny. Požiadajte o nový reset.'],
            ]);
        }

        if (now()->greaterThan($user->reset_temp_expires_at)) {
            // expirované – vyčisti a povedz userovi čo ďalej
            $user->reset_temp_password = null;
            $user->reset_temp_expires_at = null;
            $user->save();

            throw ValidationException::withMessages([
                'temp_password' => ['Dočasné heslo expirovalo. Požiadajte o nový reset.'],
            ]);
        }

        if (! Hash::check($data['temp_password'], $user->reset_temp_password)) {
            throw ValidationException::withMessages([
                'temp_password' => ['Dočasné heslo nie je správne.'],
            ]);
        }

        $user->password = Hash::make($data['password']);
        $user->must_change_password = 0;
        $user->reset_temp_password = null;
        $user->reset_temp_expires_at = null;
        $user->save();

        return response()->json(['ok' => true]);
    }
}
