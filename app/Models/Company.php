<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Company extends Authenticatable
{
    use Notifiable;

    protected $table = 'company';
    protected $primaryKey = 'idcompany';
    public $timestamps = false;

    protected $fillable = [
        'name','ICO','DIC','email','password',
        'phone_contact','responsible_person','street','city','country','postal_code',
    ];

    protected $hidden = ['password','remember_token'];
}
