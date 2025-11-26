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
        $data = $request->validate(
            [
                'first_name'   => ['required', 'string', 'max:100'],
                'last_name'    => ['required', 'string', 'max:100'],
                'email'        => ['required', 'email', 'max:255', 'unique:users,email'],
                'phone_number' => ['required', 'string', 'max:50'],
                'ico'          => ['required', 'string', 'max:45'],
                'dic'          => ['required', 'string', 'max:45'],
                // voliteľne: 'company_name' => ['nullable','string','max:255'],
            ],
            [
                'first_name.required'   => 'Meno je povinné.',
                'last_name.required'    => 'Priezvisko je povinné.',
                'email.required'        => 'E-mail je povinný.',
                'email.email'           => 'Zadajte platný e-mail.',
                'email.unique'          => 'Tento e-mail už je zaregistrovaný.',
                'phone_number.required' => 'Telefónne číslo je povinné.',
                'ico.required'          => 'IČO je povinné.',
                'dic.required'          => 'DIČ je povinné.',
            ]
        );

        // vygenerujeme dočasné heslo
        $plain = Str::password(14);

        // vytvoríme používateľa – konto firmy (kontakt)
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

        // POZOR: ico/dic/ nazov firmy by si mal uložiť do tabuľky company,
        // to riešiš buď tu, alebo v activácii (CompanyActivationController).

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

        return response()->json([
            'message' => 'Firma zaregistrovaná. Poslali sme aktivačný e-mail.',
        ], 201);
    }
}