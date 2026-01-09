<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AgreementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AgreementController extends Controller
{
    public function download(Request $request, int $internship)
    {
        $user = $request->user();

        $row = DB::table('internship')
            ->where('internship_id', $internship)
            ->select(['internship_id', 'student_user_id', 'garant_user_id', 'company_id', 'practice_type'])
            ->first();

        if (!$row) {
            return response()->json(['message' => 'Prax neexistuje.'], 404);
        }

        if ($row->practice_type !== 'standard') {
            return response()->json(['message' => 'Dohoda existuje iba pre odbornú prax (štandard).'], 404);
        }

        $role = $user->role ?? null;

        $ok =
            ($role === 'student' && (int) $row->student_user_id === (int) ($user->user_id ?? $user->id)) ||
            ($role === 'garant'  && (int) $row->garant_user_id  === (int) ($user->user_id ?? $user->id)) ||
            ($role === 'company' && (int) $row->company_id      === (int) ($user->company_id ?? 0));

        if (!$ok) {
            return response()->json(['message' => 'Nemáš prístup k tejto dohode.'], 403);
        }

        try {
            // musí vrátiť RELATÍVNU cestu (ideálne bez "storage/app/"), napr. agreements/agreement_8.pdf
            $relative = app(AgreementService::class)->ensureGenerated((int) $row->internship_id);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['message' => 'Dohodu sa nepodarilo vygenerovať.'], 500);
        }

        // --- Normalizácia cesty (odolné na Windows a na "storage/app/..." návraty zo service) ---
        $relative = str_replace(['storage/app/', 'storage\\app\\'], '', (string) $relative);
        $relative = str_replace('\\', '/', $relative);
        $relative = ltrim($relative, '/');

        if ($relative === '') {
            return response()->json(['message' => 'PDF dohoda neexistuje.'], 404);
        }

        // --- Nájsť správny disk (kým nebude AgreementService striktne používať jeden disk) ---
        $disk = null;

        if (Storage::disk('local')->exists($relative)) {
            $disk = 'local';
        } elseif (Storage::disk('public')->exists($relative)) {
            $disk = 'public';
        }

        if ($disk === null) {
            // užitočné do logu, ak by sa to dialo v produkcii (pomôže odhaliť zlú cestu/disk)
            logger()->warning('Agreement PDF missing', [
                'internship' => (int) $internship,
                'relative' => $relative,
                'local_path' => Storage::disk('local')->path($relative),
                'public_path' => Storage::disk('public')->path($relative),
                'role' => $role,
            ]);

            return response()->json(['message' => 'PDF dohoda neexistuje.'], 404);
        }

        $filename = "Dohoda_o_odbornej_praxi.pdf";

        $absolutePath = Storage::disk($disk)->path($relative);
        return response()->download($absolutePath, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }
}