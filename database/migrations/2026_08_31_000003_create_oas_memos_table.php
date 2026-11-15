<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('oas_memos', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('sender');
            $table->string('recipient');
            $table->string('department');
            $table->enum('priority', ['normal', 'urgent', 'confidential'])->default('normal');
            $table->text('content');
            $table->string('document_type')->default('Memo Internal');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('oas_memos');
    }
};
