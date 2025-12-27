<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Internship;
use App\Models\InternshipState;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentInternshipController extends Controller
{
    /**
     * Vráti prihláseného usera a overí, že je študent.
     * - 401 ak nie je prihlásený
     * - 403 ak nie je študent
     */
    private function requireStudent(Request $request)
    {
        $user = $request->user(); // route je pod auth:sanctum

        if (!$user) {
            abort(response()->json(['message' => 'Neprihlásený používateľ.'], 401));
        }

        // Robustné čítanie roly (ak to máš v DB rôzne pomenované)
        $rawRole =
            $user->role
            ?? $user->role_name
            ?? $user->type
            ?? null;

        $role = $rawRole !== null ? strtolower(trim((string)$rawRole)) : null;

        if ($role !== 'student') {
            // Ak chceš ešte lepší debug, dočasne si to môžeš pozrieť v response:
            // return response()->json(['message' => 'Prístup povolený len pre študenta.', 'debug_role' => $rawRole, 'debug_user_id' => $user->user_id ?? $user->id], 403);

            abort(response()->json(['message' => 'Prístup povolený len pre študenta.'], 403));
        }

        return $user;
    }

    /**
     * Zoznam praxí prihláseného študenta.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $this->requireStudent($request);

        $rows = DB::table('internship')
            ->join('company', 'company.company_id', '=', 'internship.company_id')
            ->join('internship_state', 'internship_state.internship_state_id', '=', 'internship.state_id')
            ->where('internship.student_user_id', $user->user_id)
            ->orderByDesc('internship.year')
            ->orderByDesc('internship.internship_id')
            ->selectRaw('
                internship.internship_id as id,
                company.company_name       as firm,
                internship.year            as year,
                internship_state.internship_state_name as status
            ')
            ->get();

        return response()->json($rows);
    }

    /**
     * Študent vytvorí novú prax.
     */
    public function store(Request $request): JsonResponse
{
    $user = $this->requireStudent($request);

    $data = $request->validate([
        'company_name' => ['required', 'string', 'max:120'],
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

    $internshipId = DB::transaction(function () use ($data, $user) {
        // 1) adresa firmy
        $addressId = null;
        if ($data['street'] || $data['city'] || $data['zip'] || $data['country']) {
            $addressId = DB::table('address')->insertGetId([
                'street'  => $data['street']  ?: null,
                'city'    => $data['city']    ?: null,
                'zip'     => $data['zip']     ?: null,
                'country' => $data['country'] ?: null,
            ]);
        }

        // 2) firma podla nazvu
        $company = DB::table('company')
            ->where('company_name', $data['company_name'])
            ->first();

        if ($company) {
            $companyId = $company->company_id;
        } else {
            $now = now();
            $companyId = DB::table('company')->insertGetId([
                'company_name'  => $data['company_name'],
                'ico'           => null,
                'dic'           => null,
                'email'         => null,
                'phone_contact' => null,
                'address_id'    => $addressId,
                'created_at'    => $now,
                'updated_at'    => $now,
            ]);
        }

        // 3) stav "Vytvorena"
        $state = InternshipState::where('internship_state_name', 'Odoslaná na schválenie')->first();
        $stateId = $state?->internship_state_id;

        // 4) ulozenie praxe
        $now = now();
        return DB::table('internship')->insertGetId([
            'student_user_id' => $user->user_id,
            'company_id'      => $companyId,
            'garant_user_id'  => 100,
            'start_date'      => $data['start_date'],
            'end_date'        => $data['end_date'],
            'year'            => $data['year'],
            'semester'        => $data['semester'],
            'worked_hours'    => $data['worked_hours'] ?? null,
            'state_id'        => $stateId,
            'created_at'      => $now,
            'updated_at'      => $now,
        ]);
    });

    return response()->json([
        'message' => 'Prax bola vytvorená.',
        'internship_id' => $internshipId,
    ], 201);
}


    /**
     * Detail praxe pre študenta.
     */
    public function show(Request $request, int $internship): JsonResponse
    {
        $user = $this->requireStudent($request);

        $internshipModel = Internship::with(['company.address', 'state'])
            ->where('internship_id', $internship)
            ->where('student_user_id', $user->user_id)
            ->first();

        if (!$internshipModel) {
            return response()->json(['message' => 'Prax neexistuje alebo ti nepatrí.'], 404);
        }

        $company = $internshipModel->company;
        $address = $company?->address;
        $state   = $internshipModel->state;

        return response()->json([
            'id'           => $internshipModel->internship_id,
            'company_name' => $company?->company_name ?? '',
            'street'       => $address?->street ?? null,
            'city'         => $address?->city ?? null,
            'zip'          => $address?->zip ?? null,
            'country'      => $address?->country ?? null,
            'start_date'   => $internshipModel->start_date,
            'end_date'     => $internshipModel->end_date,
            'year'         => (int) $internshipModel->year,
            'semester'     => $internshipModel->semester,
            'worked_hours' => $internshipModel->worked_hours,
            'status'       => $state?->internship_state_name ?? '—',
        ]);
    }
}
