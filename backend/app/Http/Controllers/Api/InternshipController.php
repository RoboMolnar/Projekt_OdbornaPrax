<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InternshipController extends Controller
{
    /**
     * Alias pre zobrazenie stavu v UI:
     * - DB stav "Schválená" sa má na FE zobrazovať ako "Prebieha"
     */
    private function mapStatusForUi(?string $status): ?string
    {
        if ($status === null) {
            return null;
        }

        return $status === 'Schválená' ? 'Prebieha' : $status;
    }

    /**
     * ✅ Vyhľadávanie firiem pre študenta (fulltext-like cez LIKE)
     * Zobrazujeme iba firmy, ktoré majú aktívny company účet:
     * users.role = 'company' AND users.active = 1
     *
     * GET /api/companies/search?q=...
     */
    public function companySearch(Request $request): JsonResponse
    {
        $user = $request->user();

        if (($user->role ?? null) !== 'student') {
            return response()->json(['message' => 'Prístup povolený len pre študenta.'], 403);
        }

        $q = trim((string) $request->query('q', ''));
        $limit = (int) $request->query('limit', 20);
        $limit = max(1, min($limit, 50));

        $rows = DB::table('company')
            ->join('users', function ($join) {
                $join->on('users.company_id', '=', 'company.company_id')
                    ->where('users.role', '=', 'company')
                    ->where('users.active', '=', 1); // ✅ iba aktivované firmy
            })
            ->leftJoin('address', 'address.address_id', '=', 'company.address_id')
            ->select([
                'company.company_id',
                'company.company_name',
                'company.ico',
                'company.dic',
                'address.city',
                'address.street',
            ])
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($s) use ($q) {
                    $s->where('company.company_name', 'like', "%{$q}%")
                        ->orWhere('company.ico', 'like', "%{$q}%")
                        ->orWhere('company.dic', 'like', "%{$q}%");
                });
            })
            ->distinct()
            ->orderBy('company.company_name')
            ->limit($limit)
            ->get();

        return response()->json($rows);
    }

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

        $rows = $rows->map(function ($row) {
            $row->status = $this->mapStatusForUi($row->status);
            return $row;
        });

        return response()->json($rows);
    }

    /**
     * ✅ Vytvorenie praxe výberom firmy (company_id), dátumy + rok + semester
     * Firma musí byť aktivovaná (users.active = 1).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if (($user->role ?? null) !== 'student') {
            return response()->json(['message' => 'Prístup povolený len pre študenta.'], 403);
        }

        $data = $request->validate([
            // ✅ firma sa vyberá zo zoznamu
            'company_id' => [
                'required',
                'integer',
                function ($attribute, $value, $fail) {
                    $ok = DB::table('company')
                        ->join('users', function ($join) {
                            $join->on('users.company_id', '=', 'company.company_id')
                                ->where('users.role', '=', 'company')
                                ->where('users.active', '=', 1);
                        })
                        ->where('company.company_id', $value)
                        ->exists();

                    if (!$ok) {
                        $fail('Vybraná firma neexistuje alebo nie je aktivovaná.');
                    }
                },
            ],

            'start_date'   => ['required', 'date'],
            'end_date'     => ['required', 'date', 'after_or_equal:start_date'],
            'year'         => ['required', 'integer', 'min:2000', 'max:2100'],
            'semester'     => ['required', 'in:1,2'],
            'worked_hours' => ['nullable', 'integer', 'min:0'],

            // ak FE pošle practice_type, necháme len štandard
            'practice_type' => ['nullable', 'in:standard'],
        ]);

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

            $garantId = User::where('role', 'garant')->value('user_id') ?? null;

            $now = now();

            $internshipId = DB::table('internship')->insertGetId([
                'student_user_id' => $user->user_id,
                'company_id'      => $data['company_id'],

                // ✅ aby to nikdy nepadlo, keď je practice_type NOT NULL
                'practice_type'   => $data['practice_type'] ?? 'standard',

                'garant_user_id'  => $garantId,

                'start_date'      => $data['start_date'],
                'end_date'        => $data['end_date'],
                'year'            => $data['year'],
                'semester'        => $data['semester'],

                // ✅ bezpečne (ak je worked_hours v DB NOT NULL)
                'worked_hours'    => $data['worked_hours'] ?? 0,

                // ✅ správny stĺpec v internship tabuľke
                'state_id'        => $stateId,

                'created_at'      => $now,
                'updated_at'      => $now,
            ], 'internship_id');

            // voliteľné: log zmeny stavu (máš tabuľku internship_state_change)
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

        return response()->json(['id' => $internshipId], 201);
    }

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

        $row->status = $this->mapStatusForUi($row->status);

        return response()->json($row);
    }
}