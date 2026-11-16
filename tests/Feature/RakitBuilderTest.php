<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RakitBuilderTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    private Brand $brand;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::create([
            'name' => 'Hardware & Komponen PC',
            'slug' => 'hardware-pc',
            'icon' => 'cpu',
            'description' => 'Komponen rakitan PC.',
        ]);

        $this->brand = Brand::create([
            'name' => 'RAKIT Lab',
            'slug' => 'rakit-lab',
            'tagline' => 'Test Fixture Brand',
        ]);
    }

    /**
     * Create a fixture PC component product with explicit specs and stock.
     *
     * @param  array<string, mixed>  $specs
     */
    private function makePart(
        string $slot,
        string $name,
        string $slug,
        array $specs,
        float $price = 1_500_000,
        int $stock = 5
    ): Product {
        return Product::create([
            'category_id' => $this->category->id,
            'brand_id' => $this->brand->id,
            'component_type' => $slot,
            'name' => $name,
            'slug' => $slug,
            'description' => "Komponen uji {$name}.",
            'specs' => $specs,
            'price' => $price,
            'stock' => $stock,
            'image' => null,
            'is_featured' => false,
        ]);
    }

    /**
     * Seed a canonical compatible AM5 ATX DDR5 8-part rig for reuse across tests.
     *
     * @return array<string, Product>
     */
    private function makeCompatibleAm5Rig(int $stock = 5): array
    {
        return [
            'case' => $this->makePart('case', 'Lian Li O11 Dynamic EVO', 'lian-li-o11-dynamic-evo-rgb-case', [
                'supported_form_factors' => ['ATX', 'Micro-ATX', 'Mini-ITX'],
                'max_gpu_length_mm' => 420,
                'max_radiator_mm' => 360,
                'max_cooler_height_mm' => 167,
                'drive_bays_35' => 2,
                'psu_form_factors' => ['ATX'],
            ], 2_899_000, $stock),
            'motherboard' => $this->makePart('motherboard', 'MSI MAG B650 Tomahawk WiFi', 'msi-mag-b650-tomahawk-wifi-motherboard', [
                'socket' => 'AM5',
                'form_factor' => 'ATX',
                'memory_type' => 'DDR5',
                'memory_slots' => 4,
                'max_memory_gb' => 192,
                'm2_slots' => 3,
                'tdp_w' => 50,
            ], 3_699_000, $stock),
            'cpu' => $this->makePart('cpu', 'AMD Ryzen 7 7800X3D', 'amd-ryzen-7-7800x3d-gaming-processor', [
                'socket' => 'AM5',
                'supported_memory' => ['DDR5'],
                'tdp_w' => 120,
                'cores' => '8C/16T',
            ], 6_499_000, $stock),
            'ram' => $this->makePart('ram', 'Kingston FURY DDR5 32GB', 'kingston-fury-renegade-rgb-ddr5-32gb-6400mhz', [
                'memory_type' => 'DDR5',
                'modules' => 2,
                'capacity_gb' => 32,
                'speed_mhz' => 6400,
                'tdp_w' => 10,
            ], 2_199_000, $stock),
            'gpu' => $this->makePart('gpu', 'ASUS TUF RTX 4070 Ti SUPER', 'asus-tuf-gaming-geforce-rtx-4070-ti-super-16gb', [
                'length_mm' => 305,
                'slots' => 3.25,
                'vram_gb' => 16,
                'tdp_w' => 285,
                'recommended_psu_w' => 750,
            ], 14_299_000, $stock),
            'cooler' => $this->makePart('cooler', 'NZXT Kraken Elite 360 AIO', 'nzxt-kraken-elite-360-rgb-aio-cooler', [
                'cooler_type' => 'AIO',
                'radiator_mm' => 360,
                'supported_sockets' => ['AM5', 'AM4', 'LGA1700'],
                'tdp_w' => 15,
            ], 4_599_000, $stock),
            'storage' => $this->makePart('storage', 'WD Black SN850X 2TB', 'western-digital-black-sn850x-2tb-nvme-ssd', [
                'interface' => 'M.2 NVMe',
                'pcie_gen' => 'PCIe 4.0',
                'capacity_gb' => 2000,
                'tdp_w' => 8,
            ], 2_499_000, $stock),
            'psu' => $this->makePart('psu', 'Corsair RM1000x Shift 1000W', 'corsair-rm1000x-shift-fully-modular-1000w', [
                'wattage_w' => 1000,
                'form_factor' => 'ATX',
                'efficiency' => '80+ Gold',
                'modular' => 'Full Modular',
            ], 3_199_000, $stock),
        ];
    }

    public function test_rakit_page_renders_with_slots_components_and_initial_part(): void
    {
        $rig = $this->makeCompatibleAm5Rig();
        $cpu = $rig['cpu'];

        $response = $this->get(route('rakit.index', ['part' => $cpu->slug]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Shop/Rakit')
            ->has('slots', 9)
            ->has('components', 8)
            ->where('initialPartId', $cpu->id)
            ->where('initialSlot', 'cpu')
            ->has('presets')
        );
    }

    public function test_validate_endpoint_rejects_cpu_socket_and_memory_mismatches(): void
    {
        $rig = $this->makeCompatibleAm5Rig();

        $intelCpu = $this->makePart('cpu', 'Intel Core i9-14900K', 'intel-i9-14900k-test', [
            'socket' => 'LGA1700',
            'supported_memory' => ['DDR4', 'DDR5'],
            'tdp_w' => 253,
        ]);

        $ddr4Ram = $this->makePart('ram', 'Corsair Vengeance DDR4 32GB', 'corsair-ddr4-32gb-test', [
            'memory_type' => 'DDR4',
            'modules' => 2,
            'capacity_gb' => 32,
            'speed_mhz' => 3600,
            'tdp_w' => 8,
        ]);

        $quadRam = $this->makePart('ram', 'Quad Kit DDR5 128GB', 'quad-ddr5-test', [
            'memory_type' => 'DDR5',
            'modules' => 4,
            'capacity_gb' => 128,
            'tdp_w' => 16,
        ]);

        $itxMobo = $this->makePart('motherboard', 'ASUS ROG B650E-I ITX', 'b650e-i-itx-test', [
            'socket' => 'AM5',
            'form_factor' => 'Mini-ITX',
            'memory_type' => 'DDR5',
            'memory_slots' => 2,
            'max_memory_gb' => 96,
            'm2_slots' => 0,
            'tdp_w' => 45,
        ]);

        // 1. LGA1700 CPU onto AM5 Motherboard -> cpu_socket error
        $resSocket = $this->postJson(route('rakit.validate'), [
            'build' => ['motherboard' => $rig['motherboard']->id],
            'candidate_slot' => 'cpu',
            'candidate_id' => $intelCpu->id,
        ]);
        $resSocket->assertOk()
            ->assertJsonPath('candidate_check.compatible', false)
            ->assertJsonPath('candidate_check.conflicts.0.rule', 'cpu_socket');
        $this->assertStringContainsString(
            'Tidak cocok dengan Motherboard MSI MAG B650 Tomahawk WiFi yang Anda pilih',
            (string) $resSocket->json('candidate_check.headline')
        );

        // 2. DDR4 RAM onto DDR5 Motherboard -> ram_type error
        $resRamMobo = $this->postJson(route('rakit.validate'), [
            'build' => ['motherboard' => $rig['motherboard']->id],
            'candidate_slot' => 'ram',
            'candidate_id' => $ddr4Ram->id,
        ]);
        $resRamMobo->assertOk()
            ->assertJsonPath('candidate_check.compatible', false)
            ->assertJsonPath('candidate_check.conflicts.0.rule', 'ram_type');
        $this->assertStringContainsString(
            'Tidak cocok dengan Motherboard',
            (string) $resRamMobo->json('candidate_check.headline')
        );

        // 3. DDR4 RAM paired with DDR5-only AM5 CPU -> cpu_ram_type error
        $resRamCpu = $this->postJson(route('rakit.validate'), [
            'build' => ['cpu' => $rig['cpu']->id],
            'candidate_slot' => 'ram',
            'candidate_id' => $ddr4Ram->id,
        ]);
        $resRamCpu->assertOk()
            ->assertJsonPath('candidate_check.compatible', false)
            ->assertJsonPath('candidate_check.conflicts.0.rule', 'cpu_ram_type');
        $this->assertStringContainsString(
            'Tidak cocok dengan Prosesor AMD Ryzen 7 7800X3D yang Anda pilih',
            (string) $resRamCpu->json('candidate_check.headline')
        );

        // 4. 4-module RAM kit onto 2-DIMM Mini-ITX motherboard -> ram_slots
        $resRamSlots = $this->postJson(route('rakit.validate'), [
            'build' => ['motherboard' => $itxMobo->id],
            'candidate_slot' => 'ram',
            'candidate_id' => $quadRam->id,
        ]);
        $resRamSlots->assertOk()
            ->assertJsonPath('candidate_check.compatible', false)
            ->assertJsonPath('candidate_check.conflicts.0.rule', 'ram_slots');

        // 5. Wrong slot candidate rejected cleanly
        $wrongSlot = $this->postJson(route('rakit.validate'), [
            'build' => [],
            'candidate_slot' => 'cpu',
            'candidate_id' => $rig['gpu']->id,
        ]);
        $wrongSlot->assertOk()
            ->assertJsonPath('candidate_check.compatible', false)
            ->assertJsonPath('candidate_check.conflicts.0.rule', 'slot_type');
    }

    public function test_validate_endpoint_rejects_clearance_storage_psu_and_cooler_conflicts(): void
    {
        $rig = $this->makeCompatibleAm5Rig();

        $itxCase = $this->makePart('case', 'Cooler Master NR200P', 'nr200p-test', [
            'supported_form_factors' => ['Mini-ITX'],
            'max_gpu_length_mm' => 330,
            'max_radiator_mm' => 240,
            'max_cooler_height_mm' => 155,
            'drive_bays_35' => 0,
            'psu_form_factors' => ['SFX'],
        ]);

        $northCase = $this->makePart('case', 'Fractal Design North', 'fractal-north-test', [
            'supported_form_factors' => ['ATX', 'Micro-ATX', 'Mini-ITX'],
            'max_gpu_length_mm' => 355,
            'max_radiator_mm' => 360,
            'max_cooler_height_mm' => 170,
            'drive_bays_35' => 2,
            'psu_form_factors' => ['ATX'],
        ]);

        $rtx4090 = $this->makePart('gpu', 'ASUS ROG Strix RTX 4090', 'strix-4090-test', [
            'length_mm' => 358,
            'slots' => 3.5,
            'vram_gb' => 24,
            'tdp_w' => 450,
            'recommended_psu_w' => 850,
        ]);

        $tallAirCooler = $this->makePart('cooler', 'DeepCool Assassin IV 164mm', 'assassin-iv-test', [
            'cooler_type' => 'Air',
            'height_mm' => 164,
            'supported_sockets' => ['LGA1700'],
            'tdp_w' => 10,
        ]);

        $sataHdd = $this->makePart('storage', 'Seagate IronWolf 4TB HDD', 'hdd-35-test', [
            'interface' => 'SATA 3.5"',
            'capacity_gb' => 4000,
            'tdp_w' => 8,
        ]);

        $psu650 = $this->makePart('psu', 'Cooler Master MWE 650W', 'mwe-650-test', [
            'wattage_w' => 650,
            'form_factor' => 'ATX',
        ]);

        // ATX Motherboard vs Mini-ITX Case -> case_form_factor
        $this->postJson(route('rakit.validate'), [
            'build' => ['case' => $itxCase->id],
            'candidate_slot' => 'motherboard',
            'candidate_id' => $rig['motherboard']->id,
        ])->assertJsonPath('candidate_check.compatible', false)
            ->assertJsonPath('candidate_check.conflicts.0.rule', 'case_form_factor');

        // RTX 4090 (358 mm) vs Fractal North (355 mm) -> gpu_clearance
        $resGpu = $this->postJson(route('rakit.validate'), [
            'build' => ['case' => $northCase->id],
            'candidate_slot' => 'gpu',
            'candidate_id' => $rtx4090->id,
        ]);
        $resGpu->assertJsonPath('candidate_check.compatible', false)
            ->assertJsonPath('candidate_check.conflicts.0.rule', 'gpu_clearance');
        $this->assertStringContainsString(
            'Tidak cocok dengan Casing Fractal Design North yang Anda pilih',
            (string) $resGpu->json('candidate_check.headline')
        );

        // 360mm AIO vs 240mm Case -> cooler_radiator
        $this->postJson(route('rakit.validate'), [
            'build' => ['case' => $itxCase->id],
            'candidate_slot' => 'cooler',
            'candidate_id' => $rig['cooler']->id,
        ])->assertJsonPath('candidate_check.compatible', false)
            ->assertJsonPath('candidate_check.conflicts.0.rule', 'cooler_radiator');

        // 164mm LGA1700-only Air Cooler vs AM5 CPU & 155mm Case -> cooler_socket + cooler_height
        $resAir = $this->postJson(route('rakit.validate'), [
            'build' => ['case' => $itxCase->id, 'cpu' => $rig['cpu']->id],
            'candidate_slot' => 'cooler',
            'candidate_id' => $tallAirCooler->id,
        ]);
        $resAir->assertJsonPath('candidate_check.compatible', false);
        $rules = array_column((array) $resAir->json('candidate_check.conflicts'), 'rule');
        $this->assertContains('cooler_socket', $rules);
        $this->assertContains('cooler_height', $rules);

        // 3.5" SATA HDD vs 0-bay ITX Case -> storage_bay
        $this->postJson(route('rakit.validate'), [
            'build' => ['case' => $itxCase->id],
            'candidate_slot' => 'storage',
            'candidate_id' => $sataHdd->id,
        ])->assertJsonPath('candidate_check.compatible', false)
            ->assertJsonPath('candidate_check.conflicts.0.rule', 'storage_bay');

        // ATX PSU vs SFX ITX Case -> psu_form_factor
        $this->postJson(route('rakit.validate'), [
            'build' => ['case' => $itxCase->id],
            'candidate_slot' => 'psu',
            'candidate_id' => $rig['psu']->id,
        ])->assertJsonPath('candidate_check.compatible', false)
            ->assertJsonPath('candidate_check.conflicts.0.rule', 'psu_form_factor');

        // 650W PSU vs RTX 4090 (850W rec) -> psu_gpu_wattage
        $resPsuW = $this->postJson(route('rakit.validate'), [
            'build' => ['gpu' => $rtx4090->id],
            'candidate_slot' => 'psu',
            'candidate_id' => $psu650->id,
        ]);
        $resPsuW->assertJsonPath('candidate_check.compatible', false)
            ->assertJsonPath('candidate_check.conflicts.0.rule', 'psu_gpu_wattage');
        $this->assertStringContainsString(
            'Tidak cocok dengan Kartu Grafis ASUS ROG Strix RTX 4090 yang Anda pilih',
            (string) $resPsuW->json('candidate_check.headline')
        );
    }

    public function test_validate_endpoint_approves_complete_compatible_build(): void
    {
        $rig = $this->makeCompatibleAm5Rig();
        $buildPayload = collect($rig)->map(fn (Product $part): int => $part->id)->all();

        $response = $this->postJson(route('rakit.validate'), [
            'build' => $buildPayload,
        ]);

        $response->assertOk()
            ->assertJsonPath('evaluation.compatible', true)
            ->assertJsonPath('evaluation.complete', true)
            ->assertJsonPath('evaluation.ready', true)
            ->assertJsonPath('evaluation.installed_count', 8)
            ->assertJsonPath('evaluation.required_count', 8)
            ->assertJsonCount(0, 'evaluation.conflicts');

        $this->assertGreaterThan(400, (int) $response->json('evaluation.total_wattage_w'));
    }

    public function test_add_build_to_cart_requires_authentication(): void
    {
        $rig = $this->makeCompatibleAm5Rig();

        $this->post(route('rakit.cart'), [
            'build' => ['cpu' => $rig['cpu']->id],
        ])->assertRedirect(route('login'));

        $this->assertSame(0, Cart::count());
    }

    public function test_add_build_to_cart_blocks_incompatible_and_out_of_stock_builds(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $rig = $this->makeCompatibleAm5Rig(stock: 5);

        $intelCpu = $this->makePart('cpu', 'Intel Core i5-14600K', 'i5-14600k-test', [
            'socket' => 'LGA1700',
            'supported_memory' => ['DDR4', 'DDR5'],
            'tdp_w' => 181,
        ]);

        // 1. Incompatible motherboard + CPU is rejected with exact error
        $mismatch = $this->actingAs($user)->post(route('rakit.cart'), [
            'build' => [
                'motherboard' => $rig['motherboard']->id,
                'cpu' => $intelCpu->id,
            ],
        ]);
        $mismatch->assertRedirect();
        $mismatch->assertSessionHas('error');
        $this->assertStringContainsString('Tidak cocok dengan', (string) session('error'));
        $this->assertSame(0, Cart::count());

        // 2. Build containing an out-of-stock part rolls back cleanly (0 cart lines inserted)
        $rig['gpu']->update(['stock' => 0]);

        $noStock = $this->actingAs($user)->post(route('rakit.cart'), [
            'build' => collect($rig)->map(fn (Product $part): int => $part->id)->all(),
        ]);
        $noStock->assertRedirect();
        $noStock->assertSessionHas('error');
        $this->assertStringContainsString('tidak mencukupi', (string) session('error'));
        $this->assertSame(0, Cart::count());
    }

    public function test_add_build_to_cart_inserts_all_compatible_components_atomically(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $rig = $this->makeCompatibleAm5Rig(stock: 4);
        $buildPayload = collect($rig)->map(fn (Product $part): int => $part->id)->all();

        $response = $this->actingAs($user)->post(route('rakit.cart'), [
            'build' => $buildPayload,
        ]);

        $response->assertRedirect(route('shop.cart'));
        $response->assertSessionHas('success');
        $this->assertStringContainsString('8 komponen rakitan', (string) session('success'));

        $this->assertSame(8, Cart::where('user_id', $user->id)->count());
        $this->assertCount(8, (array) session('cart'));

        foreach ($rig as $part) {
            $this->assertDatabaseHas('cart', [
                'user_id' => $user->id,
                'product_id' => $part->id,
                'quantity' => 1,
            ]);
        }
    }
}
