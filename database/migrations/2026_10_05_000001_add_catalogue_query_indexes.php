<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indexes for the queries the sheets actually run.
 *
 * Every one of these backs a filter or an ordering that appears on a page the
 * operator opens daily: the console counts low stock and open orders, the
 * storefront shows featured positions, and the register always sorts by recency.
 * Without them MySQL scans the whole table, which is cheap at 184 rows and will
 * not be at 18,400.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->index('is_featured', 'products_is_featured_index');
            $table->index('stock', 'products_stock_index');
            $table->index('updated_at', 'products_updated_at_index');
            $table->index(['category_id', 'created_at'], 'products_category_created_index');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index('status', 'orders_status_index');
            $table->index(['status', 'created_at'], 'orders_status_created_index');
        });

        Schema::table('logs', function (Blueprint $table) {
            $table->index('created_at', 'logs_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_is_featured_index');
            $table->dropIndex('products_stock_index');
            $table->dropIndex('products_updated_at_index');
            $table->dropIndex('products_category_created_index');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_status_index');
            $table->dropIndex('orders_status_created_index');
        });

        Schema::table('logs', function (Blueprint $table) {
            $table->dropIndex('logs_created_at_index');
        });
    }
};
