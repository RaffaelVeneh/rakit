<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Make `products.stock` unsigned.
 *
 * The column was a signed integer, so a decrement past zero produced -1 without a
 * single error: the catalogue then advertised negative stock and nothing anywhere
 * complained. An unsigned column cannot hold that value, so MySQL refuses the write.
 *
 * Refusing is the point. Inside the checkout transaction a refused write rolls the
 * whole order back, which is the correct outcome for a sale that cannot be fulfilled.
 * The application checks the quantity first, so this is the second line of defence,
 * not the only one — but it is the one that holds even if a future code path forgets
 * to check.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('stock')->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->integer('stock')->default(10)->change();
        });
    }
};
