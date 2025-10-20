<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prax extends Model
{
    use HasFactory;

    protected $table = 'prax';
    protected $primaryKey = 'idprax';
    public $timestamps = false;

    protected $fillable = [
        'start_date',
        'end_date',
        'student_idstudent',
        'grade',
        'worked_hours',
        'company_idcompany',
        'garant_idgarant',
        'year',
        'semester',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date'   => 'datetime',
        'worked_hours' => 'integer',
        'year' => 'integer',
    ];

    // vzťahy
    public function student()
    {
        return $this->belongsTo(User::class, 'student_idstudent', 'idstudent');
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_idcompany', 'idcompany');
    }

    public function garant()
    {
        return $this->belongsTo(Garant::class, 'garant_idgarant', 'idgarant');
    }
}
