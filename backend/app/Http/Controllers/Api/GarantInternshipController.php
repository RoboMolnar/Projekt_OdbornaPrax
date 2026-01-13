<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use App\Models\Internship;
use App\Models\InternshipState;
use App\Models\InternshipStateChange;
use App\Models\User;
use App\Mail\InternshipStateChanged;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use App\Http\Controllers\Api\InternshipDocumentsController;

class GarantInternshipController extends Controller
{
    private function isPg(): bool
    {
        try {
            $driver = DB::getDriverName();
            return strtolower((string) $driver) === 'pgsql';
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function requireGarant(Request $request): User
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user) {
            abort(401, 'Neprihlásený používateľ.');
        }

        $role = $user->role ?? null;
        if (!in_array($role, ['garant', 'external'], true)) {
            abort(403, 'Prístup povolený len pre garanta alebo externý systém.');
        }

        return $user;
    }

    private function findInternshipById(Request $request, $id): Internship
    {
        $user = $this->requireGarant($request);

        $query = Internship::query()->with(['student', 'company', 'state']);

        if (!app()->environment('local')) {
            $query->where('garant_user_id', $user->user_id);
        }

        $internship = $query->where('internship_id', $id)->first();

        if (!$internship) {
            abort(404, 'Prax sa nenašla.');
        }

        return $internship;
    }

    private function changeStateInternal(Internship $i, string $newStateName, User $actor): void
    {
        $state = InternshipState::query()
            ->where('internship_state_name', $newStateName)
            ->first();

        if (!$state) {
            abort(422, "Neznámy stav: {$newStateName}");
        }

        $oldStateId = (int) $i->state_id;
        $newStateId = (int) $state->internship_state_id;

        if ($oldStateId === $newStateId) {
            return;
        }

        DB::transaction(function () use ($i, $oldStateId, $newStateId, $actor) {
            $i->state_id = $newStateId;
            $i->save();

            InternshipStateChange::query()->create([
                'internship_id'      => (int) ($i->internship_id ?? $i->id),
                'from_state_id'      => $oldStateId,
                'to_state_id'        => $newStateId,
                'changed_by_user_id' => (int) ($actor->user_id ?? $actor->id),
                'changed_at'         => now(),
            ]);
        });
    }

    private function notifyStudent(Internship $i, ?string $old, string $new, User $actor): void
    {
        try {
            $i->loadMissing(['student', 'company', 'state']);
            $student = $i->student;

            if (!$student || empty($student->email)) {
                return;
            }

            $studentName = trim(($student->firstname ?? $student->first_name ?? '') . ' ' . ($student->lastname ?? $student->last_name ?? ''));
            if ($studentName === '') {
                $studentName = $student->name ?? 'študent';
            }

            $companyName = $i->company?->company_name ?? '—';
            $changedBy = $actor->role ?? 'systém';

            Mail::to($student->email)->send(
                new InternshipStateChanged($i, $old, $new, $studentName, $companyName, $changedBy)
            );
        } catch (\Throwable $e) {
            Log::warning('Email send failed: ' . $e->getMessage());
        }
    }

    private function notifyCompany(Internship $i, ?string $old, string $new, User $actor): void
    {
        try {
            $i->loadMissing(['company.users', 'student', 'state']);
            $company = $i->company;

            if (!$company) {
                return;
            }

            $companyUser = null;
            if ($company->relationLoaded('users')) {
                $companyUser = $company->users->firstWhere('role', 'company') ?? $company->users->first();
            }

            $toEmail = $companyUser?->email ?? $company->email ?? null;
            if (!$toEmail) {
                return;
            }

            $studentName = trim(($i->student?->firstname ?? $i->student?->first_name ?? '') . ' ' . ($i->student?->lastname ?? $i->student?->last_name ?? ''));
            if ($studentName === '') {
                $studentName = $i->student?->name ?? 'študent';
            }

            $subject = "Zmena stavu praxe: {$new}";
            $body = "Dobrý deň,\n\n"
                . "Prax študenta {$studentName} zmenila stav.\n"
                . "Predošlý stav: " . ($old ?? '—') . "\n"
                . "Nový stav: {$new}\n\n"
                . "Pozdravujeme,\nSystém evidencie praxí";

            Mail::raw($body, function ($m) use ($toEmail, $subject) {
                $m->to($toEmail)->subject($subject);
            });
        } catch (\Throwable $e) {
            Log::warning('Company notify failed: ' . $e->getMessage());
        }
    }

