<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\InternshipStateChanged;
use App\Models\Internship;
use App\Models\InternshipState;
use App\Models\InternshipStateChange;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CompanyInternshipController extends Controller
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
     * Stavy, pri ktorých už firma NESMIE meniť rozhodnutie (garant už rozhodol / finálne stavy).
     */
    private function isLockedForCompany(?string $status): bool
    {
        if ($status === null) {
            return false;
        }

        return in_array($status, ['Schválená', 'Neschválená', 'Obhájená', 'Neobhájená'], true);
    }

    /**
     * Zoznam praxí pre prihlásenú firmu.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // ✅ MIMO LOCAL prostredia stále striktne len pre firmu
        if (!app()->environment('local') && (($user->role ?? null) !== 'company')) {
            return response()->json(['message' => 'Prístup povolený len pre firmu.'], 403);
        }

        $query = Internship::query()
            ->with([
                'student.fieldOfStudy',
                'state',
            ]);

        // ✅ V produkcii filtrujeme podľa firmy a ak firma nie je priradená, error
        if (!app()->environment('local')) {
            if (!$user->company_id) {
                return response()->json(['message' => 'Konto firmy nemá priradenú firmu.'], 422);
            }
            $query->where('company_id', $user->company_id);
        } else {
            // 💡 LOCAL: ak má user company_id, filtrujeme; ak nie, vidíš VŠETKY praxe (na dev je to OK)
            if ($user->company_id) {
                $query->where('company_id', $user->company_id);
            }
        }

        // filter podľa stavu (textový názov)
        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->whereHas('state', function ($q) use ($status) {
                    $q->where('internship_state_name', $status);
                });
            }
        }

        // filter podľa roka
        if ($year = $request->query('year')) {
            if ($year !== 'all') {
                $query->where('year', (int) $year);
            }
        }

        // filter podľa odboru
        if ($program = $request->query('program')) {
            if ($program !== 'all') {
                $query->whereHas('student.fieldOfStudy', function ($q) use ($program) {
                    $q->where('field_of_study_name', $program);
                });
            }
        }

        // fulltext hľadanie (meno študenta / odbor / rok)
        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(function ($qb) use ($q) {
                $qb->whereHas('student', function ($q2) use ($q) {
                    $q2->where('first_name', 'like', "%{$q}%")
                        ->orWhere('last_name', 'like', "%{$q}%")
                        ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$q}%"]);
                })->orWhereHas('student.fieldOfStudy', function ($q3) use ($q) {
                    $q3->where('field_of_study_name', 'like', "%{$q}%");
                })->orWhere('year', 'like', "%{$q}%");
            });
        }

        $internships = $query
            ->orderByDesc('year')
            ->orderByDesc('internship_id')
            ->get();

        $rows = $internships->map(function (Internship $i) {
            $student = $i->student;
            $fos     = $student?->fieldOfStudy;
            $state   = $i->state;

            $status = $state?->internship_state_name ?? '—';
            $status = $this->mapStatusForUi($status);

            return [
                'id'            => $i->internship_id,
                'student'        => $student
                    ? trim($student->first_name . ' ' . $student->last_name)
                    : '—',
                'program'        => $fos?->field_of_study_name,
                'year'           => (int) $i->year,
                'status'         => $status,

                // ✅ NOVÉ: typ praxe pre FE (badge "Zamestnanie")
                'practice_type'  => $i->practice_type ?? 'standard',
            ];
        });

        return response()->json($rows);
    }

    /**
     * Detail jednej praxe – musí patriť firme.
     */
    public function show(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $internship->loadMissing([
            'student.fieldOfStudy',
            'company.address',
            'state',
            'garant',
        ]);

        $student = $internship->student;
        $fos     = $student?->fieldOfStudy;
        $company = $internship->company;
        $address = $company?->address;
        $state   = $internship->state;
        $garant  = $internship->garant;

        $status = $state?->internship_state_name ?? '—';
        $status = $this->mapStatusForUi($status);

        $detail = [
            'id'                => $internship->internship_id,
            'student_firstname' => $student?->first_name ?? '',
            'student_lastname'  => $student?->last_name ?? '',
            'student_email'     => $student?->email ?? null,
            'program'           => $fos?->field_of_study_name ?? null,

            // ✅ NOVÉ: typ praxe pre FE (badge "Zamestnanie")
            'practice_type'     => $internship->practice_type ?? 'standard',

            'company_name'      => $company?->company_name ?? '',
            'street'            => $address?->street ?? null,
            'city'              => $address?->city ?? null,
            'zip'               => $address?->zip ?? null,
            'country'           => $address?->country ?? null,

            'start_date'        => $internship->start_date,
            'end_date'          => $internship->end_date,
            'year'              => (int) $internship->year,
            'semester'          => $internship->semester,
            'worked_hours'      => $internship->worked_hours,
            'status'            => $status,

            'garant_email'      => $garant?->email ?? null,
        ];

        return response()->json($detail);
    }

    public function approve(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $internship->loadMissing(['state', 'student', 'garant', 'company']);

        $current = $internship->state?->internship_state_name;

        if ($this->isLockedForCompany($current)) {
            return response()->json([
                'ok' => false,
                'message' => 'Stav už bol uzavretý garantom, firma ho nemôže meniť.',
            ], 422);
        }

        if ($current === 'Potvrdená') {
            return response()->json([
                'ok' => true,
                'status' => 'Potvrdená',
            ]);
        }

        if (!in_array($current, ['Vytvorená', 'Zamietnutá', null], true)) {
            return response()->json([
                'ok' => false,
                'message' => 'Potvrdiť možno len prax v stave Vytvorená alebo Zamietnutá.',
            ], 422);
        }

        $this->changeStateInternal($internship, 'Potvrdená', $request->user());
        $this->notifyOnConfirmed($internship, $current);

        return response()->json([
            'ok'     => true,
            'status' => $internship->state->internship_state_name ?? 'Potvrdená',
        ]);
    }

    public function reject(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $internship->loadMissing(['state', 'student', 'company']);

        $current = $internship->state?->internship_state_name;

        if ($this->isLockedForCompany($current)) {
            return response()->json([
                'ok' => false,
                'message' => 'Stav už bol uzavretý garantom, firma ho nemôže meniť.',
            ], 422);
        }

        if ($current === 'Zamietnutá') {
            return response()->json([
                'ok' => true,
                'status' => 'Zamietnutá',
            ]);
        }

        if (!in_array($current, ['Vytvorená', 'Potvrdená', null], true)) {
            return response()->json([
                'ok' => false,
                'message' => 'Zamietnuť možno len prax v stave Vytvorená alebo Potvrdená.',
            ], 422);
        }

        $this->changeStateInternal($internship, 'Zamietnutá', $request->user());
        $this->notifyOnRejected($internship, $current);

        return response()->json([
            'ok'     => true,
            'status' => $internship->state->internship_state_name ?? 'Zamietnutá',
        ]);
    }

    public function grade(Request $request, Internship $internship): JsonResponse
    {
        return response()->json([
            'ok' => false,
            'message' => 'Hodnotenie praxe (Obhájená/Neobhájená) vykonáva garant (nie firma).',
        ], 403);
    }

    public function setState(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $internship->loadMissing(['state', 'student', 'garant', 'company']);

        $data = $request->validate([
            'state' => 'required|string|in:Potvrdená,Zamietnutá',
        ]);

        $current = $internship->state?->internship_state_name;

        if ($this->isLockedForCompany($current)) {
            return response()->json([
                'ok' => false,
                'message' => 'Stav už bol uzavretý garantom, firma ho nemôže meniť.',
            ], 422);
        }

        $target = $data['state'];

        if ($current === $target) {
            return response()->json([
                'ok' => true,
                'status' => $target,
            ]);
        }

        if (!in_array($current, ['Vytvorená', 'Potvrdená', 'Zamietnutá', null], true)) {
            return response()->json([
                'ok' => false,
                'message' => 'Firma môže meniť stav len pred schválením garantom (Vytvorená/Potvrdená/Zamietnutá).',
            ], 422);
        }

        $this->changeStateInternal($internship, $target, $request->user());

        if ($target === 'Potvrdená') {
            $this->notifyOnConfirmed($internship, $current);
        } else {
            $this->notifyOnRejected($internship, $current);
        }

        return response()->json([
            'ok'     => true,
            'status' => $internship->state->internship_state_name ?? $target,
        ]);
    }

    public function destroy(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $internship->delete();

        return response()->json(['ok' => true]);
    }

    public function contactGarant(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $data = $request->validate([
            'message' => 'required|string',
        ]);

        $user    = $request->user();
        $garant  = $internship->garant;
        $company = $internship->company;

        if (!$garant || !$garant->email) {
            return response()->json([
                'message' => 'Pre túto prax nie je dostupný email garanta.',
            ], 422);
        }

        $subject = 'Správa od firmy k odbornej praxi #' . $internship->internship_id;
        $body    = $data['message'];

        try {
            Mail::raw($body, function ($message) use ($garant, $user, $company, $subject) {
                $message->to($garant->email)->subject($subject);

                $fromEmail = config('mail.from.address');
                $fromName  = config('mail.from.name', 'Portál praxe');

                if ($fromEmail) {
                    $message->from($fromEmail, $fromName);
                }

                $replyEmail = $company?->email ?? $user->email ?? null;
                $replyName  = $company?->company_name
                    ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));

                if ($replyEmail) {
                    $message->replyTo($replyEmail, $replyName ?: $replyEmail);
                }
            });
        } catch (\Throwable $e) {
            Log::error('Chyba pri odosielaní mailu garantovi', [
                'error'         => $e->getMessage(),
                'internship_id' => $internship->internship_id,
                'garant_id'     => $garant->user_id ?? null,
            ]);

            return response()->json([
                'ok'      => false,
                'message' => 'Správu sa nepodarilo odoslať. Prosím kontaktujte garanta priamo na ' . $garant->email . '.',
            ], 500);
        }

        Log::info('Firma kontaktovala garanta k praxi.', [
            'internship_id' => $internship->internship_id,
            'company_id'    => $company?->company_id,
            'company_user'  => $user->getKey(),
            'garant_id'     => $garant->user_id ?? null,
            'garant_email'  => $garant->email ?? null,
        ]);

        return response()->json([
            'ok'      => true,
            'message' => 'Správa bola odoslaná garantovi.',
        ]);
    }

    protected function ensureBelongsToCompany(Request $request, Internship $internship): void
    {
        $user = $request->user();

        if (app()->environment('local')) {
            return;
        }

        if (($user->role ?? null) !== 'company') {
            abort(403, 'Prístup povolený len pre firmu.');
        }

        if (!$user->company_id) {
            abort(403, 'Konto firmy nemá priradenú firmu.');
        }

        if ((int) $internship->company_id !== (int) $user->company_id) {
            abort(403, 'Táto prax nepatrí tejto firme.');
        }
    }

    protected function changeStateInternal(Internship $internship, string $stateName, User $changedBy): void
    {
        $internship->loadMissing('state');

        $fromState = $internship->state;
        $toState   = InternshipState::where('internship_state_name', $stateName)->firstOrFail();

        $internship->state_id = $toState->internship_state_id;
        $internship->save();

        InternshipStateChange::create([
            'internship_id'       => $internship->internship_id,
            'from_state_id'       => $fromState?->internship_state_id,
            'to_state_id'         => $toState->internship_state_id,
            'changed_by_user_id'  => $changedBy->getKey(),
            'note'                => null,
            'changed_at'          => now(),
        ]);
    }

    private function notifyOnConfirmed(Internship $internship, ?string $oldStatus): void
    {
        $internship->loadMissing(['student', 'garant', 'company', 'state']);

        $studentEmail = $internship->student?->email;
        $garantEmail  = $internship->garant?->email;
        $companyName  = $internship->company?->company_name ?? 'firma';
        $id           = $internship->internship_id;

        if ($studentEmail) {
            try {
                $studentName = trim(($internship->student?->first_name ?? '') . ' ' . ($internship->student?->last_name ?? ''));
                $changedBy = "firmou {$companyName}";

                Mail::to($studentEmail)->send(
                    new InternshipStateChanged(
                        $internship,
                        $oldStatus,
                        'Potvrdená',
                        $studentName,
                        $companyName,
                        $changedBy,
                        $id
                    )
                );
            } catch (\Throwable $e) {
                Log::error('Mail student (confirmed) failed', [
                    'to' => $studentEmail,
                    'error' => $e->getMessage(),
                    'internship_id' => $id,
                ]);
            }
        }

        if ($garantEmail) {
            $subject = "Prax #{$id} bola potvrdená firmou";
            $bodyGarant = "Odborná prax #{$id} bola potvrdená firmou ({$companyName}).\n\nProsím, schváľte alebo neschváľte prax v systéme.";

            try {
                Mail::raw($bodyGarant, function ($message) use ($garantEmail, $subject) {
                    $message->to($garantEmail)->subject($subject);
                });
            } catch (\Throwable $e) {
                Log::error('Mail garant (confirmed) failed', [
                    'to' => $garantEmail,
                    'error' => $e->getMessage(),
                    'internship_id' => $id,
                ]);
            }
        }
    }

    private function notifyOnRejected(Internship $internship, ?string $oldStatus): void
    {
        $internship->loadMissing(['student', 'company', 'state']);

        $studentEmail = $internship->student?->email;
        $companyName  = $internship->company?->company_name ?? 'firma';
        $id           = $internship->internship_id;

        if (!$studentEmail) {
            return;
        }

        try {
            $studentName = trim(($internship->student?->first_name ?? '') . ' ' . ($internship->student?->last_name ?? ''));
            $changedBy = "firmou {$companyName}";

            Mail::to($studentEmail)->send(
                new InternshipStateChanged(
                    $internship,
                    $oldStatus,
                    'Zamietnutá',
                    $studentName,
                    $companyName,
                    $changedBy,
                    $id
                )
            );
        } catch (\Throwable $e) {
            Log::error('Mail student (rejected) failed', [
                'to' => $studentEmail,
                'error' => $e->getMessage(),
                'internship_id' => $id,
            ]);
        }
    }
}
