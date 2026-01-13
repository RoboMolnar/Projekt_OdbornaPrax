<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\CompanyActivationMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

                // ✅ NOVÉ: pozícia kontaktnej osoby (CEO/konateľ/...)
                'position'     => ['required', 'string', 'max:255'],

                'company_name' => ['nullable', 'string', 'max:255'],
                'ico'          => ['required', 'string', 'max:45'],
                'dic'          => ['required', 'string', 'max:45'],

                // ✅ povinná adresa firmy
                'street'       => ['required', 'string', 'max:255'],
                'city'         => ['required', 'string', 'max:255'],
                'zip'          => ['required', 'string', 'max:20'],
                'country'      => ['required', 'string', 'max:255'],
            ],
            [
                'first_name.required'    => 'Meno je povinné.',
                'last_name.required'     => 'Priezvisko je povinné.',
                'email.required'         => 'E-mail je povinný.',
                'email.email'            => 'Neplatný formát e-mailu.',
                'email.unique'           => 'E-mail už existuje.',
                'phone_number.required'  => 'Telefón je povinný.',

                // ✅ NOVÉ
                'position.required'      => 'Pozícia je povinná.',

                'ico.required'           => 'IČO je povinné.',
                'dic.required'           => 'DIČ je povinné.',

                'street.required'        => 'Ulica je povinná.',
                'city.required'          => 'Mesto je povinné.',
                'zip.required'           => 'PSČ je povinné.',
                'country.required'       => 'Štát je povinný.',
            ]
        );

        return DB::transaction(function () use ($data) {

            // 1) nájdi firmu podľa IČO alebo ju vytvor v tabuľke company
            $existing = DB::table('company')->where('ico', $data['ico'])->first();

            if ($existing) {
                $companyId = $existing->company_id;
            } else {
                // ✅ vytvor adresu a napoj firmu na address_id
                $addressId = DB::table('address')->insertGetId([
                    'street'     => $data['street'],
                    'city'       => $data['city'],
                    'zip'        => $data['zip'],
                    'country'    => $data['country'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $companyId = DB::table('company')->insertGetId([
                    'company_name'  => $data['company_name'] ?? ($data['first_name'] . ' ' . $data['last_name']),
                    'ico'           => $data['ico'],
                    'dic'           => $data['dic'],
                    'email'         => $data['email'],
                    'phone_contact' => $data['phone_number'],
                    'address_id'    => $addressId,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ], 'company_id');
            }

            // 2) vygenerujeme dočasné heslo
            $plain = Str::password(14, true, true, false, false);

            // 3) vytvoríme používateľa – konto firmy (kontakt)
            $user = User::create([
                'role'                 => 'company',
                'first_name'           => $data['first_name'],
                'last_name'            => $data['last_name'],
                'email'                => $data['email'],
                'phone_number'         => $data['phone_number'],

                // ✅ NOVÉ
                'position'             => $data['position'],

                'password'             => Hash::make($plain),
                'active'               => 0,
                'must_change_password' => 1,
                'company_id'           => $companyId,
            ]);

            // 4) aktivačný link
            $activationUrl = URL::temporarySignedRoute(
                'company.activate',
                now()->addMinutes(60),
                ['user' => $user->user_id]
            );

            try {
                Mail::to($user->email)->send(new CompanyActivationMail($user, $plain, $activationUrl));
            } catch (\Throwable $e) {
                report($e);
            }

            return response()->json([
                'message' => 'Firma zaregistrovaná. Poslali sme aktivačný e-mail.',
            ], 201);
        });
    }
}