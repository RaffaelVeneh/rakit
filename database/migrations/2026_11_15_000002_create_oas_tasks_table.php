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
        Schema::create('oas_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->string('assignee', 100);
            $table->string('department', 100);
            $table->date('due_date');
            $table->enum('priority', ['normal', 'urgent'])->default('normal');
            $table->enum('status', ['open', 'done'])->default('open');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        $now = now();

        DB::table('oas_tasks')->insert([
            [
                'title' => 'Rekonsiliasi stok kartu grafis RTX kuartal berjalan',
                'assignee' => 'Staf Inventaris Gudang',
                'department' => 'Operasional & Gudang',
                'due_date' => now()->addDays(2)->toDateString(),
                'priority' => 'urgent',
                'status' => 'open',
                'notes' => 'Cocokkan catatan batch masuk dengan ledger produk aktif.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Arsip digital faktur B2B pengadaan workstation',
                'assignee' => 'Sekretaris Administrasi',
                'department' => 'Administrasi Kantor',
                'due_date' => now()->addDays(5)->toDateString(),
                'priority' => 'normal',
                'status' => 'open',
                'notes' => 'Pindai dokumen menggunakan alur OCR sebelum pengesahan manajer.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Audit mingguan log backup & trigger SQL',
                'assignee' => 'Database Administrator',
                'department' => 'Sistem Informasi',
                'due_date' => now()->subDay()->toDateString(),
                'priority' => 'normal',
                'status' => 'done',
                'notes' => 'Terverifikasi pada tabel logs dan user_info_backup.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('oas_tasks');
    }
};
