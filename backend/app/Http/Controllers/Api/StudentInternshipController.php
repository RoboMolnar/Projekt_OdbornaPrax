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
     * Zoznam praxí prihláseného študenta.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (($user->role ?? null) !== 'student') {
            return response()->json(['message' => 'Prístup povolený len pre študenta.'], 403);
        }

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
     *
     * KĽÚČOVÉ: musíme dostať company_id a zapísať ho do internship.company_id.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (($user->role ?? null) !== 'student') {
            return response()->json(['message' => 'Prístup povolený len pre študenta.'], 403);
        }

        $data = $request->validate([
            'company_id'   => ['required', 'exists:company,company_id'],  // 👈 firma MUSÍ existovať
            'start_date'   => ['required', 'date'],
            'end_date'     => ['required', 'date', 'after_or_equal:start_date'],
            'year'         => ['required', 'integer'],
            'semester'     => ['required', 'in:1,2'],
            'worked_hours' => ['nullable', 'integer', 'min:0'],
        ]);

        // predvolený stav "Vytvorená"
        $state = InternshipState::where('internship_state_name', 'Vytvorená')->first();

        $internship = Internship::create([
            'student_user_id' => $user->user_id,
            'company_id'      => $data['company_id'],          // 👈 TOTO JE POINTA
            'garant_user_id'  => null,                         // garanta môžeš priradiť inde
            'start_date'      => $data['start_date'],
            'end_date'        => $data['end_date'],
            'year'            => $data['year'],
            'semester'        => $data['semester'],
            'worked_hours'    => $data['worked_hours'] ?? null,
            'state_id'        => $state?->internship_state_id,
        ]);

        return response()->json([
            'message'       => 'Prax bola vytvorená.',
            'internship_id' => $internship->internship_id,
        ], 201);
    }

    /**
     * Detail praxe pre študenta.
     */
    public function show(Request $request, int $internshipId): JsonResponse
    {
        $user = $request->user();

        if (($user->role ?? null) !== 'student') {
            return response()->json(['message' => 'Prístup povolený len pre študenta.'], 403);
        }

        $internship = Internship::with(['company.address', 'state'])
            ->where('internship_id', $internshipId)
            ->where('student_user_id', $user->user_id)
            ->first();

        if (!$internship) {
            return response()->json(['message' => 'Prax neexistuje alebo ti nepatrí.'], 404);
        }

        $company = $internship->company;
        $address = $company?->address;
        $state   = $internship->state;

        $detail = [
            'id'           => $internship->internship_id,
            'company_name' => $company?->company_name ?? '',
            'street'       => $address?->street ?? null,
            'city'         => $address?->city ?? null,
            'zip'          => $address?->zip ?? null,
            'country'      => $address?->country ?? null,
            'start_date'   => $internship->start_date,
            'end_date'     => $internship->end_date,
            'year'         => (int) $internship->year,
            'semester'     => $internship->semester,
            'worked_hours' => $internship->worked_hours,
            'status'       => $state?->internship_state_name ?? '—',
        ];

        return response()->json($detail);
    }
}