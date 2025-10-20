<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/login'); // resources/js/pages/auth/login.tsx
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email'    => ['required','email'],
            'password' => ['required','string'],
            'remember' => ['nullable','boolean'],
        ]);

        
        $remember = false;

        // 1) študent
        if ($u = User::where('email', $data['email'])->first()) {
            if (Hash::check($data['password'], $u->password)) {
                Auth::guard('web')->login($u, $remember);
                $request->session()->regenerate();
                return redirect()->intended(route('dashboard'));
            }
        }

        // 2) firma
        if ($c = Company::where('email', $data['email'])->first()) {
            if (!empty($c->password) && Hash::check($data['password'], $c->password)) {
                Auth::guard('company')->login($c, $remember);
                $request->session()->regenerate();
                return redirect()->intended(route('dashboard'));
            }
        }

        return back()->withErrors([
            'email' => 'Nesprávny email alebo heslo.',
        ])->onlyInput('email');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        Auth::guard('company')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
