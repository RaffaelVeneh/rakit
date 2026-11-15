<?php

namespace App\Http\Middleware;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;
use Throwable;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        // The framework's own version is a hash of the built asset manifest. A
        // hardcoded string never changes, so a browser holding the previous SPA
        // had no way to learn that the hashed chunk names it remembered were gone:
        // it kept routing client-side against a manifest that no longer existed
        // and failed on the next navigation. Delegating restores the full reload
        // that a deploy requires.
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $cart = $request->session()->get('cart', []);
        $cartCount = 0;
        foreach ($cart as $item) {
            $cartCount += ($item['quantity'] ?? 1);
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_admin' => $user->isAdmin(),
                ] : null,
            ],
            // A plain array, never the Eloquent collection itself. The cache store
            // is the database, so a cached value is serialised and read back by a
            // later — possibly differently-booted — process. Caching the object
            // works until it does not: it comes back as an
            // `__PHP_Incomplete_Class`, and every page that maps over `categories`
            // dies on `.map is not a function`. Plain data has no class to lose.
            'categories' => Cache::remember(
                'shared.categories',
                now()->addMinutes(10),
                fn (): array => Category::all(['id', 'name', 'slug', 'icon'])->toArray(),
            ),
            'cartCount' => $cartCount,
            'cart' => $cart,
            'system' => $this->systemFacts(),
            // The colophon prints how many positions the register holds. Sharing
            // the real figure keeps every surface from printing a stale zero when
            // it does not fetch the catalogue itself.
            'registerPositions' => Cache::remember(
                'register.positions',
                now()->addMinutes(10),
                fn (): int => Product::count(),
            ),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                // Structured result data that belongs to the flash lifetime:
                // the ISS expert system's verdict, read by the module sheet.
                'diagnosis' => $request->session()->get('diagnosis'),
            ],
        ];
    }

    /**
     * Facts about the running stack, read from the running stack.
     *
     * The console prints these in its record strip. They are measured rather than
     * asserted, and cached for an hour so the strip does not cost a query per
     * request. A failure here degrades the strip, never the page.
     *
     * @return array{php: string, laravel: string, database: ?string, environment: string}
     */
    private function systemFacts(): array
    {
        $facts = Cache::remember('system.facts', now()->addHour(), function (): array {
            $database = null;

            try {
                $database = DB::selectOne('select version() as version')->version ?? null;
            } catch (Throwable) {
                $database = null;
            }

            return [
                'php' => PHP_VERSION,
                'laravel' => app()->version(),
                'database' => $database,
            ];
        });

        return [
            ...$facts,
            'environment' => app()->environment(),
        ];
    }
}
