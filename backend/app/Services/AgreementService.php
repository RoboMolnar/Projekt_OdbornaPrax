<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\TemplateProcessor;
use Symfony\Component\Process\Process;

class AgreementService
{
    public function ensureGenerated(int $internshipId): string
    {
        $lock = Cache::lock("agreement:{$internshipId}", 30);

        return $lock->block(10, function () use ($internshipId) {
            return $this->ensureGeneratedUnlocked($internshipId);
        });
    }

    private function ensureGeneratedUnlocked(int $internshipId): string
    {
        $cfg = config('agreement');
        $templatePath = $cfg['template'] ?? null;
        $outDir = trim((string)($cfg['output_dir'] ?? 'private/agreements'), '/');

        if (!$templatePath || !is_file($templatePath)) {
            throw new \RuntimeException("Agreement template not found at: {$templatePath}");
        }

        // subquery: vyber "prvého" company používateľa pre firmu (aby nevznikali duplicity)
        $cuMin = DB::table('users')
            ->selectRaw('MIN(user_id) as user_id, company_id')
            ->where('role', 'company')
            ->groupBy('company_id');

        // --- Načítaj prax + firmu + adresu firmy + študenta + (company user z registrácie) ---
        $q = DB::table('internship as i')
            ->join('company as c', 'c.company_id', '=', 'i.company_id')
            ->leftJoin('address as ca', 'ca.address_id', '=', 'c.address_id')
            ->join('users as u', 'u.user_id', '=', 'i.student_user_id')
            ->leftJoinSub($cuMin, 'cu_min', function ($join) {
                $join->on('cu_min.company_id', '=', 'c.company_id');
            })
            ->leftJoin('users as cu', 'cu.user_id', '=', 'cu_min.user_id')
            ->where('i.internship_id', $internshipId)
            ->select([
                // internship
                'i.internship_id',
                'i.practice_type',
                'i.start_date',
                'i.end_date',
                'i.updated_at',

                // company
                'c.company_id',
                'c.company_name',

                // company address
                'ca.street as company_street',
                'ca.city as company_city',
                'ca.zip as company_zip',
                'ca.country as company_country',

                // student
                'u.user_id as student_user_id',
                'u.email as student_email',
                'u.first_name as student_first_name',
                'u.last_name as student_last_name',
                'u.phone_number as student_phone_number',
                'u.study_type as study_type',

                // company user (osoba z registrácie firmy)
                'cu.first_name as company_user_first_name',
                'cu.last_name as company_user_last_name',
            ]);

        // ✅ pozícia: preferuj users.position, fallback na users.title (aby sa nič nerozbilo v starších DB)
        if (Schema::hasColumn('users', 'position')) {
            $q->addSelect('cu.position as company_user_position');
        } else {
            // fallback
            $q->addSelect('cu.title as company_user_position');
        }

        // študentova adresa cez address_id (u teba existuje)
        if (Schema::hasColumn('users', 'address_id')) {
            $q->leftJoin('address as sa', 'sa.address_id', '=', 'u.address_id')
                ->addSelect([
                    'sa.street as student_street',
                    'sa.city as student_city',
                    'sa.zip as student_zip',
                    'sa.country as student_country',
                ]);
        }

        $row = $q->first();

        if (!$row) {
            throw new \RuntimeException('Internship not found.');
        }

        if (($row->practice_type ?? null) !== 'standard') {
            throw new \RuntimeException('Agreement is only for standard practice_type.');
        }

        // --- Cesty ---
        Storage::disk('local')->makeDirectory($outDir);

        $pdfRelative  = "{$outDir}/agreement_{$internshipId}.pdf";
        $docxRelative = "{$outDir}/agreement_{$internshipId}.docx";

        // --- Ak PDF existuje a je novšie než updated_at alebo šablóna, nechaj ho ---
        if (Storage::disk('local')->exists($pdfRelative)) {
            $pdfMtime = Storage::disk('local')->lastModified($pdfRelative);
            $updatedAt = $row->updated_at ? Carbon::parse($row->updated_at)->timestamp : 0;
            $tplMtime = @filemtime($templatePath) ?: 0;

            if ($pdfMtime >= max($updatedAt, $tplMtime)) {
                return $pdfRelative;
            }
        }

        // --- Poskladaj hodnoty do placeholderov ---
        $studentFullName = $this->buildStudentName($row);
        $studentPhone = (string)($row->student_phone_number ?? '');

        $studentAddress = $this->buildStudentAddress($row);
        $companyAddress = $this->buildCompanyAddress($row);

        // osoba firmy + pozícia (CEO/konateľ/...)
        $companyPersonName = trim((string)($row->company_user_first_name ?? '') . ' ' . (string)($row->company_user_last_name ?? ''));
        $companyPersonPosition = trim((string)($row->company_user_position ?? ''));

        $companyRepresentative = $companyPersonName;
        if ($companyPersonPosition !== '') {
            $companyRepresentative .= ', ' . $companyPersonPosition;
        }

        $now = Carbon::now();
        $start = $this->fmtDate($row->start_date);
        $end   = $this->fmtDate($row->end_date);

        $tpl = new TemplateProcessor($templatePath);

        // ✅ Plný názov a adresa: LEN firma + adresa (bez osoby)
        $tpl->setValue('COMPANY_NAME_ADDRESS', $companyAddress);

        // ✅ v zastúpení: osoba + (pozícia)
        $tpl->setValue('COMPANY_REPRESENTATIVE', $companyRepresentative);

        $tpl->setValue('STUDENT_FULLNAME', $studentFullName ?: '');
        $tpl->setValue('STUDENT_ADDRESS', $studentAddress ?: '');
        $tpl->setValue('STUDENT_EMAIL', (string)($row->student_email ?? ''));
        $tpl->setValue('STUDENT_PHONE', $studentPhone);

        // študijný program vždy "Aplikovaná informatika"
        $tpl->setValue('STUDY_TYPE', 'aplikovaná informatika');

        $tpl->setValue('COMPANY_NAME', (string)($row->company_name ?? ''));
        $tpl->setValue('START_DATE', $start);
        $tpl->setValue('END_DATE', $end);

        // tútor – meno a priezvisko z registrácie firmy
        $tpl->setValue('COMPANY_TUTOR_ACC', $companyPersonName);

        $tpl->setValue('DATE_NITRA', $now->format('d.m.Y'));
        $tpl->setValue('COMPANY_CITY', (string)($row->company_city ?? ''));
        $tpl->setValue('DATE_COMPANY', $now->format('d.m.Y'));

        // podpisujúci – meno a priezvisko (bez pozície)
        $tpl->setValue('COMPANY_SIGNER_NAME', $companyPersonName);

        // --- Ulož DOCX ---
        $docxAbs = Storage::disk('local')->path($docxRelative);
        $tpl->saveAs($docxAbs);

        // --- Konverzia na PDF cez LibreOffice ---
        $this->convertDocxToPdf($docxAbs, Storage::disk('local')->path($outDir));

        if (!Storage::disk('local')->exists($pdfRelative)) {
            throw new \RuntimeException('PDF conversion failed (output pdf missing).');
        }

        return $pdfRelative;
    }

