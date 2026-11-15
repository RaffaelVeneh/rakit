<?php

namespace App\Http\Controllers;

use App\Models\OasMemo;
use App\Models\OasTask;
use App\Models\Order;
use App\Models\Product;
use App\Models\SalesPerformance;
use App\Models\Transaction;
use App\Models\User;
use App\Services\DeepSeekService;
use App\Support\ModuleQuizBank;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $tasks = OasTask::query()
            ->orderBy('status')
            ->orderBy('due_date')
            ->get();

        return Inertia::render('Modules/Oas', compact('memos', 'tasks'));
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
     * OAS: Store scheduled task & deadline (Bab IX)
     */
    public function oasTaskStore(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'assignee' => 'required|string|max:100',
            'department' => 'required|string|max:100',
            'due_date' => 'required|date',
            'priority' => 'required|in:normal,urgent',
            'notes' => 'nullable|string|max:1000',
        ]);

        OasTask::create([
            ...$validated,
            'status' => 'open',
        ]);

        return redirect()->route('oas')->with('success', 'Tugas & tenggat kerja OAS berhasil dijadwalkan.');
    }

    /**
     * OAS: Toggle task completion status
     */
    public function oasTaskToggle(OasTask $oasTask)
    {
        $oasTask->status = $oasTask->status === 'done' ? 'open' : 'done';
        $oasTask->save();

        return redirect()->route('oas')->with('success', "Status tugas '{$oasTask->title}' diperbarui menjadi {$oasTask->status}.");
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
        $eisAnalytics = $this->buildEisAnalytics($performances);

        return Inertia::render('Modules/Iss', compact('performances', 'regions', 'eisAnalytics'));
    }

    /**
     * Answer an executive analytical question against real EIS aggregates (Bab XII).
     */
    public function issExecutiveAsk(Request $request, DeepSeekService $deepSeek): JsonResponse
    {
        $validated = $request->validate([
            'question' => 'required|string|max:500',
        ]);

        $performances = SalesPerformance::all();
        $eisAnalytics = $this->buildEisAnalytics($performances);
        $topCategory = $eisAnalytics['by_category'][0]['title'] ?? '-';
        $topRegion = $performances->sortByDesc('actual_sales')->first()?->region ?? '-';

        $payload = [
            ...$eisAnalytics['summary'],
            'top_category' => $topCategory,
            'top_region' => $topRegion,
            'by_category' => $eisAnalytics['by_category'],
            'by_status' => $eisAnalytics['by_status'],
        ];

        $result = $deepSeek->askExecutiveQuestion($validated['question'], $payload);

        return response()->json($result);
    }

    /**
     * Expert System Inference Engine (Forward/Backward Chaining + Factual/Heuristic KB + Explanation Trace)
     */
    public function issDiagnose(Request $request)
    {
        $problemArea = (string) $request->input('problem_area', '');
        $symptom = (string) $request->input('symptom', '');
        $severity = (string) $request->input('severity', 'high');
        $inferenceMode = in_array($request->input('inference_mode'), ['forward', 'backward'], true)
            ? (string) $request->input('inference_mode')
            : 'forward';
        $knowledgeType = in_array($request->input('knowledge_type'), ['factual', 'heuristic'], true)
            ? (string) $request->input('knowledge_type')
            : 'factual';

        $diagnosis = '';
        $recommendation = [];
        $ruleFired = '';
        $confidence = $knowledgeType === 'factual' ? '100% (Factual Deterministik)' : '88% (Heuristik Pakar)';

        // Rule-Based Knowledge Base (IS Organizational + RAKIT Hardware Diagnostics)
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
        } elseif ($problemArea === 'pc_no_post') {
            $ruleFired = 'RULE-05: Hardware No-POST & BIOS Initialization';
            $diagnosis = 'Sistem gagal melewati fase Power-On Self Test (POST) akibat konflik RAM/CMOS, kabel daya EPS 8-pin longgar, atau versi BIOS belum mendukung generasi CPU.';
            $recommendation = [
                'Lakukan Clear CMOS dan uji menyalakan sistem dengan konfigurasi minimal (1 keping RAM pada slot A2).',
                'Pastikan konektor 24-pin ATX serta 8-pin EPS CPU terpasang penuh hingga mengunci.',
                'Verifikasi dukungan revisi BIOS motherboard; gunakan BIOS Flashback apabila memakai CPU generasi terbaru.',
            ];
        } elseif ($problemArea === 'ram_mismatch') {
            $ruleFired = 'RULE-06: Memory Bus & XMP/EXPO Instability';
            $diagnosis = 'Konfigurasi memori mengalami ketidakstabilan timing/voltase controller memori (sering terjadi pada 4-DIMM frekuensi tinggi atau pencampuran kit berbeda).';
            $recommendation = [
                'Gunakan maksimal 2 modul kit identik (Dual-Channel slot A2/B2) sesuai daftar QVL motherboard.',
                'Turunkan frekuensi profil XMP/EXPO satu tingkat di bawah spesifikasi puncak (mis. 6000 MT/s -> 5600 MT/s).',
                'Perbarui AGESA/Microcode BIOS untuk meningkatkan stabilitas memory training.',
            ];
        } elseif ($problemArea === 'psu_unstable') {
            $ruleFired = 'RULE-07: Power Headroom & Transient Spike Protection';
            $diagnosis = 'Unit catu daya mengalami pemicu OCP/OPP akibat lonjakan daya transien GPU melebihi headroom kontinyu rail +12V.';
            $recommendation = [
                'Hitung ulang beban puncak: (TDP CPU + TBP GPU + 120W) × 1,30 untuk menyisakan headroom minimal 30%.',
                'Pisahkan kabel daya PCIe per konektor GPU (hindari daisy-chain splitter).',
                'Pertimbangkan upgrade ke unit PSU 80+ Gold/Platinum berstandar ATX 3.0/3.1.',
            ];
        } else {
            $ruleFired = 'RULE-04: General Information Flow Alignment';
            $diagnosis = 'Ketidakharmonisan aliran data antara level Operasional (TPS) dan level Taktis (MIS).';
            $recommendation = [
                'Otomatisasi transformasi data harian TPS menjadi summary report terstruktur.',
                'Gunakan OAS (Office Automation) untuk menyebarkan laporan rutin secara otomatis ke manajer terkait.',
            ];
        }

        $explanationTrace = $inferenceMode === 'backward'
            ? [
                "1. [GOAL] Hipotesis target diuji: {$ruleFired}.",
                "2. [BASIS PENGETAHUAN] Tipe aturan: {$knowledgeType} | Domain={$problemArea} | Gejala={$symptom} | Severity={$severity}.",
                '3. [VERIFIKASI SUB-TUJUAN] Bukti observasi lapangan cocok dengan premis aturan sehingga hipotesis diterima.',
                "4. [KESIMPULAN] {$diagnosis}",
            ]
            : [
                "1. [OBSERVASI DATA] Premis masukan diterima: Domain={$problemArea}, Gejala={$symptom}, Severity={$severity}.",
                "2. [WORKING MEMORY] Mesin inferensi mencocokkan fakta pada basis pengetahuan bertipe {$knowledgeType}.",
                "3. [ATURAN TERPICU] {$ruleFired}.",
                "4. [AKSI] Menghasilkan diagnosis dengan tingkat keyakinan {$confidence} beserta rekomendasi bertahap.",
            ];

        return redirect()
            ->route('iss')
            ->with('diagnosis', [
                'rule_fired' => $ruleFired,
                'diagnosis' => $diagnosis,
                'recommendations' => $recommendation,
                'inference_mode' => $inferenceMode,
                'knowledge_type' => $knowledgeType,
                'confidence' => $confidence,
                'explanation_trace' => $explanationTrace,
            ]);
    }

    /**
     * Aggregate real storefront EIS metrics across orders, products, and categories (Bab XII).
     *
     * @return array<string, mixed>
     */
    private function buildEisAnalytics($performances): array
    {
        $totalOrders = Order::query()->count();
        $paidRevenue = (float) Order::query()->sum('total_amount');
        $pendingOrders = Order::query()->where('status', 'pending')->count();
        $avgOrderValue = $totalOrders > 0 ? round($paidRevenue / $totalOrders, 0) : 0;

        $byCategory = DB::table('categories')
            ->leftJoin('products', 'products.category_id', '=', 'categories.id')
            ->leftJoin('order_items', 'order_items.product_id', '=', 'products.id')
            ->select(
                'categories.id',
                'categories.name',
                DB::raw('COUNT(DISTINCT products.id) as sku_count'),
                DB::raw('COALESCE(SUM(order_items.quantity), 0) as units_sold'),
                DB::raw('COALESCE(SUM(order_items.quantity * order_items.price), 0) as revenue')
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row): array => [
                'id' => (int) $row->id,
                'title' => (string) $row->name,
                'sku_count' => (int) $row->sku_count,
                'units_sold' => (int) $row->units_sold,
                'revenue' => (float) $row->revenue,
            ])
            ->values()
            ->all();

        $topProducts = DB::table('order_items')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->select(
                'products.id',
                'products.name',
                'products.category_id',
                DB::raw("COALESCE(categories.name, 'Umum') as category_title"),
                'products.stock',
                DB::raw('SUM(order_items.quantity) as units_sold'),
                DB::raw('SUM(order_items.quantity * order_items.price) as revenue')
            )
            ->groupBy('products.id', 'products.name', 'products.category_id', 'categories.name', 'products.stock')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(fn ($row): array => [
                'id' => (int) $row->id,
                'title' => (string) $row->name,
                'category_id' => (int) $row->category_id,
                'category_title' => (string) $row->category_title,
                'stock' => (int) $row->stock,
                'units_sold' => (int) $row->units_sold,
                'revenue' => (float) $row->revenue,
            ])
            ->values()
            ->all();

        $byStatus = DB::table('orders')
            ->select(
                'status',
                DB::raw('COUNT(*) as order_count'),
                DB::raw('COALESCE(SUM(total_amount), 0) as revenue')
            )
            ->groupBy('status')
            ->orderByDesc('order_count')
            ->get()
            ->map(fn ($row): array => [
                'status' => (string) $row->status,
                'order_count' => (int) $row->order_count,
                'revenue' => (float) $row->revenue,
            ])
            ->values()
            ->all();

        return [
            'summary' => [
                'total_orders' => $totalOrders,
                'total_revenue' => $paidRevenue,
                'pending_orders' => $pendingOrders,
                'avg_order_value' => $avgOrderValue,
                'total_skus' => Product::query()->count(),
                'low_stock_skus' => Product::query()->where('stock', '<=', 5)->count(),
                'customer_count' => User::query()->where('role', '!=', 'admin')->count(),
                'region_count' => $performances->pluck('region')->unique()->count(),
            ],
            'by_category' => $byCategory,
            'top_products' => $topProducts,
            'by_status' => $byStatus,
        ];
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
     * Kuis & Evaluasi Interaktif (Multi-Bab: Bab II, VII, VIII, IX, X, XII, XIII)
     */
    public function quiz(Request $request)
    {
        $chapter = ModuleQuizBank::normalizeChapter($request->query('bab'));
        $chapterMeta = ModuleQuizBank::chapterMeta($chapter);
        $chapters = ModuleQuizBank::chapters();
        $questions = ModuleQuizBank::questions($chapter);

        return Inertia::render('Modules/Quiz', compact('questions', 'chapter', 'chapterMeta', 'chapters'));
    }

    /**
     * Submit & Evaluasi Kuis
     */
    public function quizSubmit(Request $request)
    {
        $chapter = ModuleQuizBank::normalizeChapter($request->input('bab'));
        $chapterMeta = ModuleQuizBank::chapterMeta($chapter);
        $questions = ModuleQuizBank::questions($chapter);
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

        $percentage = $total > 0 ? round(($score / $total) * 100) : 0;

        return Inertia::render('Modules/QuizResult', compact('score', 'total', 'percentage', 'details') + [
            'subject' => $chapterMeta['subject'],
            'chapter' => $chapter,
        ]);
    }
}
