<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Fortify;
use Inertia\Inertia;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Fortify beží na /fortify/login a /fortify/register, UI je rovnaké (Inertia)
        //Fortify::loginView(fn () => Inertia::render('auth/login'));
        //Fortify::registerView(fn () => Inertia::render('auth/register'));
    }
}
