<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Shared props pre všetky Inertia stránky.
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $webUser = auth('web')->user();
        $companyUser = auth('company')->user();
        $u = $webUser ?: $companyUser;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $u ? [
                    'id'    => $u->id,
                    'email' => $u->email,
                    'name'  => $u->name
                               ?? trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''))
                               ?: ($u->email ?? 'Používateľ'),
                    'role'  => $u->role ?? ($companyUser ? 'company' : 'student'),
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
