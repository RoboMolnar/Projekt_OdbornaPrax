<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $table = 'company';
    protected $primaryKey = 'company_id';
    public $timestamps = true;

    protected $fillable = [
        'company_name',
        'ico',
        'dic',
        'email',
        'password',
        'phone_contact',
        'responsible_person',
        'address_id',
    ];

    protected $hidden = ['password'];
}
