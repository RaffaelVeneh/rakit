<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class PcBuilderSeeder extends Seeder
{
    /**
     * Populate structured PC component types and compatibility specs on existing
     * hardware products, plus complementary parts for full cross-platform testing.
     */
    public function run(): void
    {
        $category = Category::firstOrCreate(
            ['slug' => 'hardware-pc'],
            [
                'name' => 'Hardware & Komponen PC',
                'icon' => 'cpu',
                'description' => 'CPU Processor 6.0 GHz, RAM DDR5, Storage NVMe Gen4/Gen5, PSU Titanium, dan kartu grafis GPU RTX.',
            ]
        );

        $brandIds = $this->ensureBrands();

        // 1. Tag all existing 36 hardware-pc products by slug with component_type + specs
        foreach ($this->existingSpecsBySlug() as $slug => $meta) {
            Product::query()
                ->where('slug', $slug)
                ->update([
                    'component_type' => $meta['component_type'],
                    'specs' => json_encode($meta['specs']),
                ]);
        }

        // 2. Ensure complementary PC components exist for DDR4, AM4, Micro-ATX, Mini-ITX, SFX & 650W scenarios
        foreach ($this->additionalParts() as $part) {
            $brandId = $brandIds[$part['brand_slug']] ?? null;

            Product::updateOrCreate(
                ['slug' => $part['slug']],
                [
                    'category_id' => $category->id,
                    'brand_id' => $brandId,
                    'component_type' => $part['component_type'],
                    'name' => $part['name'],
                    'description' => $part['description'],
                    'specs' => $part['specs'],
                    'price' => $part['price'],
                    'stock' => $part['stock'],
                    'image' => $part['image'],
                    'is_featured' => $part['is_featured'],
                ]
            );
        }
    }

    /**
     * @return array<string, int>
     */
    private function ensureBrands(): array
    {
        $brands = [
            'asus-rog' => 'ASUS ROG',
            'msi-gaming' => 'MSI Gaming',
            'intel' => 'Intel',
            'amd' => 'AMD',
            'corsair' => 'Corsair',
            'gskill' => 'G.Skill',
            'cooler-master' => 'Cooler Master',
        ];

        $ids = [];

        foreach ($brands as $slug => $name) {
            $brand = Brand::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'description' => "Komponen resmi {$name} untuk rakitan PC performa tinggi.",
                ]
            );
            $ids[$slug] = $brand->id;
        }

        return $ids;
    }

    /**
     * @return array<string, array{component_type: string, specs: array<string, mixed>}>
     */
    private function existingSpecsBySlug(): array
    {
        return [
            // CPUs
            'intel-core-i9-14900k-60-ghz-processor' => [
                'component_type' => 'cpu',
                'specs' => [
                    'socket' => 'LGA1700',
                    'supported_memory' => ['DDR5', 'DDR4'],
                    'tdp_w' => 253,
                    'base_tdp_w' => 125,
                    'cores' => '24 Core (8P+16E)',
                    'boost_clock' => '6.0 GHz',
                    'architecture' => 'Raptor Lake Refresh',
                ],
            ],
            'intel-core-i7-14700k-20-core-processor' => [
                'component_type' => 'cpu',
                'specs' => [
                    'socket' => 'LGA1700',
                    'supported_memory' => ['DDR5', 'DDR4'],
                    'tdp_w' => 253,
                    'base_tdp_w' => 125,
                    'cores' => '20 Core (8P+12E)',
                    'boost_clock' => '5.6 GHz',
                    'architecture' => 'Raptor Lake Refresh',
                ],
            ],
            'intel-core-i5-14600k-14-core-processor' => [
                'component_type' => 'cpu',
                'specs' => [
                    'socket' => 'LGA1700',
                    'supported_memory' => ['DDR5', 'DDR4'],
                    'tdp_w' => 181,
                    'base_tdp_w' => 125,
                    'cores' => '14 Core (6P+8E)',
                    'boost_clock' => '5.3 GHz',
                    'architecture' => 'Raptor Lake Refresh',
                ],
            ],
            'amd-ryzen-9-7950x3d-desktop-processor' => [
                'component_type' => 'cpu',
                'specs' => [
                    'socket' => 'AM5',
                    'supported_memory' => ['DDR5'],
                    'tdp_w' => 120,
                    'base_tdp_w' => 120,
                    'cores' => '16 Core / 32 Thread',
                    'boost_clock' => '5.7 GHz',
                    'architecture' => 'Zen 4 3D V-Cache',
                ],
            ],
            'amd-ryzen-7-7800x3d-gaming-processor' => [
                'component_type' => 'cpu',
                'specs' => [
                    'socket' => 'AM5',
                    'supported_memory' => ['DDR5'],
                    'tdp_w' => 120,
                    'base_tdp_w' => 120,
                    'cores' => '8 Core / 16 Thread',
                    'boost_clock' => '5.0 GHz',
                    'architecture' => 'Zen 4 3D V-Cache',
                ],
            ],
            'amd-ryzen-5-7600x-6-core-am5-processor' => [
                'component_type' => 'cpu',
                'specs' => [
                    'socket' => 'AM5',
                    'supported_memory' => ['DDR5'],
                    'tdp_w' => 105,
                    'base_tdp_w' => 105,
                    'cores' => '6 Core / 12 Thread',
                    'boost_clock' => '5.3 GHz',
                    'architecture' => 'Zen 4',
                ],
            ],

            // Motherboards
            'asus-rog-maximus-z790-dark-hero' => [
                'component_type' => 'motherboard',
                'specs' => [
                    'socket' => 'LGA1700',
                    'chipset' => 'Z790',
                    'form_factor' => 'ATX',
                    'memory_type' => 'DDR5',
                    'memory_slots' => 4,
                    'max_memory_gb' => 192,
                    'm2_slots' => 5,
                    'sata_ports' => 4,
                    'tdp_w' => 55,
                ],
            ],
            'msi-mag-b650-tomahawk-wifi-motherboard' => [
                'component_type' => 'motherboard',
                'specs' => [
                    'socket' => 'AM5',
                    'chipset' => 'B650',
                    'form_factor' => 'ATX',
                    'memory_type' => 'DDR5',
                    'memory_slots' => 4,
                    'max_memory_gb' => 256,
                    'm2_slots' => 3,
                    'sata_ports' => 6,
                    'tdp_w' => 45,
                ],
            ],
            'gigabyte-z790-aorus-elite-ax-motherboard' => [
                'component_type' => 'motherboard',
                'specs' => [
                    'socket' => 'LGA1700',
                    'chipset' => 'Z790',
                    'form_factor' => 'ATX',
                    'memory_type' => 'DDR5',
                    'memory_slots' => 4,
                    'max_memory_gb' => 192,
                    'm2_slots' => 4,
                    'sata_ports' => 6,
                    'tdp_w' => 50,
                ],
            ],

            // RAM
            'corsair-dominator-titanium-ddr5-64gb-6600mhz' => [
                'component_type' => 'ram',
                'specs' => [
                    'memory_type' => 'DDR5',
                    'capacity_gb' => 64,
                    'modules' => 2,
                    'speed_mhz' => 6600,
                    'tdp_w' => 12,
                ],
            ],
            'kingston-fury-renegade-rgb-ddr5-32gb-6400mhz' => [
                'component_type' => 'ram',
                'specs' => [
                    'memory_type' => 'DDR5',
                    'capacity_gb' => 32,
                    'modules' => 2,
                    'speed_mhz' => 6400,
                    'tdp_w' => 10,
                ],
            ],
            'gskill-trident-z5-rgb-ddr5-64gb-2x32gb-6400mhz' => [
                'component_type' => 'ram',
                'specs' => [
                    'memory_type' => 'DDR5',
                    'capacity_gb' => 64,
                    'modules' => 2,
                    'speed_mhz' => 6400,
                    'tdp_w' => 12,
                ],
            ],
            'team-t-force-delta-rgb-ddr5-32gb-2x16gb-6000mhz' => [
                'component_type' => 'ram',
                'specs' => [
                    'memory_type' => 'DDR5',
                    'capacity_gb' => 32,
                    'modules' => 2,
                    'speed_mhz' => 6000,
                    'tdp_w' => 10,
                ],
            ],

            // GPUs
            'asus-rog-strix-geforce-rtx-4090-24gb' => [
                'component_type' => 'gpu',
                'specs' => [
                    'chipset' => 'RTX 4090',
                    'vram_gb' => 24,
                    'length_mm' => 358,
                    'slots' => 3.5,
                    'tdp_w' => 450,
                    'recommended_psu_w' => 1000,
                ],
            ],
            'sapphire-nitro-radeon-rx-7900-xtx-24gb' => [
                'component_type' => 'gpu',
                'specs' => [
                    'chipset' => 'RX 7900 XTX',
                    'vram_gb' => 24,
                    'length_mm' => 320,
                    'slots' => 3.5,
                    'tdp_w' => 355,
                    'recommended_psu_w' => 850,
                ],
            ],
            'msi-geforce-rtx-4080-super-16gb-gaming-x-trio' => [
                'component_type' => 'gpu',
                'specs' => [
                    'chipset' => 'RTX 4080 SUPER',
                    'vram_gb' => 16,
                    'length_mm' => 337,
                    'slots' => 3.2,
                    'tdp_w' => 320,
                    'recommended_psu_w' => 850,
                ],
            ],
            'asus-tuf-gaming-geforce-rtx-4070-ti-super-16gb' => [
                'component_type' => 'gpu',
                'specs' => [
                    'chipset' => 'RTX 4070 Ti SUPER',
                    'vram_gb' => 16,
                    'length_mm' => 305,
                    'slots' => 3.25,
                    'tdp_w' => 285,
                    'recommended_psu_w' => 750,
                ],
            ],
            'asus-dual-geforce-rtx-4060-evo-8gb-gddr6' => [
                'component_type' => 'gpu',
                'specs' => [
                    'chipset' => 'RTX 4060',
                    'vram_gb' => 8,
                    'length_mm' => 227,
                    'slots' => 2.5,
                    'tdp_w' => 115,
                    'recommended_psu_w' => 550,
                ],
            ],

            // Storage
            'samsung-990-pro-with-heatsink-4tb-nvme' => [
                'component_type' => 'storage',
                'specs' => [
                    'interface' => 'M.2 NVMe',
                    'pcie_gen' => 'PCIe 4.0',
                    'capacity_gb' => 4000,
                    'tdp_w' => 8,
                ],
            ],
            'western-digital-black-sn850x-2tb-nvme-ssd' => [
                'component_type' => 'storage',
                'specs' => [
                    'interface' => 'M.2 NVMe',
                    'pcie_gen' => 'PCIe 4.0',
                    'capacity_gb' => 2000,
                    'tdp_w' => 8,
                ],
            ],
            'crucial-t700-gen5-nvme-ssd-2tb-with-heatsink' => [
                'component_type' => 'storage',
                'specs' => [
                    'interface' => 'M.2 NVMe',
                    'pcie_gen' => 'PCIe 5.0',
                    'capacity_gb' => 2000,
                    'tdp_w' => 12,
                ],
            ],
            'western-digital-black-sn770-1tb-nvme-gen4-ssd' => [
                'component_type' => 'storage',
                'specs' => [
                    'interface' => 'M.2 NVMe',
                    'pcie_gen' => 'PCIe 4.0',
                    'capacity_gb' => 1000,
                    'tdp_w' => 6,
                ],
            ],
            'seagate-ironwolf-pro-8tb-nas-hard-drive' => [
                'component_type' => 'storage',
                'specs' => [
                    'interface' => 'SATA 3.5"',
                    'pcie_gen' => 'SATA III',
                    'capacity_gb' => 8000,
                    'tdp_w' => 10,
                ],
            ],

            // Coolers
            'nzxt-kraken-elite-360-rgb-aio-cooler' => [
                'component_type' => 'cooler',
                'specs' => [
                    'cooler_type' => 'AIO',
                    'radiator_mm' => 360,
                    'height_mm' => 56,
                    'supported_sockets' => ['LGA1700', 'AM5', 'AM4'],
                    'tdp_w' => 18,
                ],
            ],
            'noctua-nh-d15-chromaxblack-cpu-cooler' => [
                'component_type' => 'cooler',
                'specs' => [
                    'cooler_type' => 'Air',
                    'radiator_mm' => null,
                    'height_mm' => 165,
                    'supported_sockets' => ['LGA1700', 'AM5', 'AM4'],
                    'tdp_w' => 6,
                ],
            ],
            'lian-li-galahad-ii-trinity-sl-inf-360-aio' => [
                'component_type' => 'cooler',
                'specs' => [
                    'cooler_type' => 'AIO',
                    'radiator_mm' => 360,
                    'height_mm' => 58,
                    'supported_sockets' => ['LGA1700', 'AM5', 'AM4'],
                    'tdp_w' => 18,
                ],
            ],
            'thermalright-peerless-assassin-120-se-cooler' => [
                'component_type' => 'cooler',
                'specs' => [
                    'cooler_type' => 'Air',
                    'radiator_mm' => null,
                    'height_mm' => 155,
                    'supported_sockets' => ['LGA1700', 'AM5', 'AM4'],
                    'tdp_w' => 5,
                ],
            ],
            'arctic-liquid-freezer-iii-360-a-rgb-cooler' => [
                'component_type' => 'cooler',
                'specs' => [
                    'cooler_type' => 'AIO',
                    'radiator_mm' => 360,
                    'height_mm' => 68,
                    'supported_sockets' => ['LGA1700', 'AM5', 'AM4'],
                    'tdp_w' => 16,
                ],
            ],
            'asus-rog-ryujin-iii-360-argb-aio-liquid-cooler' => [
                'component_type' => 'cooler',
                'specs' => [
                    'cooler_type' => 'AIO',
                    'radiator_mm' => 360,
                    'height_mm' => 62,
                    'supported_sockets' => ['LGA1700', 'AM5', 'AM4'],
                    'tdp_w' => 20,
                ],
            ],

            // Cases
            'lian-li-o11-dynamic-evo-rgb-case' => [
                'component_type' => 'case',
                'specs' => [
                    'case_class' => 'Dual-Chamber ATX',
                    'supported_form_factors' => ['ATX', 'Micro-ATX', 'Mini-ITX'],
                    'max_gpu_length_mm' => 426,
                    'max_cooler_height_mm' => 167,
                    'max_radiator_mm' => 360,
                    'psu_form_factors' => ['ATX'],
                    'drive_bays_35' => 2,
                ],
            ],
            'fractal-design-north-charcoal-black-mesh-case' => [
                'component_type' => 'case',
                'specs' => [
                    'case_class' => 'Mid-Tower ATX',
                    'supported_form_factors' => ['ATX', 'Micro-ATX', 'Mini-ITX'],
                    'max_gpu_length_mm' => 355,
                    'max_cooler_height_mm' => 170,
                    'max_radiator_mm' => 240,
                    'psu_form_factors' => ['ATX'],
                    'drive_bays_35' => 2,
                ],
            ],
            'corsair-5000d-airflow-tempered-glass-white' => [
                'component_type' => 'case',
                'specs' => [
                    'case_class' => 'Mid-Tower ATX',
                    'supported_form_factors' => ['ATX', 'Micro-ATX', 'Mini-ITX'],
                    'max_gpu_length_mm' => 400,
                    'max_cooler_height_mm' => 170,
                    'max_radiator_mm' => 360,
                    'psu_form_factors' => ['ATX'],
                    'drive_bays_35' => 2,
                ],
            ],
            'nzxt-h9-flow-dual-chamber-mid-tower-case' => [
                'component_type' => 'case',
                'specs' => [
                    'case_class' => 'Dual-Chamber ATX',
                    'supported_form_factors' => ['ATX', 'Micro-ATX', 'Mini-ITX'],
                    'max_gpu_length_mm' => 435,
                    'max_cooler_height_mm' => 165,
                    'max_radiator_mm' => 360,
                    'psu_form_factors' => ['ATX'],
                    'drive_bays_35' => 2,
                ],
            ],

            // PSUs
            'seasonic-prime-tx-1300-titanium-atx-30' => [
                'component_type' => 'psu',
                'specs' => [
                    'wattage_w' => 1300,
                    'form_factor' => 'ATX',
                    'efficiency' => '80+ Titanium',
                    'modular' => 'Fully Modular',
                ],
            ],
            'corsair-rm1000x-shift-fully-modular-1000w' => [
                'component_type' => 'psu',
                'specs' => [
                    'wattage_w' => 1000,
                    'form_factor' => 'ATX',
                    'efficiency' => '80+ Gold',
                    'modular' => 'Fully Modular',
                ],
            ],
            'be-quiet-dark-power-pro-13-1300w-titanium' => [
                'component_type' => 'psu',
                'specs' => [
                    'wattage_w' => 1300,
                    'form_factor' => 'ATX',
                    'efficiency' => '80+ Titanium',
                    'modular' => 'Fully Modular',
                ],
            ],

            // Fans
            'lian-li-uni-fan-tl-lcd-120-reverse-blade-3-pack' => [
                'component_type' => 'fan',
                'specs' => [
                    'fan_size_mm' => 120,
                    'pack_qty' => 3,
                    'tdp_w' => 10,
                ],
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function additionalParts(): array
    {
        return [
            [
                'slug' => 'amd-ryzen-7-5800x3d-am4-gaming-processor',
                'brand_slug' => 'amd',
                'component_type' => 'cpu',
                'name' => 'AMD Ryzen 7 5800X3D AM4 Gaming Processor',
                'price' => 4850000,
                'stock' => 16,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
                'description' => '8 Core, 16 Thread, 96MB L3 3D V-Cache, soket AM4 khusus memori DDR4 dengan efisiensi gaming maksimal.',
                'specs' => [
                    'socket' => 'AM4',
                    'supported_memory' => ['DDR4'],
                    'tdp_w' => 105,
                    'base_tdp_w' => 105,
                    'cores' => '8 Core / 16 Thread',
                    'boost_clock' => '4.5 GHz',
                    'architecture' => 'Zen 3 3D V-Cache',
                ],
            ],
            [
                'slug' => 'intel-core-i5-13400f-10-core-lga1700-processor',
                'brand_slug' => 'intel',
                'component_type' => 'cpu',
                'name' => 'Intel Core i5-13400F 10-Core LGA1700 Processor',
                'price' => 2950000,
                'stock' => 24,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
                'description' => '10 Core (6P+4E), 16 Thread, soket LGA1700 hemat daya untuk rakitan gaming DDR4 maupun DDR5.',
                'specs' => [
                    'socket' => 'LGA1700',
                    'supported_memory' => ['DDR5', 'DDR4'],
                    'tdp_w' => 148,
                    'base_tdp_w' => 65,
                    'cores' => '10 Core (6P+4E)',
                    'boost_clock' => '4.6 GHz',
                    'architecture' => 'Raptor Lake',
                ],
            ],
            [
                'slug' => 'msi-pro-b760m-a-wifi-ddr4-motherboard',
                'brand_slug' => 'msi-gaming',
                'component_type' => 'motherboard',
                'name' => 'MSI PRO B760M-A WiFi DDR4 Motherboard',
                'price' => 2550000,
                'stock' => 19,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
                'description' => 'Motherboard Micro-ATX soket LGA1700 dengan dukungan RAM DDR4, 2 slot M.2 PCIe 4.0, dan Wi-Fi 6E.',
                'specs' => [
                    'socket' => 'LGA1700',
                    'chipset' => 'B760',
                    'form_factor' => 'Micro-ATX',
                    'memory_type' => 'DDR4',
                    'memory_slots' => 4,
                    'max_memory_gb' => 128,
                    'm2_slots' => 2,
                    'sata_ports' => 4,
                    'tdp_w' => 40,
                ],
            ],
            [
                'slug' => 'asus-rog-strix-b550-f-gaming-wifi-ii',
                'brand_slug' => 'asus-rog',
                'component_type' => 'motherboard',
                'name' => 'ASUS ROG STRIX B550-F Gaming WiFi II',
                'price' => 3190000,
                'stock' => 14,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
                'description' => 'Motherboard ATX soket AMD AM4 dengan memori DDR4, PCIe 4.0 x16 SafeSlot, 2 slot M.2, dan LAN 2.5G.',
                'specs' => [
                    'socket' => 'AM4',
                    'chipset' => 'B550',
                    'form_factor' => 'ATX',
                    'memory_type' => 'DDR4',
                    'memory_slots' => 4,
                    'max_memory_gb' => 128,
                    'm2_slots' => 2,
                    'sata_ports' => 6,
                    'tdp_w' => 40,
                ],
            ],
            [
                'slug' => 'asus-rog-strix-b650e-i-gaming-wifi-mini-itx',
                'brand_slug' => 'asus-rog',
                'component_type' => 'motherboard',
                'name' => 'ASUS ROG STRIX B650E-I Gaming WiFi Mini-ITX',
                'price' => 5450000,
                'stock' => 9,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
                'description' => 'Motherboard Mini-ITX SFF soket AM5 dengan slot PCIe 5.0 x16, 2 slot DIMM DDR5, dan 2 slot M.2 NVMe.',
                'specs' => [
                    'socket' => 'AM5',
                    'chipset' => 'B650E',
                    'form_factor' => 'Mini-ITX',
                    'memory_type' => 'DDR5',
                    'memory_slots' => 2,
                    'max_memory_gb' => 96,
                    'm2_slots' => 2,
                    'sata_ports' => 2,
                    'tdp_w' => 40,
                ],
            ],
            [
                'slug' => 'corsair-vengeance-lpx-32gb-2x16gb-ddr4-3600mhz',
                'brand_slug' => 'corsair',
                'component_type' => 'ram',
                'name' => 'Corsair Vengeance LPX 32GB (2x16GB) DDR4 3600MHz',
                'price' => 1290000,
                'stock' => 30,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
                'description' => 'Kit RAM profil rendah 32GB (2x16GB) DDR4 3600MHz CL18 dengan heatsink aluminium murni untuk sistem DDR4.',
                'specs' => [
                    'memory_type' => 'DDR4',
                    'capacity_gb' => 32,
                    'modules' => 2,
                    'speed_mhz' => 3600,
                    'tdp_w' => 8,
                ],
            ],
            [
                'slug' => 'gskill-trident-z-neo-16gb-2x8gb-ddr4-3600mhz',
                'brand_slug' => 'gskill',
                'component_type' => 'ram',
                'name' => 'G.Skill Trident Z Neo 16GB (2x8GB) DDR4 3600MHz',
                'price' => 950000,
                'stock' => 28,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
                'description' => 'Memori gaming DDR4 16GB (2x8GB) 3600MHz dengan pencahayaan RGB dual-tone yang dioptimalkan untuk AMD & Intel.',
                'specs' => [
                    'memory_type' => 'DDR4',
                    'capacity_gb' => 16,
                    'modules' => 2,
                    'speed_mhz' => 3600,
                    'tdp_w' => 7,
                ],
            ],
            [
                'slug' => 'corsair-icue-h100i-rgb-elite-240mm-aio',
                'brand_slug' => 'corsair',
                'component_type' => 'cooler',
                'name' => 'Corsair iCUE H100i RGB ELITE 240mm AIO',
                'price' => 2190000,
                'stock' => 18,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80',
                'description' => 'Pendingin cair AIO 240mm kompatibel dengan casing kompak maupun ATX pada soket LGA1700, AM5, dan AM4.',
                'specs' => [
                    'cooler_type' => 'AIO',
                    'radiator_mm' => 240,
                    'height_mm' => 52,
                    'supported_sockets' => ['LGA1700', 'AM5', 'AM4'],
                    'tdp_w' => 14,
                ],
            ],
            [
                'slug' => 'asus-prime-ap201-mesh-micro-atx-case',
                'brand_slug' => 'asus-rog',
                'component_type' => 'case',
                'name' => 'ASUS Prime AP201 Mesh Micro-ATX Case',
                'price' => 1350000,
                'stock' => 17,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
                'description' => 'Casing Micro-ATX berpori mesh quasi-filter 33 liter: mendukung radiator 360mm, GPU hingga 338mm, dan PSU ATX.',
                'specs' => [
                    'case_class' => 'Micro-ATX Tower',
                    'supported_form_factors' => ['Micro-ATX', 'Mini-ITX'],
                    'max_gpu_length_mm' => 338,
                    'max_cooler_height_mm' => 170,
                    'max_radiator_mm' => 360,
                    'psu_form_factors' => ['ATX'],
                    'drive_bays_35' => 1,
                ],
            ],
            [
                'slug' => 'cooler-master-nr200p-mini-itx-case',
                'brand_slug' => 'cooler-master',
                'component_type' => 'case',
                'name' => 'Cooler Master NR200P Mini-ITX Case',
                'price' => 1490000,
                'stock' => 12,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
                'description' => 'Casing SFF Mini-ITX 18.2 liter: hanya mendukung motherboard Mini-ITX, PSU SFX, cooler maks. 155mm, dan GPU maks. 330mm.',
                'specs' => [
                    'case_class' => 'Mini-ITX SFF',
                    'supported_form_factors' => ['Mini-ITX'],
                    'max_gpu_length_mm' => 330,
                    'max_cooler_height_mm' => 155,
                    'max_radiator_mm' => 240,
                    'psu_form_factors' => ['SFX'],
                    'drive_bays_35' => 0,
                ],
            ],
            [
                'slug' => 'corsair-rm650-650w-80-plus-gold-atx-psu',
                'brand_slug' => 'corsair',
                'component_type' => 'psu',
                'name' => 'Corsair RM650 650W 80+ Gold ATX PSU',
                'price' => 1590000,
                'stock' => 25,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
                'description' => 'Power supply 650W 80 PLUS Gold Fully Modular form factor ATX dengan mode kipas Zero RPM untuk sistem mid-range.',
                'specs' => [
                    'wattage_w' => 650,
                    'form_factor' => 'ATX',
                    'efficiency' => '80+ Gold',
                    'modular' => 'Fully Modular',
                ],
            ],
            [
                'slug' => 'cooler-master-v850-sfx-gold-850w-psu',
                'brand_slug' => 'cooler-master',
                'component_type' => 'psu',
                'name' => 'Cooler Master V850 SFX Gold 850W PSU',
                'price' => 2450000,
                'stock' => 13,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
                'description' => 'PSU form factor SFX bertenaga 850W efisiensi 80 PLUS Gold Fully Modular khusus casing SFF Mini-ITX.',
                'specs' => [
                    'wattage_w' => 850,
                    'form_factor' => 'SFX',
                    'efficiency' => '80+ Gold',
                    'modular' => 'Fully Modular',
                ],
            ],
        ];
    }
}
