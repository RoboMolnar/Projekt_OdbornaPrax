<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\InitialPasswordMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class RegisterStudentController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name'   => ['required','string','max:100'],
            'last_name'    => ['required','string','max:100'],
            'email'        => ['required','email','max:255','unique:users,email'],
            'phone_number' => ['nullable','string','max:50'],
        ]);

        $plain = Str::password(14);

        $user = User::create([
            'role'                 => 'student',
            'first_name'           => $data['first_name'],
            'last_name'            => $data['last_name'],
            'email'                => $data['email'],
            'phone_number'         => $data['phone_number'] ?? null,
            'password'             => Hash::make($plain),
            'active'               => 1,   // študent hneď aktívny
            'must_change_password' => 1,
        ]);

        Mail::to($user->email)->send(new InitialPasswordMail($user, $plain));

        return response()->json(['message' => 'Študent zaregistrovaný. Dočasné heslo odoslané.'], 201);
    }
}
