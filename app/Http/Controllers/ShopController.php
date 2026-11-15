<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use RuntimeException;

class ShopController extends Controller
{
    /**
     * Storefront Homepage
     */
    public function index(Request $request)
    {
        // Each group carries one representative part so the sheet can show a real
        // catalogue plate instead of a stand-in image.
        $categories = Category::withCount('products')
            ->with(['products' => function ($query) {
                $query->select('id', 'category_id', 'name', 'slug', 'image')->latest()->limit(1);
            }])
            ->get();
        // Only brands the catalogue actually stocks, busiest first, so the filter
        // never offers a choice that returns nothing.
        //
        // The filter used to be `having('products_count', '>', 0)`. MySQL accepts a
        // HAVING clause against a select-list alias, SQLite does not — it rejects the
        // statement outright as "HAVING clause on a non-aggregate query", which made
        // the front page a 500 wherever the tests ran. Filtering on the subquery itself
        // means the same rows, in either engine.
        $brands = Brand::withCount('products')
            ->whereHas('products')
            ->orderByDesc('products_count')
            ->orderBy('name')
            ->get();

        $query = Product::with(['category', 'brand']);

        /*
         * The reader's filters, as a closure, so the register and the drawing table
         * are drawn from the same set.
         *
         * The hero used to run its own unfiltered query, which is why choosing a
         * different group left the same six positions on the table: the sheet said
         * "Hardware & Komponen PC" across the top while the plate went on showing
         * whatever was newest catalogue-wide. A filter the page displays but the
         * hero ignores is a lie about what is being looked at.
         */
        $filters = function ($builder) use ($request): void {
            if ($request->filled('category')) {
                $builder->where('category_id', $request->category);
            }

            if ($request->filled('brand')) {
                $builder->whereHas('brand', function ($q) use ($request) {
                    $q->where('slug', $request->brand)
                        ->orWhere('id', $request->brand);
                });
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $builder->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }
        };

        $filters($query);

        // Sorting
        if ($request->get('sort') === 'price_asc') {
            $query->orderBy('price', 'asc');
        } elseif ($request->get('sort') === 'price_desc') {
            $query->orderBy('price', 'desc');
        } elseif ($request->get('sort') === 'popular') {
            $query->orderBy('is_featured', 'desc')->latest();
        } else {
            $query->latest();
        }

        $products = $query->paginate(24)->withQueryString();
        $featuredProducts = Product::with(['category', 'brand'])->where('is_featured', true)->take(4)->get();

        // Register readouts: every figure below is read from the catalogue itself,
        // never asserted by the page.
        $priceRange = Product::selectRaw('MIN(price) AS min_price, MAX(price) AS max_price')->first();
        $register = [
            'positions' => Product::count(),
            'groups' => $categories->count(),
            'brands' => $brands->count(),
            'onHand' => (int) Product::sum('stock'),
            'lowStock' => Product::where('stock', '<=', 5)->count(),
            'outOfStock' => Product::where('stock', '<=', 0)->count(),
            'minPrice' => (int) ($priceRange->min_price ?? 0),
            'maxPrice' => (int) ($priceRange->max_price ?? 0),
            'revisedAt' => optional(Product::max('updated_at'))->toIso8601String(),
        ];

        /*
         * The drawing table inspects positions from the filtered set — the same rows
         * the register below is listing. It is never topped up from the rest of the
         * catalogue: a table that quietly refilled itself from elsewhere would undo
         * the point of filtering. When the filter is narrow enough that the rail
         * cannot be filled, the rail is short and the sheet says which group it is
         * showing.
         */
        $heroQuery = Product::with(['category', 'brand']);
        $filters($heroQuery);

        $heroProducts = $heroQuery
            ->orderByDesc('is_featured')
            ->latest()
            ->take(6)
            ->get();

        $heroFiltered = $request->filled('category') || $request->filled('brand') || $request->filled('search');
        $heroGroup = $request->filled('category')
            ? optional($categories->firstWhere('id', (int) $request->category))->name
            : null;

        return Inertia::render('Shop/Index', [
            'categories' => $categories,
            'brands' => $brands,
            'products' => $products,
            'featuredProducts' => $featuredProducts,
            'heroProducts' => $heroProducts,
            'heroFiltered' => $heroFiltered,
            'heroGroup' => $heroGroup,
            'register' => $register,
            'currentSort' => $request->get('sort', 'latest'),
            'currentCategory' => $request->get('category', null),
            'currentBrand' => $request->get('brand', null),
            'currentSearch' => $request->get('search', null),
        ]);
    }

