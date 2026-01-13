<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Internship;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class StudentDocumentController extends Controller
{
    private function requireStudent(Request $request)
    {
        $user = $request->user();
        if (!$user) abort(401, 'Neprihlásený používateľ.');

        $role = strtolower((string) ($user->role ?? $user->role_name ?? $user->type ?? ''));
        if ($role !== 'student') abort(403, 'Prístup povolený len pre študenta.');

        return $user;
    }

    private function findOwnedInternship(Request $request, int $internshipId): Internship
    {
        $user = $this->requireStudent($request);

        $internship = Internship::query()
            ->where('internship_id', $internshipId)
            ->where('student_user_id', $user->user_id)
            ->first();

        if (!$internship) abort(404, 'Prax neexistuje alebo ti nepatrí.');

        return $internship;
    }

    private function getDocTypeId(string $name): int
    {
        $id = DB::table('document_type')->where('document_type_name', $name)->value('document_type_id');
        if (!$id) abort(422, "Chýba document_type: {$name}");
        return (int) $id;
    }

    /**
     * Compliance:
     * - OK ak existuje aspoň 1x EMPLOYMENT_CONTRACT
     * - alebo existujú 3 po sebe idúce mesiace faktúr (EMPLOYMENT_INVOICE) s invoice_period YYYY-MM
     */
    private function computeEmploymentCompliance(int $internshipId): array
    {
        $contractTypeId = $this->getDocTypeId('EMPLOYMENT_CONTRACT');
        $invoiceTypeId  = $this->getDocTypeId('EMPLOYMENT_INVOICE');

        $hasContract = DB::table('documents')
            ->where('internship_id', $internshipId)
            ->where('document_type_id', $contractTypeId)
            ->exists();

        if ($hasContract) {
            return ['required' => true, 'ok' => true, 'reason' => 'Nahratá pracovná zmluva.'];
        }

        $periods = DB::table('documents')
            ->where('internship_id', $internshipId)
            ->where('document_type_id', $invoiceTypeId)
            ->whereNotNull('invoice_period')
            ->pluck('invoice_period')
            ->map(fn ($p) => (string) $p)
            ->unique()
            ->values()
            ->all();

        // zoradiť YYYY-MM
        sort($periods);

        $ok = $this->hasThreeConsecutiveMonths($periods);

        if ($ok) {
            return ['required' => true, 'ok' => true, 'reason' => 'Nahraté 3 po sebe idúce faktúry.'];
        }

        return [
            'required' => true,
            'ok' => false,
            'reason' => 'Nahraj 1× pracovnú zmluvu alebo 3 po sebe idúce faktúry (s mesiacmi).',
        ];
    }

    private function hasThreeConsecutiveMonths(array $periods): bool
    {
        // periods: ["2025-09","2025-10",...]
        $toIndex = function (string $ym): ?int {
            if (!preg_match('/^\d{4}-\d{2}$/', $ym)) return null;
            [$y, $m] = explode('-', $ym);
            $y = (int) $y; $m = (int) $m;
            if ($m < 1 || $m > 12) return null;
            return $y * 12 + ($m - 1);
        };

        $idx = [];
        foreach ($periods as $p) {
            $i = $toIndex($p);
            if ($i !== null) $idx[] = $i;
        }
        sort($idx);
        $idx = array_values(array_unique($idx));

        // hľadáme ľubovoľné okno 3 po sebe
        for ($k = 0; $k + 2 < count($idx); $k++) {
            if ($idx[$k + 1] === $idx[$k] + 1 && $idx[$k + 2] === $idx[$k] + 2) return true;
        }
        return false;
    }

    public function index(Request $request, int $internship)
    {
        $i = $this->findOwnedInternship($request, $internship);

        $rows = DB::table('documents')
            ->join('document_type', 'document_type.document_type_id', '=', 'documents.document_type_id')
            ->where('documents.internship_id', $i->internship_id)
            ->orderByDesc('documents.document_id')
            ->select([
                'documents.document_id as id',
                'document_type.document_type_name as type',
                'documents.document_name as name',
                'documents.invoice_period as invoice_period',
                'documents.uploaded_at as uploaded_at',
            ])
            ->get();

        $compliance = null;
        if ($i->practice_type === 'employment') {
            $compliance = $this->computeEmploymentCompliance((int) $i->internship_id);
        }

        return response()->json([
            'documents' => $rows,
            'employment_compliance' => $compliance,
        ]);
    }

    public function store(Request $request, int $internship)
    {
        $user = $this->requireStudent($request);
        $i = $this->findOwnedInternship($request, $internship);

        if ($i->practice_type !== 'employment') {
            return response()->json(['message' => 'Doklady sa nahrávajú len pri platenom zamestnaní.'], 422);
        }

        $data = $request->validate([
            'type' => ['required', Rule::in(['EMPLOYMENT_CONTRACT', 'EMPLOYMENT_INVOICE'])],
            'invoice_period' => ['nullable', 'regex:/^\d{4}-\d{2}$/'],
            'file' => ['required', 'file', 'max:10240'], // 10MB
        ]);

        if ($data['type'] === 'EMPLOYMENT_INVOICE' && empty($data['invoice_period'])) {
            return response()->json(['message' => 'Pri faktúre musí byť zadané obdobie (YYYY-MM).'], 422);
        }

        $typeId = $this->getDocTypeId($data['type']);

        $file = $request->file('file');
        $origName = $file->getClientOriginalName();
        $ext = $file->getClientOriginalExtension();
        $safeExt = $ext ? ('.' . strtolower($ext)) : '';

        $stamp = now()->format('Ymd_His');
        $storedName = $data['type'] . '_' . $stamp . $safeExt;

        $dir = "documents/internships/{$i->internship_id}";
        $path = $file->storeAs($dir, $storedName); // uloží do storage/app/...

        DB::table('documents')->insert([
            'document_type_id' => $typeId,
            'internship_id' => (int) $i->internship_id,
            'document_name' => $origName,
            'file_path' => $path,
            'invoice_period' => $data['type'] === 'EMPLOYMENT_INVOICE' ? $data['invoice_period'] : null,
            'uploaded_by_user_id' => (int) ($user->user_id ?? $user->id),
            'uploaded_at' => now(),
        ]);

        return response()->json(['ok' => true], 201);
    }

    public function destroy(Request $request, int $document)
    {
        $user = $this->requireStudent($request);

        $doc = DB::table('documents')->where('document_id', $document)->first();
        if (!$doc) return response()->json(['message' => 'Doklad neexistuje.'], 404);

        // over vlastníctvo cez internship
        $i = Internship::query()
            ->where('internship_id', $doc->internship_id)
            ->where('student_user_id', $user->user_id)
            ->first();
        if (!$i) return response()->json(['message' => 'Nemáš prístup k tomuto dokladu.'], 403);

        // zmaž aj súbor
        if (!empty($doc->file_path) && Storage::exists($doc->file_path)) {
            Storage::delete($doc->file_path);
        }

        DB::table('documents')->where('document_id', $document)->delete();

        return response()->json(['ok' => true]);
    }
}
