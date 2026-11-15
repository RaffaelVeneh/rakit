<?php

namespace App\Http\Controllers;

use App\Models\ChatbotRule;
use App\Models\KnowledgeArticle;
use App\Models\Product;
use App\Services\DeepSeekService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class KmsController extends Controller
{
    public const FALLBACK_REPLY = 'Maaf sistem tidak mengerti jawaban yang harus diberikan';

    public function index(DeepSeekService $deepSeek): Response
    {
        $articles = KnowledgeArticle::query()
            ->orderByDesc('id')
            ->get();

        $chatbotRules = ChatbotRule::query()
            ->orderBy('id')
            ->get();

        $stats = [
            'explicit' => $articles->where('knowledge_type', 'explicit')->count(),
            'implicit' => $articles->where('knowledge_type', 'implicit')->count(),
            'tacit' => $articles->where('knowledge_type', 'tacit')->count(),
            'chatbot_rules' => $chatbotRules->where('is_active', true)->count(),
        ];

        return Inertia::render('Modules/Kms', [
            'articles' => $articles,
            'chatbotRules' => $chatbotRules,
            'stats' => $stats,
            'deepseekConfigured' => $deepSeek->isConfigured(),
            'deepseekModel' => $deepSeek->model(),
        ]);
    }

    public function storeArticle(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:180',
            'knowledge_type' => 'required|in:explicit,implicit,tacit',
            'domain' => 'required|string|max:80',
            'summary' => 'required|string|max:400',
            'content' => 'required|string|max:5000',
            'author_role' => 'required|string|max:100',
        ]);

        $baseSlug = Str::slug($validated['title']);
        $slug = $baseSlug !== '' ? $baseSlug : 'artikel-pengetahuan';
        if (KnowledgeArticle::query()->where('slug', $slug)->exists()) {
            $slug .= '-'.Str::lower(Str::random(5));
        }

        KnowledgeArticle::create([
            ...$validated,
            'slug' => $slug,
            'views_count' => 1,
        ]);

        return redirect()->route('kms')->with('success', 'Artikel pengetahuan berhasil disimpan ke repositori KMS.');
    }

    public function storeChatbotRule(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'queries' => 'required|string|max:500',
            'replies' => 'required|string|max:1500',
            'category' => 'required|string|max:80',
        ]);

        ChatbotRule::create([
            ...$validated,
            'is_active' => true,
        ]);

        return redirect()->route('kms')->with('success', 'Pola pertanyaan & jawaban berhasil ditambahkan ke tabel chatbot.');
    }

    public function deleteChatbotRule(ChatbotRule $chatbotRule): RedirectResponse
    {
        $chatbotRule->delete();

        return redirect()->route('kms')->with('success', 'Aturan chatbot berhasil dihapus dari basis data.');
    }

    public function askChatbot(Request $request, DeepSeekService $deepSeek): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array|max:12',
            'history.*.role' => 'nullable|string|in:user,assistant',
            'history.*.content' => 'nullable|string|max:1000',
        ]);

        $message = trim($validated['message']);
        $history = $validated['history'] ?? [];

        $matchedRule = $this->matchChatbotRule($message);
        $matchingProducts = $deepSeek->findMatchingProducts($message, 3);

        $suggestedProducts = $matchingProducts->map(fn (Product $product): array => [
            'id' => $product->id,
            'slug' => $product->slug,
            'title' => $product->name,
            'price' => (int) $product->price,
            'stock' => (int) $product->stock,
            'category' => $product->category?->name ?? 'Komponen',
        ])->values()->all();

        if ($deepSeek->isConfigured()) {
            $context = $deepSeek->buildStorefrontContext($message, $matchedRule);
            $aiResult = $deepSeek->askChat($message, $history, $context);

            if ($aiResult['used_ai'] && $aiResult['reply'] !== null) {
                return response()->json([
                    'reply' => $aiResult['reply'],
                    'source' => 'rakitgpt',
                    'model' => DeepSeekService::DISPLAY_MODEL,
                    'matched_rule_id' => $matchedRule?->id,
                    'suggested_products' => $suggestedProducts,
                ]);
            }
        }

        if ($matchedRule !== null) {
            return response()->json([
                'reply' => $matchedRule->replies,
                'source' => 'chatbot_db',
                'model' => null,
                'matched_rule_id' => $matchedRule->id,
                'suggested_products' => $suggestedProducts,
            ]);
        }

        if ($matchingProducts->isNotEmpty()) {
            $lines = $matchingProducts->map(function (Product $product): string {
                $price = 'Rp '.number_format((int) $product->price, 0, ',', '.');
                $stockLabel = $product->stock > 0 ? "stok {$product->stock}" : 'stok habis';

                return "• {$product->name} ({$price}, {$stockLabel})";
            })->implode("\n");

            return response()->json([
                'reply' => "Berikut komponen di katalog RAKIT yang cocok dengan pencarian Anda:\n{$lines}\n\nKlik kartu produk di bawah untuk membuka lembar spesifikasi.",
                'source' => 'catalogue_db',
                'model' => null,
                'matched_rule_id' => null,
                'suggested_products' => $suggestedProducts,
            ]);
        }

        return response()->json([
            'reply' => self::FALLBACK_REPLY,
            'source' => 'fallback',
            'model' => null,
            'matched_rule_id' => null,
            'suggested_products' => [],
        ]);
    }

    /**
     * Match incoming query against the `chatbot` table (`queries` uses `|` separated patterns, per Bab X 10.6).
     */
    private function matchChatbotRule(string $message): ?ChatbotRule
    {
        $normalized = Str::lower(trim($message));
        $rules = ChatbotRule::query()->where('is_active', true)->get();

        $bestRule = null;
        $bestScore = 0;

        foreach ($rules as $rule) {
            $patterns = array_filter(array_map(
                fn (string $p): string => Str::lower(trim($p)),
                explode('|', $rule->queries)
            ));

            foreach ($patterns as $pattern) {
                if ($pattern === '') {
                    continue;
                }

                if ($normalized === $pattern) {
                    return $rule;
                }

                if (str_contains($normalized, $pattern)) {
                    $score = mb_strlen($pattern) + 10;
                    if ($score > $bestScore) {
                        $bestScore = $score;
                        $bestRule = $rule;
                    }
                }
            }
        }

        return $bestRule;
    }
}
