<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $table = 'documents';
    protected $primaryKey = 'document_id';
    public $timestamps = false;

    protected $fillable = [
        'document_type_id',
        'internship_id',
        'document_name',
        'file_path',
        'invoice_period',
        'uploaded_by_user_id',
        'uploaded_at',
    ];

    public function type()
    {
        return $this->belongsTo(DocumentType::class, 'document_type_id', 'document_type_id');
    }

    public function internship()
    {
        return $this->belongsTo(Internship::class, 'internship_id', 'internship_id');
    }
}
