<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InternshipStateChange extends Model
{
    use HasFactory;

    protected $table = 'internship_state_change';
    protected $primaryKey = 'internship_state_change_id';
    public $timestamps = false;

    protected $fillable = [
        'internship_id',
        'from_state_id',
        'to_state_id',
        'changed_by_user_id',
        'note',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function internship()
    {
        return $this->belongsTo(Internship::class, 'internship_id', 'internship_id');
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by_user_id', 'user_id');
    }
}