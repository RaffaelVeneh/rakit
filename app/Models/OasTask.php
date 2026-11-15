<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OasTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'assignee',
        'department',
        'due_date',
        'priority',
        'status',
        'notes',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];
}
