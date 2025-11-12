<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Garant extends Model
{
    use HasFactory;

    protected $table = 'garant';
    protected $primaryKey = 'idgarant';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'last_name',
        'title',
        'email',
    ];

    // spätne na praxe
    public function praxes()
    {
        return $this->hasMany(Prax::class, 'garant_idgarant', 'idgarant');
    }
}
