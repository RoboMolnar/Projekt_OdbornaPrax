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

class GarantInternshipController extends Controller
{
    /**
     * Mimo local: len garant.
     * V local: povolíme kvôli testovaniu, ale user musí byť prihlásený.
     */
    private function requireGarant(Request $request): User
    {
        $user = $request->user();
        abort_if(!$user, 401, 'Neprihlásený používateľ.');

        if (app()->environment('local')) {
            return $user;
        }

        $rawRole = $user->role ?? $user->role_name ?? $user->type ?? null;
        $role = $rawRole !== null ? strtolower(trim((string) $rawRole)) : null;

        abort_if($role !== 'garant', 403, 'Prístup povolený len pre garanta.');

        return $user;
    }

    private function isPg(): bool
    {
        return DB::connection()->getDriverName() === 'pgsql';
    }

    private function studentFullName($student): string
    {
        $first = $student->first_name ?? '';
        $last  = $student->last_name  ?? '';
        return trim($first . ' ' . $last);
    }

    /**
     * Nájde prax podľa ID a (mimo local) skontroluje, že patrí garantovi.
     */
    private function findInternshipById(Request $request, $id): Internship
    {
        $user = $this->requireGarant($request);

        $query = Internship::query()->with(['student', 'company', 'state']);

        // Mimo local: garant vidí len svoje praxe
        if (!app()->environment('local')) {
            $query->where('garant_user_id', $user->user_id);
        }

        $internship = $query->where('internship_id', $id)->first();
        if (!$internship) {
            $internship = $query->where('id', $id)->first();
        }

        abort_if(!$internship, 404);

        return $internship;
    }

    /**
     * Zmena stavu + log do internship_state_change.
     */
    private function changeStateInternal(Internship $internship, string $toStateName, User $changedBy): InternshipState
    {
        $internship->loadMissing('state');

        $fromState = $internship->state;
        $toState = InternshipState::where('internship_state_name', $toStateName)->firstOrFail();

        $internship->state_id = $toState->internship_state_id;
        $internship->save();

        InternshipStateChange::create([
            'internship_id'      => $internship->internship_id,
            'from_state_id'      => $fromState?->internship_state_id,
            'to_state_id'        => $toState->internship_state_id,
            'changed_by_user_id' => $changedBy->getKey(),
            'note'               => null,
            'changed_at'         => now(),
        ]);

        return $toState;
    }

    /**
     * Zoznam praxí pre garanta.
     */
    public function indexAll(Request $request)
    {
        $user    = $this->requireGarant($request);

        $q       = trim((string) $request->query('q', ''));
        $status  = (string) $request->query('status', '');
        $year    = (string) $request->query('year', '');
        $program = (string) $request->query('program', '');

        $isPg    = $this->isPg();
        $likeOp  = $isPg ? 'ILIKE' : 'LIKE';
        $term    = $isPg ? $q : mb_strtolower($q, 'UTF-8');
        $pattern = '%' . $term . '%';

        $fullNameExpr = $isPg
            ? "concat_ws(' ', COALESCE(first_name, ''), COALESCE(last_name, ''))"
            : "LOWER(CONCAT_WS(' ', COALESCE(first_name, ''), COALESCE(last_name, '')))";
        $firstExpr   = $isPg ? "COALESCE(first_name, '')"   : "LOWER(COALESCE(first_name, ''))";
        $lastExpr    = $isPg ? "COALESCE(last_name, '')"    : "LOWER(COALESCE(last_name, ''))";
        $companyExpr = $isPg ? "COALESCE(company_name, '')" : "LOWER(COALESCE(company_name, ''))";

        $query = Internship::query()
            ->with(['student', 'company', 'state']);

        // Mimo local: garant len svoje praxe
        if (!app()->environment('local')) {
            $query->where('garant_user_id', $user->user_id);
        }

        $query
            ->when($status && $status !== 'all', function ($qq) use ($status) {
                $qq->whereHas('state', function ($s) use ($status) {
                    $s->where('internship_state_name', $status);
                });
            })
            ->when($year && $year !== 'all', fn ($qq) => $qq->where('year', $year))
            ->when($program && $program !== 'all', function ($qq) use ($program) {
                $qq->whereHas('student', function ($s) use ($program) {
                    $s->where('program', $program);
                });
            })
            ->when($q !== '', function ($qq) use ($likeOp, $pattern, $firstExpr, $lastExpr, $fullNameExpr, $companyExpr) {
                $qq->where(function ($w) use ($likeOp, $pattern, $firstExpr, $lastExpr, $fullNameExpr, $companyExpr) {
                    $w->whereHas('student', function ($s) use ($likeOp, $pattern, $firstExpr, $lastExpr, $fullNameExpr) {
                        $s->whereRaw("$firstExpr $likeOp ?", [$pattern])
                          ->orWhereRaw("$lastExpr $likeOp ?",  [$pattern])
                          ->orWhereRaw("$fullNameExpr $likeOp ?", [$pattern]);
                    })
                    ->orWhereHas('company', function ($c) use ($likeOp, $pattern, $companyExpr) {
                        $c->whereRaw("$companyExpr $likeOp ?", [$pattern]);
                    });
                });
            });

        $rows = $query->orderByDesc('created_at')->get()->map(function ($i) {
            return [
                'id'      => (int) ($i->internship_id ?? $i->id),
                'student' => $i->student ? $this->studentFullName($i->student) : '',
                'program' => $i->student->program ?? null,
                'firm'    => $i->company->company_name ?? '',
                'year'    => (int) $i->year,
                'status'  => $i->state->internship_state_name ?? '—',
            ];
        });

        return response()->json($rows);
    }

