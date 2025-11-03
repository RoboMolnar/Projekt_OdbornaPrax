<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Content;

class CompanyActivationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $plainPassword,
        public string $activationUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Aktivácia firemného účtu – Portál odbornej praxe');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.company-activation',
            with: [
                'user' => $this->user,
                'plainPassword' => $this->plainPassword,
                'activationUrl' => $this->activationUrl,
            ],
        );
    }

    public function attachments(): array { return []; }
}
