<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class IssEnhancementTest extends TestCase
{
    use RefreshDatabase;

    public function test_iss_page_exposes_real_storefront_eis_analytics(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $category = Category::create([
            'name' => 'Prosesor',
            'slug' => 'prosesor',
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'AMD Ryzen 7 7800X3D',
            'slug' => 'amd-ryzen-7-7800x3d',
            'price' => 6500000,
            'stock' => 4,
            'description' => 'CPU gaming AM5',
            'image' => '7800x3d.jpg',
        ]);

        $order = Order::create([
            'order_number' => 'ORD-EIS-001',
            'user_id' => $user->id,
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'customer_phone' => '08123456789',
            'shipping_address' => 'Yogyakarta',
            'payment_method' => 'bank_transfer',
            'total_amount' => 13000000,
            'status' => 'completed',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'price' => 6500000,
            'quantity' => 2,
            'subtotal' => 13000000,
        ]);

        $response = $this->get(route('iss'));

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Modules/Iss')
                ->where('eisAnalytics.summary.total_orders', 1)
                ->where('eisAnalytics.summary.total_revenue', 13000000)
                ->where('eisAnalytics.by_category.0.title', 'Prosesor')
                ->where('eisAnalytics.top_products.0.title', 'AMD Ryzen 7 7800X3D')
            );
    }

    public function test_eis_executive_question_works_offline_and_with_deepseek(): void
    {
        Config::set('services.deepseek.api_key', null);

        $this->postJson(route('iss.eis.ask'), [
            'question' => 'Bagaimana omzet saat ini?',
        ])->assertStatus(200)
            ->assertJsonPath('source', 'eis_deterministic');

        Config::set('services.deepseek.api_key', 'sk-test-eis');
        Http::fake([
            'https://api.deepseek.com/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => 'Kategori Prosesor mendominasi pendapatan.']]],
            ], 200),
        ]);

        $this->postJson(route('iss.eis.ask'), [
            'question' => 'Kategori apa yang paling kuat?',
        ])->assertStatus(200)
            ->assertJsonPath('source', 'rakitgpt')
            ->assertJsonPath('model', 'rakitGPT')
            ->assertJsonPath('answer', 'Kategori Prosesor mendominasi pendapatan.');
    }

    public function test_expert_system_supports_forward_and_backward_chaining_with_explanation_trace(): void
    {
        $forward = $this->post(route('iss.diagnose'), [
            'problem_area' => 'pc_no_post',
            'symptom' => 'no_video_beep',
            'severity' => 'high',
            'inference_mode' => 'forward',
            'knowledge_type' => 'heuristic',
        ]);

        $forward->assertRedirect(route('iss'))
            ->assertSessionHas('diagnosis', function (array $payload): bool {
                return str_starts_with($payload['rule_fired'], 'RULE-05')
                    && $payload['inference_mode'] === 'forward'
                    && $payload['knowledge_type'] === 'heuristic'
                    && count($payload['explanation_trace']) === 4;
            });

        $backward = $this->post(route('iss.diagnose'), [
            'problem_area' => 'sales_deviation',
            'symptom' => 'high_variance',
            'severity' => 'high',
            'inference_mode' => 'backward',
            'knowledge_type' => 'factual',
        ]);

        $backward->assertRedirect(route('iss'))
            ->assertSessionHas('diagnosis', function (array $payload): bool {
                return str_starts_with($payload['rule_fired'], 'RULE-02')
                    && $payload['inference_mode'] === 'backward'
                    && str_contains($payload['explanation_trace'][0], '[GOAL]');
            });
    }
}
