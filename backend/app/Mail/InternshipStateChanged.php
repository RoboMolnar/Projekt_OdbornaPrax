<?php

namespace App\Mail;

use App\Models\Internship;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InternshipStateChanged extends Mailable
{
    use Queueable, SerializesModels;

    public Internship $internship;
    public ?string $oldStatus;
    public string $newStatus;
    public string $studentName;
    public string $companyName;
    public string $changedBy; // ✅ NOVÉ (napr. "firmou idk" alebo "garantom")

    public function __construct(
        Internship $internship,
        ?string $oldStatus,
        string $newStatus,
        string $studentName,
        string $companyName,
        string $changedBy // ✅ NOVÉ
    ) {
        $this->internship  = $internship;
        $this->oldStatus   = $oldStatus;
        $this->newStatus   = $newStatus;
        $this->studentName = $studentName;
        $this->companyName = $companyName;
        $this->changedBy   = $changedBy;
    }

    private function dateToString($value): string
    {
        if (!$value) return '—';
        return method_exists($value, 'toDateString') ? $value->toDateString() : (string) $value;
    }

    public function build()
    {
        $id = $this->internship->internship_id ?? $this->internship->id;

        // ✅ jednotný subject (lepšie v inboxe)
        $subject = "Stav praxe #{$id}: {$this->newStatus}";

        return $this->subject($subject)
            // POZOR: adresujeme priečinok "mail", nie "emails"
            ->view('mail.internship_state_changed')
            ->with([
                'id'          => $id,
                'studentName' => $this->studentName,
                'companyName' => $this->companyName,
                'changedBy'   => $this->changedBy, // ✅ NOVÉ
                'oldStatus'   => $this->oldStatus ?? '—',
                'newStatus'   => $this->newStatus,

                'startDate'   => $this->dateToString($this->internship->start_date),
                'endDate'     => $this->dateToString($this->internship->end_date),
                'year'        => (int) $this->internship->year,
                'semester'    => $this->internship->semester ?? '—',
            ]);
    }
}
