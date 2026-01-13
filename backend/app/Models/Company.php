<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Address;

class Company extends Model
{
    protected $table = 'company';
    protected $primaryKey = 'company_id';
    public $timestamps = false;

    protected $fillable = [
        'company_name',
        'ico',
        'dic',
        'email',
        'phone_contact',
        'address_id',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'company_id', 'company_id');
    }

    public function address()
    {
        // company.address_id -> address.address_id
        return $this->belongsTo(Address::class, 'address_id', 'address_id');
    }

}