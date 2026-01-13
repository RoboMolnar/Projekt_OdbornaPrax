<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\AgreementService;

class StudentInternshipController extends Controller
{
    /**
     * Alias pre zobrazenie stavu v UI:
     * - DB stav "Schválená" sa má na FE zobrazovať ako "Prebieha"
     */
    private function mapStatusForUi(?string $status): ?string
    {
        if ($status === null) return null;
        return $status === 'Schválená' ? 'Prebieha' : $status;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $rows = DB::table('internship')
            ->join('company', 'company.company_id', '=', 'internship.company_id')
            ->join('internship_state', 'internship_state.internship_state_id', '=', 'internship.state_id')
            ->where('internship.student_user_id', $user->user_id)
            ->orderByDesc('internship.year')
            ->orderByDesc('internship.internship_id')
            ->selectRaw('
                internship.internship_id as id,
                company.company_name      as firm,
                internship.year           as year,
                internship.practice_type  as practice_type,
                internship_state.internship_state_name as status
            ')
            ->get();

        $rows = $rows->map(function ($row) {
            $row->status = $this->mapStatusForUi($row->status);
            return $row;
        });

        return response()->json($rows);
    }

    /**
     * ✅ NOVÁ PRAX: výber firmy (company_id), dátumy, rok, semester...
     * ✅ Firma musí byť aktivovaná: users.role='company' AND users.active=1
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate(
            [
                'practice_type' => ['required', 'in:standard,employment'],
                'company_id'    => ['required', 'integer'],

                'start_date'    => ['required', 'date'],
                'end_date'      => ['required', 'date', 'after_or_equal:start_date'],
                'year'          => ['required', 'integer', 'min:2000', 'max:2100'],
                'semester'      => ['required', 'in:1,2'],
                'worked_hours'  => ['nullable', 'integer', 'min:0'],
            ],
            [
                'company_id.required' => 'Firma je povinná.',
                'practice_type.required' => 'Typ praxe je povinný.',
            ]
        );

        // ✅ firma musí existovať a byť aktivovaná
        $companyOk = DB::table('company')
            ->join('users', function ($join) {
                $join->on('users.company_id', '=', 'company.company_id')
                    ->where('users.role', '=', 'company')
                    ->where('users.active', '=', 1);
            })
            ->where('company.company_id', $data['company_id'])
            ->exists();

        if (!$companyOk) {
            return response()->json([
                'message' => 'Vybraná firma neexistuje alebo nie je aktivovaná.',
                'errors' => ['company_id' => ['Vybraná firma neexistuje alebo nie je aktivovaná.']],
            ], 422);
        }

        // stav "Vytvorená"
        $stateId = DB::table('internship_state')
            ->where('internship_state_name', 'Vytvorená')
            ->value('internship_state_id');

        if (!$stateId) {
            $states = DB::table('internship_state')
                ->orderBy('internship_state_id')
                ->pluck('internship_state_name');

            return response()->json([
                'message' => 'Stav "Vytvorená" sa nenašiel v internship_state (DB backendu).',
                'db'      => config('database.connections.mysql.database'),
                'states'  => $states,
            ], 500);
        }

        $internshipId = DB::transaction(function () use ($data, $user, $stateId) {

            // garant - prvý garant, ak existuje
            $garantId = User::where('role', 'garant')->value('user_id') ?? null;

            $now = now();

            $internshipId = DB::table('internship')->insertGetId([
                'student_user_id' => $user->user_id,
                'company_id'      => $data['company_id'],
                'practice_type'   => $data['practice_type'],

                'garant_user_id'  => $garantId,

                'start_date'      => $data['start_date'],
                'end_date'        => $data['end_date'],
                'year'            => $data['year'],
                'semester'        => $data['semester'],

                'worked_hours'    => $data['worked_hours'] ?? 0,

                'state_id'        => $stateId,

                'created_at'      => $now,
                'updated_at'      => $now,
            ], 'internship_id');

            // log zmeny stavu
            DB::table('internship_state_change')->insert([
                'internship_id'      => $internshipId,
                'from_state_id'      => null,
                'to_state_id'        => $stateId,
                'changed_by_user_id' => $user->user_id,
                'note'               => 'Vytvorenie praxe',
                'changed_at'         => $now,
            ]);

            return $internshipId;
        });

        // ✅ DOPLNENÉ: po vytvorení štandardnej praxe skús vygenerovať dohodu
        if (($data['practice_type'] ?? null) === 'standard') {
            try {
                app(AgreementService::class)->ensureGenerated((int)$internshipId);
            } catch (\Throwable $e) {
                report($e); // nech to nezablokuje vytvorenie praxe
            }
        }

        return response()->json(['id' => $internshipId], 201);
    }

    public function show(Request $request, int $internship): JsonResponse
    {
        $user = $request->user();

        $row = DB::table('internship')
            ->join('company', 'company.company_id', '=', 'internship.company_id')
            ->leftJoin('address', 'address.address_id', '=', 'company.address_id')
            ->join('internship_state', 'internship_state.internship_state_id', '=', 'internship.state_id')
            ->where('internship.internship_id', $internship)
            ->where('internship.student_user_id', $user->user_id)
            ->selectRaw('
                internship.practice_type as practice_type,
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

        $row->status = $this->mapStatusForUi($row->status);

        return response()->json($row);
    }

    public function update(Request $request, int $internship): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'start_date'   => ['required', 'date'],
            'end_date'     => ['required', 'date', 'after_or_equal:start_date'],
            'year'         => ['required', 'integer', 'min:2000', 'max:2100'],
            'semester'     => ['required', 'in:1,2'],
            'worked_hours' => ['nullable', 'integer', 'min:0'],
        ]);

        $exists = DB::table('internship')
            ->where('internship_id', $internship)
            ->where('student_user_id', $user->user_id)
            ->exists();

        if (!$exists) {
            return response()->json(['message' => 'Prax neexistuje alebo ti nepatrí.'], 404);
        }

        DB::table('internship')
            ->where('internship_id', $internship)
            ->update([
                'start_date'   => $data['start_date'],
                'end_date'     => $data['end_date'],
                'year'         => $data['year'],
                'semester'     => $data['semester'],
                'worked_hours' => $data['worked_hours'] ?? 0,
                'updated_at'   => now(),
            ]);

        return response()->json(['message' => 'Uložené.']);
    }

    public function destroy(Request $request, int $internship): JsonResponse
    {
        $user = $request->user();

        $exists = DB::table('internship')
            ->where('internship_id', $internship)
            ->where('student_user_id', $user->user_id)
            ->exists();

        if (!$exists) {
            return response()->json(['message' => 'Prax neexistuje alebo ti nepatrí.'], 404);
        }

        DB::table('internship_state_change')->where('internship_id', $internship)->delete();
        DB::table('internship')->where('internship_id', $internship)->delete();

        return response()->json(['message' => 'Zmazané.']);
    }
}