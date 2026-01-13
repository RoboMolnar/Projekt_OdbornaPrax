<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FieldOfStudy extends Model
{
    protected $table = 'field_of_study';
    protected $primaryKey = 'field_of_study_id';
    public $timestamps = false;

    protected $fillable = [
        'field_of_study_name',
        'field_of_study_shortcut',
        'faculty_id',
    ];

    public function students()
    {
        // users.field_of_study_id -> field_of_study.field_of_study_id
        return $this->hasMany(User::class, 'field_of_study_id', 'field_of_study_id');
    }
}