<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    public function handle(Request $request, Closure $next): Response
    {
        $u = $request->user();

        if ($u && $u->must_change_password) {
            if (!$request->routeIs(['password.force.form','password.force.update','logout'])) {
                return redirect()->route('password.force.form');
            }
        }

        return $next($request);
    }
}
