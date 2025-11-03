<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Fortify;
use Inertia\Inertia;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Fortify::loginView(fn () => Inertia::render('auth/login'));
        // Fortify::registerView(fn () => Inertia::render('auth/register'));

        Fortify::authenticateUsing(function ($request) {
            $user = User::where('email', $request->email)->first();

            if (! $user) {
                return null;
            }

            if (! Hash::check($request->password, $user->password)) {
                return null;
            }

            if ($user->role === 'company' && ! $user->active) {
                return null;
            }

            return $user;
        });
    }
}
