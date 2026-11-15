<?php

namespace App\Support;

class ModuleQuizBank
{
    /**
     * Catalog of all available module evaluation chapters.
     *
     * @return array<int, array<string, string>>
     */
    public static function chapters(): array
    {
        return [
            ['key' => 'bab2', 'code' => 'Bab II', 'title' => 'Tipe Sistem Informasi (TPS, OAS, MIS, ISS)', 'subject' => 'Evaluasi kuis Bab II'],
            ['key' => 'bab7', 'code' => 'Bab VII', 'title' => 'People di Dalam Sistem Informasi', 'subject' => 'Evaluasi kuis Bab VII'],
            ['key' => 'bab8', 'code' => 'Bab VIII', 'title' => 'Transaction Processing Systems (TPS)', 'subject' => 'Evaluasi kuis Bab VIII'],
            ['key' => 'bab9', 'code' => 'Bab IX', 'title' => 'Office Automation System (OAS)', 'subject' => 'Evaluasi kuis Bab IX'],
            ['key' => 'bab10', 'code' => 'Bab X', 'title' => 'Knowledge Management System (KMS)', 'subject' => 'Evaluasi kuis Bab X'],
            ['key' => 'bab12', 'code' => 'Bab XII', 'title' => 'Executive Information System (EIS)', 'subject' => 'Evaluasi kuis Bab XII'],
            ['key' => 'bab13', 'code' => 'Bab XIII', 'title' => 'Expert System (Sistem Pakar)', 'subject' => 'Evaluasi kuis Bab XIII'],
        ];
    }

    public static function normalizeChapter(?string $chapter): string
    {
        $valid = array_column(self::chapters(), 'key');

        return in_array($chapter, $valid, true) ? (string) $chapter : 'bab2';
    }

    public static function chapterMeta(string $chapter): array
    {
        $key = self::normalizeChapter($chapter);
        foreach (self::chapters() as $meta) {
            if ($meta['key'] === $key) {
                return $meta;
            }
        }

        return self::chapters()[0];
    }

