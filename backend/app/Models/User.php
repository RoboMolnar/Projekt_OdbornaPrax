<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;
use App\Models\FieldOfStudy;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'user_id';
    public $incrementing = true;
    protected $keyType = 'int';
    public $timestamps = true;

    protected $fillable = [
        'role',                 // 'student' | 'garant' | 'company' | 'admin'
        'email',
        'password',
        'first_name',
        'last_name',
        'phone_number',        // <- toto musí sedieť s DB
        'position',
        'address_id',
        'department_id',
        'field_of_study_id',
        'company_id',
        'active',               // ak má default, nemusíš posielať
        'title',
        'year_of_study',
        'study_type',
        'alternative_email',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    // automaticky hashni heslo, aj keby si na to zabudol v kontroleri
    public function setPasswordAttribute($value)
    {
        // iba ak už nie je zahashované
        $this->attributes['password'] = Hash::needsRehash($value)
            ? Hash::make($value)
            : $value;
    }

    public function fieldOfStudy()
    {
        // users.field_of_study_id -> field_of_study.field_of_study_id
        return $this->belongsTo(FieldOfStudy::class, 'field_of_study_id', 'field_of_study_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'company_id');
    }
}
