<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Internship;
use App\Models\InternshipState;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InternshipController extends Controller
{
    /**
     * Zoznam praxí prihláseného študenta
     * (používa sa v dashboardStudent.tsx – /api/student/internships).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (($user->role ?? null) !== 'student') {
            return response()->json(['message' => 'Prístup povolený len pre študenta.'], 403);
        }

        // join s company + internship_state, aby sme vedeli názov firmy a stav
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
     * Vytvorenie novej praxe študentom
     * (POST /api/student/internships).
     *
     * Očakáva payload:
     *  {
     *    company_name, street, city, zip, country,
     *    start_date, end_date, year, semester, worked_hours
     *  }
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (($user->role ?? null) !== 'student') {
            return response()->json(['message' => 'Prístup povolený len pre študenta.'], 403);
        }

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

            // 2) firma – ak existuje podľa názvu, použijeme ju, inak vytvoríme novú
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

            // 3) stav = "Vytvorená"
            $state = InternshipState::where('internship_state_name', 'Vytvorená')->first();
            $stateId = $state?->internship_state_id;

            // 4) default garant – prvý user s rolou "garant" (ak neexistuje, použijeme ID študenta)
            $garantId = User::where('role', 'garant')->value('user_id') ?? $user->user_id;

            // 5) samotná prax
            $now = now();
            $internshipId = DB::table('internship')->insertGetId([
                'student_user_id' => $user->user_id,
                'company_id'      => $companyId,
                'garant_user_id'  => $garantId,
                'start_date'      => $data['start_date'],
                'end_date'        => $data['end_date'],
                'year'            => $data['year'],
                'semester'        => $data['semester'],
                'worked_hours'    => $data['worked_hours'] ?? null,
                'state_id'        => $stateId,
                'created_at'      => $now,
                'updated_at'      => $now,
            ]);

            return $internshipId;
        });

        return response()->json(['id' => $internshipId], 201);
    }

    /**
     * Detail jednej praxe pre študenta
     * (GET /api/student/internships/{internship}).
     */
    public function show(Request $request, int $internship): JsonResponse
    {
        $user = $request->user();

        if (($user->role ?? null) !== 'student') {
            return response()->json(['message' => 'Prístup povolený len pre študenta.'], 403);
        }

        $row = DB::table('internship')
            ->join('company', 'company.company_id', '=', 'internship.company_id')
            ->leftJoin('address', 'address.address_id', '=', 'company.address_id')
            ->join('internship_state', 'internship_state.internship_state_id', '=', 'internship.state_id')
            ->where('internship.internship_id', $internship)
            ->where('internship.student_user_id', $user->user_id)
            ->selectRaw('
                internship.internship_id as id,
                company.company_name       as company_name,
                address.street             as street,
                address.city               as city,
                address.zip                as zip,
                address.country            as country,
                internship.start_date      as start_date,
                internship.end_date        as end_date,
                internship.year            as year,
                internship.semester        as semester,
                internship.worked_hours    as worked_hours,
                internship_state.internship_state_name as status
            ')
            ->first();

        if (!$row) {
            return response()->json(['message' => 'Prax neexistuje alebo ti nepatrí.'], 404);
        }

        return response()->json($row);
    }
}