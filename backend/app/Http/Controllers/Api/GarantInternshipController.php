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
use App\Mail\InternshipStateChanged;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class GarantInternshipController extends Controller
{
    private function findInternshipById($id): Internship
    {
        $query = Internship::query()->with(['student', 'company', 'state']);
        $internship = $query->where('internship_id', $id)->first();
        if (!$internship) {
            $internship = $query->where('id', $id)->first();
        }
        abort_if(!$internship, 404);
        return $internship;
    }

    private function studentFullName($student): string
    {
        $first = $student->first_name ?? '';
        $last  = $student->last_name  ?? '';
        return trim($first.' '.$last);
    }

    private function isPg(): bool
    {
        return DB::connection()->getDriverName() === 'pgsql';
    }

    public function indexAll(Request $request)
    {
        $q       = trim((string) $request->query('q', ''));
        $status  = (string) $request->query('status', '');
        $year    = (string) $request->query('year', '');
        $program = (string) $request->query('program', '');

        $isPg    = $this->isPg();
        $likeOp  = $isPg ? 'ILIKE' : 'LIKE';
        $term    = $isPg ? $q : mb_strtolower($q, 'UTF-8');
        $pattern = '%'.$term.'%';

        $fullNameExpr = $isPg
            ? "concat_ws(' ', COALESCE(first_name, ''), COALESCE(last_name, ''))"
            : "LOWER(CONCAT_WS(' ', COALESCE(first_name, ''), COALESCE(last_name, '')))";
        $firstExpr   = $isPg ? "COALESCE(first_name, '')"   : "LOWER(COALESCE(first_name, ''))";
        $lastExpr    = $isPg ? "COALESCE(last_name, '')"    : "LOWER(COALESCE(last_name, ''))";
        $companyExpr = $isPg ? "COALESCE(company_name, '')" : "LOWER(COALESCE(company_name, ''))";

        $query = Internship::query()
            ->with(['student', 'company', 'state'])
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

    public function show($internship)
    {
        $i = $this->findInternshipById($internship);

        $payload = [
            'id' => (int) ($i->internship_id ?? $i->id),
            'student_firstname' => $i->student->first_name ?? '',
            'student_lastname'  => $i->student->last_name  ?? '',
            'student_email'     => $i->student->email ?? null,
            'program'           => $i->student->program ?? null,
            'company_name' => $i->company->company_name ?? '',
            'street'       => $i->company->street ?? null,
            'city'         => $i->company->city ?? null,
            'zip'          => $i->company->zip ?? null,
            'country'      => $i->company->country ?? null,
            'start_date'   => method_exists($i->start_date, 'toDateString') ? $i->start_date->toDateString() : (string)$i->start_date,
            'end_date'     => method_exists($i->end_date, 'toDateString') ? $i->end_date->toDateString() : (string)$i->end_date,
            'year'         => (int) $i->year,
            'semester'     => $i->semester ?? '',
            'worked_hours' => $i->worked_hours ?? null,
            'status'       => $i->state->internship_state_name ?? '—',
        ];

        return response()->json($payload);
    }

    public function approve($internship)
    {
        $i = $this->findInternshipById($internship);
        $old = $i->state->internship_state_name ?? null;

        if ($old !== 'Vytvorená') {
            return response()->json(['ok' => false, 'message' => 'Schváliť možno len prax v stave Vytvorená.'], 422);
        }

        $stateId = InternshipState::where('internship_state_name', 'Schválená')->value('internship_state_id');
        abort_if(!$stateId, 422, 'Neznámy cieľový stav.');

        $i->state_id = $stateId;
        $i->save();

        $this->notifyStudent($i, $old, 'Schválená');

        return response()->json(['ok' => true, 'status' => 'Schválená']);
    }

    public function reject($internship)
    {
        $i = $this->findInternshipById($internship);
        $old = $i->state->internship_state_name ?? null;

        if ($old !== 'Vytvorená') {
            return response()->json(['ok' => false, 'message' => 'Zamietnuť možno len prax v stave Vytvorená.'], 422);
        }

        $stateId = InternshipState::where('internship_state_name', 'Zamietnutá')->value('internship_state_id');
        abort_if(!$stateId, 422, 'Neznámy cieľový stav.');

        $i->state_id = $stateId;
        $i->save();

        $this->notifyStudent($i, $old, 'Zamietnutá');

        return response()->json(['ok' => true, 'status' => 'Zamietnutá']);
    }

    public function grade(Request $request, $internship)
    {
        $i = $this->findInternshipById($internship);
        $old = $i->state->internship_state_name ?? null;

        if ($old !== 'Schválená') {
            return response()->json(['ok' => false, 'message' => 'Hodnotiť možno len schválenú prax.'], 422);
        }

        $passed = (bool) $request->boolean('passed', false);
        $target = $passed ? 'Obhájená' : 'Neobhájená';

        $stateId = InternshipState::where('internship_state_name', $target)->value('internship_state_id');
        abort_if(!$stateId, 422, 'Neznámy cieľový stav.');

        $i->state_id = $stateId;
        $i->grade = $passed ? 1 : 0;
        $i->save();

        $this->notifyStudent($i, $old, $target);

        return response()->json(['ok' => true, 'status' => $target]);
    }

    public function setState(Request $request, $internship)
    {
        $i = $this->findInternshipById($internship);
        $old = $i->state->internship_state_name ?? null;

        $validated = $request->validate([
            'state' => [
                'required',
                Rule::in(['Odoslaná na schválenie', 'Prebieha', 'Schválená', 'Ukončená', 'V návrhu', 'Zamietnutá', 'Zrušená']),
            ],
        ]);

        $targetName = $validated['state'];
        $stateId = InternshipState::where('internship_state_name', $targetName)->value('internship_state_id');
        abort_if(!$stateId, 422, 'Neznámy cieľový stav.');

        $grade = null;
        if ($targetName === 'Obhájená') $grade = 1;
        if ($targetName === 'Neobhájená') $grade = 0;

        $i->state_id = $stateId;
        $i->grade = $grade;
        $i->save();

        $this->notifyStudent($i, $old, $targetName);

        return response()->json([
            'ok' => true,
            'status' => $targetName,
            'grade' => $grade,
        ]);
    }

    public function destroy($internship)
    {
        $i = $this->findInternshipById($internship);

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
                'message' => 'Mazanie zlyhalo: '.$e->getMessage(),
            ], 409);
        }
    }

    private function notifyStudent(Internship $internship, ?string $oldStatus, string $newStatus): void
    {
        $email = $internship->student->email ?? null;
        if (!$email) {
            Log::warning('Mail not sent: student email missing', [
                'internship' => $internship->internship_id ?? $internship->id,
            ]);
            return;
        }

        try {
            Mail::to($email)->send(new InternshipStateChanged(
                $internship,
                $oldStatus,
                $newStatus,
                $this->studentFullName($internship->student),
                $internship->company->company_name ?? ''
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
}
