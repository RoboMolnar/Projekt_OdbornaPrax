<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\CompanyActivationMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class RegisterCompanyController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name'   => ['required','string','max:100'],
            'last_name'    => ['required','string','max:100'],
            'email'        => ['required','email','max:255','unique:users,email'],
            'phone_number' => ['required','string','max:50'],
        ]);

        $plain = Str::password(14);

        $user = User::create([
            'role'                 => 'company',
            'first_name'           => $data['first_name'],
            'last_name'            => $data['last_name'],
            'email'                => $data['email'],
            'phone_number'         => $data['phone_number'],
            'password'             => Hash::make($plain),
            'active'               => 0,   // potrebuje aktiváciu
            'must_change_password' => 1,
        ]);

        $activationUrl = URL::temporarySignedRoute(
            'company.activate',
            now()->addHours(72),
            ['user' => $user->user_id] // primárny kľúč user_id
        );

        try {
            Mail::to($user->email)->send(new CompanyActivationMail($user, $plain, $activationUrl));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json(['message' => 'Firma zaregistrovaná. Poslali sme aktivačný e-mail.'], 201);
    }
}
