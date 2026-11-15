<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OasMemo extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'sender',
        'recipient',
        'department',
        'priority',
        'content',
        'document_type',
    ];
}