    private function convertDocxToPdf(string $docxAbs, string $outDirAbs): void
    {
        $soffice = config('agreement.libreoffice_path') ?: 'soffice';

        $process = new Process([
            $soffice,
            '--headless',
            '--nologo',
            '--nofirststartwizard',
            '--convert-to', 'pdf',
            '--outdir', $outDirAbs,
            $docxAbs,
        ]);

        $process->setTimeout(60);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new \RuntimeException('LibreOffice convert failed: ' . $process->getErrorOutput());
        }
    }

    private function fmtDate($val): string
    {
        if (!$val) return '';
        return Carbon::parse($val)->format('d.m.Y');
    }

    private function buildStudentName(object $row): string
    {
        $first = $row->student_first_name ?? null;
        $last  = $row->student_last_name ?? null;

        $full = trim(implode(' ', array_filter([(string)$first, (string)$last])));
        return $full !== '' ? $full : (string)($row->student_email ?? '');
    }

    /**
     * Formálna adresa na 2 riadky:
     * 1) ulica a číslo
     * 2) PSČ Mesto, Štát
     */
    private function buildStudentAddress(object $row): string
    {
        $street  = trim((string)($row->student_street ?? ''));
        $city    = trim((string)($row->student_city ?? ''));
        $zip     = trim((string)($row->student_zip ?? ''));
        $country = trim((string)($row->student_country ?? ''));

        $line1 = $street;

        $zipCity = trim(implode(' ', array_filter([$zip, $city])));
        $line2Parts = [];
        if ($zipCity !== '') $line2Parts[] = $zipCity;
        if ($country !== '') $line2Parts[] = $country;

        $line2 = implode(', ', $line2Parts);

        return trim(implode("\n", array_filter([$line1, $line2])));
    }

    /**
     * Firma + adresa v jednom riadku pre placeholder COMPANY_NAME_ADDRESS:
     * "Názov firmy, Ulica a číslo, PSČ Mesto, Štát"
     */
    private function buildCompanyAddress(object $row): string
    {
        $name    = trim((string)($row->company_name ?? ''));
        $street  = trim((string)($row->company_street ?? ''));
        $city    = trim((string)($row->company_city ?? ''));
        $zip     = trim((string)($row->company_zip ?? ''));
        $country = trim((string)($row->company_country ?? ''));

        $zipCity = trim(implode(' ', array_filter([$zip, $city])));

        $parts = array_filter([
            $name,
            $street,
            $zipCity,
            $country,
        ], fn($v) => trim((string)$v) !== '');

        return implode(', ', $parts);
    }
}