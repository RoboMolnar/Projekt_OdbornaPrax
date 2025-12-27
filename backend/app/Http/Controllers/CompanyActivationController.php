<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class CompanyActivationController extends Controller
{
    public function activate(Request $request, User $user)
    {
        if (!$request->hasValidSignature()) {
            abort(403, 'Neplatný alebo expirovaný aktivačný odkaz.');
        }

        if ($user->role !== 'company') {
            abort(403, 'Aktivovať možno len firemný účet.');
        }

        if ($user->active) {
            return redirect(rtrim(env('FRONTEND_URL', config('app.url')), '/') . '/login');
        }

        $user->update(['active' => 1]);

        return redirect(rtrim(env('FRONTEND_URL', config('app.url')), '/') . '/login');
    }
}
