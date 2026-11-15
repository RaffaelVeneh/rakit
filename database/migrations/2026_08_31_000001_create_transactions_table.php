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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->enum('type', ['internal', 'external'])->default('external');
            $table->string('category');
            $table->string('party_name');
            $table->decimal('amount', 15, 2);
            $table->enum('mode', ['online', 'batch'])->default('online');
            $table->enum('status', ['pending', 'validated', 'processed', 'failed'])->default('processed');
            $table->string('source_document')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