    /**
     * Product Detail Page
     */
    public function product(Product $product)
    {
        $product->load(['category', 'brand']);

        $relatedProducts = Product::with(['category', 'brand'])
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->take(4)
            ->get();

        return Inertia::render('Shop/Product', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
        ]);
    }

    /**
     * Cart Page
     */
    /**
     * The bag, and the reader's own order register beside it.
     *
     * These are the same visit: what you are about to buy, and what you have bought
     * before. They were two pages, and the second one had no way in — reachable only
     * from a line in the footer, which is not where anybody looks for their orders.
     * One page with two tabs means the register is one press from the bag anyone can
     * find.
     *
     * The tab lives in the address bar, so it is linkable, bookmarkable, and
     * survives a reload — and `/my-orders` redirects here rather than keeping a
     * second copy of the same register.
     */
    public function cart(Request $request)
    {
        // Read through the record rather than trusting the session copy, so a bag
        // whose session expired comes back instead of appearing empty.
        $cart = $this->refreshSessionCart($request);
        $total = 0;
        foreach ($cart as $item) {
            $total += $item['price'] * $item['quantity'];
        }

        $tab = $request->get('tab') === 'orders' ? 'orders' : 'bag';

        $orders = $tab === 'orders'
            ? Order::where('user_id', Auth::id())
                ->with('items')
                ->latest()
                ->paginate(10)
                ->withQueryString()
            : null;

        return Inertia::render('Shop/Cart', [
            'cart' => $cart,
            'subtotal' => $total,
            'total' => $total,
            'tab' => $tab,
            'orders' => $orders,
        ]);
    }

    /**
     * The one source of truth for the bag.
     *
     * The `cart` table is the record; the session copy is a projection of it. Both
     * used to be written independently, and a failure in one was caught and logged
     * rather than surfaced — so the two could disagree and the screen showed whichever
     * it happened to read. Rebuilding the session from the table after every change,
     * and before every read, means there is only ever one answer. It also means a bag
     * survives a lost session, which is what a persistent cart is for.
     */
    private function cartQuery(Request $request)
    {
        $userId = Auth::id();
        $ip = $request->ip() ?: '127.0.0.1';

        return Cart::query()->where(function ($q) use ($userId, $ip) {
            if ($userId) {
                $q->where('user_id', $userId);
            } else {
                $q->whereNull('user_id')->where('ip_address', $ip);
            }
        });
    }

    /**
     * Rebuild the session copy from the record and return it.
     */
    private function refreshSessionCart(Request $request): array
    {
        $lines = $this->cartQuery($request)->with('product.category')->get();

        $cart = [];

        foreach ($lines as $line) {
            $product = $line->product;

            // A product deleted while it sat in a bag leaves a line with nothing
            // behind it. Drop the line rather than render a blank row.
            if (! $product) {
                $line->delete();

                continue;
            }

            $cart[$product->id] = [
                'id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'quantity' => (int) $line->quantity,
                'image' => $product->image,
                'category' => $product->category->name ?? '',
            ];
        }

        session()->put('cart', $cart);

        return $cart;
    }

    /**
     * Add to Cart
     */
    public function addToCart(Request $request)
    {
        $productId = $request->input('product_id');
        $quantity = max(1, (int) $request->input('quantity', 1));

        $product = Product::findOrFail($productId);

        if ($product->stock < $quantity) {
            return back()->with('error', "Stok produk {$product->name} tidak mencukupi (sisa: {$product->stock}).");
        }

        // The accumulated quantity is what has to fit in stock, not the quantity being
        // added: adding five twice against a stock of six used to pass both checks and
        // leave the bag holding ten.
        $line = $this->cartQuery($request)->where('product_id', $product->id)->first();
        $alreadyInBag = $line ? (int) $line->quantity : 0;

        if ($product->stock < $alreadyInBag + $quantity) {
            return back()->with('error', "Stok produk {$product->name} tidak mencukupi (sisa: {$product->stock}).");
        }

        // Write the record first. If this fails the exception must reach the handler:
        // a bag that exists only in the session is a bag that disappears, and the old
        // code swallowed exactly this error.
        if ($line) {
            $line->quantity = $alreadyInBag + $quantity;
            $line->save();
        } else {
            Cart::create([
                'product_id' => $product->id,
                'user_id' => Auth::id(),
                'ip_address' => $request->ip() ?: '127.0.0.1',
                'quantity' => $quantity,
            ]);
        }

        $this->refreshSessionCart($request);

        return back()->with('success', "{$product->name} masuk ke tas belanja.");
    }

    /**
     * Update Cart Quantity
     */
    public function updateCart(Request $request)
    {
        $productId = $request->input('product_id');
        $action = $request->input('action'); // 'increase', 'decrease', or 'set'

        $line = $this->cartQuery($request)->where('product_id', $productId)->first();

        if (! $line) {
            return back()->with('error', 'Posisi itu tidak ada lagi di tas belanja Anda.');
        }

        if ($action === 'increase') {
            $product = Product::find($productId);

            if (! $product || $product->stock <= $line->quantity) {
                return back()->with('error', 'Jumlah melebihi batas stok yang tersedia.');
            }

            $line->quantity = $line->quantity + 1;
            $line->save();
        } elseif ($action === 'decrease') {
            $line->quantity = $line->quantity - 1;

            if ($line->quantity <= 0) {
                $line->delete();
            } else {
                $line->save();
            }
        }

        $this->refreshSessionCart($request);

        return back()->with('success', 'Jumlah pada tas belanja diperbarui.');
    }

    /**
     * Remove Item from Cart
     */
    public function removeFromCart(Request $request, $productId)
    {
        $this->cartQuery($request)->where('product_id', $productId)->delete();

        $this->refreshSessionCart($request);

        return back()->with('success', 'Posisi dikeluarkan dari tas belanja.');
    }

    /**
     * Checkout View
     */
    public function checkout(Request $request)
    {
        $cart = $this->refreshSessionCart($request);

        if (empty($cart)) {
            return redirect()->route('shop.cart')->with('error', 'Tas belanja Anda masih kosong.');
        }

        $total = 0;
        foreach ($cart as $item) {
            $total += $item['price'] * $item['quantity'];
        }

        $user = Auth::user();

        return Inertia::render('Shop/Checkout', [
            'cart' => $cart,
            'subtotal' => $total,
            'total' => $total,
            'user' => $user,
        ]);
    }

    /**
     * Process Checkout Order
     */
    public function processCheckout(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:100',
            'customer_email' => 'required|email|max:100',
            'customer_phone' => 'required|string|max:25',
            'shipping_address' => 'required|string',
            'payment_method' => 'required|string',
            'notes' => 'nullable|string|max:500',
        ]);

        // Read the bag from its record, not from the session copy.
        $cart = $this->refreshSessionCart($request);

        if (empty($cart)) {
            return redirect()->route('shop.index')->with('error', 'Tas belanja Anda masih kosong, jadi belum ada yang bisa diproses.');
        }

        // Generate Order Number
        $orderNumber = 'ORD-'.strtoupper(Str::random(8));

        /*
         * One transaction around all three writes.
         *
         * Before this, the order, its items, and the stock decrement were three
         * separate statements. A failure between them left an order with no items and
         * stock that had not moved — a record that looks valid and is not. Either all
         * of it lands or none of it does.
         *
         * The products are fetched once, locked, before anything is written:
         *   - one query instead of one per line (the old loop called Product::find
         *     inside the foreach),
         *   - `lockForUpdate` holds the rows until commit, so two buyers racing for the
         *     last unit cannot both pass the stock check,
         *   - the price charged comes from the database, not from the session, so a
         *     price changed after the item went into the bag is not charged at the old
         *     one.
         */
        try {
            $order = DB::transaction(function () use ($cart, $validated, $orderNumber) {
                $products = Product::whereIn('id', array_column($cart, 'id'))
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $totalAmount = 0;

                foreach ($cart as $item) {
                    $product = $products->get($item['id']);

                    if (! $product) {
                        throw new RuntimeException('Ada posisi di tas belanja Anda yang sudah tidak tersedia. Kosongkan dan susun ulang.');
                    }

                    if ($product->stock < $item['quantity']) {
                        throw new RuntimeException("Stok {$product->name} tidak mencukupi (sisa: {$product->stock}).");
                    }

                    $totalAmount += (float) $product->price * $item['quantity'];
                }

                // Triggers MySQL after_orders_insert -> writes to the logs table.
                $order = Order::create([
                    'order_number' => $orderNumber,
                    'user_id' => Auth::id() ?? null,
                    'customer_name' => $validated['customer_name'],
                    'customer_email' => $validated['customer_email'],
                    'customer_phone' => $validated['customer_phone'],
                    'shipping_address' => $validated['shipping_address'],
                    'payment_method' => $validated['payment_method'],
                    'total_amount' => $totalAmount,
                    'status' => 'pending',
                    'notes' => $validated['notes'] ?? null,
                ]);

                foreach ($cart as $item) {
                    $product = $products->get($item['id']);

                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'price' => $product->price,
                        'quantity' => $item['quantity'],
                        'subtotal' => (float) $product->price * $item['quantity'],
                    ]);

                    $product->decrement('stock', $item['quantity']);
                }

                return $order;
            });
        } catch (RuntimeException $e) {
            // Nothing was written: the transaction rolled back, so the bag is intact
            // and the customer can fix the quantity rather than lose the order.
            return back()->with('error', $e->getMessage());
        }

        // Clear both halves of the bag. The session copy is rebuilt from the table on
        // every read, so leaving a row behind would put the items straight back.
        session()->forget('cart');
        $this->cartQuery($request)->delete();

        // The receipt is the session's own: `orderSuccess` will not show this order
        // to anyone who did not place it here or hold it on their account.
        $request->session()->push('placed_orders', $order->id);

        return redirect()->route('shop.order-success', $order->id)->with('success', "Pesanan #{$orderNumber} berhasil dibuat!");
    }

    /**
     * Order Confirmation Page
     */
    public function orderSuccess(Request $request, Order $order)
    {
        /*
         * A receipt belongs to whoever placed the order, and to nobody else.
         *
         * This page took the order id straight from the URL, so `/order/success/7`
         * showed a stranger's name, email, phone number, delivery address and what
         * they bought — no session, no signature, and nothing to guess but a number
         * that starts at one.
         *
         * There are two ways to be entitled to it, because this shop takes orders
         * from guests as well as from accounts. A signed-in customer owns the
         * orders on their own account; a guest owns the ones this session placed,
         * which checkout records against the session as it writes them. An
         * administrator may read any of them, because that is the console's job.
         * Anyone else is refused.
         */
        $ownsIt = Auth::check() && (int) $order->user_id === (int) Auth::id();
        $placedHere = in_array($order->id, (array) $request->session()->get('placed_orders', []), true);
        $isAdmin = Auth::user()?->isAdmin() ?? false;

        abort_unless($ownsIt || $placedHere || $isAdmin, 403);

        $order->load('items');

        return Inertia::render('Shop/OrderSuccess', [
            'order' => $order,
        ]);
    }

    /**
     * Halaman User (Customer Portal & Profile)
     */
    public function userDashboard(Request $request)
    {
        if (! Auth::check()) {
            return redirect()->route('login')->with('error', 'Silakan login terlebih dahulu untuk mengakses portal pengguna.');
        }

        $user = Auth::user();

        $ordersQuery = Order::where('user_id', $user->id)->with('items');

        $totalSpent = (clone $ordersQuery)->where('status', '!=', 'cancelled')->sum('total_amount');
        $totalOrdersCount = (clone $ordersQuery)->count();
        $completedOrdersCount = (clone $ordersQuery)->where('status', 'completed')->count();
        $processingOrdersCount = (clone $ordersQuery)->where('status', 'processing')->count();

        $orders = $ordersQuery->latest()->paginate(8)->withQueryString();

        return Inertia::render('User/Dashboard', [
            'user' => $user,
            'stats' => [
                'totalSpent' => (float) $totalSpent,
                'totalOrders' => $totalOrdersCount,
                'completedOrders' => $completedOrdersCount,
                'processingOrders' => $processingOrdersCount,
                'memberSince' => $user->created_at ? $user->created_at->translatedFormat('F Y') : 'September 2026',
                'membershipTier' => match (true) {
                    $totalSpent > 50000000 => 'Prioritas I',
                    $totalSpent > 20000000 => 'Prioritas II',
                    default => 'Standar',
                },
            ],
            'orders' => $orders,
            'activeTab' => $request->get('tab', 'profile'),
        ]);
    }

    /**
     * Update User Profile (Form Input Data Pribadi)
     */
    public function updateUserProfile(Request $request)
    {
        if (! Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:25',
            'address' => 'nullable|string|max:500',
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? $user->phone,
            'address' => $validated['address'] ?? $user->address,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        User::where('id', $user->id)->update($updateData);

        return back()->with('success', 'Data pribadi pengguna berhasil diperbarui!');
    }

    /**
     * Subscribe to Newsletter (Saves to email_info table from PDF 1)
     */
    public function subscribeNewsletter(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        DB::table('email_info')->insert([
            'email' => $validated['email'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Terima kasih telah berlangganan info penawaran!',
            ]);
        }

        return back()->with('success', 'Alamat email Anda tercatat pada daftar pemberitahuan rilis.');
    }
}
