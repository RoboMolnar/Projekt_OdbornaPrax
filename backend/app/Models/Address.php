<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    protected $table = 'address';
    protected $primaryKey = 'address_id';
    public $timestamps = false;

    protected $fillable = [
        'street',
        'city',
        'zip',
        'country',
    ];

    public function companies()
    {
        return $this->hasMany(Company::class, 'address_id', 'address_id');
    }
}