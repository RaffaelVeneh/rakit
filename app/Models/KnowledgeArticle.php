<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KnowledgeArticle extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'knowledge_type',
        'domain',
        'summary',
        'content',
        'author_role',
        'views_count',
    ];

    protected $casts = [
        'views_count' => 'integer',
    ];
}
