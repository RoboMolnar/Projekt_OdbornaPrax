<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class InternshipDocumentsController extends Controller
{
    private function requireRole(Request $request, string ...$roles)
    {
        $user = $request->user();
        if (!$user) {
            abort(response()->json(['message' => 'Neprihlásený používateľ.'], 401));
        }

        $rawRole = $user->role ?? $user->role_name ?? $user->type ?? null;
        $r = $rawRole !== null ? strtolower(trim((string) $rawRole)) : null;

        $allowed = array_map(
            fn ($x) => strtolower(trim((string) $x)),
            $roles
        );

        if ($r === null || !in_array($r, $allowed, true)) {
            abort(response()->json(['message' => 'Prístup zamietnutý.'], 403));
        }

        return $user;
    }

    private function docTypeId(string $name): int
    {
        $id = DB::table('document_type')->where('document_type_name', $name)->value('document_type_id');
        if (!$id) {
            abort(response()->json(['message' => "Chýba document_type: {$name}"], 422));
        }
        return (int) $id;
    }

    private function listDocsForInternship(int $internshipId): array
    {
        $docs = DB::table('documents')
            ->join('document_type', 'document_type.document_type_id', '=', 'documents.document_type_id')
            ->where('documents.internship_id', $internshipId)
            ->orderByDesc('documents.uploaded_at')
            ->select([
                'documents.document_id as id',
                'document_type.document_type_name as type',
                'documents.document_name as name',
                'documents.invoice_period as invoice_period',
                'documents.uploaded_at as uploaded_at',

                    'documents.company_review_status as company_review_status',
                    'documents.company_reviewed_at as company_reviewed_at',
                    'documents.company_review_note as company_review_note',
                    'documents.company_reviewed_by_user_id as company_reviewed_by_user_id',
            ])
            ->get();

        // compliance len pre employment
        $practiceType = DB::table('internship')->where('internship_id', $internshipId)->value('practice_type');

        $compliance = null;
        if ($practiceType === 'employment') {
            $contractTypeId = DB::table('document_type')->where('document_type_name', 'EMPLOYMENT_CONTRACT')->value('document_type_id');
            $invoiceTypeId  = DB::table('document_type')->where('document_type_name', 'EMPLOYMENT_INVOICE')->value('document_type_id');

            $hasContract = $contractTypeId
                ? DB::table('documents')->where('internship_id', $internshipId)->where('document_type_id', $contractTypeId)->exists()
                : false;

            $invoicePeriods = $invoiceTypeId
                ? DB::table('documents')
                    ->where('internship_id', $internshipId)
                    ->where('document_type_id', $invoiceTypeId)
                    ->whereNotNull('invoice_period')
                    ->pluck('invoice_period')
                    ->unique()
                    ->values()
                    ->all()
                : [];

            $ok = $hasContract || (count($invoicePeriods) >= 3);

            $reason = $hasContract
                ? 'Je nahratá pracovná zmluva.'
                : (count($invoicePeriods) >= 3
                    ? 'Sú nahraté aspoň 3 faktúry.'
                    : 'Chýba zmluva alebo 3 po sebe idúce faktúry.');

            $compliance = [
                'required' => true,
                'ok' => $ok,
                'reason' => $reason,
            ];
        }

        return [
            'documents' => $docs,
            'employment_compliance' => $compliance,
        ];
    }

    public function listForCompany(Request $request, int $internship): JsonResponse
{
    $user = $this->requireRole($request, 'company');

    // Firma musí mať company_id
    $companyId = $user->company_id ?? null;
    if (!$companyId) {
        abort(response()->json(['message' => 'Konto firmy nemá priradenú firmu.'], 422));
    }

    // Prax musí patriť firme
    $owned = DB::table('internship')
        ->where('internship_id', $internship)
        ->where('company_id', $companyId)
        ->exists();

    if (!$owned) {
        abort(response()->json(['message' => 'Prax neexistuje alebo nepatrí tvojej firme.'], 404));
    }

    return response()->json($this->listDocsForInternship($internship));
}
private function ensureIsReportDocument(int $documentId): void
{
    $type = DB::table('documents')
        ->join('document_type', 'document_type.document_type_id', '=', 'documents.document_type_id')
        ->where('documents.document_id', $documentId)
        ->value('document_type.document_type_name');

    // ZMEŇ si názov podľa tvojej DB!
    // napr. PRACTICE_REPORT alebo STANDARD_REPORT alebo VYKAZ...
    if ($type !== 'PRACTICE_REPORT') {
        abort(response()->json(['message' => 'Firma môže potvrdiť/zamietnuť iba výkaz.'], 422));
    }
}
public function approveReportForCompany(Request $request, int $document): JsonResponse
{
    $user = $this->requireRole($request, 'company');

    $companyId = $user->company_id ?? null;
    if (!$companyId) {
        abort(response()->json(['message' => 'Konto firmy nemá priradenú firmu.'], 422));
    }

    // musí to patriť firme (cez internship)
    $internshipId = DB::table('documents')
        ->join('internship', 'internship.internship_id', '=', 'documents.internship_id')
        ->where('documents.document_id', $document)
        ->where('internship.company_id', $companyId)
        ->value('documents.internship_id');

    if (!$internshipId) {
        abort(response()->json(['message' => 'Doklad neexistuje alebo nepatrí tvojej firme.'], 404));
    }

    $this->ensureIsReportDocument($document);

    $data = $request->validate([
        'note' => ['nullable', 'string', 'max:500'],
    ]);

    DB::table('documents')
        ->where('document_id', $document)
        ->update([
            'company_review_status' => 'approved',
            'company_reviewed_by_user_id' => $user->user_id,
            'company_reviewed_at' => now(),
            'company_review_note' => $data['note'] ?? null,
        ]);

    return response()->json(['ok' => true]);
}

public function rejectReportForCompany(Request $request, int $document): JsonResponse
{
    $user = $this->requireRole($request, 'company');

    $companyId = $user->company_id ?? null;
    if (!$companyId) {
        abort(response()->json(['message' => 'Konto firmy nemá priradenú firmu.'], 422));
    }

    $internshipId = DB::table('documents')
        ->join('internship', 'internship.internship_id', '=', 'documents.internship_id')
        ->where('documents.document_id', $document)
        ->where('internship.company_id', $companyId)
        ->value('documents.internship_id');

    if (!$internshipId) {
        abort(response()->json(['message' => 'Doklad neexistuje alebo nepatrí tvojej firme.'], 404));
    }

    $this->ensureIsReportDocument($document);

    $data = $request->validate([
        'note' => ['nullable', 'string', 'max:500'],
    ]);

    DB::table('documents')
        ->where('document_id', $document)
        ->update([
            'company_review_status' => 'rejected',
            'company_reviewed_by_user_id' => $user->user_id,
            'company_reviewed_at' => now(),
            'company_review_note' => $data['note'] ?? null,
        ]);

    return response()->json(['ok' => true]);
}

    /**
     * študent: zoznam dokladov k jeho praxi
     */
    public function list(Request $request, int $internship): JsonResponse
    {
        $user = $this->requireRole($request, 'student');

        $owned = DB::table('internship')
            ->where('internship_id', $internship)
            ->where('student_user_id', $user->user_id)
            ->exists();

        if (!$owned) {
            abort(response()->json(['message' => 'Prax neexistuje alebo ti nepatrí.'], 404));
        }

        return response()->json($this->listDocsForInternship($internship));
    }

    /**
     * Študent: upload dokladu
     */
    public function upload(Request $request, int $internship): JsonResponse
    {
        $user = $this->requireRole($request, 'student');

        $owned = DB::table('internship')
            ->where('internship_id', $internship)
            ->where('student_user_id', $user->user_id)
            ->exists();

        if (!$owned) {
            abort(response()->json(['message' => 'Prax neexistuje alebo ti nepatrí.'], 404));
        }

        $data = $request->validate([
        'type' => ['required', 'string', 'in:EMPLOYMENT_CONTRACT,EMPLOYMENT_INVOICE,PRACTICE_CONTRACT,PRACTICE_REPORT'],
        'invoice_period' => ['nullable', 'string', 'regex:/^\d{4}-\d{2}$/'],
        'file' => ['required', 'file', 'max:10240'],
        ]);


// invoice_period je povinné iba pri faktúre
if ($data['type'] === 'EMPLOYMENT_INVOICE' && empty($data['invoice_period'])) {
    abort(response()->json(['message' => 'Pri faktúre musí byť vyplnené obdobie (YYYY-MM).'], 422));
}


        $docTypeId = $this->docTypeId($data['type']);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();

        $storedPath = $file->store("documents/{$internship}", 'local');

        DB::table('documents')->insert([
            'document_type_id' => $docTypeId,
            'internship_id' => $internship,
            'document_name' => $originalName,
            'file_path' => $storedPath,
            'invoice_period' => $data['type'] === 'EMPLOYMENT_INVOICE' ? $data['invoice_period'] : null,
            'uploaded_by_user_id' => $user->user_id,
            'uploaded_at' => now(),
        ]);

        return response()->json(['ok' => true], 201);
    }

    /**
     * Študent: delete dokladu (len jeho)
     */
    public function delete(Request $request, int $document): JsonResponse
    {
        $user = $this->requireRole($request, 'student');

        $row = DB::table('documents')
            ->join('internship', 'internship.internship_id', '=', 'documents.internship_id')
            ->where('documents.document_id', $document)
            ->where('internship.student_user_id', $user->user_id)
            ->select(['documents.document_id', 'documents.file_path'])
            ->first();

        if (!$row) {
            abort(response()->json(['message' => 'Doklad neexistuje alebo ti nepatrí.'], 404));
        }

        if (!empty($row->file_path) && Storage::disk('local')->exists($row->file_path)) {
            Storage::disk('local')->delete($row->file_path);
        }

        DB::table('documents')->where('document_id', $document)->delete();

        return response()->json(['ok' => true]);
    }
    public function uploadForCompany(Request $request, int $internship): JsonResponse
{
    $user = $this->requireRole($request, 'company');

    $companyId = $user->company_id ?? null;
    if (!$companyId) {
        abort(response()->json(['message' => 'Konto firmy nemá priradenú firmu.'], 422));
    }

    // prax musí patriť firme
    $owned = DB::table('internship')
        ->where('internship_id', $internship)
        ->where('company_id', $companyId)
        ->exists();

    if (!$owned) {
        abort(response()->json(['message' => 'Prax neexistuje alebo nepatrí tvojej firme.'], 404));
    }

    // Firma môže nahrávať iba výkaz (PRACTICE_REPORT)
    $data = $request->validate([
        'type' => ['required', 'string', 'in:PRACTICE_REPORT'],
        'file' => ['required', 'file', 'max:10240'], // 10MB
    ]);

    $docTypeId = $this->docTypeId($data['type']);

    $file = $request->file('file');
    $originalName = $file->getClientOriginalName();

    $storedPath = $file->store("documents/{$internship}", 'local');

    // automaticky schválené
    DB::table('documents')->insert([
        'document_type_id' => $docTypeId,
        'internship_id' => $internship,
        'document_name' => $originalName,
        'file_path' => $storedPath,
        'invoice_period' => null,
        'uploaded_by_user_id' => $user->user_id,
        'uploaded_at' => now(),

        'company_review_status' => 'approved',
        'company_reviewed_by_user_id' => $user->user_id,
        'company_reviewed_at' => now(),
        'company_review_note' => null,
    ]);

    return response()->json(['ok' => true], 201);
}


    /**
     * Garant: zoznam dokladov (len k praxi, kde je garant_user_id = aktuálny garant)
     */
    public function listForGarant(Request $request, int $internship): JsonResponse
    {
        $user = $this->requireRole($request, 'garant', 'external');

        $ownedByGarant = DB::table('internship')
            ->where('internship_id', $internship)
            ->where('garant_user_id', $user->user_id)
            ->exists();

        if (!$ownedByGarant) {
            abort(response()->json(['message' => 'Prax neexistuje alebo ti nepatrí (nie si garant).'], 404));
        }

        return response()->json($this->listDocsForInternship($internship));
    }

    /**
     * Garant: zmaže doklad (iba ak je garantom danej praxe)
     */
    public function deleteForGarant(Request $request, int $document): JsonResponse
    {
        $user = $this->requireRole($request, 'garant', 'external');

        $row = DB::table('documents')
            ->join('internship', 'internship.internship_id', '=', 'documents.internship_id')
            ->where('documents.document_id', $document)
            ->where('internship.garant_user_id', $user->user_id)
            ->select([
                'documents.document_id',
                'documents.file_path',
            ])
            ->first();

        if (!$row) {
            abort(response()->json(['message' => 'Doklad neexistuje alebo k nemu nemáš prístup (nie si garant).'], 404));
        }

        if (!empty($row->file_path) && Storage::disk('local')->exists($row->file_path)) {
            Storage::disk('local')->delete($row->file_path);
        }

        DB::table('documents')->where('document_id', $document)->delete();

        return response()->json(['ok' => true]);
    }
}
