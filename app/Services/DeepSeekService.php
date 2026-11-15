<?php

namespace App\Services;

use App\Models\Category;
use App\Models\ChatbotRule;
use App\Models\KnowledgeArticle;
use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class DeepSeekService
{
    public const DISPLAY_MODEL = 'rakitGPT';

    public function isConfigured(): bool
    {
        return filled(config('services.deepseek.api_key'));
    }

    public function model(): string
    {
        return self::DISPLAY_MODEL;
    }

    public function upstreamModel(): string
    {
        return (string) config('services.deepseek.model', 'deepseek-chat');
    }

    /**
     * Send a prompt + conversation history to the upstream LLM API and present it under rakitGPT.
     *
     * @param  array<int, array{role: string, content: string}>  $history
     * @return array{reply: ?string, used_ai: bool, model: string, error: ?string}
     */
    public function askChat(string $message, array $history = [], string $systemContext = ''): array
    {
        $displayModel = self::DISPLAY_MODEL;

        if (! $this->isConfigured()) {
            return [
                'reply' => null,
                'used_ai' => false,
                'model' => $displayModel,
                'error' => 'Kunci API rakitGPT belum dikonfigurasi pada file .env.',
            ];
        }

        $baseUrl = rtrim((string) config('services.deepseek.base_url', 'https://api.deepseek.com'), '/');
        $timeout = (int) config('services.deepseek.timeout', 20);

        $messages = [
            [
                'role' => 'system',
                'content' => trim(
                    "Anda adalah rakitGPT, Asisten Pengetahuan resmi platform RAKIT (sistem informasi & etalase perangkat keras PC Indonesia dalam Rupiah).\n"
                    ."Jawab ringkas, akurat, teknis namun ramah dalam bahasa Indonesia. Jangan menyebut model vendor internal; identitas Anda adalah rakitGPT. Jangan mengarang stok atau harga di luar konteks yang diberikan.\n\n"
                    .$systemContext
                ),
            ],
        ];

        foreach (array_slice($history, -6) as $turn) {
            if (! is_array($turn)) {
                continue;
            }
            $role = ($turn['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
            $content = trim((string) ($turn['content'] ?? ''));
            if ($content !== '') {
                $messages[] = ['role' => $role, 'content' => Str::limit($content, 800, '')];
            }
        }

        $messages[] = ['role' => 'user', 'content' => $message];

        try {
            $response = Http::withToken((string) config('services.deepseek.api_key'))
                ->acceptJson()
                ->timeout($timeout)
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $this->upstreamModel(),
                    'messages' => $messages,
                    'temperature' => 0.3,
                    'max_tokens' => 650,
                ]);

            if (! $response->successful()) {
                return [
                    'reply' => null,
                    'used_ai' => false,
                    'model' => $displayModel,
                    'error' => "Layanan rakitGPT mengembalikan HTTP {$response->status()}.",
                ];
            }

            $reply = data_get($response->json(), 'choices.0.message.content');
            if (! is_string($reply) || trim($reply) === '') {
                return [
                    'reply' => null,
                    'used_ai' => false,
                    'model' => $displayModel,
                    'error' => 'Respons rakitGPT kosong.',
                ];
            }

            return [
                'reply' => trim($reply),
                'used_ai' => true,
                'model' => $displayModel,
                'error' => null,
            ];
        } catch (Throwable $e) {
            return [
                'reply' => null,
                'used_ai' => false,
                'model' => $displayModel,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Build live grounding context from the RAKIT catalogue, KMS articles, and chatbot DB rules.
     */
    public function buildStorefrontContext(string $message, ?ChatbotRule $matchedRule = null): string
    {
        $categories = Category::query()->orderBy('name')->pluck('name')->all();
        $totalProducts = Product::query()->count();
        $inStockProducts = Product::query()->where('stock', '>', 0)->count();

        $matchingProducts = $this->findMatchingProducts($message);
        $productLines = $matchingProducts->map(function (Product $product): string {
            $price = 'Rp '.number_format((int) $product->price, 0, ',', '.');

            return "- {$product->name} | Kategori: ".($product->category?->name ?? 'Umum')." | Harga: {$price} | Stok: {$product->stock} | URL: /product/{$product->slug}";
        })->implode("\n");

        $keywords = $this->extractKeywords($message);
        $articleLines = KnowledgeArticle::query()
            ->when(count($keywords) > 0, function ($query) use ($keywords): void {
                $query->where(function ($nested) use ($keywords): void {
                    foreach ($keywords as $word) {
                        $nested->orWhere('title', 'like', "%{$word}%")
                            ->orWhere('summary', 'like', "%{$word}%")
                            ->orWhere('domain', 'like', "%{$word}%");
                    }
                });
            })
            ->limit(3)
            ->get()
            ->map(fn (KnowledgeArticle $article): string => "- [{$article->knowledge_type}] {$article->title}: {$article->summary}")
            ->implode("\n");

        $sections = [
            "Ringkasan Katalog RAKIT: {$totalProducts} SKU terdaftar ({$inStockProducts} tersedia stok). Kategori: ".implode(', ', $categories).'.',
            'Rute modul pembelajaran: /pyramid (Piramida SI), /tps (TPS), /oas (OAS), /mis (MIS), /kms (KMS & Chatbot), /iss (DSS/EIS/Expert System), /matrix (Matriks), /quiz (Evaluasi).',
        ];

        if ($matchedRule !== null) {
            $sections[] = "Kecocokan Basis Data Chatbot (tabel chatbot):\nPertanyaan cocok: {$matchedRule->queries}\nJawaban rujukan: {$matchedRule->replies}";
        }

        if ($productLines !== '') {
            $sections[] = "Produk relevan dari database:\n{$productLines}";
        }

        if ($articleLines !== '') {
            $sections[] = "Artikel Knowledge Management terkait:\n{$articleLines}";
        }

        return implode("\n\n", $sections);
    }

    /**
     * Find storefront products matching meaningful keywords in the user message.
     *
     * @return Collection<int, Product>
     */
    public function findMatchingProducts(string $message, int $limit = 4)
    {
        $keywords = $this->extractKeywords($message);
        if ($keywords === []) {
            return Product::query()->where('id', 0)->get();
        }

        return Product::query()
            ->with('category')
            ->where(function ($query) use ($keywords): void {
                foreach ($keywords as $word) {
                    $query->orWhere('name', 'like', "%{$word}%")
                        ->orWhere('description', 'like', "%{$word}%");
                }
            })
            ->orderByDesc('stock')
            ->limit($limit)
            ->get();
    }

    /**
     * Answer an executive summary question (Bab XII EIS) using DeepSeek or deterministic metrics.
     *
     * @param  array<string, mixed>  $metricsSummary
     * @return array{answer: string, source: string, model: string}
     */
    public function askExecutiveQuestion(string $question, array $metricsSummary): array
    {
        $context = "Anda adalah Penasihat Executive Information System (EIS) RAKIT.\n"
            ."Berikan analisis eksekutif ringkas berbasis data riil di bawah ini dalam Bahasa Indonesia:\n"
            .json_encode($metricsSummary, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $result = $this->askChat($question, [], $context);
        if ($result['used_ai'] && $result['reply'] !== null) {
            return [
                'answer' => $result['reply'],
                'source' => 'rakitgpt',
                'model' => self::DISPLAY_MODEL,
            ];
        }

        $totalRevenue = 'Rp '.number_format((float) ($metricsSummary['total_revenue'] ?? 0), 0, ',', '.');
        $totalOrders = (int) ($metricsSummary['total_orders'] ?? 0);
        $topCategory = (string) ($metricsSummary['top_category'] ?? '-');
        $topRegion = (string) ($metricsSummary['top_region'] ?? '-');

        return [
            'answer' => "Ringkasan EIS Lokal (Mode Offline): Total {$totalOrders} pesanan tercatat dengan omzet {$totalRevenue}. "
                ."Kategori performa tertinggi adalah {$topCategory} dan wilayah sales tertinggi berada di {$topRegion}. "
                .'Tambahkan kunci API pada .env untuk mengaktifkan analisis naratif rakitGPT.',
            'source' => 'eis_deterministic',
            'model' => 'EIS Lokal',
        ];
    }

    /**
     * Extract searchable tokens from a message while filtering common Indonesian stop words.
     *
     * @return array<int, string>
     */
    public function extractKeywords(string $message): array
    {
        $stopWords = [
            'apa', 'apakah', 'ada', 'yang', 'dan', 'atau', 'untuk', 'dengan', 'dari', 'ke', 'di',
            'ini', 'itu', 'saya', 'aku', 'kami', 'kita', 'kamu', 'anda', 'tolong', 'cari', 'carikan',
            'berapa', 'harga', 'stok', 'produk', 'barang', 'komponen', 'dong', 'ya', 'nih', 'bisa',
            'bagaimana', 'gimana', 'kenapa', 'mengapa', 'mau', 'beli', 'rekomendasi', 'tentang',
        ];

        $tokens = preg_split('/[^\p{L}\p{N}\-]+/u', Str::lower($message)) ?: [];
        $filtered = [];

        foreach ($tokens as $token) {
            $token = trim($token);
            if (mb_strlen($token) < 3 || in_array($token, $stopWords, true)) {
                continue;
            }
            $filtered[] = $token;
        }

        return array_values(array_unique(array_slice($filtered, 0, 5)));
    }
}
