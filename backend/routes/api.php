<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

use App\Http\Controllers\Api\StudentInternshipController;
use App\Http\Controllers\Api\GarantInternshipController;
use App\Http\Controllers\Api\CompanyInternshipController;

use App\Http\Controllers\Auth\RegisterCompanyController;
use App\Http\Controllers\Auth\RegisterStudentController;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordController;

use App\Http\Controllers\Api\InternshipDocumentsController;
use App\Http\Controllers\Api\DocumentDownloadController;
use App\Http\Controllers\Api\CompanySearchController;

use App\Http\Controllers\Api\AgreementController;
use App\Http\Controllers\Api\ExternalIntegrationController;

Route::get('/health', function () {
    return response()->json([
        'ok'   => true,
        'time' => now()->toIso8601String(),
        'app'  => config('app.name', 'Laravel'),
    ]);
});

/*
|--------------------------------------------------------------------------
| Externý systém – zmena stavu praxe (Schválená -> Obhájená)
|--------------------------------------------------------------------------
*/
Route::middleware(['scopes:external-integration'])
    ->post('/external/internships/{internship}/defend', [ExternalIntegrationController::class, 'markDefended']);

/*
|--------------------------------------------------------------------------
| Registrácia
|--------------------------------------------------------------------------
*/
Route::post('/register/student', [RegisterStudentController::class, 'store']);
Route::post('/register/company', [RegisterCompanyController::class, 'store']);

/*
|--------------------------------------------------------------------------
| Autentifikácia
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

/*
|--------------------------------------------------------------------------
| Zabudnuté heslo (bez prihlásenia)
|--------------------------------------------------------------------------
*/
Route::post('/password/forgot', [PasswordController::class, 'forgot']);
Route::post('/password/reset-with-temp', [PasswordController::class, 'resetWithTemp']);

/*
|--------------------------------------------------------------------------
| Spoločné pre všetkých prihlásených
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Download dokumentu pre všetkých prihlásených (študent/garant/firma)
    Route::get('/documents/{document}/download', [DocumentDownloadController::class, 'download']);

    /*
    |----------------------------------------------------------------------
    | Info o prihlásenom používateľovi
    |----------------------------------------------------------------------
    */
    Route::get('/user', function (Request $request) {
        $user = $request->user();

        return response()->json([
            'id'                   => $user->user_id ?? $user->id,
            'email'                => $user->email,
            'name'                 => $user->name
                ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
            'role'                 => $user->role ?? 'student',
            'must_change_password' => (bool)($user->must_change_password ?? false),
        ]);
    });

    /*
    |----------------------------------------------------------------------
    | Nútená zmena hesla (spoločné)
    |----------------------------------------------------------------------
    */
    Route::get('/password/force-change-check', [PasswordController::class, 'check']);
    Route::post('/password/force-change', [PasswordController::class, 'update']);
});

