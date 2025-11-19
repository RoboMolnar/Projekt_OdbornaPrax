<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Company;
use App\Models\Internship;
use Illuminate\Http\Request;

class InternshipController extends Controller
{
    /**
     * Vráti všetky praxe prihláseného študenta.
     */
    public function index(Request $request)
{
    $user = $request->user();

    if (!$user || $user->role !== 'student') {
        return response()->json(['message' => 'Len študent môže vidieť svoje praxe.'], 403);
    }

    $internships = Internship::with(['company', 'state'])
        ->where('student_user_id', $user->user_id)
        ->orderByDesc('created_at')
        ->get();

    $result = $internships->map(function (Internship $internship) {
        return [
            'id'     => $internship->internship_id,
            'firm'   => $internship->company?->company_name ?? '',
            'year'   => $internship->year,
            'status' => $internship->state?->internship_state_name ?? '',
        ];
    });

    return response()->json($result);
}


    /**
     * Uloží novú prax z formulára.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'student') {
            return response()->json(['message' => 'Len študent môže vytvoriť prax.'], 403);
        }

        $data = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'street'       => ['nullable', 'string', 'max:80'],
            'city'         => ['required', 'string', 'max:60'],
            'zip'          => ['nullable', 'string', 'max:15'],
            'country'      => ['nullable', 'string', 'max:60'],
            'start_date'   => ['required', 'date'],
            'end_date'     => ['required', 'date', 'after_or_equal:start_date'],
            'year'         => ['required', 'integer'],
            'semester'     => ['required', 'in:1,2'],
            'worked_hours' => ['nullable', 'integer', 'min:0'],
        ]);

        // 1) adresa (ak je niečo zadané)
        $addressId = null;
        if ($data['street'] || $data['city'] || $data['zip'] || $data['country']) {
            $address = Address::create([
                'street'  => $data['street'] ?? null,
                'city'    => $data['city'] ?? null,
                'zip'     => $data['zip'] ?? null,
                'country' => $data['country'] ?? null,
            ]);
            $addressId = $address->address_id;
        }

        // 2) firma – ak existuje podľa názvu, zoberieme ju, inak vytvoríme
        // 2) firma – ak existuje podľa názvu, zoberieme ju, inak vytvoríme
$company = Company::where('company_name', $data['company_name'])->first();

if (!$company) {
    $company = Company::create([
        'company_name'  => $data['company_name'],
        'ico'           => null,
        'dic'           => null,
        'email'         => null,
        'phone_contact' => null,
        'address_id'    => $addressId,
    ]);
} elseif ($addressId && !$company->address_id) {
    $company->address_id = $addressId;
    $company->save();
}


        // 3) garant – DOČASNE použijeme samotného študenta, aby nepadol NOT NULL
        $garantId = $user->user_id;

        // 4) samotná prax
        $internship = Internship::create([
            'student_user_id' => $user->user_id,
            'garant_user_id'  => $garantId,
            'company_id'      => $company->company_id,
            'start_date'      => $data['start_date'],
            'end_date'        => $data['end_date'],
            'year'            => $data['year'],
            'semester'        => $data['semester'],
            'worked_hours'    => $data['worked_hours'] ?? null,
            'grade'           => null,
            'state_id'        => 1, // počiatočný stav
        ]);

        return response()->json([
            'ok'             => true,
            'internship_id'  => $internship->internship_id,
        ], 201);
    }
    public function show(Request $request, int $id)
{
    $user = $request->user();

    if (!$user || $user->role !== 'student') {
        return response()->json(['message' => 'Len študent môže vidieť svoje praxe.'], 403);
    }

    $internship = Internship::with(['company.address', 'state'])
        ->where('student_user_id', $user->user_id)
        ->where('internship_id', $id)
        ->firstOrFail();

    return response()->json([
        'id'            => $internship->internship_id,
        'company_name'  => $internship->company?->company_name,
        'street'        => $internship->company?->address?->street,
        'city'          => $internship->company?->address?->city,
        'zip'           => $internship->company?->address?->zip,
        'country'       => $internship->company?->address?->country,
        'start_date'    => $internship->start_date,
        'end_date'      => $internship->end_date,
        'year'          => $internship->year,
        'semester'      => $internship->semester,
        'worked_hours'  => $internship->worked_hours,
        'status'        => $internship->state?->internship_state_name,
    ]);
}

}
