<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        // filter podľa stavu (textový názov – Vytvorená, Schválená, ...)
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

            return [
                'id'      => $i->internship_id,
                'student' => $student
                    ? trim($student->first_name . ' ' . $student->last_name)
                    : '—',
                'program' => $fos?->field_of_study_name,
                'year'    => (int) $i->year,
                'status'  => $state?->internship_state_name ?? '—',
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

        $detail = [
            'id'                => $internship->internship_id,
            'student_firstname' => $student?->first_name ?? '',
            'student_lastname'  => $student?->last_name ?? '',
            'student_email'     => $student?->email ?? null,
            'program'           => $fos?->field_of_study_name ?? null,

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
            'status'            => $state?->internship_state_name ?? '—',

            'garant_email'      => $garant?->email ?? null,
        ];

        return response()->json($detail);
    }

    /**
     * Schválenie praxe.
     */
    public function approve(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $this->changeStateInternal($internship, 'Schválená', $request->user());

        return response()->json([
            'ok'     => true,
            'status' => $internship->state->internship_state_name ?? 'Schválená',
        ]);
    }

    /**
     * Zamietnutie praxe.
     */
    public function reject(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $this->changeStateInternal($internship, 'Zamietnutá', $request->user());

        return response()->json([
            'ok'     => true,
            'status' => $internship->state->internship_state_name ?? 'Zamietnutá',
        ]);
    }

    /**
     * Hodnotenie praxe (prešiel / neprešiel) – mení stav na Obhájená / Neobhájená.
     */
    public function grade(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $data = $request->validate([
            'passed' => 'required|boolean',
        ]);

        $targetName = $data['passed'] ? 'Obhájená' : 'Neobhájená';

        $this->changeStateInternal($internship, $targetName, $request->user());

        return response()->json([
            'ok'     => true,
            'status' => $internship->state->internship_state_name ?? $targetName,
        ]);
    }

    /**
     * Manuálna zmena stavu (používa dropdown v detaile).
     */
    public function setState(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $data = $request->validate([
            'state' => 'required|string|in:Vytvorená,Schválená,Zamietnutá,Obhájená,Neobhájená',
        ]);

        $this->changeStateInternal($internship, $data['state'], $request->user());

        return response()->json([
            'ok'     => true,
            'status' => $internship->state->internship_state_name ?? $data['state'],
        ]);
    }

    /**
     * Firma môže vlastnú prax vymazať.
     */
    public function destroy(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $internship->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Kontaktovanie garanta – firma pošle správu garantovi praxe.
     */
    public function contactGarant(Request $request, Internship $internship): JsonResponse
    {
        $this->ensureBelongsToCompany($request, $internship);

        $data = $request->validate([
            'message' => 'required|string',
        ]);

        $user    = $request->user();
        $garant  = $internship->garant;  // relácia na User (role = garant)
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
                $message->to($garant->email)
                    ->subject($subject);

                // FROM musí byť adresa, pod ktorou sa prihlasuješ na SMTP
                $fromEmail = config('mail.from.address');
                $fromName  = config('mail.from.name', 'Portál praxe');

                if ($fromEmail) {
                    $message->from($fromEmail, $fromName);
                }

                // aby garant vedel odpovedať priamo firme, dáme ju do Reply-To
                $replyEmail = $company?->email ?? $user->email ?? null;
                $replyName  = $company?->company_name
                    ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));

                if ($replyEmail) {
                    $message->replyTo($replyEmail, $replyName ?: $replyEmail);
                }
            });
        } catch (\Throwable $e) {
            // zalogujeme detail chyby a pošleme slušnú správu klientovi
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

        // log do laravel.log (jednoduchý audit)
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

    /**
     * Helper – skontroluje, či prax patrí firme prihláseného používateľa.
     */
    protected function ensureBelongsToCompany(Request $request, Internship $internship): void
    {
        $user = $request->user();

        // 💡 LOCAL: neobmedzujeme – môžeš testovať aj ako študent
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

    /**
     * Helper – zmena stavu + log do internship_state_change.
     */
    protected function changeStateInternal(Internship $internship, string $stateName, User $changedBy): void
    {
        $internship->loadMissing('state');

        $fromState = $internship->state;
        $toState   = InternshipState::where('internship_state_name', $stateName)->firstOrFail();

        // zmena stavu v tabuľke internship
        $internship->state_id = $toState->internship_state_id;
        $internship->save();

        // log do internship_state_change
        InternshipStateChange::create([
            'internship_id'       => $internship->internship_id,
            'from_state_id'       => $fromState?->internship_state_id,
            'to_state_id'         => $toState->internship_state_id,
            'changed_by_user_id'  => $changedBy->getKey(),
            'note'                => null,
            'changed_at'          => now(),
        ]);
    }
}