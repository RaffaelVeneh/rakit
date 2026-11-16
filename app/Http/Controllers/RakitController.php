<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Product;
use App\Services\BuildCompatibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RakitController extends Controller
{
    /**
     * Interactive 3D PC Builder workspace.
     */
    public function index(Request $request, BuildCompatibilityService $compatibility): Response
    {
        $components = Product::query()
            ->with(['category', 'brand'])
            ->whereNotNull('component_type')
            ->orderByDesc('is_featured')
            ->orderBy('price')
            ->get();

        $bySlug = $components->keyBy('slug');

        $initialSlug = (string) ($request->query('part') ?: $request->query('add') ?: '');
        $initialPart = $initialSlug !== '' ? $bySlug->get($initialSlug) : null;

        $presets = $this->buildPresets($bySlug);

        return Inertia::render('Shop/Rakit', [
            'slots' => $compatibility->slots(),
            'components' => $components,
            'presets' => $presets,
            'initialPartId' => $initialPart?->id,
            'initialSlot' => $initialPart?->component_type ?: 'case',
        ]);
    }

    /**
     * Server-side compatibility validation endpoint for builds or single candidate parts.
     */
    public function validateSelection(Request $request, BuildCompatibilityService $compatibility): JsonResponse
    {
        $validated = $request->validate([
            'build' => 'nullable|array',
            'build.*' => 'nullable|integer|exists:products,id',
            'candidate_slot' => 'nullable|string|in:case,motherboard,cpu,ram,gpu,cooler,storage,psu,fan',
            'candidate_id' => 'nullable|integer|exists:products,id',
        ]);

        $buildMap = $validated['build'] ?? [];
        $ids = array_values(array_filter(array_map('intval', $buildMap)));

        if (! empty($validated['candidate_id'])) {
            $ids[] = (int) $validated['candidate_id'];
        }

        $products = Product::query()
            ->whereIn('id', array_unique($ids))
            ->get()
            ->keyBy('id');

        $buildModels = [];
        foreach ($buildMap as $slot => $productId) {
            if ($productId && $products->has((int) $productId)) {
                $buildModels[$slot] = $products->get((int) $productId);
            }
        }

        $candidateCheck = null;
        if (! empty($validated['candidate_slot']) && ! empty($validated['candidate_id'])) {
            $candidate = $products->get((int) $validated['candidate_id']);
            if ($candidate !== null) {
                $candidateCheck = $compatibility->evaluateCandidate(
                    $buildModels,
                    $validated['candidate_slot'],
                    $candidate
                );
            }
        }

        return response()->json([
            'evaluation' => $compatibility->evaluateBuild($buildModels),
            'candidate_check' => $candidateCheck,
        ]);
    }

    /**
     * Add all compatible components in the current build to the authenticated user's cart.
     */
    public function addBuildToCart(Request $request, BuildCompatibilityService $compatibility): RedirectResponse
    {
        $validated = $request->validate([
            'build' => 'required|array|min:1',
            'build.*' => 'nullable|integer|exists:products,id',
        ]);

        $buildInput = array_filter($validated['build'], fn ($id): bool => ! empty($id));

        if ($buildInput === []) {
            return back()->with('error', 'Pilih minimal satu komponen rakitan terlebih dahulu.');
        }

        $products = Product::query()
            ->with('category')
            ->whereIn('id', array_values(array_unique(array_map('intval', $buildInput))))
            ->get()
            ->keyBy('id');

        $buildModels = [];
        foreach ($buildInput as $slot => $productId) {
            $product = $products->get((int) $productId);
            if ($product === null) {
                continue;
            }
            if ($product->component_type !== $slot) {
                return back()->with('error', "Komponen {$product->name} tidak valid untuk slot {$slot}.");
            }
            $buildModels[$slot] = $product;
        }

        $evaluation = $compatibility->evaluateBuild($buildModels);

        if (! $evaluation['compatible']) {
            $firstConflict = $evaluation['conflicts'][0] ?? null;
            $reason = $firstConflict
                ? "Tidak cocok dengan {$firstConflict['name_a']} / {$firstConflict['name_b']} — {$firstConflict['reason']}"
                : 'Masih ada konflik kompatibilitas antar komponen pada rakitan Anda.';

            return back()->with('error', $reason);
        }

        $userId = Auth::id();
        $ip = $request->ip() ?: '127.0.0.1';

        try {
            DB::transaction(function () use ($buildModels, $userId, $ip): void {
                foreach ($buildModels as $product) {
                    $lockedProduct = Product::query()->lockForUpdate()->findOrFail($product->id);

                    $existingLine = Cart::query()
                        ->where('user_id', $userId)
                        ->where('product_id', $lockedProduct->id)
                        ->first();

                    $nextQuantity = ($existingLine ? (int) $existingLine->quantity : 0) + 1;

                    if ($lockedProduct->stock < $nextQuantity) {
                        throw new \RuntimeException(
                            "Stok {$lockedProduct->name} tidak mencukupi (tersisa {$lockedProduct->stock} unit)."
                        );
                    }

                    if ($existingLine !== null) {
                        $existingLine->quantity = $nextQuantity;
                        $existingLine->save();
                    } else {
                        Cart::create([
                            'product_id' => $lockedProduct->id,
                            'user_id' => $userId,
                            'ip_address' => $ip,
                            'quantity' => 1,
                        ]);
                    }
                }
            });
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        $lines = Cart::query()
            ->where('user_id', $userId)
            ->with('product.category')
            ->get();

        $sessionCart = [];
        foreach ($lines as $line) {
            if (! $line->product) {
                continue;
            }
            $sessionCart[$line->product->id] = [
                'id' => $line->product->id,
                'name' => $line->product->name,
                'price' => (float) $line->product->price,
                'quantity' => (int) $line->quantity,
                'image' => $line->product->image,
                'category' => $line->product->category->name ?? '',
            ];
        }
        session()->put('cart', $sessionCart);

        return redirect()
            ->route('shop.cart')
            ->with('success', count($buildModels).' komponen rakitan berhasil dimasukkan ke tas belanja.');
    }

    /**
     * Build curated starter presets using products that actually exist in the database.
     *
     * @param  Collection<string, Product>  $bySlug
     * @return array<int, array{id: string, name: string, tag: string, description: string, slots: array<string, int>}>
     */
    private function buildPresets($bySlug): array
    {
        $definitions = [
            [
                'id' => 'am5-gaming',
                'name' => 'Gaming AM5 DDR5',
                'tag' => 'ATX · 1000W',
                'description' => 'Ryzen 7 7800X3D + RTX 4070 Ti SUPER dalam casing dual-chamber kaca panorama.',
                'slugs' => [
                    'case' => 'lian-li-o11-dynamic-evo-rgb-case',
                    'motherboard' => 'msi-mag-b650-tomahawk-wifi-motherboard',
                    'cpu' => 'amd-ryzen-7-7800x3d-gaming-processor',
                    'ram' => 'kingston-fury-renegade-rgb-ddr5-32gb-6400mhz',
                    'gpu' => 'asus-tuf-gaming-geforce-rtx-4070-ti-super-16gb',
                    'cooler' => 'lian-li-galahad-ii-trinity-sl-inf-360-aio',
                    'storage' => 'western-digital-black-sn850x-2tb-nvme-ssd',
                    'psu' => 'corsair-rm1000x-shift-fully-modular-1000w',
                ],
            ],
            [
                'id' => 'intel-flagship',
                'name' => 'Workstation Z790 Flagship',
                'tag' => 'ATX · 1300W',
                'description' => 'Core i9-14900K + RTX 4090 + 64GB DDR5 untuk rendering & AI lokal berat.',
                'slugs' => [
                    'case' => 'corsair-5000d-airflow-tempered-glass-white',
                    'motherboard' => 'asus-rog-maximus-z790-dark-hero',
                    'cpu' => 'intel-core-i9-14900k-60-ghz-processor',
                    'ram' => 'corsair-dominator-titanium-ddr5-64gb-6600mhz',
                    'gpu' => 'asus-rog-strix-geforce-rtx-4090-24gb',
                    'cooler' => 'asus-rog-ryujin-iii-360-argb-aio-liquid-cooler',
                    'storage' => 'samsung-990-pro-with-heatsink-4tb-nvme',
                    'psu' => 'seasonic-prime-tx-1300-titanium-atx-30',
                ],
            ],
            [
                'id' => 'sff-itx',
                'name' => 'Compact SFF Mini-ITX',
                'tag' => 'ITX · SFX 850W',
                'description' => 'Build mungil 18.2L dengan motherboard B650E-I ITX, AIO 240mm, dan PSU SFX.',
                'slugs' => [
                    'case' => 'cooler-master-nr200p-mini-itx-case',
                    'motherboard' => 'asus-rog-strix-b650e-i-gaming-wifi-mini-itx',
                    'cpu' => 'amd-ryzen-5-7600x-6-core-am5-processor',
                    'ram' => 'team-t-force-delta-rgb-ddr5-32gb-2x16gb-6000mhz',
                    'gpu' => 'asus-dual-geforce-rtx-4060-evo-8gb-gddr6',
                    'cooler' => 'corsair-icue-h100i-rgb-elite-240mm-aio',
                    'storage' => 'western-digital-black-sn770-1tb-nvme-gen4-ssd',
                    'psu' => 'cooler-master-v850-sfx-gold-850w-psu',
                ],
            ],
        ];

        $presets = [];
        foreach ($definitions as $preset) {
            $slots = [];
            foreach ($preset['slugs'] as $slot => $slug) {
                $product = $bySlug->get($slug);
                if ($product !== null) {
                    $slots[$slot] = $product->id;
                }
            }
            if ($slots !== []) {
                $presets[] = [
                    'id' => $preset['id'],
                    'name' => $preset['name'],
                    'tag' => $preset['tag'],
                    'description' => $preset['description'],
                    'slots' => $slots,
                ];
            }
        }

        return $presets;
    }
}
