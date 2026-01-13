<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DocumentDownloadController extends Controller
{
    public function download(Request $request, int $document)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Neprihlásený používateľ.'], 401);
        }

        $rawRole = $user->role ?? $user->role_name ?? $user->type ?? null;
        $role = $rawRole !== null ? strtolower(trim((string) $rawRole)) : null;

        // načítaj dokument + prax
        $row = DB::table('documents')
            ->join('internship', 'internship.internship_id', '=', 'documents.internship_id')
            ->where('documents.document_id', $document)
            ->select([
                'documents.document_id',
                'documents.document_name',
                'documents.file_path',
                'documents.internship_id',
                'internship.student_user_id',
                'internship.garant_user_id',
                'internship.company_id',
            ])
            ->first();

        if (!$row) {
            return response()->json(['message' => 'Dokument neexistuje.'], 404);
        }

        // autorizácia podľa role
        $ok = false;

        if ($role === 'student') {
            $ok = ((int)$row->student_user_id === (int)$user->user_id);
        } elseif ($role === 'garant') {
            $ok = ((int)$row->garant_user_id === (int)$user->user_id);
        } elseif ($role === 'company') {
            $companyId = $user->company_id ?? null;
            $ok = $companyId && ((int)$row->company_id === (int)$companyId);
        } else {
            // iné roly nepúšťame
            $ok = false;
        }

        if (!$ok) {
            return response()->json(['message' => 'Prístup zamietnutý.'], 403);
        }

        if (!$row->file_path || !Storage::disk('local')->exists($row->file_path)) {
            return response()->json(['message' => 'Súbor sa nenašiel na disku.'], 404);
        }

        // vyrob korektný filename (ASCII fallback + UTF-8)
        $filename = $row->document_name ?: ("document_" . $row->document_id);
        $asciiName = preg_replace('/[^\x20-\x7E]/', '_', $filename);

        $mime = Storage::disk('local')->mimeType($row->file_path) ?: 'application/octet-stream';

        return Storage::disk('local')->download(
            $row->file_path,
            $filename,
            [
                'Content-Type' => $mime,
                // väčšina prehliadačov: podpora UTF-8 cez filename*
                'Content-Disposition' => "attachment; filename=\"{$asciiName}\"; filename*=UTF-8''" . rawurlencode($filename),
            ]
        );
    }
}
