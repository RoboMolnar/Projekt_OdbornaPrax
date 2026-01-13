<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Internship;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GarantDocumentController extends Controller
{
    private function requireGarant(Request $request)
    {
        $user = $request->user();
        if (!$user) abort(401, 'Neprihlásený používateľ.');

        if (($user->role ?? null) !== 'garant') abort(403, 'Prístup povolený len pre garanta.');
        return $user;
    }

    private function findInternshipById(Request $request, int $id): Internship
    {
        $user = $this->requireGarant($request);

        $q = Internship::query()->where('internship_id', $id);

        // mimo local garant len svoje praxe
        if (!app()->environment('local')) {
            $q->where('garant_user_id', $user->user_id);
        }

        $i = $q->first();
        if (!$i) abort(404, 'Prax sa nenašla.');
        return $i;
    }

    public function index(Request $request, int $internship)
    {
        $i = $this->findInternshipById($request, $internship);

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

        return response()->json(['documents' => $rows]);
    }
}
