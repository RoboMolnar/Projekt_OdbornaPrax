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

        $rawRole =
            $user->role
            ?? $user->role_name
            ?? $user->type
            ?? null;

        $role = $rawRole !== null ? strtolower(trim((string) $rawRole)) : null;

        if ($role !== 'student') {
            abort(response()->json(['message' => 'Prístup povolený len pre študenta.'], 403));
        }

        return $user;
    }

    /**
     * Načíta prax patriacu prihlásenému študentovi alebo vráti 404.
     */
    private function findOwnedInternship(Request $request, int $internshipId): Internship
    {
        $user = $this->requireStudent($request);

        $internship = Internship::with(['company.address', 'state'])
            ->where('internship_id', $internshipId)
            ->where('student_user_id', $user->user_id)
            ->first();

        if (!$internship) {
            abort(response()->json(['message' => 'Prax neexistuje alebo ti nepatrí.'], 404));
        }

        return $internship;
    }

    /**
     * (Voliteľné) obmedzenie edit/mazania podľa stavu.
     * Podľa nového workflow:
     * - študent môže upravovať iba v stave "Vytvorená"
     * - po potvrdení/zamietnutí/schválení a finálnych stavoch už neupravuje
     */
    private function ensureEditableState(Internship $internship): void
    {
        $stateName = $internship->state?->internship_state_name;

        // Blokované stavy (už nie je možné upravovať)
        $blocked = [
            'Potvrdená',
            'Zamietnutá',
            'Schválená',
            'Neschválená',
            'Obhájená',
            'Neobhájená',
        ];

        if ($stateName && in_array($stateName, $blocked, true)) {
            abort(response()->json(['message' => 'Túto prax už nie je možné upravovať.'], 422));
        }
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

        // UI alias: "Schválená" -> "Prebieha"
        $rows = $rows->map(function ($row) {
            $row->status = $this->mapStatusForUi($row->status);
            return $row;
        });

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

            // 3) stav = "Vytvorená" (podľa nového workflow)
            $stateId = InternshipState::where('internship_state_name', 'Vytvorená')
                ->value('internship_state_id');

            if (!$stateId) {
                // nech to padne kontrolovane, nie SQLSTATE
                throw new \RuntimeException('Stav "Vytvorená" neexistuje v tabuľke internship_state.');
            }

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
        $internshipModel = $this->findOwnedInternship($request, $internship);

        $company = $internshipModel->company;
        $address = $company?->address;
        $state   = $internshipModel->state;

        $status = $state?->internship_state_name ?? '—';
        $status = $this->mapStatusForUi($status);

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
            'status'       => $status,
        ]);
    }

    /**
     * EDIT praxe študentom (bez zmeny firmy a bez zmeny stavu).
     * Upraviteľné: adresa, dátumy, rok, semester, odpracované hodiny.
     */
    public function update(Request $request, int $internship): JsonResponse
    {
        $internshipModel = $this->findOwnedInternship($request, $internship);

        // voliteľné pravidlo: neumožniť edit pri finálnych stavoch
        $this->ensureEditableState($internshipModel);

        $data = $request->validate([
            'street'       => ['nullable', 'string', 'max:80'],
            'city'         => ['nullable', 'string', 'max:60'],
            'zip'          => ['nullable', 'string', 'max:15'],
            'country'      => ['nullable', 'string', 'max:60'],

            'start_date'   => ['sometimes', 'date'],
            'end_date'     => ['sometimes', 'date', 'after_or_equal:start_date'],
            'year'         => ['sometimes', 'integer'],
            'semester'     => ['sometimes', 'in:1,2'],
            'worked_hours' => ['nullable', 'integer', 'min:0'],
        ]);

        // Bezpečnostná poistka: ignorujeme pokusy meniť firmu/stav
        unset($data['company_name'], $data['company_id'], $data['state_id'], $data['status']);

        DB::transaction(function () use ($data, $internshipModel) {
            // update internship polia
            $internshipUpdate = [];
            foreach (['start_date', 'end_date', 'year', 'semester', 'worked_hours'] as $k) {
                if (array_key_exists($k, $data)) {
                    $internshipUpdate[$k] = $data[$k];
                }
            }

            if (!empty($internshipUpdate)) {
                $internshipUpdate['updated_at'] = now();
                DB::table('internship')
                    ->where('internship_id', $internshipModel->internship_id)
                    ->update($internshipUpdate);
            }

            // update adresy firmy (pozri upozornenie hore – môže byť zdieľaná)
            $company = $internshipModel->company;
            if ($company) {
                $addrUpdate = [];
                foreach (['street', 'city', 'zip', 'country'] as $k) {
                    if (array_key_exists($k, $data)) {
                        $addrUpdate[$k] = $data[$k];
                    }
                }

                if (!empty($addrUpdate)) {
                    $addrUpdate['updated_at'] = now();

                    if ($company->address_id) {
                        DB::table('address')
                            ->where('address_id', $company->address_id)
                            ->update($addrUpdate);
                    } else {
                        // firma nemá adresu -> vytvoríme novú a pripojíme
                        $addrUpdate['created_at'] = now();
                        $newAddressId = DB::table('address')->insertGetId($addrUpdate);

                        DB::table('company')
                            ->where('company_id', $company->company_id)
                            ->update([
                                'address_id' => $newAddressId,
                                'updated_at' => now(),
                            ]);
                    }
                }
            }
        });

        // vráť aktualizovaný detail v rovnakom formáte ako show()
        $fresh = Internship::with(['company.address', 'state'])
            ->where('internship_id', $internshipModel->internship_id)
            ->first();

        $company = $fresh?->company;
        $address = $company?->address;
        $state   = $fresh?->state;

        $status = $state?->internship_state_name ?? '—';
        $status = $this->mapStatusForUi($status);

        return response()->json([
            'id'           => $fresh?->internship_id,
            'company_name' => $company?->company_name ?? '',
            'street'       => $address?->street ?? null,
            'city'         => $address?->city ?? null,
            'zip'          => $address?->zip ?? null,
            'country'      => $address?->country ?? null,
            'start_date'   => $fresh?->start_date,
            'end_date'     => $fresh?->end_date,
            'year'         => (int) ($fresh?->year ?? 0),
            'semester'     => $fresh?->semester,
            'worked_hours' => $fresh?->worked_hours,
            'status'       => $status,
        ]);
    }

    /**
     * ZMAZANIE praxe študentom.
     */
    public function destroy(Request $request, int $internship): JsonResponse
    {
        $internshipModel = $this->findOwnedInternship($request, $internship);

        // voliteľné pravidlo: neumožniť zmazať pri finálnych stavoch
        $this->ensureEditableState($internshipModel);

        DB::table('internship')
            ->where('internship_id', $internshipModel->internship_id)
            ->delete();

        return response()->json(['ok' => true]);
    }
}
