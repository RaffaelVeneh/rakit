<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AdminController extends Controller
{
    /**
     * Admin MSI Control Panel Dashboard
     */
    public function dashboard()
    {
        $totalRevenue = Order::where('status', '!=', 'cancelled')->sum('total_amount');
        $totalOrders = Order::count();
        $pendingOrders = Order::where('status', 'pending')->count();
        $processingOrders = Order::where('status', 'processing')->count();
        $completedOrders = Order::where('status', 'completed')->count();

        $totalProducts = Product::count();
        $lowStockProducts = Product::where('stock', '<=', 5)->count();
        $totalUsers = User::where('role', 'customer')->count();

        $recentOrders = Order::with('items')->latest()->take(6)->get();

        // The operator's actual job: the orders that still need a decision. The
        // console opens on this rather than on a revenue total.
        $queue = Order::with('items')
            ->whereIn('status', ['pending', 'processing'])
            ->oldest()
            ->take(10)
            ->get();

        $categories = Category::withCount('products')->get();

        // Audit Trail Database Logs (Bab 5 requirement: logs table populated by triggers)
        $activityLogs = ActivityLog::with('user')->latest('id')->take(10)->get();

        return Inertia::render('Admin/Dashboard', [
            'totalRevenue' => $totalRevenue,
            'totalOrders' => $totalOrders,
            'pendingOrders' => $pendingOrders,
            'processingOrders' => $processingOrders,
            'completedOrders' => $completedOrders,
            'totalProducts' => $totalProducts,
            'lowStockProducts' => $lowStockProducts,
            'totalUsers' => $totalUsers,
            'recentOrders' => $recentOrders,
            'queue' => $queue,
            'categories' => $categories,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Product Management
     */
    public function products(Request $request)
    {
        $query = Product::with(['category', 'brand']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }

        if ($request->filled('brand')) {
            $query->where('brand_id', $request->brand);
        }

        $products = $query->latest()->paginate(10)->withQueryString();
        $categories = Category::all();
        $brands = Brand::all();

        return Inertia::render('Admin/Products', [
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
            'currentBrand' => $request->get('brand', null),
        ]);
    }

    /**
     * Store New Product
     */
    public function storeProduct(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'name' => 'required|string|max:200',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|url',
            'description' => 'nullable|string',
            'is_featured' => 'nullable|boolean',
        ]);

        $slug = Str::slug($validated['name']).'-'.Str::random(5);

        Product::create([
            'category_id' => $validated['category_id'],
            'brand_id' => $validated['brand_id'] ?? null,
            'name' => $validated['name'],
            'slug' => $slug,
            'price' => $validated['price'],
            'stock' => $validated['stock'],
            // No stand-in photograph: an empty image stays empty and the sheet draws\n            // a hatched placeholder instead of shipping someone else's picture.\n            'image' => $validated['image'] ?: null,
            'description' => $validated['description'] ?? null,
            'is_featured' => $request->boolean('is_featured'),
        ]);

        return redirect()->route('admin.products')->with('success', 'Produk baru berhasil ditambahkan ke katalog.');
    }

    /**
     * Update Product
     */
    public function updateProduct(Request $request, Product $product)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'name' => 'required|string|max:200',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|string',
            'description' => 'nullable|string',
            'is_featured' => 'nullable|boolean',
        ]);

        $product->update([
            'category_id' => $validated['category_id'],
            'brand_id' => $validated['brand_id'] ?? null,
            'name' => $validated['name'],
            'price' => $validated['price'],
            'stock' => $validated['stock'],
            'image' => $validated['image'] ?: $product->image,
            'description' => $validated['description'] ?? null,
            'is_featured' => $request->boolean('is_featured'),
        ]);

        return redirect()->route('admin.products')->with('success', "Produk {$product->name} berhasil diperbarui.");
    }

    /**
     * Delete Product
     */
    public function deleteProduct(Product $product)
    {
        $name = $product->name;
        $product->delete();

        return redirect()->route('admin.products')->with('success', "Produk {$name} telah dihapus dari sistem.");
    }

    /**
     * Category Management
     */
    public function categories()
    {
        $categories = Category::withCount('products')->get();

        return Inertia::render('Admin/Categories', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store Category
     */
    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:categories,name',
            'description' => 'nullable|string',
        ]);

        Category::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'icon' => 'tag',
            'description' => $validated['description'] ?? null,
        ]);

        Cache::forget('shared.categories');

        return redirect()->route('admin.categories')->with('success', 'Kategori baru berhasil dibuat.');
    }

    /**
     * Delete Category
     */
    public function deleteCategory(Category $category)
    {
        $name = $category->name;
        $category->delete();

        Cache::forget('shared.categories');

        return redirect()->route('admin.categories')->with('success', "Kategori {$name} berhasil dihapus.");
    }

    /**
     * Orders Management
     */
    public function orders(Request $request)
    {
        $query = Order::with('items');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        $orders = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Orders', [
            'orders' => $orders,
        ]);
    }

    /**
     * Update Order Status
     */
    public function updateOrderStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,completed,cancelled',
        ]);

        $order->update(['status' => $validated['status']]);

        return back()->with('success', "Status pesanan #{$order->order_number} diubah menjadi ".strtoupper($validated['status']));
    }

    /**
     * Registered Users List
     */
    public function users(Request $request)
    {
        $query = User::withCount('orders');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        $users = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => $request->only('search'),
        ]);
    }
}
