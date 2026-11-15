<?php

namespace App\Http\Controllers;

use App\Models\OasMemo;
use App\Models\SalesPerformance;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MsiController extends Controller
{
    /**
     * Piramida Hierarki & Overview
     */
    public function pyramid()
    {
        $stats = [
            'total_transactions' => Transaction::count(),
            'total_sales_value' => Transaction::where('status', 'processed')->sum('amount'),
            'total_memos' => OasMemo::count(),
            'total_exceptions' => SalesPerformance::where('actual_sales', '<', 10000)
                ->orWhere('actual_sales', '>', 50000)->count(),
        ];

        return Inertia::render('Modules/Pyramid', compact('stats'));
    }

    /**
     * TPS: Transaction Processing System
     */
    public function tps(Request $request)
    {
        $query = Transaction::query()->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('party_name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('source_document', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('mode')) {
            $query->where('mode', $request->mode);
        }

        $transactions = $query->paginate(10)->withQueryString();

        $batchPendingCount = Transaction::where('mode', 'batch')->where('status', 'pending')->count();
        $onlineCount = Transaction::where('mode', 'online')->count();
        $totalAmount = Transaction::where('status', 'processed')->sum('amount');

        return Inertia::render('Modules/Tps', compact('transactions', 'batchPendingCount', 'onlineCount', 'totalAmount'));
    }

    /**
     * TPS: Store new transaction
     */
    public function tpsStore(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:internal,external',
            'category' => 'required|string|max:100',
            'party_name' => 'required|string|max:150',
            'amount' => 'required|numeric|min:1',
            'mode' => 'required|in:online,batch',
            'source_document' => 'required|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $code = 'TRX-'.Carbon::now()->format('Ymd').'-'.str_pad(Transaction::count() + 1, 3, '0', STR_PAD_LEFT);

        $status = ($validated['mode'] === 'online') ? 'processed' : 'pending';
        $processedAt = ($validated['mode'] === 'online') ? Carbon::now() : null;

        $transaction = Transaction::create([
            'code' => $code,
            'type' => $validated['type'],
            'category' => $validated['category'],
            'party_name' => $validated['party_name'],
            'amount' => $validated['amount'],
            'mode' => $validated['mode'],
            'status' => $status,
            'source_document' => $validated['source_document'],
            'notes' => $validated['notes'] ?? null,
            'processed_at' => $processedAt,
        ]);

        $msg = ($validated['mode'] === 'online')
            ? "Transaksi {$code} berhasil diproses secara ONLINE REAL-TIME (Tanpa jeda waktu)."
            : "Transaksi {$code} disimpan ke dalam antrean BATCH PROCESSING.";

        return redirect()->route('tps')->with('success', $msg);
    }

    /**
     * TPS: Execute batch processing
     */
    public function tpsProcessBatch()
    {
        $updated = Transaction::where('mode', 'batch')
            ->where('status', 'pending')
            ->update([
                'status' => 'processed',
                'processed_at' => Carbon::now(),
            ]);

        return redirect()->route('tps')->with('success', "Batch processing selesai dieksekusi! {$updated} transaksi batch berhasil diproses.");
    }

    /**
     * OAS: Office Automation System
     */
    public function oas()
    {
        $memos = OasMemo::latest()->get();

        return Inertia::render('Modules/Oas', compact('memos'));
    }

    /**
     * OAS: Store new memo / document
     */
    public function oasStore(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'sender' => 'required|string|max:100',
            'recipient' => 'required|string|max:100',
            'department' => 'required|string|max:100',
            'priority' => 'required|in:normal,urgent,confidential',
            'document_type' => 'required|string|max:100',
            'content' => 'required|string',
        ]);

        OasMemo::create($validated);

        return redirect()->route('oas')->with('success', 'Dokumen/Memo internal OAS berhasil diterbitkan dan didistribusikan ke pekerja administrasi.');
    }

    /**
     * MIS: Management Information System
     */
    public function mis()
    {
        $performances = SalesPerformance::all();

        $totalSales = $performances->sum('actual_sales');
        $totalTarget = $performances->sum('target_amount');
        $totalTrx = $performances->sum('transaction_count');
        $achievement = $totalTarget > 0 ? ($totalSales / $totalTarget) * 100 : 0;

        // Exception Reports: Sesuai Buku Bab II (Salesman < $10.000 atau > $50.000)
        $exceptions = $performances->filter(function ($item) {
            return $item->isException();
        });

        // TPS Summary agregasi
        $tpsSummary = [
            'total_trx' => Transaction::count(),
            'total_amount' => Transaction::where('status', 'processed')->sum('amount'),
            'internal_count' => Transaction::where('type', 'internal')->count(),
            'external_count' => Transaction::where('type', 'external')->count(),
            'internal_amount' => Transaction::where('type', 'internal')->where('status', 'processed')->sum('amount'),
            'external_amount' => Transaction::where('type', 'external')->where('status', 'processed')->sum('amount'),
        ];

        return Inertia::render('Modules/Mis', compact('performances', 'totalSales', 'totalTarget', 'totalTrx', 'achievement', 'exceptions', 'tpsSummary'));
    }

    /**
     * ISS: Intelligent Support Systems (DSS, EIS, ES)
     */
    public function iss()
    {
        $performances = SalesPerformance::all();
        $regions = $performances->pluck('region')->unique();

        return Inertia::render('Modules/Iss', compact('performances', 'regions'));
    }

    /**
     * Expert System Inference Engine (Mini Rule-Based AI)
     */
    public function issDiagnose(Request $request)
    {
        $problemArea = $request->input('problem_area');
        $symptom = $request->input('symptom');
        $severity = $request->input('severity');

        $diagnosis = '';
        $recommendation = [];
        $ruleFired = '';

        // Rule-Based Knowledge Base
        if ($problemArea === 'tps_backlog') {
            $ruleFired = 'RULE-01: TPS Throughput & Mode Optimization';
            $diagnosis = 'Terjadi antrean pemrosesan data transaksi karena beban mode online melebihi kapasitas IOPS storage.';
            $recommendation = [
                'Alihkan transaksi non-kritis (seperti rekap harian retail & klaim bertahap) ke Batch Processing malam hari.',
                'Upgrade media penyimpanan dari disk konvensional ke High-Speed SSD RAID.',
                'Terapkan validasi error presisi di sisi data entry untuk memangkas waktu revalidasi.',
            ];
        } elseif ($problemArea === 'sales_deviation') {
            $ruleFired = 'RULE-02: MIS Exception Trigger (< $10K atau > $50K)';
            $diagnosis = 'Ditemukan deviasi signifikan pada laporan pengecualian (Exception Report) tim pemasaran.';
            $recommendation = [
                'Bagi tenaga penjual < $10.000: Evaluasi strategi distribusi wilayah dan berikan pelatihan taktis langsung oleh manajer lini depan.',
                'Bagi tenaga penjual > $50.000: Analisis formula keberhasilan untuk direplikasi sebagai best practice di cabang lain.',
                'Sesuaikan alokasi target kuartal berikutnya berdasarkan kapasitas regional.',
            ];
        } elseif ($problemArea === 'executive_delay') {
            $ruleFired = 'RULE-03: EIS Drill-down & Strategic Decision';
            $diagnosis = 'Pengambil keputusan tingkat Senior (Top Management) kekurangan visualisasi ringkas dan analitik ad-hoc.';
            $recommendation = [
                'Implementasikan Executive Support System (ESS/EIS) dengan visual grafis menu terintegrasi.',
                'Sediakan fitur drill-down satu-klik dari agregat level korporat ke detail cabang/unit bisnis.',
                'Gunakan model GDSS (Group Decision Support System) untuk kolaborasi rapat strategis dewan direksi.',
            ];
        } else {
            $ruleFired = 'RULE-04: General Information Flow Alignment';
            $diagnosis = 'Ketidakharmonisan aliran data antara level Operasional (TPS) dan level Taktis (MIS).';
            $recommendation = [
                'Otomatisasi transformasi data harian TPS menjadi summary report terstruktur.',
                'Gunakan OAS (Office Automation) untuk menyebarkan laporan rutin secara otomatis ke manajer terkait.',
            ];
        }

        // Answered as an Inertia round trip rather than a bare JSON body: the
        // sheet that consumes it is a React page, and a plain JSON 200 would be
        // handed to Inertia's error path instead of its success path. The
        // diagnosis rides the session flash, which HandleInertiaRequests shares.
        //
        // Redirected to the sheet by name, not with `back()`. `back()` resolves the
        // Referer or the session's previous URL and falls through to `/` — so the
        // verdict was landing on the storefront while the reader sat on the ISS
        // sheet, which is why the result panel stayed empty.
        return redirect()
            ->route('iss')
            ->with('diagnosis', [
                'rule_fired' => $ruleFired,
                'diagnosis' => $diagnosis,
                'recommendations' => $recommendation,
            ]);
    }

    /**
     * Matrix: Karakteristik Tipe Sistem Informasi
     */
    public function matrix()
    {
        $matrixData = [
            [
                'system' => 'Transaction Processing System (TPS)',
                'acronym' => 'TPS',
                'badge_color' => 'amber',
                'hierarchy_level' => 'Lower / Operational Level (Manajer Tingkat Bawah)',
                'decision_type' => 'Keputusan Terstruktur (Structured / Programmed Decisions)',
                'input' => 'Data mentah terkait transaksi (Faktur, Pesanan, Kwitansi, Klaim)',
                'processing' => 'Menggunakan prosedur baku, validasi (deteksi & koreksi error), Mode Online & Batch',
                'output' => 'Ringkasan transaksi, dokumen operasional, formulir layar, nota/faktur',
                'users' => 'Manajer lini bawah, supervisor, kasir, staf operasional',
                'application' => 'Aplikasi transaksi penjualan, POS, kredit & perbankan (ATM), klaim asuransi',
            ],
            [
                'system' => 'Office Automation System (OAS)',
                'acronym' => 'OAS',
                'badge_color' => 'emerald',
                'hierarchy_level' => 'Knowledge Level (Pekerja Pengetahuan & Administrasi)',
                'decision_type' => 'Dukungan Komunikasi & Koordinasi Harian',
                'input' => 'Data, dokumen teks, surat, pesan suara, gambar, video',
                'processing' => 'Memformat, meringkas, menampilkan, digitalisasi imaging, transmisi faks/email',
                'output' => 'Dokumen tertulis, memo, grafik, presentasi multimedia, risalah rapat',
                'users' => 'Pekerja Pengetahuan (Knowledge workers), staf administrasi, sekretaris, manajer',
                'application' => 'Word processing, E-mail, Audio/Video conferencing, Teleconferencing, Desktop publishing',
            ],
            [
                'system' => 'Management Information System (MIS)',
                'acronym' => 'MIS',
                'badge_color' => 'blue',
                'hierarchy_level' => 'Middle / Tactical Level (Manajer Tingkat Menengah)',
                'decision_type' => 'Keputusan Semi-Terstruktur / Taktis (Tactical Decisions)',
                'input' => 'Keluaran dari TPS & data internal organisasi lainnya',
                'processing' => 'Mengukur dan memantau kinerja operasional, agregasi berkala',
                'output' => 'Summary Reports (Laporan ringkasan) & Exception Reports (Laporan pengecualian)',
                'users' => 'Manajer cabang, manajer regional, manajer departemen/bagian',
                'application' => 'Laporan produksi bulanan, analisis deviasi kuota penjualan, audit kinerja',
            ],
            [
                'system' => 'Intelligent Support System (ISS / DSS, EIS, ES)',
                'acronym' => 'ISS',
                'badge_color' => 'purple',
                'hierarchy_level' => 'Top / Senior Management & Strategis (Eksekutif)',
                'decision_type' => 'Keputusan Tidak Terstruktur (Unstructured & Strategic Decisions)',
                'input' => 'Data internal & eksternal, model analitik, basis pengetahuan pakar',
                'processing' => 'Pelaporan ad-hoc interaktif, goal-seeking, pemodelan skenario what-if, inferensi penalaran',
                'output' => 'Laporan alternatif & analisis strategis, grafik eksekutif drill-down, rekomendasi pakar',
                'users' => 'Top managers, CEO, dewan direksi, konsultan strategi',
                'application' => 'Perencanaan portofolio investasi, analisis merger/ekspansi, simulasi produk baru',
            ],
        ];

        return Inertia::render('Modules/Matrix', compact('matrixData'));
    }

    /**
     * Kuis & Evaluasi Interaktif (10 Soal Asli BAB II)
     */
    public function quiz()
    {
        $questions = $this->getQuizQuestions();

        return Inertia::render('Modules/Quiz', compact('questions'));
    }

    /**
     * Submit & Evaluasi Kuis
     */
    public function quizSubmit(Request $request)
    {
        $questions = $this->getQuizQuestions();
        $userAnswers = $request->input('answers', []);

        $score = 0;
        $total = count($questions);
        $details = [];

        foreach ($questions as $q) {
            $qid = $q['id'];
            $selected = $userAnswers[$qid] ?? null;
            $isCorrect = ($selected === $q['correct']);

            if ($isCorrect) {
                $score++;
            }

            $details[] = [
                'id' => $qid,
                'question' => $q['question'],
                'options' => $q['options'],
                'user_answer' => $selected,
                'correct_answer' => $q['correct'],
                'is_correct' => $isCorrect,
                'explanation' => $q['explanation'],
            ];
        }

        $percentage = round(($score / $total) * 100);

        return Inertia::render('Modules/QuizResult', compact('score', 'total', 'percentage', 'details') + ['subject' => 'Evaluasi kuis Bab II']);
    }

    /**
     * Kumpulan 10 Soal Asli Dokumen BAB II
     */
    private function getQuizQuestions(): array
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
}
