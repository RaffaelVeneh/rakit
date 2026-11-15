<?php

namespace Tests\Feature;

use App\Http\Controllers\KmsController;
use App\Models\Category;
use App\Models\ChatbotRule;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class KmsChatbotTest extends TestCase
{
    use RefreshDatabase;

    public function test_kms_page_renders_seeded_knowledge_and_chatbot_rules(): void
    {
        $response = $this->get(route('kms'));

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Modules/Kms')
                ->has('articles')
                ->has('chatbotRules')
                ->has('stats')
            );
    }

    public function test_chatbot_uses_database_table_when_deepseek_key_is_blank(): void
    {
        Config::set('services.deepseek.api_key', null);

        $response = $this->postJson(route('chatbot.message'), [
            'message' => 'Bagaimana cara order dan checkout di sini?',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('source', 'chatbot_db')
            ->assertJsonFragment(['source' => 'chatbot_db']);
    }

    public function test_chatbot_matches_catalogue_product_when_no_rule_matches(): void
    {
        Config::set('services.deepseek.api_key', null);

        $cat = Category::create([
            'name' => 'GPU',
            'slug' => 'gpu',
        ]);
        Product::create([
            'category_id' => $cat->id,
            'name' => 'NVIDIA GeForce RTX 4070 Super',
            'slug' => 'nvidia-geforce-rtx-4070-super',
            'price' => 10500000,
            'stock' => 6,
            'description' => 'Kartu grafis Ada Lovelace RTX 4070 Super',
            'image' => 'rtx4070.jpg',
        ]);

        $response = $this->postJson(route('chatbot.message'), [
            'message' => 'Apakah tersedia RTX 4070?',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('source', 'catalogue_db')
            ->assertJsonPath('suggested_products.0.title', 'NVIDIA GeForce RTX 4070 Super');
    }

    public function test_chatbot_returns_exact_bab_x_fallback_when_unmatched(): void
    {
        Config::set('services.deepseek.api_key', null);

        $response = $this->postJson(route('chatbot.message'), [
            'message' => 'zxqwertypolska999111',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('source', 'fallback')
            ->assertJsonPath('reply', KmsController::FALLBACK_REPLY);
    }

    public function test_chatbot_uses_deepseek_api_when_configured(): void
    {
        Config::set('services.deepseek.api_key', 'sk-test-fake-key');
        Config::set('services.deepseek.base_url', 'https://api.deepseek.com');
        Config::set('services.deepseek.model', 'deepseek-chat');

        Http::fake([
            'https://api.deepseek.com/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'PSU minimal 650W 80+ Gold disarankan untuk RTX 4070 Super.',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson(route('chatbot.message'), [
            'message' => 'Butuh PSU berapa watt untuk GPU?',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('source', 'rakitgpt')
            ->assertJsonPath('model', 'rakitGPT')
            ->assertJsonPath('reply', 'PSU minimal 650W 80+ Gold disarankan untuk RTX 4070 Super.');

        Http::assertSentCount(1);
    }

    public function test_kms_can_store_article_and_manage_chatbot_rules(): void
    {
        $this->post(route('kms.articles.store'), [
            'title' => 'Panduan Uji Post AM5',
            'knowledge_type' => 'tacit',
            'domain' => 'Troubleshooting',
            'summary' => 'Memory training AM5 pertama kali memakan waktu 60 detik.',
            'content' => 'Jangan mematikan daya paksa saat LED DRAM berwarna kuning.',
            'author_role' => 'Senior Technician',
        ])->assertRedirect(route('kms'));

        $this->assertDatabaseHas('knowledge_articles', [
            'title' => 'Panduan Uji Post AM5',
            'knowledge_type' => 'tacit',
        ]);

        $this->post(route('kms.chatbot.store'), [
            'queries' => 'ongkir|ekspedisi|kurir',
            'replies' => 'Pengiriman diasuransikan penuh ke seluruh Indonesia.',
            'category' => 'Logistik',
        ])->assertRedirect(route('kms'));

        $rule = ChatbotRule::query()->where('category', 'Logistik')->firstOrFail();

        $this->delete(route('kms.chatbot.delete', $rule))
            ->assertRedirect(route('kms'));

        $this->assertDatabaseMissing('chatbot', ['id' => $rule->id]);
    }
}