    public function show(Request $request, $internship)
    {
        $i = $this->findInternshipById($request, $internship);

        $i->loadMissing(['company.address']);
        $address = $i->company?->address;

        $payload = [
            'id' => (int) ($i->internship_id ?? $i->id),
            'student_firstname' => $i->student->first_name ?? '',
            'student_lastname'  => $i->student->last_name  ?? '',
            'student_email'     => $i->student->email ?? null,
            'program'           => $i->student->program ?? null,

            'company_name' => $i->company->company_name ?? '',
            'street'       => $address?->street ?? ($i->company->street ?? null),
            'city'         => $address?->city ?? ($i->company->city ?? null),
            'zip'          => $address?->zip ?? ($i->company->zip ?? null),
            'country'      => $address?->country ?? ($i->company->country ?? null),

            'start_date'   => method_exists($i->start_date, 'toDateString') ? $i->start_date->toDateString() : (string) $i->start_date,
            'end_date'     => method_exists($i->end_date, 'toDateString') ? $i->end_date->toDateString() : (string) $i->end_date,
            'year'         => (int) $i->year,
            'semester'     => $i->semester ?? '',
            'worked_hours' => $i->worked_hours ?? null,
            'status'       => $i->state->internship_state_name ?? '—',
        ];

        return response()->json($payload);
    }

    /**
     * Garant SCHVÁLI prax (a môže to aj opraviť):
     * - Potvrdená -> Schválená
     * - Neschválená -> Schválená
     */
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

        $this->changeStateInternal($i, 'Schválená', $user);

        $this->notifyStudent($i, $old, 'Schválená', $user);
        $this->notifyCompanyOnApproved($i);

