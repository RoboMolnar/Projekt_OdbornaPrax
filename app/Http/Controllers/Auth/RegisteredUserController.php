<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Registered;

class RegisteredUserController extends Controller
{
    public function create()
    {
        return Inertia::render('auth/register'); // resources/js/pages/auth/register.tsx
    }

    public function store(Request $request)
    {
        return $request->input('account_type') === 'company'
            ? $this->storeCompany($request)
            : $this->storeStudent($request);
    }

    public function storeStudent(Request $request)
    {
        $data = $request->validate([
            'name'       => ['required','string','max:45'],
            'email'      => ['required','email','max:255', Rule::unique('student','email')],
            'password'   => ['required','confirmed','min:8'],
            'title'      => ['nullable','string','max:45'],
            // FE môže neposielať – dáme defaulty
            'year'       => ['nullable','integer'],
            'study_type' => ['nullable','string','max:45'],
            'major'      => ['nullable','string','max:45'],
        ]);

        $user = User::create([
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => Hash::make($data['password']),
            'year'       => $data['year']       ?? 1,
            'study_type' => $data['study_type'] ?? 'unknown',
            'major'      => $data['major']      ?? 'unknown',
            'title'      => $data['title']      ?? null,
        ]);

        event(new Registered($user));
        Auth::guard('web')->login($user, false);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function storeCompany(Request $request)
    {
        $data = $request->validate([
            'name'         => ['required','string','max:255'], // kontaktná osoba
            'company_name' => ['required','string','max:255'], // názov firmy
            'email'        => ['required','email','max:255', Rule::unique('company','email')],
            'password'     => ['required','confirmed','min:8'],
            'phone'        => ['nullable','string','max:45'],
            'company_id'   => ['nullable','string','max:45'],   // ICO
            'company_vat'  => ['nullable','string','max:45'],   // DIC / IČ DPH
        ]);

        $company = Company::create([
            'name'               => $data['company_name'],
            'ICO'                => $data['company_id'] ?? null,
            'DIC'                => $data['company_vat'] ?? null,
            'email'              => $data['email'],
            'password'           => Hash::make($data['password']),
            'phone_contact'      => $data['phone'] ?? '',
            'responsible_person' => $data['name'],
            'street'             => null,
            'city'               => null,
            'country'            => null,
            'postal_code'        => null,
        ]);

        event(new Registered($company));
        Auth::guard('company')->login($company, false);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }
}
