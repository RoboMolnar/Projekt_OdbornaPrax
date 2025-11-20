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

    public function __construct(
        Internship $internship,
        ?string $oldStatus,
        string $newStatus,
        string $studentName,
        string $companyName
    ) {
        $this->internship  = $internship;
        $this->oldStatus   = $oldStatus;
        $this->newStatus   = $newStatus;
        $this->studentName = $studentName;
        $this->companyName = $companyName;
    }

    public function build()
    {
        $subject = 'Zmena stavu odbornej praxe: ' . $this->newStatus;

        return $this->subject($subject)
            // POZOR: adresujeme priečinok "mail", nie "emails"
            ->view('mail.internship_state_changed')
            ->with([
                'studentName' => $this->studentName,
                'companyName' => $this->companyName,
                'oldStatus'   => $this->oldStatus,
                'newStatus'   => $this->newStatus,
                'startDate'   => method_exists($this->internship->start_date, 'toDateString')
                                    ? $this->internship->start_date->toDateString()
                                    : (string)$this->internship->start_date,
                'endDate'     => method_exists($this->internship->end_date, 'toDateString')
                                    ? $this->internship->end_date->toDateString()
                                    : (string)$this->internship->end_date,
                'year'        => (int)$this->internship->year,
                'semester'    => $this->internship->semester ?? '',
            ]);
    }
}