    private function ensureStandardContractUploaded(Internship $i): void
    {
        $typeId = DB::table('document_type')
            ->where('document_type_name', 'PRACTICE_CONTRACT')
            ->value('document_type_id');

        if (!$typeId) {
            abort(422, 'Chýba typ dokumentu PRACTICE_CONTRACT v databáze.');
        }

        $hasDoc = DB::table('documents')
            ->where('internship_id', (int) ($i->internship_id ?? $i->id))
            ->where('document_type_id', (int) $typeId)
            ->exists();

        if (!$hasDoc) {
            abort(422, 'Nie je možné schváliť prax bez nahratej podpísanej zmluvy.');
        }
    }

    /**
     * Spoločná query pre index + export (rešpektuje filtre)
     */
    private function baseQuery(Request $request)
    {
        $user    = $this->requireGarant($request);

        $q       = trim((string) $request->query('q', ''));
        $status  = (string) $request->query('status', '');
        $year    = (string) $request->query('year', '');
        $program = (string) $request->query('program', '');

        // ✅ NOVÉ – presné filtre
        $studentId = $request->query('student_user_id', null);
        $companyId = $request->query('company_id', null);

        $isPg    = $this->isPg();

        $query = Internship::query()
            // nechávam fieldOfStudy ako fallback, ale primárne ideme cez study_type
            ->with(['student.fieldOfStudy', 'company.address', 'company.users', 'state']);

        if (!app()->environment('local')) {
            $query->where('garant_user_id', $user->user_id);
        }

        // ✅ NOVÉ – aplikuj presné filtre (ak sú zadané)
        if ($studentId !== null && $studentId !== '') {
            $s = (string) $studentId;
            if (!ctype_digit($s)) {
                abort(422, 'Neplatný student_user_id.');
            }
            $query->where('student_user_id', (int) $s);
        }

        if ($companyId !== null && $companyId !== '') {
            $c = (string) $companyId;
            if (!ctype_digit($c)) {
                abort(422, 'Neplatný company_id.');
            }
            $query->where('company_id', (int) $c);
        }

        if ($q !== '') {
            if ($isPg) {
                $query->where(function ($sub) use ($q) {
                    $sub->whereHas('student', function ($s) use ($q) {
                        $s->whereRaw("concat(coalesce(firstname,''), ' ', coalesce(lastname,'')) ILIKE ?", ["%{$q}%"])
                          ->orWhereRaw("concat(coalesce(first_name,''), ' ', coalesce(last_name,'')) ILIKE ?", ["%{$q}%"])
                          ->orWhere('email', 'ILIKE', "%{$q}%")
                          ->orWhere('name', 'ILIKE', "%{$q}%");
                    })
                    ->orWhereHas('company', function ($c) use ($q) {
                        $c->where('company_name', 'ILIKE', "%{$q}%");
                    });
                });
            } else {
                $query->where(function ($sub) use ($q) {
                    $sub->whereHas('student', function ($s) use ($q) {
                        $s->where(DB::raw("CONCAT(IFNULL(firstname,''),' ',IFNULL(lastname,''))"), 'LIKE', "%{$q}%")
                          ->orWhere(DB::raw("CONCAT(IFNULL(first_name,''),' ',IFNULL(last_name,''))"), 'LIKE', "%{$q}%")
                          ->orWhere('email', 'LIKE', "%{$q}%")
                          ->orWhere('name', 'LIKE', "%{$q}%");
                    })
                    ->orWhereHas('company', function ($c) use ($q) {
                        $c->where('company_name', 'LIKE', "%{$q}%");
                    });
                });
            }
        }

        if ($status !== '' && $status !== 'all') {
            $query->whereHas('state', function ($s) use ($status) {
                $s->where('internship_state_name', $status);
            });
        }

        if ($year !== '' && $year !== 'all') {
            $query->where('year', (int) $year);
        }

        // ✅ OPRAVA: program filtruj podľa users.study_type (to je to, čo máš reálne vyplnené)
        if ($program !== '' && $program !== 'all') {
            $query->whereHas('student', function ($s) use ($program) {
                $s->where('study_type', $program);
            });
        }

        return $query;
    }

