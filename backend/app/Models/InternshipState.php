<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InternshipState extends Model
{
    protected $table = 'internship_state';
    protected $primaryKey = 'internship_state_id';
    public $timestamps = false;

    protected $fillable = [
        'internship_state_name',
    ];
}