/*
|--------------------------------------------------------------------------
| ŠTUDENT – praxe + dokumenty
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get(
    '/internships/{internship}/agreement',
    [AgreementController::class, 'download']
);
Route::middleware(['auth:sanctum', 'role:student'])->group(function () {

    /*
    |----------------------------------------------------------------------
    | FIRMY – fulltext search (iba aktivované firmy)
    |----------------------------------------------------------------------
    */
    Route::get('/companies/search', [CompanySearchController::class, 'search']);

    /*
    |----------------------------------------------------------------------
    | FIRMY – zoznam (iba aktivované firmy) 
    |----------------------------------------------------------------------
    */
    Route::get('/companies', function () {
        return DB::table('company')
            ->join('users', function ($join) {
                $join->on('users.company_id', '=', 'company.company_id')
                    ->where('users.role', '=', 'company')
                    ->where('users.active', '=', 1);
            })
            ->leftJoin('address', 'address.address_id', '=', 'company.address_id')
            ->orderBy('company.company_name')
            ->select([
                'company.company_id as company_id',
                'company.company_name as company_name',
                'address.street',
                'address.city',
                'address.zip',
                'address.country',
            ])
            ->distinct()
            ->get();
    });

    // dokumenty k praxi (študent)
    Route::get('/student/internships/{internship}/documents', [InternshipDocumentsController::class, 'list']);
    Route::post('/student/internships/{internship}/documents', [InternshipDocumentsController::class, 'upload']);
    Route::delete('/student/documents/{document}', [InternshipDocumentsController::class, 'delete']);

    // praxe
    Route::get('/student/internships', [StudentInternshipController::class, 'index']);
    Route::post('/student/internships', [StudentInternshipController::class, 'store']);
    Route::get('/student/internships/{internship}', [StudentInternshipController::class, 'show']);
    Route::patch('/student/internships/{internship}', [StudentInternshipController::class, 'update']);
    Route::delete('/student/internships/{internship}', [StudentInternshipController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| GARANT – praxe + dokumenty
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:garant,external'])->group(function () {

    // AUTOCOMPLETE: študenti pre garanta (typeahead)
    // GET /api/garant/students/search?q=novak
    Route::get('/garant/students/search', function (Request $request) {
        $q = trim((string) $request->query('q', ''));

        // min. dĺžka, aby sa nedalo dumpovať všetko
        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        $isPg = strtolower((string) DB::getDriverName()) === 'pgsql';

        $query = DB::table('users')
            ->where('role', 'student')
            ->where('active', 1);

        if ($isPg) {
            $query->where(function ($sub) use ($q) {
                $sub->whereRaw("concat(coalesce(first_name,''), ' ', coalesce(last_name,'')) ILIKE ?", ["%{$q}%"])
                    ->orWhere('email', 'ILIKE', "%{$q}%");
            });
        } else {
            $query->where(function ($sub) use ($q) {
                $sub->where(DB::raw("CONCAT(IFNULL(first_name,''),' ',IFNULL(last_name,''))"), 'LIKE', "%{$q}%")
                    ->orWhere('email', 'LIKE', "%{$q}%");
            });
        }

        $rows = $query
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(20)
            ->get(['user_id', 'email', 'first_name', 'last_name'])
            ->map(function ($u) {
                $full = trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
                return [
                    'id' => (int) ($u->user_id ?? 0),
                    'label' => trim($full . (isset($u->email) && $u->email ? " ({$u->email})" : '')),
                    'email' => $u->email ?? null,
                    'first_name' => $u->first_name ?? '',
                    'last_name' => $u->last_name ?? '',
                ];
            })
            ->values();

        return response()->json($rows);
    });

    // AUTOCOMPLETE: firmy pre garanta (typeahead)
    // GET /api/garant/companies/search?q=ibm
    Route::get('/garant/companies/search', function (Request $request) {
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        $isPg = strtolower((string) DB::getDriverName()) === 'pgsql';

        $query = DB::table('company');

        if ($isPg) {
            $query->where('company_name', 'ILIKE', "%{$q}%");
        } else {
            $query->where('company_name', 'LIKE', "%{$q}%");
        }

        $rows = $query
            ->orderBy('company_name')
            ->limit(20)
            ->get(['company_id', 'company_name'])
            ->map(function ($c) {
                return [
                    'id' => (int) ($c->company_id ?? 0),
                    'label' => (string) ($c->company_name ?? ''),
                    'company_name' => (string) ($c->company_name ?? ''),
                ];
            })
            ->values();

        return response()->json($rows);
    });

    // dokumenty k praxi (garant)
    Route::get('/garant/internships/{internship}/documents', [InternshipDocumentsController::class, 'listForGarant']);
    Route::delete('/garant/documents/{document}', [InternshipDocumentsController::class, 'deleteForGarant']);

    // export CSV (berie filter parametre)
    Route::get('/garant/internships/export', [GarantInternshipController::class, 'exportCsv']);

    // praxe
    Route::get('/garant/internships', [GarantInternshipController::class, 'indexAll']);
    Route::get('/garant/internships/{internship}', [GarantInternshipController::class, 'show']);
    Route::patch('/garant/internships/{internship}', [GarantInternshipController::class, 'update']);

    Route::post('/garant/internships/{internship}/approve', [GarantInternshipController::class, 'approve']);
    Route::post('/garant/internships/{internship}/reject', [GarantInternshipController::class, 'reject']);
    Route::post('/garant/internships/{internship}/grade', [GarantInternshipController::class, 'grade']);
    Route::patch('/garant/internships/{internship}/state', [GarantInternshipController::class, 'setState']);
    Route::delete('/garant/internships/{internship}', [GarantInternshipController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| FIRMA – praxe
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:company'])->group(function () {
    Route::get('/company/internships', [CompanyInternshipController::class, 'index']);
    Route::get('/company/internships/{internship}', [CompanyInternshipController::class, 'show']);

    Route::post('/company/internships/{internship}/approve', [CompanyInternshipController::class, 'approve']);
    Route::post('/company/internships/{internship}/reject', [CompanyInternshipController::class, 'reject']);
    Route::post('/company/internships/{internship}/grade', [CompanyInternshipController::class, 'grade']);
    Route::patch('/company/internships/{internship}/state', [CompanyInternshipController::class, 'setState']);
    Route::delete('/company/internships/{internship}', [CompanyInternshipController::class, 'destroy']);

    // dokumenty k praxi (firma)
    Route::get('/company/internships/{internship}/documents', [InternshipDocumentsController::class, 'listForCompany']);
    Route::post('/company/internships/{internship}/documents', [InternshipDocumentsController::class, 'uploadForCompany']);

    // firma potvrdí/zamietne výkaz (študentov)
    Route::post('/company/documents/{document}/report-approve', [InternshipDocumentsController::class, 'approveReportForCompany']);
    Route::post('/company/documents/{document}/report-reject', [InternshipDocumentsController::class, 'rejectReportForCompany']);

    Route::post(
        '/company/internships/{internship}/contact-garant',
        [CompanyInternshipController::class, 'contactGarant']
    );
});