    public function indexAll(Request $request)
    {
        $query = $this->baseQuery($request);

        $rows = $query
            ->orderByDesc('internship_id')
            ->get()
            ->map(function (Internship $i) {
                $student = $i->student;
                $company = $i->company;
                $state   = $i->state;

                $fn = $student?->firstname ?? $student?->first_name ?? '';
                $ln = $student?->lastname  ?? $student?->last_name  ?? '';
                $nm = $student?->name ?? '';

                $studentName = trim($fn . ' ' . $ln);
                if ($studentName === '') {
                    $studentName = $nm;
                }

                // ✅ OPRAVA: program primárne zober z study_type (fallback na fieldOfStudy ak existuje)
                $program = $student?->study_type
                    ?? $student?->fieldOfStudy?->field_of_study_name
                    ?? null;

                return [
                    'practice_type' => $i->practice_type ?? 'standard',

                    'id'      => (int) ($i->internship_id ?? $i->id),
                    'student' => $studentName,
                    'program' => $program,
                    'firm'    => $company?->company_name ?? '—',
                    'year'    => (int) ($i->year ?? 0),
                    'status'  => $state?->internship_state_name ?? '—',
                ];
            });

        return response()->json($rows);
    }

    private function buildDetailPayload(Internship $i): array
    {
        $i->loadMissing(['student.fieldOfStudy', 'company.address', 'company.users', 'state']);
        $address = $i->company?->address;

        $fn = $i->student?->firstname ?? $i->student?->first_name ?? '';
        $ln = $i->student?->lastname  ?? $i->student?->last_name  ?? '';
        $nm = $i->student?->name ?? '';

        $companyUser = null;
        if ($i->company && $i->company->relationLoaded('users')) {
            $companyUser = $i->company->users->firstWhere('role', 'company') ?? $i->company->users->first();
        }

        $contactName = null;
        $contactPhone = null;
        $contactEmail = null;

        if ($companyUser) {
            $cfn = $companyUser->first_name ?? $companyUser->firstname ?? '';
            $cln = $companyUser->last_name  ?? $companyUser->lastname  ?? '';
            $cnm = $companyUser->name ?? '';

            $contactName = trim($cfn . ' ' . $cln);
            if ($contactName === '') {
                $contactName = ($cnm !== '' ? $cnm : null);
            }

            $contactPhone = $companyUser->phone_number ?? null;
            $contactEmail = $companyUser->email ?? null;
        }

        $companyEmail = $contactEmail ?? ($i->company?->email ?? null);
        $companyPhone = $contactPhone ?? ($i->company?->phone_contact ?? null);

        // ✅ OPRAVA: program primárne zober z study_type (fallback na fieldOfStudy ak existuje)
        $program = $i->student?->study_type
            ?? $i->student?->fieldOfStudy?->field_of_study_name
            ?? null;

        return [
            'id' => (int) ($i->internship_id ?? $i->id),

            'student_user_id' => (int) ($i->student_user_id ?? 0),
            'company_id'      => (int) ($i->company_id ?? 0),

            'student_firstname' => $fn !== '' ? $fn : ($nm !== '' ? $nm : ''),
            'student_lastname'  => $ln,
            'student_email'     => $i->student?->email ?? null,
            'program'           => $program,
            'practice_type' => $i->practice_type ?? 'standard',

            'company_name' => $i->company?->company_name ?? '—',
            'street'       => $address?->street ?? null,
            'city'         => $address?->city ?? null,
            'zip'          => $address?->zip ?? null,
            'country'      => $address?->country ?? null,

            'company_contact_name'  => $contactName,
            'company_contact_phone' => $companyPhone,
            'company_contact_email' => $companyEmail,

            'start_date'   => method_exists($i->start_date, 'toDateString') ? $i->start_date->toDateString() : (string) $i->start_date,
            'end_date'     => method_exists($i->end_date, 'toDateString') ? $i->end_date->toDateString() : (string) $i->end_date,
            'year'         => (int) $i->year,
            'semester'     => $i->semester ?? '',
            'worked_hours' => $i->worked_hours ?? null,
            'status'       => $i->state?->internship_state_name ?? '—',
        ];
    }

