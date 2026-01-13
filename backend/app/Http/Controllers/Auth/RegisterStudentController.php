<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\InitialPasswordMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class RegisterStudentController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate(
            [
                'first_name'        => ['required','string','max:100'],
                'last_name'         => ['required','string','max:100'],

                // ✅ študentský email musí byť @student.ukf.sk
                'email'             => ['required','email','max:255','unique:users,email','ends_with:@student.ukf.sk'],

                // ✅ alternatívny email
                'alternative_email' => ['nullable','email','max:255','different:email'],

                // ✅ telefón (realisticky)
                'phone_number'      => ['required','regex:/^\+?[0-9]{9,15}$/'],

                // ✅ povinná adresa študenta
                'street'            => ['required','string','max:255'],
                'city'              => ['required','string','max:255'],
                'zip'               => ['required','regex:/^\d{3}\s?\d{2}$/'],
                'country'           => ['required','string','max:100'],

                // ✅ odbor ide do users.study_type
                'study_type'        => ['required','in:AI22m,AI22b'],
            ],
            [
                'email.ends_with'         => 'Študentský e-mail musí končiť na @student.ukf.sk.',
                'phone_number.regex'      => 'Telefón musí obsahovať 9 až 15 číslic (voliteľne s +).',
                'zip.regex'               => 'PSČ musí byť vo formáte 81101 alebo 811 01.',
                'study_type.required'     => 'Študijný odbor je povinný.',
                'study_type.in'           => 'Neplatný študijný odbor.',
                'alternative_email.email' => 'Alternatívny e-mail musí byť platný.',
                'alternative_email.different' => 'Alternatívny e-mail musí byť iný ako študentský e-mail.',
            ]
        );

        return DB::transaction(function () use ($data) {

            // ✅ vytvor adresu
            $addressId = DB::table('address')->insertGetId([
                'street'     => $data['street'],
                'city'       => $data['city'],
                'zip'        => $data['zip'],
                'country'    => $data['country'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $plain = Str::password(14, true, true, false, false);

            $user = User::create([
                'role'                 => 'student',
                'first_name'           => $data['first_name'],
                'last_name'            => $data['last_name'],
                'email'                => $data['email'],
                'alternative_email'    => $data['alternative_email'] ?? null, // ✅ tu
                'phone_number'         => $data['phone_number'],
                'password'             => Hash::make($plain),
                'active'               => 1,
                'must_change_password' => 1,
                'address_id'           => $addressId,
                'study_type'           => $data['study_type'],
            ]);


            try {
                Mail::to($user->email)->send(new InitialPasswordMail($user, $plain));
            } catch (\Throwable $e) {
                report($e);
            }

            return response()->json(['message' => 'Študent zaregistrovaný. Dočasné heslo odoslané.'], 201);
        });
    }
}