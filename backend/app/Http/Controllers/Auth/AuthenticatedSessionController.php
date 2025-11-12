<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Http\RedirectResponse;

class AuthenticatedSessionController extends Controller
{
    public function create(): InertiaResponse
    {
        // resources/js/pages/auth/login.tsx
        return Inertia::render('auth/login');
    }

    public function store(Request $request): SymfonyResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $remember = (bool)($data['remember'] ?? false);

        // 1) študent (guard web)
        if ($u = User::where('email', $data['email'])->first()) {
            if (Hash::check($data['password'], $u->password)) {
                Auth::guard('web')->login($u, $remember);
                $request->session()->regenerate();

                // Full-page redirect → URL sa prepne na /dashboard
                return Inertia::location(route('dashboard'));
            }
        }

        // 2) firma (guard company)
        if ($c = Company::where('email', $data['email'])->first()) {
            if (!empty($c->password) && Hash::check($data['password'], $c->password)) {
                Auth::guard('company')->login($c, $remember);
                $request->session()->regenerate();

                // Full-page redirect → URL sa prepne na /dashboard
                return Inertia::location(route('dashboard'));
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