    public function show(Request $request, $internship)
    {
        $i = $this->findInternshipById($request, $internship);
        return response()->json($this->buildDetailPayload($i));
    }

    public function update(Request $request, $internship)
    {
        $this->requireGarant($request);
        $i = $this->findInternshipById($request, $internship);

        $data = $request->validate([
            'start_date'   => ['nullable', 'date'],
            'end_date'     => ['nullable', 'date', 'after_or_equal:start_date'],
            'year'         => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'semester'     => ['nullable', Rule::in(['1', '2'])],
            'worked_hours' => ['nullable', 'integer', 'min:0', 'max:10000'],

            'student_user_id' => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) {
                    if ($value === null) return;

                    $exists = User::query()
                        ->where('user_id', (int) $value)
                        ->where('role', 'student')
                        ->exists();

                    if (!$exists) {
                        $fail('Zvolený študent neexistuje.');
                    }
                }
            ],
            'company_id' => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) use ($i) {
                    if ($value === null) return;

                    $companyModel = $i->company()->getRelated();
                    $exists = $companyModel->newQuery()->whereKey((int) $value)->exists();

                    if (!$exists) {
                        $fail('Zvolená firma neexistuje.');
                    }
                }
            ],
        ]);

        DB::transaction(function () use ($i, $data) {
            $fields = ['start_date', 'end_date', 'year', 'semester', 'worked_hours', 'student_user_id', 'company_id'];
            $dirty = false;

            foreach ($fields as $f) {
                if (array_key_exists($f, $data)) {
                    $i->{$f} = $data[$f];
                    $dirty = true;
                }
            }

            if ($dirty) {
                $i->save();
            }
        });

        $i->refresh();
        return response()->json($this->buildDetailPayload($i));
    }

    public function exportCsv(Request $request)
    {
        $query = $this->baseQuery($request);

        $items = $query->orderByDesc('internship_id')->get();

        $filename = 'praxe_export_' . now()->format('Y-m-d') . '.csv';

        $headers = [
            'Internship ID',
            'Student meno',
            'Student email',
            'Odbor',
            'Firma',
            'Ulica',
            'Mesto',
            'PSČ',
            'Krajina',
            'Kontakt osoba',
            'Kontakt telefón',
            'Kontakt email',
            'Začiatok',
            'Koniec',
            'Rok',
            'Semester',
            'Odpracované hodiny',
            'Stav',
        ];

        return response()->streamDownload(function () use ($items, $headers) {
            $out = fopen('php://output', 'w');

            echo "\xEF\xBB\xBF";
            fwrite($out, "sep=;\n");
            fputcsv($out, $headers, ';');

            foreach ($items as $i) {
                $payload = $this->buildDetailPayload($i);

                $studentName = trim(($payload['student_firstname'] ?? '') . ' ' . ($payload['student_lastname'] ?? ''));
                if ($studentName === '') {
                    $studentName = ($payload['student_firstname'] ?? '');
                }

                fputcsv($out, [
                    $payload['id'] ?? '',
                    $studentName,
                    $payload['student_email'] ?? '',
                    $payload['program'] ?? '',
                    $payload['company_name'] ?? '',
                    $payload['street'] ?? '',
                    $payload['city'] ?? '',
                    $payload['zip'] ?? '',
                    $payload['country'] ?? '',
                    $payload['company_contact_name'] ?? '',
                    $payload['company_contact_phone'] ?? '',
                    $payload['company_contact_email'] ?? '',
                    $payload['start_date'] ?? '',
                    $payload['end_date'] ?? '',
                    $payload['year'] ?? '',
                    $payload['semester'] ?? '',
                    $payload['worked_hours'] ?? '',
                    $payload['status'] ?? '',
                ], ';');
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function approve(Request $request, $internship)
    {
        $user = $this->requireGarant($request);
        $i = $this->findInternshipById($request, $internship);

        $i->loadMissing(['state', 'student', 'company']);

        $old = $i->state->internship_state_name ?? null;

        if (!in_array($old, ['Potvrdená', 'Neschválená'], true)) {
            return response()->json([
                'ok' => false,
                'message' => 'Schváliť možno len prax v stave Potvrdená alebo Neschválená.',
            ], 422);
        }

        $this->ensureStandardContractUploaded($i);

        if (($i->practice_type ?? 'standard') === 'employment') {
            $docsCtrl = app(InternshipDocumentsController::class);
            $comp = $docsCtrl->employmentCompliance($i);
            if (!($comp['ok'] ?? false)) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Nie je možné schváliť prax typu "Platené zamestnanie" bez dokladov (zmluva alebo 3 po sebe idúce faktúry).',
                ], 422);
            }
        }

        $this->changeStateInternal($i, 'Schválená', $user);

        $this->notifyStudent($i, $old, 'Schválená', $user);
        $this->notifyCompany($i, $old, 'Schválená', $user);

        return response()->json(['ok' => true, 'status' => 'Schválená']);
    }

    public function reject(Request $request, $internship)
    {
        $user = $this->requireGarant($request);
        $i = $this->findInternshipById($request, $internship);

        $i->loadMissing(['state', 'student', 'company']);

        $old = $i->state->internship_state_name ?? null;

        if (!in_array($old, ['Potvrdená', 'Schválená'], true)) {
            return response()->json([
                'ok' => false,
                'message' => 'Neschváliť možno len prax v stave Potvrdená alebo Schválená.',
            ], 422);
        }

        $this->changeStateInternal($i, 'Neschválená', $user);
        $this->notifyStudent($i, $old, 'Neschválená', $user);
        $this->notifyCompany($i, $old, 'Neschválená', $user);

        return response()->json(['ok' => true, 'status' => 'Neschválená']);
    }

    public function grade(Request $request, $internship)
    {
        $user = $this->requireGarant($request);
        $i = $this->findInternshipById($request, $internship);

        $i->loadMissing(['state']);

        $old = $i->state->internship_state_name ?? null;

        $payload = $request->validate([
            'state' => ['required', Rule::in(['Obhájená', 'Neobhájená'])],
        ]);

        if (!in_array($old, ['Schválená', 'Obhájená', 'Neobhájená'], true)) {
            return response()->json([
                'ok' => false,
                'message' => 'Obhajobu možno nastaviť len zo stavu Schválená/Obhájená/Neobhájená.',
            ], 422);
        }

        $new = (string) $payload['state'];
        $this->changeStateInternal($i, $new, $user);
        $this->notifyStudent($i, $old, $new, $user);
        $this->notifyCompany($i, $old, $new, $user);

        return response()->json(['ok' => true, 'status' => $new]);
    }

    public function setState(Request $request, $internship)
    {
        $user = $this->requireGarant($request);
        $i = $this->findInternshipById($request, $internship);

        $i->loadMissing(['state']);

        $old = $i->state->internship_state_name ?? null;

        $payload = $request->validate([
            'state' => ['required', 'string', 'max:50'],
        ]);

        $new = (string) $payload['state'];

        if ($new === 'Schválená') {
            $this->ensureStandardContractUploaded($i);
        }

        $this->changeStateInternal($i, $new, $user);
        $this->notifyStudent($i, $old, $new, $user);
        $this->notifyCompany($i, $old, $new, $user);

        return response()->json(['ok' => true, 'status' => $new]);
    }

    public function destroy(Request $request, $internship)
    {
        $this->requireGarant($request);
        $i = $this->findInternshipById($request, $internship);

        DB::transaction(function () use ($i) {
            InternshipStateChange::query()
                ->where('internship_id', (int) ($i->internship_id ?? $i->id))
                ->delete();

            $i->delete();
        });

        return response()->json(['ok' => true]);
    }
}
