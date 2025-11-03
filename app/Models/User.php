<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'student';
    protected $primaryKey = 'idstudent';
    public $timestamps = false;

    protected $fillable = [
        'name','email','password','year','title','study_type','major',
    ];

    protected $hidden = ['password','remember_token'];
}
