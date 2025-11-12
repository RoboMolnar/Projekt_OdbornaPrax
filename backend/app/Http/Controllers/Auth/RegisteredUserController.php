<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RegisteredUserController extends Controller
{
    /**
     * Zobrazenie registračného formulára (Inertia).
     */
    public function create()
    {
        // sedí s resources/js/pages/auth/register.tsx
        return Inertia::render('auth/register');
    }

    /**
     * Spoločný handler registrácie.
     * Očakáva payload s 'role' a 'name'.
     */
    public function store(Request $request)
    {
        $role = $request->input('role', 'student');

        // ✅ Validácia dát
        $baseRules = [
            'role'              => ['required', Rule::in(['student','company','garant','admin'])],
            'email'             => ['required','email','max:255','unique:users,email'],
            'password'          => ['required','min:8','confirmed'],
            'phone'             => ['nullable','string','max:30'],      // z formulára ide 'phone'
            'name'              => ['required','string','max:240'],     // jedno pole pre celé meno
            'address_id'        => ['nullable','integer'],
            'department_id'     => ['nullable','integer'],
            'field_of_study_id' => ['nullable','integer'],
            'company_id'        => ['nullable','integer'],
        ];

        $data = $request->validate($baseRules);

        // ✅ Rozdelenie mena na first_name a last_name
        $full = trim($data['name']);
        [$first, $last] = array_pad(preg_split('/\s+/', $full, 2), 2, '');

        // ✅ Vytvorenie používateľa
        $user = User::create([
            'role'              => $role,
            'email'             => $data['email'],
            'password'          => $data['password'],          // zahashuje sa v modeli (mutátor)
            'first_name'        => $first,
            'last_name'         => $last,
            'phone_number'      => $data['phone'] ?? null,     // správny názov v DB
            'address_id'        => $data['address_id'] ?? null,
            'department_id'     => $data['department_id'] ?? null,
            'field_of_study_id' => $data['field_of_study_id'] ?? null,
            'company_id'        => $data['company_id'] ?? null,
            'active'            => true,
        ]);

        // ✅ Event + login
        event(new Registered($user));
        Auth::login($user, false);
        $request->session()->regenerate();

        // ✅ Presmerovanie podľa role
        $target = match ($role) {
            'student' => route('dashboard.student'),
            'company' => route('dashboard'),
            default   => route('dashboard'),
        };

        return redirect()->intended($target);
    }

    /**
     * Alias pre POST /register-company
     */
    public function storeCompany(Request $request)
    {
        $request->merge(['role' => 'company']);
        return $this->store($request);
    }

    /**
     * Alias pre POST /register-student
     */
    public function storeStudent(Request $request)
    {
        $request->merge(['role' => 'student']);
        return $this->store($request);
    }
}
