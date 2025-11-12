<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Internship extends Model
{
    protected $table = 'internship';
    protected $primaryKey = 'internship_id';
    public $timestamps = true;

    protected $fillable = [
        'student_user_id',
        'garant_user_id',
        'company_id',
        'state_id',
        'start_date',
        'end_date',
        'hours_total',
        'hours_completed',
        'notes',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_user_id', 'user_id');
    }

    public function garant()
    {
        return $this->belongsTo(User::class, 'garant_user_id', 'user_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'company_id');
    }

    public function state()
    {
        return $this->belongsTo(InternshipState::class, 'state_id', 'state_id');
    }
}