    /**
     * Return 10 multiple-choice questions for the selected chapter.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function questions(string $chapter): array
    {
        return match (self::normalizeChapter($chapter)) {
            'bab7' => self::bab7(),
            'bab8' => self::bab8(),
            'bab9' => self::bab9(),
            'bab10' => self::bab10(),
            'bab12' => self::bab12(),
            'bab13' => self::bab13(),
            default => self::bab2(),
        };
    }

    private static function bab2(): array
    {
        return [
            [
                'id' => 1,
                'question' => '.......... adalah sekumpulan informasi yang memproses transaksi data dalam sistem basis data yang memantau program transaksi.',
                'options' => [
                    'a' => 'Operating System',
                    'b' => 'Decision Support System',
                    'c' => 'Transaction Processing System',
                    'd' => 'Tidak ada jawaban',
                ],
                'correct' => 'c',
                'explanation' => 'Transaction Processing System (TPS) adalah sistem yang bertujuan mencatat, memvalidasi proses, dan menyimpan transaksi yang terjadi di area fungsi bisnis.',
            ],
            [
                'id' => 2,
                'question' => '____ memproses beberapa transaksi secara bersamaan.',
                'options' => [
                    'a' => 'Batch Processing',
                    'b' => 'Real-time Processing',
                    'c' => 'Distributed System',
                    'd' => 'Tidak ada jawaban',
                ],
                'correct' => 'a',
                'explanation' => 'Dalam Batch Processing, transaksi diakumulasikan dari waktu ke waktu dan diproses secara bersamaan (berkala).',
            ],
            [
                'id' => 3,
                'question' => 'Dalam ___ hasil setiap transaksi tidak segera tersedia.',
                'options' => [
                    'a' => 'Batch processing',
                    'b' => 'Real-time processing',
                    'c' => 'Transaction processing',
                    'd' => 'Tidak ada jawaban',
                ],
                'correct' => 'a',
                'explanation' => 'Berbeda dengan Online/Real-time yang langsung diproses tanpa jeda waktu, pada Batch Processing hasil transaksi tidak segera tersedia karena diakumulasikan dahulu.',
            ],
            [
                'id' => 4,
                'question' => '___ dirancang untuk memecahkan masalah yang kompleks dengan penalaran melalui pengetahuan.',
                'options' => [
                    'a' => 'Computer systems',
                    'b' => 'Expert systems',
                    'c' => 'Operating systems',
                    'd' => 'Transaction processing systems',
                ],
                'correct' => 'b',
                'explanation' => 'Expert Systems (Sistem Pakar) adalah sistem berbasis pengetahuan yang meniru penalaran dan keterampilan pemecahan masalah dari seorang pakar manusia.',
            ],
            [
                'id' => 5,
                'question' => 'Sistem pakar dibagi menjadi ___ Subsistem (komponen utama).',
                'options' => [
                    'a' => 'Satu',
                    'b' => 'Dua',
                    'c' => 'Tiga',
                    'd' => 'Empat',
                ],
                'correct' => 'c',
                'explanation' => 'Sistem pakar memiliki 3 komponen utama: Basis Pengetahuan (Knowledge Base), Mesin Inferensi (Inference Engine), dan Antarmuka Pengguna (User Interface).',
            ],
            [
                'id' => 6,
                'question' => 'Expert system adalah jenis sistem informasi yang memfasilitasi komputer untuk membuat ___ seperti seorang ahli.',
                'options' => [
                    'a' => 'Analisis sistem',
                    'b' => 'Saran dan fungsi',
                    'c' => 'Hasil analisis',
                    'd' => 'Tak satu pun dari yang disebutkan di atas',
                ],
                'correct' => 'b',
                'explanation' => 'Expert system memfasilitasi komputer untuk memberikan saran, penalaran, dan fungsi pemecahan masalah selayaknya pakar manusia.',
            ],
            [
                'id' => 7,
                'question' => '___ adalah aplikasi komputer yang digunakan untuk mendukung penentuan, keputusan, dan tindakan dalam suatu organisasi atau bisnis.',
                'options' => [
                    'a' => 'Decision Support System (DSS)',
                    'b' => 'Transaction Process System',
                    'c' => 'Executive Support System',
                    'd' => 'Tak satu pun dari yang disebutkan di atas',
                ],
                'correct' => 'a',
                'explanation' => 'Decision Support System (DSS) memfasilitasi keputusan semi-terstruktur dengan menyediakan data, alat, pemodelan, dan pencarian tujuan (goal seeking).',
            ],
            [
                'id' => 8,
                'question' => 'Sebuah Decision Support System (DSS) adalah sebuah aplikasi untuk sistem informasi yang membantu dalam ___.',
                'options' => [
                    'a' => 'Desain sistem',
                    'b' => 'Analisis sistem',
                    'c' => 'Pengambilan keputusan',
                    'd' => 'Semua yang disebutkan di atas',
                ],
                'correct' => 'c',
                'explanation' => 'Fungsi primer DSS secara spesifik adalah membantu para manajer dalam proses pengambilan keputusan (decision making).',
            ],
            [
                'id' => 9,
                'question' => 'Keputusan di mana pembuat keputusan harus memberikan penilaian, evaluasi, dan wawasan ke dalam definisi masalah akan dicirikan sebagai:',
                'options' => [
                    'a' => 'structured.',
                    'b' => 'semistructured.',
                    'c' => 'unstructured.',
                    'd' => 'Tak satu pun dari yang disebutkan di atas',
                ],
                'correct' => 'c',
                'explanation' => 'Unstructured decisions (keputusan tidak terstruktur) memerlukan penilaian, evaluasi subjektif, dan wawasan baru karena tanggapan standarnya belum tersedia.',
            ],
            [
                'id' => 10,
                'question' => 'Jenis keputusan yang dapat dibuat dengan mengikuti prosedur tertentu disebut ………. decision.',
                'options' => [
                    'a' => 'structured',
                    'b' => 'unstructured',
                    'c' => 'semistructured',
                    'd' => 'procedural',
                ],
                'correct' => 'a',
                'explanation' => 'Structured decisions (keputusan terstruktur/terprogram) adalah keputusan rutin dan berulang yang dapat diselesaikan mengikuti aturan/prosedur baku yang pasti.',
            ],
        ];
    }

    private static function bab7(): array
    {
        return [
            [
                'id' => 1,
                'question' => '______________ berfokus pada perencanaan, kebijakan, dan prosedur terkait penggunaan data dan informasi perusahaan.',
                'options' => ['a' => 'CIO', 'b' => 'Analis sistem', 'c' => 'Administrator basis data (DBA)', 'd' => 'Operator system'],
                'correct' => 'c',
                'explanation' => 'Administrator basis data (DBA) merencanakan, menetapkan kebijakan, standar, dan prosedur pengelolaan data organisasi.',
            ],
            [
                'id' => 2,
                'question' => 'Apakah yang bukan merupakan fungsi dari DBA?',
                'options' => ['a' => 'Authorization of data access', 'b' => 'Network maintenance', 'c' => 'Routine maintenance', 'd' => 'Schema definition'],
                'correct' => 'b',
                'explanation' => 'Pemeliharaan jaringan (Network maintenance) adalah tugas Network Manager/Administrator, bukan DBA.',
            ],
            [
                'id' => 3,
                'question' => '______ adalah individu yang membantu pengguna menentukan keluaran apa yang mereka butuhkan dari sistem dan menyusun rencana untuk mengembangkan program yang menghasilkan keluaran tersebut.',
                'options' => ['a' => 'Data entry operators', 'b' => 'Programmers', 'c' => 'Database administrators', 'd' => 'Systems analysts'],
                'correct' => 'd',
                'explanation' => 'Systems Analyst menjembatani kebutuhan bisnis pengguna dengan rancangan teknis sistem informasi.',
            ],
            [
                'id' => 4,
                'question' => '______ manager biasanya mengelola operasional LAN dan WAN tertentu.',
                'options' => ['a' => 'Factory', 'b' => 'Network', 'c' => 'Firm', 'd' => 'System'],
                'correct' => 'b',
                'explanation' => 'Network manager mengelola infrastruktur konektivitas jaringan lokal (LAN) maupun luas (WAN).',
            ],
            [
                'id' => 5,
                'question' => '______ adalah orang yang mengembangkan dan mengoperasikan sistem informasi.',
                'options' => ['a' => 'IS specialists', 'b' => 'IS Analyst', 'c' => 'IS experts', 'd' => 'IS data entry'],
                'correct' => 'a',
                'explanation' => 'IS Specialists mencakup seluruh tenaga teknis yang mengembangkan, memelihara, dan mengoperasikan sistem informasi.',
            ],
            [
                'id' => 6,
                'question' => 'Dalam sistem informasi, operasi dikelola oleh seorang petugas ______.',
                'options' => ['a' => 'Chief information officer', 'b' => 'Chief manager', 'c' => 'Chief operator', 'd' => 'Chief analyst'],
                'correct' => 'a',
                'explanation' => 'Chief Information Officer (CIO) adalah eksekutif puncak yang memimpin kebijakan strategis dan operasi sistem informasi perusahaan.',
            ],
            [
                'id' => 7,
                'question' => 'Siapa orang yang bertanggung jawab untuk kontrol keseluruhan sistem database?',
                'options' => ['a' => 'DDL', 'b' => 'DBMS', 'c' => 'DBA', 'd' => 'SDL'],
                'correct' => 'c',
                'explanation' => 'DBA (Database Administrator) adalah individu yang memegang kendali dan otorisasi keseluruhan sistem basis data.',
            ],
            [
                'id' => 8,
                'question' => 'Istilah untuk orang-orang yang pekerjaannya melibatkan mensponsori dan mendanai proyek untuk mengembangkan, mengoperasikan, dan memelihara sistem informasi adalah:',
                'options' => ['a' => 'Information worker', 'b' => 'Internal system user', 'c' => 'Systems owner', 'd' => 'External system user'],
                'correct' => 'c',
                'explanation' => 'Systems Owner adalah sponsor eksekutif yang mendanai dan menentukan tujuan proyek sistem informasi.',
            ],
            [
                'id' => 9,
                'question' => 'Orang yang umumnya bertanggung jawab atas strategi, standar, dan konstruksi desain program disebut:',
                'options' => ['a' => 'Program librarian', 'b' => 'Backup chief programmer', 'c' => 'Network designer', 'd' => 'Chief programmer'],
                'correct' => 'd',
                'explanation' => 'Chief Programmer memimpin strategi teknis, standar kode, dan arsitektur konstruksi program.',
            ],
            [
                'id' => 10,
                'question' => 'Orang yang memastikan bahwa sistem dikembangkan tepat waktu, sesuai anggaran, dan dengan kualitas yang dapat diterima adalah:',
                'options' => ['a' => 'Systems designer', 'b' => 'Project manager', 'c' => 'Systems owner', 'd' => 'Systems builder'],
                'correct' => 'b',
                'explanation' => 'Project Manager bertanggung jawab mengoordinasikan tim agar proyek memenuhi jadwal, anggaran, dan standar kualitas.',
            ],
        ];
    }

    private static function bab8(): array
    {
        return [
            [
                'id' => 1,
                'question' => '___ adalah sekumpulan informasi yang memproses transaksi data dalam sistem basis data yang memantau program transaksi.',
                'options' => ['a' => 'Operating System', 'b' => 'Decision Support System', 'c' => 'Transaction Processing System', 'd' => 'Tidak ada jawaban'],
                'correct' => 'c',
                'explanation' => 'TPS memantau dan mengeksekusi transaksi data operasional secara konsisten di dalam basis data.',
            ],
            [
                'id' => 2,
                'question' => 'TPS adalah sekumpulan informasi yang memproses ____ dalam sistem basis data.',
                'options' => ['a' => 'Information management', 'b' => 'Data transaction', 'c' => 'Scheduling', 'd' => 'Tidak ada jawaban'],
                'correct' => 'b',
                'explanation' => 'Fokus utama TPS adalah pemrosesan data transaksi (data transaction) harian organisasi.',
            ],
            [
                'id' => 3,
                'question' => '____ memproses beberapa transaksi secara bersamaan (akumulasi berkala).',
                'options' => ['a' => 'Batch Processing', 'b' => 'Real-time Processing', 'c' => 'Distributed System', 'd' => 'Tidak ada jawaban'],
                'correct' => 'a',
                'explanation' => 'Batch Processing mengumpulkan transaksi dalam satu kelompok (batch) lalu mengeksekusinya sekaligus.',
            ],
            [
                'id' => 4,
                'question' => 'Dalam ___ hasil setiap transaksi tidak segera tersedia.',
                'options' => ['a' => 'Batch processing', 'b' => 'Real-time processing', 'c' => 'Transaction processing', 'd' => 'Semua jawaban benar'],
                'correct' => 'a',
                'explanation' => 'Karena transaksi menunggu penjadwalan kumpulan batch, keluarannya tidak muncul seketika.',
            ],
            [
                'id' => 5,
                'question' => 'Sistem pemrosesan transaksi membantu pengguna memproses transaksi data dalam ___ yang melacak program transaksi.',
                'options' => ['a' => 'Transaction system', 'b' => 'Batch system', 'c' => 'Database system', 'd' => 'Tidak ada jawaban'],
                'correct' => 'c',
                'explanation' => 'TPS bekerja erat di atas Database System untuk menjaga integritas ACID.',
            ],
            [
                'id' => 6,
                'question' => '___ menggunakan perangkat lunak dan perangkat keras untuk mengelola ribuan data bisnis dan pengguna.',
                'options' => ['a' => 'Decision Support System', 'b' => 'Transaction Processing System', 'c' => 'Executive Support System', 'd' => 'Tidak ada jawaban'],
                'correct' => 'b',
                'explanation' => 'TPS dirancang menangani volume transaksi operasional yang tinggi dari banyak pengguna secara andal.',
            ],
            [
                'id' => 7,
                'question' => 'Komponen Sistem Pemrosesan Transaksi mencakup ____.',
                'options' => ['a' => 'Processing system', 'b' => 'Storage device', 'c' => 'Input / Output (I/O)', 'd' => 'Semua jawaban benar'],
                'correct' => 'd',
                'explanation' => 'Sesuai Bab VIII 8.9, fungsi TPS melibatkan Input, Processing, Storage, dan Output.',
            ],
            [
                'id' => 8,
                'question' => 'Di sistem ___, setiap transaksi segera diproses secara otomatis begitu masuk.',
                'options' => ['a' => 'Real-Time Processing', 'b' => 'Executive Support System', 'c' => 'Decision Support System', 'd' => 'Tidak ada jawaban'],
                'correct' => 'a',
                'explanation' => 'Real-time / Online Processing memproses dan memperbarui status basis data secara instan saat kejadian terjadi.',
            ],
            [
                'id' => 9,
                'question' => '____ menangani satu transaksi secara langsung pada satu waktu.',
                'options' => ['a' => 'Batch Processing System', 'b' => 'Real-time Processing System', 'c' => 'Distributed System', 'd' => 'Tidak ada jawaban'],
                'correct' => 'b',
                'explanation' => 'Real-time Processing memproses tiap transaksi individual secara langsung begitu di-input.',
            ],
            [
                'id' => 10,
                'question' => 'Sebuah ___ terdiri dari urutan query dan/atau pernyataan update yang membentuk satu kesatuan logis.',
                'options' => ['a' => 'System', 'b' => 'Transaction', 'c' => 'Maintenance', 'd' => 'Semua jawaban benar'],
                'correct' => 'b',
                'explanation' => 'Dalam basis data, satu unit kerja logis dari kumpulan read/write/update disebut Transaction.',
            ],
        ];
    }

    private static function bab9(): array
    {
        return [
            [
                'id' => 1,
                'question' => 'Menggunakan ___ organisasi beralih ke otomatisasi di tempat kerja untuk meningkatkan produktivitas.',
                'options' => ['a' => 'Office Automation System', 'b' => 'Expert System', 'c' => 'Transaction Process System', 'd' => 'Tidak ada jawaban'],
                'correct' => 'a',
                'explanation' => 'Office Automation System (OAS) mengotomatiskan alur dokumen, komunikasi, dan pekerjaan perkantoran.',
            ],
            [
                'id' => 2,
                'question' => '___ yang kuat mengurangi upaya manual dan menyimpan sejumlah besar data dalam ruang kecil.',
                'options' => ['a' => 'Decision Support System', 'b' => 'Transaction Process System', 'c' => 'Office Automation System', 'd' => 'Tidak ada jawaban'],
                'correct' => 'c',
                'explanation' => 'OAS dengan digitalisasi & pencitraan dokumen memangkas arsip kertas dan kerja manual.',
            ],
            [
                'id' => 3,
                'question' => 'Otomatisasi kantor memudahkan beban kerja organisasi dengan ___.',
                'options' => ['a' => 'Manual Support System', 'b' => 'Simplifying dan automating processes', 'c' => 'Non Automation System', 'd' => 'Tidak ada jawaban'],
                'correct' => 'b',
                'explanation' => 'OAS menyederhanakan (simplifying) dan mengotomatiskan (automating) proses administratif berulang.',
            ],
            [
                'id' => 4,
                'question' => 'Keuntungan terbesar dari mengotomatisasi alur kerja kantor dikenal sebagai ___.',
                'options' => [
                    'a' => 'Mengurangi upaya manual untuk menyelesaikan tugas rutin',
                    'b' => 'Membuat keputusan bisnis berdasar data',
                    'c' => 'Mendapatkan wawasan metrik kinerja proses',
                    'd' => 'Semua jawaban benar',
                ],
                'correct' => 'd',
                'explanation' => 'Seluruh opsi merupakan manfaat langsung penerapan alur kerja OAS modern.',
            ],
            [
                'id' => 5,
                'question' => 'Berapa banyak hal penting dalam sistem otomatisasi kantor menurut Bab IX?',
                'options' => ['a' => '1', 'b' => '3', 'c' => '5', 'd' => '7'],
                'correct' => 'd',
                'explanation' => 'Bab IX 9.5 menyebutkan 7 pilar penting: Workflow design, Task/deadline, Komunikasi, Integrasi, Keamanan, Pelaporan, dan Mobilitas.',
            ],
            [
                'id' => 6,
                'question' => 'Penggunaan komputer dalam OAS adalah untuk ___ berbagai operasi kantor.',
                'options' => ['a' => 'Execute', 'b' => 'System', 'c' => 'Process', 'd' => 'Tidak ada jawaban'],
                'correct' => 'a',
                'explanation' => 'Komputer pada OAS mengeksekusi dan mengoordinasikan berbagai pekerjaan operasional perkantoran.',
            ],
            [
                'id' => 7,
                'question' => 'Sistem otomatisasi kantor modern memberikan akses organisasi ke ___, laporan, dan analitik.',
                'options' => ['a' => 'Large data sets', 'b' => 'Small data set', 'c' => 'Average data set', 'd' => 'Tidak ada jawaban'],
                'correct' => 'a',
                'explanation' => 'Integrasi OAS berbasis cloud memudahkan pengelolaan dataset besar beserta pelaporan dan analitiknya.',
            ],
            [
                'id' => 8,
                'question' => 'Apa tulang punggung konektivitas lokal sistem otomasi kantor dalam gedung organisasi?',
                'options' => ['a' => 'WAN', 'b' => 'MAN', 'c' => 'LAN', 'd' => 'Semua jawaban'],
                'correct' => 'c',
                'explanation' => 'LAN (Local Area Network) merupakan tulang punggung utama pertukaran dokumen & komunikasi internal kantor.',
            ],
            [
                'id' => 9,
                'question' => 'Istilah otomatisasi kantor mengacu pada kombinasi komputer berupa ___.',
                'options' => ['a' => 'Hardware', 'b' => 'Software', 'c' => 'Network connectivity', 'd' => 'Semua jawaban'],
                'correct' => 'd',
                'explanation' => 'OAS merupakan perpaduan perangkat keras, perangkat lunak aplikasi kantor, serta konektivitas jaringan.',
            ],
            [
                'id' => 10,
                'question' => 'Manakah berikut ini yang digunakan untuk membuat atau mengedit dokumen, spreadsheet, atau gambar di Sistem Otomasi Kantor?',
                'options' => ['a' => 'Data Storage', 'b' => 'Office Applications', 'c' => 'Data Management', 'd' => 'Tidak ada jawaban'],
                'correct' => 'b',
                'explanation' => 'Office Applications (Word processing, spreadsheet, desktop publishing) bertugas membuat dan menyunting dokumen.',
            ],
        ];
    }

    private static function bab10(): array
    {
        return [
            [
                'id' => 1,
                'question' => 'Serangkaian proses yang dikembangkan dalam organisasi untuk membuat, mengumpulkan, menyimpan, mentransfer, dan menerapkan pengetahuan paling menggambarkan:',
                'options' => ['a' => 'Organizational learnings', 'b' => 'Knowledge management', 'c' => 'Organizational memory', 'd' => 'Knowledge assets'],
                'correct' => 'b',
                'explanation' => 'Knowledge Management mencakup siklus lengkap kreasi, pengumpulan, penyimpanan, distribusi, dan pemanfaatan pengetahuan.',
            ],
            [
                'id' => 2,
                'question' => 'Keahlian dan pengalaman anggota organisasi yang belum terdokumentasikan secara formal disebut sebagai:',
                'options' => ['a' => 'Knowledge sharing', 'b' => 'Tacit knowledge', 'c' => 'Organizational learning', 'd' => 'Organizational memory'],
                'correct' => 'b',
                'explanation' => 'Tacit Knowledge tersimpan di benak pakar/karyawan dan sulit diformulasikan secara formal sebelum dikodifikasi.',
            ],
            [
                'id' => 3,
                'question' => 'Pembelajaran yang tersimpan dari sejarah organisasi yang dapat digunakan untuk pengambilan keputusan paling tepat menggambarkan:',
                'options' => ['a' => 'Organizational learning', 'b' => 'Knowledge warehouse', 'c' => 'Best practices', 'd' => 'Organizational memory'],
                'correct' => 'd',
                'explanation' => 'Organizational Memory menyimpan rekam jejak pelajaran dan pengalaman historis perusahaan agar tidak hilang.',
            ],
            [
                'id' => 4,
                'question' => 'Solusi atau metode pemecahan masalah paling berhasil yang dikembangkan oleh organisasi atau industri disebut:',
                'options' => ['a' => 'Organizational memory', 'b' => 'Knowledge management', 'c' => 'Best practices', 'd' => 'Standard operating procedures'],
                'correct' => 'c',
                'explanation' => 'Best practices merupakan praktik terbaik yang terbukti paling efektif menyelesaikan masalah tertentu.',
            ],
            [
                'id' => 5,
                'question' => 'Aplikasi knowledge work utama (Knowledge Work Systems) meliputi:',
                'options' => [
                    'a' => 'Investment workstations, CAD systems, dan intelligent agents',
                    'b' => 'Document imaging systems',
                    'c' => 'Virtual reality systems dan investment workstations',
                    'd' => 'Computer-aided design (CAD), virtual reality systems, dan investment workstations',
                ],
                'correct' => 'd',
                'explanation' => 'Sistem kerja pengetahuan inti menggunakan CAD, Virtual Reality (simulasi), dan Investment Workstations.',
            ],
            [
                'id' => 6,
                'question' => 'Perangkat lunak dan perangkat keras grafis interaktif yang membuat simulasi komputer meniru aktivitas dunia nyata adalah:',
                'options' => ['a' => 'VRML', 'b' => 'Fuzzy neural networks', 'c' => 'Virtual reality systems', 'd' => 'Genetic algorithms'],
                'correct' => 'c',
                'explanation' => 'Virtual Reality Systems menyediakan simulasi grafis interaktif yang meniru lingkungan dunia nyata.',
            ],
            [
                'id' => 7,
                'question' => 'Pernyataan yang paling tepat mengenai Artificial Intelligence Systems saat ini:',
                'options' => [
                    'a' => 'Tidak menunjukkan tingkat kecerdasan umum yang sama dengan manusia',
                    'b' => 'Dapat menyelesaikan semua masalah secara mandiri tanpa batas',
                    'c' => 'Pengganti mutlak seluruh ahli manusia',
                    'd' => 'Selalu dapat menemukan kesadaran baru di luar domainnya',
                ],
                'correct' => 'a',
                'explanation' => 'Sistem AI bekerja pada domain spesifik dan tidak memiliki kecerdasan serta akal sehat menyeluruh layaknya manusia.',
            ],
            [
                'id' => 8,
                'question' => 'Program komputer yang menangkap keahlian manusia dalam domain pengetahuan tertentu menjelaskan:',
                'options' => ['a' => 'Virtual reality', 'b' => 'Neural network', 'c' => 'Decision support system', 'd' => 'Expert system'],
                'correct' => 'd',
                'explanation' => 'Expert System mengekstraksi dan meniru keahlian pakar manusia pada domain tertentu.',
            ],
            [
                'id' => 9,
                'question' => 'Kumpulan pengetahuan internal dan eksternal di satu lokasi untuk pengelolaan dan pemanfaatan yang lebih efisien adalah:',
                'options' => ['a' => 'Knowledge repository', 'b' => 'Organizational memory', 'c' => 'Data warehouse', 'd' => 'Knowledge management'],
                'correct' => 'a',
                'explanation' => 'Knowledge Repository menghimpun basis pengetahuan internal maupun eksternal dalam satu tempat terpusat.',
            ],
            [
                'id' => 10,
                'question' => 'Manakah berikut ini yang mengacu pada AI berbasis aturan yang mentolerir ketidaktepatan memakai fungsi keanggotaan?',
                'options' => ['a' => 'Genetic algorithms', 'b' => 'Expert system', 'c' => 'Hybrid system', 'd' => 'Fuzzy logic'],
                'correct' => 'd',
                'explanation' => 'Fuzzy Logic memodelkan istilah nonspesifik dengan fungsi keanggotaan untuk mengatasi ketidakpastian.',
            ],
        ];
    }

    private static function bab12(): array
    {
        return [
            [
                'id' => 1,
                'question' => 'Executive Information System (EIS), juga dikenal sebagai ___.',
                'options' => ['a' => 'Decision Support System (DSS)', 'b' => 'Executive Support System (ESS)', 'c' => 'Transaction Process System (TPS)', 'd' => 'Expert System (ES)'],
                'correct' => 'b',
                'explanation' => 'EIS sering disebut Executive Support System (ESS) saat dilengkapi analitik & komunikasi strategis.',
            ],
            [
                'id' => 2,
                'question' => 'Manakah pernyataan yang paling cocok menggambarkan EIS?',
                'options' => [
                    'a' => 'Menyediakan akses cepat informasi dengan meringkas, memilih, dan merinci (drill-down)',
                    'b' => 'Membantu eksekutif mengidentifikasi masalah dan mengenali peluang',
                    'c' => 'Menggunakan visualisasi grafis interaktif yang mudah dipahami',
                    'd' => 'Semua yang disebutkan di atas',
                ],
                'correct' => 'd',
                'explanation' => 'EIS menggabungkan ringkasan eksekutif, deteksi peluang/masalah, drill-down, dan antarmuka grafis intuitif.',
            ],
            [
                'id' => 3,
                'question' => 'Executive Support System merupakan jenis ___ yang memfasilitasi eksekutif senior dengan informasi strategis.',
                'options' => ['a' => 'Transaction Process System', 'b' => 'Decision Support System', 'c' => 'Management Support System', 'd' => 'Tak satu pun dari yang disebutkan'],
                'correct' => 'c',
                'explanation' => 'Secara taksonomi, ESS/EIS termasuk keluarga Management Support System bagi manajemen tingkat atas.',
            ],
            [
                'id' => 4,
                'question' => '___ menekankan antarmuka grafis yang baik sehingga eksekutif puncak dapat menggunakannya dengan mudah.',
                'options' => ['a' => 'EIS', 'b' => 'DSS', 'c' => 'OAS', 'd' => 'TPS'],
                'correct' => 'a',
                'explanation' => 'EIS dirancang ramah bagi eksekutif senior tanpa menuntut keahlian teknis pemrograman/query rumit.',
            ],
            [
                'id' => 5,
                'question' => 'Secara historis, generasi awal Executive Information Systems banyak dibangun sebagai program berbasis ___.',
                'options' => ['a' => 'Mobile', 'b' => 'Mainframe computer', 'c' => 'Mini Computer', 'd' => 'Quantum computer'],
                'correct' => 'b',
                'explanation' => 'Generasi awal EIS korporasi terhubung langsung ke basis data pusat pada mainframe computer.',
            ],
            [
                'id' => 6,
                'question' => 'Penerapan EIS tidak hanya untuk perusahaan besar, tetapi juga relevan bagi ___.',
                'options' => ['a' => 'Large Scale Industry', 'b' => 'Middle Scale Industry', 'c' => 'Small Scale Industry', 'd' => 'Semua skala bisnis sesuai kebutuhannya'],
                'correct' => 'd',
                'explanation' => 'Dashbor analitik EIS modern dapat diadopsi lintas skala organisasi untuk memantau KPI penting.',
            ],
            [
                'id' => 7,
                'question' => 'Berapa komponen arsitektur utama pembentuk EIS secara konseptual?',
                'options' => ['a' => '1', 'b' => '2', 'c' => '3', 'd' => '4'],
                'correct' => 'd',
                'explanation' => 'Komponen EIS umumnya terdiri dari Hardware, Software, User Interface, dan Telekomunikasi (4 komponen).',
            ],
            [
                'id' => 8,
                'question' => '___ berisi analisis statistik, keuangan, dan kuantitatif yang mendukung pengambilan keputusan eksekutif.',
                'options' => ['a' => 'Executive Information Systems models', 'b' => 'Marketing models', 'c' => 'Mainframe computer models', 'd' => 'Tidak ada jawaban'],
                'correct' => 'a',
                'explanation' => 'Model analitik di dalam EIS menyediakan rasio keuangan, tren historis, dan proyeksi kuantitatif.',
            ],
            [
                'id' => 9,
                'question' => 'EIS mencakup dukungan ___ seperti peramalan (forecasting), estimasi, dan prediksi tren masa depan.',
                'options' => ['a' => 'Marketing', 'b' => 'Informasi', 'c' => 'Perencanaan (Planning)', 'd' => 'Tak satu pun'],
                'correct' => 'c',
                'explanation' => 'Fungsi perencanaan strategis memanfaatkan perkiraan dan tren pasar yang disajikan EIS.',
            ],
            [
                'id' => 10,
                'question' => 'Bagaimana EIS membantu eksekutif menemukan data spesifik sesuai kriteria pengguna?',
                'options' => ['a' => 'Graphical interface EIS', 'b' => 'Select filter', 'c' => 'Set criteria', 'd' => 'Semua jawaban benar'],
                'correct' => 'd',
                'explanation' => 'EIS menyediakan antarmuka grafis dengan penyaringan (filter) serta penetapan kriteria interaktif (drill-down).',
            ],
        ];
    }

    private static function bab13(): array
    {
        return [
            [
                'id' => 1,
                'question' => 'Sistem pakar adalah ___ yang memiliki kemampuan pengambilan keputusan seperti ahli manusia.',
                'options' => ['a' => 'Computer system', 'b' => 'Operating system', 'c' => 'Transaction processing system', 'd' => 'Tidak ada jawaban'],
                'correct' => 'a',
                'explanation' => 'Expert System adalah sistem komputer berbasis AI yang meniru penalaran pakar manusia.',
            ],
            [
                'id' => 2,
                'question' => '___ dirancang untuk memecahkan masalah kompleks dengan penalaran melalui pengetahuan.',
                'options' => ['a' => 'Computer systems', 'b' => 'Expert systems', 'c' => 'Operating systems', 'd' => 'Transaction processing systems'],
                'correct' => 'b',
                'explanation' => 'Expert Systems menyelesaikan masalah kompleks dengan mengolah fakta dan aturan dalam basis pengetahuan.',
            ],
            [
                'id' => 3,
                'question' => 'Sistem pakar pertama (DENDRAL) dirintis pada tahun ___.',
                'options' => ['a' => '1965', 'b' => '1968', 'c' => '1970', 'd' => '1972'],
                'correct' => 'a',
                'explanation' => 'Sistem pakar perintis DENDRAL dikembangkan oleh Edward Feigenbaum dkk. mulai tahun 1965 di Stanford.',
            ],
            [
                'id' => 4,
                'question' => 'Secara inti konseptual arsitektur AI, mesin penalaran & gudang aturan sering dibagi menjadi ___ subsistem utama, atau ___ jika menyertakan antarmuka pengguna.',
                'options' => ['a' => 'Satu', 'b' => 'Dua (inference engine & knowledge base)', 'c' => 'Tiga (tambah user interface)', 'd' => 'Empat'],
                'correct' => 'b',
                'explanation' => 'Dalam Bab XIII Latihan #4 ditegaskan inti pemrosesan terdiri atas dua subsistem pokok: Inference Engine dan Knowledge Base.',
            ],
            [
                'id' => 5,
                'question' => '___ mewakili kumpulan fakta (facts) dan aturan (rules) domain kepakaran.',
                'options' => ['a' => 'Knowledge base', 'b' => 'Inference engine', 'c' => 'Operating system', 'd' => 'Tidak ada jawaban'],
                'correct' => 'a',
                'explanation' => 'Knowledge Base menyimpan pengetahuan faktual dan heuristik berbentuk aturan IF-THEN.',
            ],
            [
                'id' => 6,
                'question' => '___ menerapkan aturan pada fakta yang diketahui untuk menyimpulkan fakta atau rekomendasi baru.',
                'options' => ['a' => 'Operating system', 'b' => 'Knowledge base', 'c' => 'Inference engine', 'd' => 'Tidak ada jawaban'],
                'correct' => 'c',
                'explanation' => 'Inference Engine menjalankan strategi Forward Chaining atau Backward Chaining terhadap fakta di Knowledge Base.',
            ],
            [
                'id' => 7,
                'question' => 'Sistem pakar secara umum diklasifikasikan sebagai ___.',
                'options' => ['a' => 'Aplikasi Mobile', 'b' => 'Aplikasi komputer', 'c' => 'Aplikasi web saja', 'd' => 'Tidak ada jawaban'],
                'correct' => 'b',
                'explanation' => 'Sistem pakar adalah aplikasi komputer berbasis kecerdasan buatan yang dapat berjalan lintas platform.',
            ],
            [
                'id' => 8,
                'question' => 'Sistem pakar mampu ___.',
                'options' => ['a' => 'Mengambil keputusan / saran', 'b' => 'Mencari solusi', 'c' => 'Menginterpretasi input', 'd' => 'Semua jawaban benar'],
                'correct' => 'd',
                'explanation' => 'Sistem pakar menafsirkan gejala masukan, menalar berbasis aturan, lalu menghasilkan solusi/keputusan.',
            ],
            [
                'id' => 9,
                'question' => 'Para pakar membuat keputusan berdasarkan informasi ___.',
                'options' => ['a' => 'Data numeris saja', 'b' => 'Kualitatif dan kuantitatif', 'c' => 'Informasi eksperimental', 'd' => 'Tak satu pun'],
                'correct' => 'b',
                'explanation' => 'Pakar memadukan data terukur (kuantitatif) dan penilaian deskriptif/pengalaman (kualitatif).',
            ],
            [
                'id' => 10,
                'question' => 'Dalam sistem pakar, Forward Chaining merupakan strategi penalaran berorientasi data untuk menjawab pertanyaan "___".',
                'options' => [
                    'a' => 'Apa yang terjadi sebelumnya?',
                    'b' => 'Apa yang akan terjadi / disimpulkan setelahnya?',
                    'c' => 'Semua jawaban benar',
                    'd' => 'Tidak ada jawaban benar',
                ],
                'correct' => 'b',
                'explanation' => 'Forward Chaining bergerak maju dari kumpulan fakta awal menuju kesimpulan konsekuen berikutnya.',
            ],
        ];
    }
}
