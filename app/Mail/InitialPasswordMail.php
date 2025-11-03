<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Content;

class InitialPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $plainPassword) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Váš účet bol vytvorený – dočasné heslo');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.initial-password',
            with: [
                'user' => $this->user,
                'plainPassword' => $this->plainPassword,
            ],
        );
    }

    public function attachments(): array { return []; }
}
