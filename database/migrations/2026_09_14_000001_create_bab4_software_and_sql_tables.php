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
        // 1. Tabel admin_info
        Schema::create('admin_info', function (Blueprint $table) {
            $table->increments('admin_id');
            $table->string('admin_name', 100);
            $table->string('admin_email', 300);
            $table->string('admin_password', 300);
            $table->timestamps();
        });

        // 2. Tabel email_info (untuk newsletter)
        Schema::create('email_info', function (Blueprint $table) {
            $table->increments('email_id');
            $table->text('email');
            $table->timestamps();
        });

        // 3. Tabel user_info
        Schema::create('user_info', function (Blueprint $table) {
            $table->increments('user_id');
            $table->string('first_name', 100);
            $table->string('last_name', 100)->nullable();
            $table->string('email', 300);
            $table->string('password', 300);
            $table->string('mobile', 20)->nullable();
            $table->string('address1', 300)->nullable();
            $table->string('address2', 100)->nullable();
            $table->timestamps();
        });

        // 4. Tabel user_info_backup (target Trigger)
        Schema::create('user_info_backup', function (Blueprint $table) {
            $table->increments('user_id');
            $table->string('first_name', 100);
            $table->string('last_name', 100)->nullable();
            $table->string('email', 300);
            $table->string('password', 300);
            $table->string('mobile', 20)->nullable();
            $table->string('address1', 300)->nullable();
            $table->string('address2', 100)->nullable();
            $table->timestamps();
        });

        // 5–6. Trigger dan stored procedure.
        //
        // Keduanya ditulis dalam dialek MySQL: badan trigger memakai BEGIN…END dan
        // END IF, dan CREATE PROCEDURE tidak punya padanan di SQLite. Tanpa penjaga
        // ini, seluruh rangkaian migrasi gagal di lingkungan uji yang memakai SQLite,
        // sehingga tidak ada satu pun tes yang bisa dijalankan. Objek basis data ini
        // hanya ada di MySQL, jadi hanya di MySQL ia dibuat.
        if (DB::getDriverName() === 'mysql') {
            DB::unprepared('DROP TRIGGER IF EXISTS after_user_info_insert');
            DB::unprepared('
                CREATE TRIGGER `after_user_info_insert` AFTER INSERT ON `user_info` FOR EACH ROW
                BEGIN
                    INSERT INTO user_info_backup (user_id, first_name, last_name, email, password, mobile, address1, address2, created_at, updated_at)
                    VALUES (new.user_id, new.first_name, new.last_name, new.email, new.password, new.mobile, new.address1, new.address2, NOW(), NOW());
                END
            ');

            DB::unprepared('DROP PROCEDURE IF EXISTS getcat');
            DB::unprepared('
                CREATE PROCEDURE `getcat` (IN `cid` INT)
                BEGIN
                    SELECT * FROM categories WHERE id = cid;
                END
            ');
        }

        // Seed data awal sesuai PDF 1 SQL Dump
        DB::table('admin_info')->insert([
            'admin_id' => 1,
            'admin_name' => 'admin',
            'admin_email' => 'admin@gmail.com',
            'admin_password' => md5('password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('email_info')->insert([
            'email_id' => 3,
            'email' => 'admin@gmail.com',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('user_info')->insert([
            'user_id' => 12,
            'first_name' => 'punee',
            'last_name' => 'Red',
            'email' => 'pune@gmail.com',
            'password' => 'punee',
            'mobile' => '9448121558',
            'address1' => '123456789',
            'address2' => 'sdcjns,djc',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::unprepared('DROP PROCEDURE IF EXISTS getcat');
            DB::unprepared('DROP TRIGGER IF EXISTS after_user_info_insert');
        }

        Schema::dropIfExists('user_info_backup');
        Schema::dropIfExists('user_info');
        Schema::dropIfExists('email_info');
        Schema::dropIfExists('admin_info');
    }
};
