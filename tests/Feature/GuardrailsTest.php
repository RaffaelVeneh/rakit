<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The three remaining findings, each held down by an assertion.
 *
 * T3 — a password could be guessed without limit.
 * T4 — debug mode outside local exposes stack traces.
 * T2 — the bag could hold more than the stock, because only the quantity being added
 *      was checked against stock, never the quantity already in the bag.
 */
class GuardrailsTest extends TestCase
{
    use RefreshDatabase;

    // ── T3 ────────────────────────────────────────────────────────────────────
    public function test_the_sixth_login_attempt_is_throttled(): void
    {
        $credentials = ['email' => 'seseorang@contoh.test', 'password' => 'salah'];

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $response = $this->post(route('login.process'), $credentials);

            $response->assertSessionHasErrors('email');
            $this->assertNull(
                session('error'),
                "Percobaan ke-{$attempt} seharusnya masih dinilai sebagai kredensial salah."
            );
        }

        $throttled = $this->post(route('login.process'), $credentials);

        $throttled->assertSessionHas('error');
        $this->assertStringContainsString('Terlalu banyak', (string) session('error'));

        $this->assertGuest();
    }

    public function test_a_successful_login_is_not_blocked_by_the_limiter(): void
    {
        $user = User::factory()->create([
            'role' => 'customer',
            'password' => bcrypt('rahasia123'),
        ]);

        $this->post(route('login.process'), [
            'email' => $user->email,
            'password' => 'rahasia123',
        ])->assertRedirect();

        $this->assertAuthenticatedAs($user);
    }

    // ── T4 ────────────────────────────────────────────────────────────────────
    public function test_debug_outside_local_is_reported_as_leaking(): void
    {
        config(['app.env' => 'production', 'app.debug' => true]);

        $this->assertTrue(AppServiceProvider::debugIsLeaking());
    }

    public function test_debug_off_outside_local_is_not_a_leak(): void
    {
        config(['app.env' => 'production', 'app.debug' => false]);

        $this->assertFalse(AppServiceProvider::debugIsLeaking());
    }

    public function test_debug_inside_local_is_not_treated_as_a_leak(): void
    {
        config(['app.env' => 'local', 'app.debug' => true]);

        $this->assertFalse(
            AppServiceProvider::debugIsLeaking(),
            'Di mesin pengembang, debug memang seharusnya menyala.'
        );
    }

    // ── T2 ────────────────────────────────────────────────────────────────────
    public function test_the_bag_cannot_accumulate_more_than_the_stock(): void
    {
        $categoryId = DB::table('categories')->insertGetId([
            'name' => 'Komponen', 'slug' => 'komponen-guardrails',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $productId = DB::table('products')->insertGetId([
            'category_id' => $categoryId,
            'name' => 'Produk Langka',
            'slug' => 'produk-langka',
            'price' => 500,
            'stock' => 6,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $user = User::factory()->create(['role' => 'customer']);

        // Five fit in six. It must succeed.
        $this->actingAs($user)
            ->post(route('shop.cart.add'), ['product_id' => $productId, 'quantity' => 5])
            ->assertSessionHas('success');

        // Five more would make ten, which does not fit. It must be refused, and the
        // bag must stay where it was.
        $this->actingAs($user)
            ->post(route('shop.cart.add'), ['product_id' => $productId, 'quantity' => 5])
            ->assertSessionHas('error');

        $this->assertSame(
            5,
            (int) Cart::where('user_id', $user->id)->where('product_id', $productId)->value('quantity'),
            'Jumlah di tas tidak boleh bertambah melewati stok.'
        );
    }
}
