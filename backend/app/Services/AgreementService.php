<?php

namespace App\Services;

use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

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
        $view = (string) ($cfg['view'] ?? 'agreements.standard');
        $viewPath = $cfg['view_path'] ?? null;
        $outDir = trim((string) ($cfg['output_dir'] ?? 'agreements'), '/');

        if ($viewPath && !is_file($viewPath)) {
            throw new \RuntimeException("Agreement view not found at: {$viewPath}");
        }

        $cuMin = DB::table('users')
            ->selectRaw('MIN(user_id) as user_id, company_id')
            ->where('role', 'company')
            ->groupBy('company_id');

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
                'i.internship_id',
                'i.practice_type',
                'i.start_date',
                'i.end_date',
                'i.updated_at',

                'c.company_id',
                'c.company_name',

                'ca.street as company_street',
                'ca.city as company_city',
                'ca.zip as company_zip',
                'ca.country as company_country',

                'u.user_id as student_user_id',
                'u.email as student_email',
                'u.first_name as student_first_name',
                'u.last_name as student_last_name',
                'u.phone_number as student_phone_number',
                'u.study_type as study_type',

                'cu.first_name as company_user_first_name',
                'cu.last_name as company_user_last_name',
            ]);

        if (Schema::hasColumn('users', 'position')) {
            $q->addSelect('cu.position as company_user_position');
        } else {
            $q->addSelect('cu.title as company_user_position');
        }

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

        Storage::disk('local')->makeDirectory($outDir);

        $pdfRelative = "{$outDir}/agreement_{$internshipId}.pdf";

        if (Storage::disk('local')->exists($pdfRelative)) {
            $pdfMtime = Storage::disk('local')->lastModified($pdfRelative);
            $updatedAt = $row->updated_at ? Carbon::parse($row->updated_at)->timestamp : 0;
            $tplMtime = $viewPath && is_file($viewPath) ? (@filemtime($viewPath) ?: 0) : 0;

            if ($pdfMtime >= max($updatedAt, $tplMtime)) {
                return $pdfRelative;
            }
        }

        $studentFullName = $this->buildStudentName($row);
        $studentPhone = (string) ($row->student_phone_number ?? '');

        $studentAddress = $this->buildStudentAddress($row);
        $companyAddress = $this->buildCompanyAddress($row);

        $companyPersonName = trim((string) ($row->company_user_first_name ?? '') . ' ' . (string) ($row->company_user_last_name ?? ''));
        $companyPersonPosition = trim((string) ($row->company_user_position ?? ''));

        $companyRepresentative = $companyPersonName;
        if ($companyPersonPosition !== '') {
            $companyRepresentative .= ', ' . $companyPersonPosition;
        }

        $now = Carbon::now();
        $start = $this->fmtDate($row->start_date);
        $end = $this->fmtDate($row->end_date);

        $data = [
            'company_name_address' => $companyAddress,
            'company_representative' => $companyRepresentative,
            'student_fullname' => $studentFullName ?: '',
            'student_address' => $studentAddress ?: '',
            'student_email' => (string) ($row->student_email ?? ''),
            'student_phone' => $studentPhone,
            'study_type' => 'aplikovaná informatika',
            'company_name' => (string) ($row->company_name ?? ''),
            'start_date' => $start,
            'end_date' => $end,
            'company_tutor_acc' => $companyPersonName,
            'date_nitra' => $now->format('d.m.Y'),
            'company_city' => (string) ($row->company_city ?? ''),
            'date_company' => $now->format('d.m.Y'),
            'company_signer_name' => $companyPersonName,
        ];

        $pdfAbs = Storage::disk('local')->path($pdfRelative);
        $this->renderPdf($view, $data, $pdfAbs);

        if (!Storage::disk('local')->exists($pdfRelative)) {
            throw new \RuntimeException('PDF generation failed (output pdf missing).');
        }

        return $pdfRelative;
    }

    private function renderPdf(string $view, array $data, string $pdfAbs): void
    {
        $html = view($view, $data)->render();

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isPhpEnabled', true);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4');
        $dompdf->render();

        file_put_contents($pdfAbs, $dompdf->output());
    }

    private function fmtDate($val): string
    {
        if (!$val) return '';
        return Carbon::parse($val)->format('d.m.Y');
    }

    private function buildStudentName(object $row): string
    {
        $first = $row->student_first_name ?? null;
        $last = $row->student_last_name ?? null;

        $full = trim(implode(' ', array_filter([(string) $first, (string) $last])));
        return $full !== '' ? $full : (string) ($row->student_email ?? '');
    }

    private function buildStudentAddress(object $row): string
    {
        $street = trim((string) ($row->student_street ?? ''));
        $city = trim((string) ($row->student_city ?? ''));
        $zip = trim((string) ($row->student_zip ?? ''));
        $country = trim((string) ($row->student_country ?? ''));

        $line1 = $street;

        $zipCity = trim(implode(' ', array_filter([$zip, $city])));
        $line2Parts = [];
        if ($zipCity !== '') $line2Parts[] = $zipCity;
        if ($country !== '') $line2Parts[] = $country;

        $line2 = implode(', ', $line2Parts);

        return trim(implode("\n", array_filter([$line1, $line2])));
    }

    private function buildCompanyAddress(object $row): string
    {
        $name = trim((string) ($row->company_name ?? ''));
        $street = trim((string) ($row->company_street ?? ''));
        $city = trim((string) ($row->company_city ?? ''));
        $zip = trim((string) ($row->company_zip ?? ''));
        $country = trim((string) ($row->company_country ?? ''));

        $zipCity = trim(implode(' ', array_filter([$zip, $city])));

        $parts = array_filter([
            $name,
            $street,
            $zipCity,
            $country,
        ], fn($v) => trim((string) $v) !== '');

        return implode(', ', $parts);
    }
}
