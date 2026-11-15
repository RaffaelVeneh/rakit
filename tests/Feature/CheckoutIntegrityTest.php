<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * What these tests hold down.
 *
 * Each one names a defect that was found in the TPS analysis and would pass silently
 * before the fix: an order written without its items, a sale that could exceed stock,
 * a price charged from the bag instead of the catalogue, and a bag that lived in two
 * places at once.
 *
 * They run on SQLite, which ignores `lockForUpdate` and does not enforce unsigned
 * integers. So they prove the *application* logic — the transaction boundary, the
 * stock check, the price source, the single cart source. The database-level guards
 * are verified separately against MySQL; see the section on manual verification.
 */
class CheckoutIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private int $categoryId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->categoryId = DB::table('categories')->insertGetId([
            'name' => 'Komponen',
            'slug' => 'komponen-uji',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->customer = User::factory()->create(['role' => 'customer']);
    }

    private function makeProduct(float $price = 1000, int $stock = 5): int
    {
        static $n = 0;
        $n++;

        return DB::table('products')->insertGetId([
            'category_id' => $this->categoryId,
            'name' => "Produk Uji {$n}",
            'slug' => "produk-uji-{$n}",
            'price' => $price,
            'stock' => $stock,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function putInBag(int $productId, int $quantity): void
    {
        Cart::create([
            'product_id' => $productId,
            'user_id' => $this->customer->id,
            'ip_address' => '127.0.0.1',
            'quantity' => $quantity,
        ]);
    }

    private function checkout(): TestResponse
    {
        return $this->actingAs($this->customer)->post(route('shop.checkout.process'), [
            'customer_name' => 'Pembeli Uji',
            'customer_email' => 'pembeli@contoh.test',
            'customer_phone' => '081200000000',
            'shipping_address' => 'Jalan Uji Nomor 1',
            'payment_method' => 'transfer',
            'notes' => null,
        ]);
    }

    /** T2 — a quantity larger than the stock must be refused. */
    public function test_a_quantity_above_stock_is_refused_and_nothing_is_written(): void
    {
        $productId = $this->makeProduct(price: 1000, stock: 1);
        $this->putInBag($productId, 2);

        $response = $this->checkout();

        $response->assertSessionHas('error');

        $this->assertSame(0, Order::count(), 'Tidak boleh ada pesanan yang tertulis.');
        $this->assertSame(0, OrderItem::count(), 'Tidak boleh ada butir pesanan.');
        $this->assertSame(1, (int) DB::table('products')->where('id', $productId)->value('stock'));

        $this->assertSame(
            1,
            DB::table('cart')->where('user_id', $this->customer->id)->count(),
            'Tas harus utuh supaya pembeli bisa memperbaiki jumlahnya.'
        );
    }

    /** T1 — a successful checkout writes the order, its items, and moves the stock. */
    public function test_a_valid_checkout_writes_order_items_and_moves_stock(): void
    {
        $productId = $this->makeProduct(price: 1000, stock: 5);
        $this->putInBag($productId, 2);

        $this->checkout()->assertRedirect();

        $order = Order::firstOrFail();

        $this->assertSame(1, Order::count());
        $this->assertSame('2000.00', number_format((float) $order->total_amount, 2, '.', ''));

        $item = OrderItem::where('order_id', $order->id)->firstOrFail();
        $this->assertSame(2, (int) $item->quantity);
        $this->assertSame('1000.00', number_format((float) $item->price, 2, '.', ''));

        $this->assertSame(3, (int) DB::table('products')->where('id', $productId)->value('stock'));
        $this->assertSame(0, DB::table('cart')->where('user_id', $this->customer->id)->count());
    }

    /** T1/T2 — the price charged is the catalogue's, not the one remembered in the bag. */
    public function test_the_catalogue_price_wins_over_the_price_remembered_in_the_bag(): void
    {
        $productId = $this->makeProduct(price: 1000, stock: 5);
        $this->putInBag($productId, 1);

        // The bag was filled when the price was 1000. An operator raises it before the
        // customer presses the button.
        DB::table('products')->where('id', $productId)->update(['price' => 1500]);

        $this->checkout()->assertRedirect();

        $order = Order::firstOrFail();
        $this->assertSame('1500.00', number_format((float) $order->total_amount, 2, '.', ''));
    }

    /** T7 — the bag shown is the record, not whatever the session happens to hold. */
    public function test_the_cart_page_reads_from_the_record_not_from_the_session(): void
    {
        $productId = $this->makeProduct(price: 1000, stock: 5);
        $this->putInBag($productId, 3);

        $response = $this->actingAs($this->customer)
            ->withSession(['cart' => []])       // a stale, empty session copy
            ->get(route('shop.cart'));

        $response->assertOk();

        $cart = $response->viewData('page')['props']['cart'] ?? [];

        $this->assertArrayHasKey($productId, $cart, 'Tas harus dibaca dari tabel, bukan dari sesi.');
        $this->assertSame(3, (int) $cart[$productId]['quantity']);
    }

    /** T7 — deleting the record removes it from view, proving the session is derived. */
    public function test_deleting_the_record_removes_the_line_even_if_the_session_still_holds_it(): void
    {
        $productId = $this->makeProduct(price: 1000, stock: 5);
        $this->putInBag($productId, 1);

        DB::table('cart')->where('user_id', $this->customer->id)->delete();

        $response = $this->actingAs($this->customer)
            ->withSession(['cart' => [$productId => [
                'id' => $productId, 'name' => 'Basi', 'price' => 1000,
                'quantity' => 1, 'image' => null, 'category' => '',
            ]]])
            ->get(route('shop.cart'));

        $cart = $response->viewData('page')['props']['cart'] ?? [];

        $this->assertArrayNotHasKey($productId, $cart, 'Sesi basi tidak boleh menampilkan posisi yang sudah tidak ada.');
    }
}
