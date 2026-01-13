<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompanySearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $qRaw = trim((string) $request->query('q', ''));
        $limit = (int) $request->query('limit', 20);
        $limit = max(1, min($limit, 50));

        // normalizácia: malé písmená + vyhodiť všetko okrem písmen/čísiel
        $qCompact = mb_strtolower($qRaw);
        $qCompact = preg_replace('/[^a-z0-9]+/i', '', $qCompact) ?? '';

        $rows = DB::table('company')
            ->join('users', function ($join) {
                $join->on('users.company_id', '=', 'company.company_id')
                    ->where('users.role', '=', 'company')
                    ->where('users.active', '=', 1); // ✅ iba aktivované firmy
            })
            ->leftJoin('address', 'address.address_id', '=', 'company.address_id')
            ->select([
                'company.company_id as company_id',
                'company.company_name as company_name',
                'address.street as street',
                'address.city as city',
                'address.zip as zip',
                'address.country as country',
            ])
            ->when($qRaw !== '', function ($query) use ($qRaw, $qCompact) {
                // 1) klasické LIKE (pre bežné prípady)
                $query->where(function ($s) use ($qRaw, $qCompact) {

                    $s->where('company.company_name', 'like', "%{$qRaw}%")
                      ->orWhere('company.ico', 'like', "%{$qRaw}%")
                      ->orWhere('company.dic', 'like', "%{$qRaw}%");

                    // 2) „smart“ LIKE – odstráni bodky a medzery z názvu firmy
                    // aby "mama sro" našlo aj "Mama s.r.o."
                    if ($qCompact !== '') {
                        $s->orWhereRaw(
                            "REPLACE(REPLACE(REPLACE(LOWER(company.company_name), '.', ''), ' ', ''), '-', '') LIKE ?",
                            ["%{$qCompact}%"]
                        );
                    }
                });
            })
            ->distinct()
            ->orderBy('company.company_name')
            ->limit($limit)
            ->get();

        return response()->json($rows);
    }
}