        return response()->json(['ok' => true, 'status' => 'Schválená']);
    }

    /**
     * Garant NESCHVÁLI prax (a môže to aj opraviť):
     * - Potvrdená -> Neschválená
     * - Schválená -> Neschválená
     */
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

        return response()->json(['ok' => true, 'status' => 'Neschválená']);
    }

    /**
     * Hodnotenie praxe – mení stav na Obhájená / Neobhájená.
     * Dovolíme aj opravu po finále.
     */
    public function grade(Request $request, $internship)
    {
        $user = $this->requireGarant($request);
        $i = $this->findInternshipById($request, $internship);

        $i->loadMissing(['state', 'student', 'company']);

        $old = $i->state->internship_state_name ?? null;

        if (!in_array($old, ['Schválená', 'Obhájená', 'Neobhájená'], true)) {
            return response()->json([
                'ok' => false,
                'message' => 'Ohodnotiť možno len prax v stave Schválená (alebo už ohodnotenú prax Obhájená/Neobhájená).',
            ], 422);
        }

        $passed = (bool) $request->boolean('passed', false);
        $target = $passed ? 'Obhájená' : 'Neobhájená';

        // ak je to rovnaké, nič nemeníme (nezaplavujeme log ani emaily)
        if ($old === $target) {
            $i->grade = $passed ? 1 : 0;
            $i->save();

            return response()->json(['ok' => true, 'status' => $target]);
        }

        $this->changeStateInternal($i, $target, $user);

        $i->grade = $passed ? 1 : 0;
        $i->save();

        $this->notifyStudent($i, $old, $target, $user);

        return response()->json(['ok' => true, 'status' => $target]);
    }

    /**
     * Manuálna zmena stavu – Schválená / Neschválená.
     */
    public function setState(Request $request, $internship)
    {
        $user = $this->requireGarant($request);
        $i = $this->findInternshipById($request, $internship);

        $i->loadMissing(['state', 'student', 'company']);

        $old = $i->state->internship_state_name ?? null;

        $validated = $request->validate([
            'state' => [
                'required',
                Rule::in(['Schválená', 'Neschválená']),
            ],
        ]);

        $targetName = $validated['state'];

        if (!in_array($old, ['Potvrdená', 'Schválená', 'Neschválená'], true)) {
            return response()->json([
                'ok' => false,
                'message' => 'Stav možno meniť iba pre prax v stave Potvrdená/Schválená/Neschválená.',
            ], 422);
        }

        if ($targetName === $old) {
            return response()->json([
                'ok' => true,
                'status' => $targetName,
            ]);
        }

        $this->changeStateInternal($i, $targetName, $user);

        $this->notifyStudent($i, $old, $targetName, $user);

        if ($targetName === 'Schválená') {
            $this->notifyCompanyOnApproved($i);
        }

        return response()->json([
            'ok' => true,
            'status' => $targetName,
        ]);
    }

    public function destroy(Request $request, $internship)
    {
        $this->requireGarant($request);
        $i = $this->findInternshipById($request, $internship);

        try {
            DB::transaction(function () use ($i) {
                DB::table('documents')->where('internship_id', $i->internship_id)->delete();
                DB::table('internship_state_change')->where('internship_id', $i->internship_id)->delete();
                $i->delete();
            });

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Mazanie zlyhalo: ' . $e->getMessage(),
            ], 409);
        }
    }

    /**
     * ✅ UPRAVENÉ: posiela changedBy ("garantom Meno Priezvisko" alebo "garantom")
     */
    private function notifyStudent(Internship $internship, ?string $oldStatus, string $newStatus, User $changedByUser): void
    {
        $internship->loadMissing(['student', 'company']);

        $email = $internship->student->email ?? null;
        if (!$email) {
            Log::warning('Mail not sent: student email missing', [
                'internship' => $internship->internship_id ?? $internship->id,
            ]);
            return;
        }

        $fullName = trim(($changedByUser->first_name ?? '') . ' ' . ($changedByUser->last_name ?? ''));
        $changedBy = $fullName !== '' ? "garantom {$fullName}" : 'garantom';

        try {
            Mail::to($email)->send(new InternshipStateChanged(
                $internship,
                $oldStatus,
                $newStatus,
                $this->studentFullName($internship->student),
                $internship->company->company_name ?? '',
                $changedBy
            ));
        } catch (TransportExceptionInterface $e) {
            Log::error('Mail transport failed', [
                'to' => $email,
                'error' => $e->getMessage(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Mail send failed (generic)', [
                'to' => $email,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Mail firme po schválení garantom (Schválená).
     */
    private function notifyCompanyOnApproved(Internship $internship): void
    {
        $internship->loadMissing(['company', 'student']);

        $company = $internship->company;
        $companyId = $company?->company_id;

        $to = $company?->email;

        if (!$to && $companyId) {
            $to = User::where('role', 'company')
                ->where('company_id', $companyId)
                ->value('email');
        }

        if (!$to) {
            Log::warning('Mail not sent: company email missing', [
                'internship_id' => $internship->internship_id,
                'company_id' => $companyId,
            ]);
            return;
        }

        $id = $internship->internship_id;
        $studentName = $this->studentFullName($internship->student);
        $subject = "Odborná prax #{$id} bola schválená garantom";

        $body = "Dobrý deň,\n\n"
            . "odborná prax #{$id} (študent: {$studentName}) bola schválená garantom.\n\n"
            . "S pozdravom\nPortál odbornej praxe";

        try {
            Mail::raw($body, function ($message) use ($to, $subject) {
                $message->to($to)->subject($subject);
            });
        } catch (\Throwable $e) {
            Log::error('Mail company (approved) failed', [
                'to' => $to,
                'error' => $e->getMessage(),
                'internship_id' => $internship->internship_id,
            ]);
        }
    }
}
