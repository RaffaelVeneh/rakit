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
        Schema::create('sales_performances', function (Blueprint $table) {
            $table->id();
            $table->string('salesperson_name');
            $table->string('region');
            $table->string('month');
            $table->decimal('target_amount', 15, 2)->default(30000.00);
            $table->decimal('actual_sales', 15, 2);
            $table->integer('transaction_count')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_performances');
    }
};
