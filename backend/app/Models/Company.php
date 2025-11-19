<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Address;
use App\Models\Internship;

class Company extends Model
{
    protected $table = 'company';
    protected $primaryKey = 'company_id';
    public $timestamps = true; // nechávam tak, ako to máš nastavené ty

    protected $fillable = [
        'company_name',
        'ico',
        'dic',
        'email',
        'password',
        'phone_contact',
        'responsible_person',
        'address_id',
    ];

    protected $hidden = ['password'];

    // 🔹 väzba na adresu (company.address_id -> address.address_id)
    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'address_id', 'address_id');
    }

    // 🔹 firma má viac praxí
    public function internships(): HasMany
    {
        return $this->hasMany(Internship::class, 'company_id', 'company_id');
    }
}
