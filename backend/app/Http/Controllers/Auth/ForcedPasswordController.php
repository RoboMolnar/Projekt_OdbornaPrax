<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class ForcedPasswordController extends Controller
{
    public function form()
    {
        return view('auth.force-password');
    }

    public function update(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = Auth::user();

        // zmena hesla
        $user->password = Hash::make($request->password);
        $user->must_change_password = false; // už nemusí meniť
        $user->save();

        // po zmene hesla zostáva prihlásený
        Auth::login($user);

        // presmerovanie podľa role
        if ($user->role === 'student') {
            return redirect()->route('dashboard.student')
                ->with('success', 'Heslo bolo úspešne zmenené.');
        } elseif ($user->role === 'company') {
            return redirect()->route('dashboard')
                ->with('success', 'Heslo bolo úspešne zmenené.');
        } else {
            return redirect()->route('dashboard')
                ->with('success', 'Heslo bolo úspešne zmenené.');
        }
    }
}
