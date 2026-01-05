<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\InternshipState;

class Internship extends Model
{
    protected $table = 'internship';
    protected $primaryKey = 'internship_id';
    public $timestamps = true;

    protected $fillable = [
        'student_user_id',
        'garant_user_id',
        'company_id',
        'start_date',
        'end_date',
        'year',
        'semester',
        'worked_hours',
        'grade',
        'state_id',
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
    return $this->belongsTo(InternshipState::class, 'state_id', 'internship_state_id');
}
public function documents()
{
    return $this->hasMany(\App\Models\Document::class, 'internship_id', 'internship_id');
}

}
