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
        Schema::create('chatbot', function (Blueprint $table) {
            $table->id();
            $table->text('queries');
            $table->text('replies');
            $table->string('category', 80)->default('Umum');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('knowledge_articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->enum('knowledge_type', ['explicit', 'implicit', 'tacit'])->default('explicit');
            $table->string('domain', 80);
            $table->text('summary');
            $table->text('content');
            $table->string('author_role', 100);
            $table->unsignedInteger('views_count')->default(0);
            $table->timestamps();
        });

        $now = now();

        DB::table('chatbot')->insert([
            [
                'queries' => 'halo|hai|hi|selamat pagi|selamat siang|selamat sore|selamat malam|assalamualaikum',
                'replies' => 'Halo! Saya Asisten RAKIT. Tanyakan ketersediaan komponen PC, kategori hardware/periferi, status transaksi, garansi, atau cara kerja KMS.',
                'category' => 'Sapaan',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'queries' => 'siapa kamu|kamu siapa|tentang rakit|apa itu rakit|toko apa ini',
                'replies' => 'Saya asisten pengetahuan RAKIT — etalase perangkat keras & platform demonstrasi Sistem Informasi Manajemen (TPS, OAS, MIS, KMS, EIS, dan Expert System).',
                'category' => 'Identitas',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'queries' => 'kategori|jual apa|produk apa|komponen apa|daftar kategori',
                'replies' => 'Katalog RAKIT mencakup komponen inti PC rakitan: CPU/Prosesor, Motherboard, RAM/Memori, GPU/Kartu Grafis, Penyimpanan SSD/NVMe, PSU, Casing, dan Periferi. Gunakan bilah pencarian atau filter kategori di halaman beranda.',
                'category' => 'Katalog',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'queries' => 'cara beli|cara order|checkout|pembayaran|bayar|keranjang|cart',
                'replies' => 'Tambahkan produk ke keranjang dari halaman utama atau detail produk, buka halaman Keranjang (/cart), lalu lakukan Checkout (/checkout). Setiap pesanan diproses secara atomik dengan penguncian stok (lockForUpdate) dan pencatatan audit trigger.',
                'category' => 'Transaksi',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'queries' => 'kompatibilitas|socket|ddr4|ddr5|am5|lga1700|psu|watt|bottle neck|bottleneck',
                'replies' => 'Pastikan socket CPU cocok dengan motherboard (mis. AM5/AM4 atau LGA1700), generasi RAM sesuai slot motherboard (DDR4 vs DDR5), serta kapasitas PSU memberi headroom minimal 25–30% di atas total TDP CPU+GPU. Anda dapat menguji aturan pakar di modul /iss.',
                'category' => 'Teknis Rakitan',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'queries' => 'garansi|retur|pengembalian|klaim|rusak|rma',
                'replies' => 'Setiap komponen resmi di RAKIT dilindungi garansi distributor sesuai SKU. Simpan nomor resi/invoice pesanan Anda dari halaman Riwayat Pesanan (/cart?tab=orders) untuk proses verifikasi RMA atau klaim garansi.',
                'category' => 'Layanan Purna Jual',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'queries' => 'kms|knowledge management|tacit|explicit|implicit|basis pengetahuan',
                'replies' => 'Knowledge Management System (KMS) di RAKIT mengelola pengetahuan Explicit (SOP & spesifikasi tertulis), Implicit (pola troubleshooting & praktik rakitan), dan Tacit (wawasan pakar/teknisi senior), serta basis aturan Chatbot pada tabel chatbot.',
                'category' => 'KMS',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'queries' => 'lacak pesanan|cek order|status pesanan|invoice|resi',
                'replies' => 'Masuk ke akun Anda lalu buka Portal Pengguna (/user) atau Riwayat Pesanan (/cart?tab=orders) untuk melihat daftar pesanan, rincian item, dan status pemrosesan terbaru.',
                'category' => 'Transaksi',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        DB::table('knowledge_articles')->insert([
            [
                'title' => 'SOP Verifikasi Kompatibilitas Socket, Chipset & Memori sebelum Pengemasan',
                'slug' => 'sop-verifikasi-kompatibilitas-socket-chipset-memori',
                'knowledge_type' => 'explicit',
                'domain' => 'Perakitan & QA',
                'summary' => 'Prosedur tertulis standar teknisi gudang untuk memverifikasi kecocokan CPU, motherboard, dan modul RAM sebelum pesanan dikirim.',
                'content' => "1. Cocokkan kode socket prosesor (AM4, AM5, LGA1700, LGA1851) dengan dukungan chipset motherboard.\n2. Verifikasi tipe DIMM (DDR4 vs DDR5) dan frekuensi maksimum resmi controller memori.\n3. Pastikan BIOS motherboard sudah mendukung revisi CPU target.\n4. Catat nomor seri tiap komponen pada lembar inspeksi sebelum segel kemasan.",
                'author_role' => 'Kepala Teknisi QA',
                'views_count' => 42,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Panduan Perhitungan Headroom PSU dan Jalur Kabel PCIe 12VHPWR',
                'slug' => 'panduan-headroom-psu-dan-jalur-pcie',
                'knowledge_type' => 'explicit',
                'domain' => 'Daya & Termal',
                'summary' => 'Dokumentasi teknik perhitungan kebutuhan daya puncak sistem dan pemilihan PSU bersertifikasi efisiensi 80+.',
                'content' => 'Rumus cepat estimasi PSU: (TDP CPU + TBP GPU + 120W beban sistem) × 1,30 headroom transien. Gunakan PSU 80+ Gold ATX 3.0/3.1 untuk kartu grafis kelas atas agar lonjakan daya transien tetap stabil tanpa memicu proteksi OCP.',
                'author_role' => 'Dokumentasi Engineering',
                'views_count' => 31,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Pola Penurunan Suhu VRM & Airflow Casing pada Beban Render Berkelanjutan',
                'slug' => 'pola-airflow-vrm-beban-render',
                'knowledge_type' => 'implicit',
                'domain' => 'Daya & Termal',
                'summary' => 'Pengetahuan terapan dari log perakitan: keseimbangan tekanan udara positif menekan akumulasi debu dan suhu VRM hingga 6°C.',
                'content' => 'Berdasarkan evaluasi 50+ unit workstation pelanggan, konfigurasi 2–3 kipas intake bertekanan statis di panel depan mesh dengan 1 kipas exhaust belakang dan 1 top-rear menghasilkan suhu SSD NVMe dan VRM paling stabil dibanding konfigurasi exhaust berlebihan.',
                'author_role' => 'Senior System Builder',
                'views_count' => 27,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Heuristik Penanganan Boot Loop XMP/EXPO pada Konfigurasi 4-DIMM DDR5',
                'slug' => 'heuristik-boot-loop-ddr5-4-dimm',
                'knowledge_type' => 'implicit',
                'domain' => 'Troubleshooting',
                'summary' => 'Praktik lapangan ketika profil XMP/EXPO gagal POST pada empat keping RAM berkecepatan tinggi.',
                'content' => 'Memory controller CPU modern lebih stabil di 2 DIMM dibanding 4 DIMM pada frekuensi tinggi. Jika pelanggan memasang 4 keping DDR5 dan gagal POST setelah mengaktifkan XMP/EXPO: (1) reset CMOS, (2) perbarui BIOS ke versi AGESA/Microcode terbaru, (3) turunkan target frekuensi satu tingkat di bawah rating kit (mis. 6000 -> 5600 MT/s).',
                'author_role' => 'Lead Hardware Support',
                'views_count' => 38,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Intuisi Diagnostik Bau & Bunyi Klik Relay PSU Saat Kegagalan Power-On',
                'slug' => 'intuisi-diagnostik-relay-psu-power-on',
                'knowledge_type' => 'tacit',
                'domain' => 'Troubleshooting',
                'summary' => 'Kearifan pengalaman teknisi senior membedakan korsleting 12V rail motherboard dengan kerusakan internal unit PSU.',
                'content' => 'Teknisi berpengalaman dapat mengenali pola satu kali bunyi klik cepat lalu mati pada PSU modular sebagai aktivasi SCP (Short Circuit Protection) akibat standoff casing berlebih atau pin PCIe terbalik, bukan selalu unit PSU rusak. Uji kertas/tester PSU dalam kondisi lepas dari beban untuk memisahkan sumber gangguan.',
                'author_role' => 'Master Technician (10+ Thn)',
                'views_count' => 19,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Strategi Konsultasi Anggaran Pelanggan: Prioritas Upgrade Tanpa Bottleneck',
                'slug' => 'strategi-konsultasi-anggaran-upgrade',
                'knowledge_type' => 'tacit',
                'domain' => 'Konsultasi Pelanggan',
                'summary' => 'Pendekatan wawancara kebutuhan nyata pelanggan agar rekomendasi komponen tidak over-spec atau salah prioritas.',
                'content' => 'Jangan langsung menawarkan SKU termahal. Tanyakan resolusi monitor, aplikasi utama (rendering GPU vs kompilasi CPU vs gaming kompetitif), dan rencana pemakaian 3 tahun. Sering kali mengalihkan anggaran dari pendingin kosmetik ke SSD NVMe ber-DRAM dan PSU lebih andal memberi kepuasan jangka panjang jauh lebih tinggi.',
                'author_role' => 'Principal Solutions Advisor',
                'views_count' => 24,
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
        Schema::dropIfExists('knowledge_articles');
        Schema::dropIfExists('chatbot');
    }
};
