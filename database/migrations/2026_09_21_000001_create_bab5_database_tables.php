<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create brands table
        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->string('logo')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. Add brand_id to products
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->after('category_id')->constrained('brands')->onDelete('set null');
        });

        // 3. Create cart table (for guest IP & authenticated user persistent cart)
        Schema::create('cart', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('ip_address', 250)->default('127.0.0.1');
            $table->integer('quantity')->default(1);
            $table->timestamps();
        });

        // 4. Create logs table (audit trail)
        Schema::create('logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action', 255);
            $table->string('ip_address', 100)->nullable()->default('127.0.0.1');
            $table->timestamp('created_at')->useCurrent();
        });

        // 5–6. Trigger jejak audit.
        //
        // Badan trigger ini memakai dialek MySQL — BEGIN…END, END IF, CONCAT, FORMAT.
        // SQLite tidak mengenalinya, dan tanpa penjaga ini seluruh rangkaian migrasi
        // gagal di lingkungan uji sehingga tidak ada tes yang bisa berjalan. Jejak
        // audit hanya ada di MySQL, jadi hanya di MySQL ia dibuat.
        if (DB::getDriverName() === 'mysql') {
            DB::unprepared('DROP TRIGGER IF EXISTS after_orders_insert');
            DB::unprepared("
                CREATE TRIGGER `after_orders_insert` AFTER INSERT ON `orders` FOR EACH ROW
                BEGIN
                    INSERT INTO logs (user_id, action, ip_address, created_at)
                    VALUES (
                        NEW.user_id,
                        CONCAT('Pesanan Baru Masuk #', NEW.order_number, ' - Rp ', FORMAT(NEW.total_amount, 0)),
                        '127.0.0.1',
                        NOW()
                    );
                END
            ");

            DB::unprepared('DROP TRIGGER IF EXISTS after_orders_status_update');
            DB::unprepared("
                CREATE TRIGGER `after_orders_status_update` AFTER UPDATE ON `orders` FOR EACH ROW
                BEGIN
                    IF OLD.status != NEW.status THEN
                        INSERT INTO logs (user_id, action, ip_address, created_at)
                        VALUES (
                            NEW.user_id,
                            CONCAT('Status Pesanan #', NEW.order_number, ' Diperbarui: ', UPPER(OLD.status), ' -> ', UPPER(NEW.status)),
                            '127.0.0.1',
                            NOW()
                        );
                    END IF;
                END
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::unprepared('DROP TRIGGER IF EXISTS after_orders_status_update');
            DB::unprepared('DROP TRIGGER IF EXISTS after_orders_insert');
        }

        Schema::dropIfExists('logs');
        Schema::dropIfExists('cart');

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropColumn('brand_id');
        });

        Schema::dropIfExists('brands');
    }
};
