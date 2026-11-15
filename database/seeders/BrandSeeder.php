<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Product;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brandsData = [
            [
                'name' => 'Apple',
                'slug' => 'apple',
                'logo' => 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=200&q=80',
                'description' => 'Inovasi perangkat premium global mencakup MacBook, iPhone, dan ekosistem terintegrasi.',
            ],
            [
                'name' => 'ASUS ROG',
                'slug' => 'asus-rog',
                'logo' => 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=200&q=80',
                'description' => 'Republic of Gamers: Pelopor laptop dan hardware gaming performa tinggi tanpa kompromi.',
            ],
            [
                'name' => 'Sony',
                'slug' => 'sony',
                'logo' => 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=200&q=80',
                'description' => 'Pemimpin industri kamera sensor full-frame Alpha dan audio visual premium.',
            ],
            [
                'name' => 'Samsung',
                'slug' => 'samsung',
                'logo' => 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=200&q=80',
                'description' => 'Inovasi layar OLED terdepan di dunia, seri Galaxy Ultra, dan memori generasi mutakhir.',
            ],
            [
                'name' => 'HP',
                'slug' => 'hp',
                'logo' => 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=200&q=80',
                'description' => 'Laptop Omen gaming dan Spectre business class dengan efisiensi rekayasa tingkat tinggi.',
            ],
            [
                'name' => 'Razer',
                'slug' => 'razer',
                'logo' => 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80',
                'description' => 'Periferal dan laptop Blade berbalut aluminium CNC premium untuk gamer profesional.',
            ],
            [
                'name' => 'Dell Alienware',
                'slug' => 'dell-alienware',
                'logo' => 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=200&q=80',
                'description' => 'Kekuatan komputasi ekstrem XPS dan lini gaming futuristik Alienware.',
            ],
            [
                'name' => 'Lenovo Legion',
                'slug' => 'lenovo-legion',
                'logo' => 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=200&q=80',
                'description' => 'Keandalan legendaris ThinkPad untuk bisnis dan Legion Pro untuk kompetisi esports.',
            ],
            [
                'name' => 'MSI Gaming',
                'slug' => 'msi-gaming',
                'logo' => 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80',
                'description' => 'Motherboard tier satu, kartu grafis, dan laptop workstation kreator terpercaya.',
            ],
            [
                'name' => 'NVIDIA',
                'slug' => 'nvidia',
                'logo' => 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=200&q=80',
                'description' => 'Arsitektur GPU RTX dan akselerasi kecerdasan buatan komputasi masa depan.',
            ],
            [
                'name' => 'LG',
                'slug' => 'lg',
                'logo' => 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=200&q=80',
                'description' => 'UltraGear monitor gaming resolusi tinggi dan inovasi panel OLED revolusioner.',
            ],
            [
                'name' => 'Logitech G',
                'slug' => 'logitech-g',
                'logo' => 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=200&q=80',
                'description' => 'Periferal presisi Lightspeed nirkabel standar turnamen esports global.',
            ],
        ];

        $createdBrands = [];
        foreach ($brandsData as $data) {
            $brand = Brand::firstOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'logo' => $data['logo'],
                    'description' => $data['description'],
                ]
            );
            $createdBrands[$data['slug']] = $brand;
        }

        // Map all existing products to their respective brand
        $products = Product::all();
        foreach ($products as $product) {
            $nameLower = strtolower($product->name.' '.($product->description ?? ''));
            $assignedBrand = null;

            if (str_contains($nameLower, 'apple') || str_contains($nameLower, 'macbook') || str_contains($nameLower, 'iphone') || str_contains($nameLower, 'ipad')) {
                $assignedBrand = $createdBrands['apple'];
            } elseif (str_contains($nameLower, 'asus') || str_contains($nameLower, 'rog') || str_contains($nameLower, 'zenbook') || str_contains($nameLower, 'zephyrus')) {
                $assignedBrand = $createdBrands['asus-rog'];
            } elseif (str_contains($nameLower, 'sony') || str_contains($nameLower, 'alpha') || str_contains($nameLower, 'fx3') || str_contains($nameLower, 'playstation')) {
                $assignedBrand = $createdBrands['sony'];
            } elseif (str_contains($nameLower, 'samsung') || str_contains($nameLower, 'galaxy')) {
                $assignedBrand = $createdBrands['samsung'];
            } elseif (str_contains($nameLower, 'hp') || str_contains($nameLower, 'omen') || str_contains($nameLower, 'spectre') || str_contains($nameLower, 'pavilion')) {
                $assignedBrand = $createdBrands['hp'];
            } elseif (str_contains($nameLower, 'razer') || str_contains($nameLower, 'blade') || str_contains($nameLower, 'huntsman') || str_contains($nameLower, 'deathadder') || str_contains($nameLower, 'blackshark')) {
                $assignedBrand = $createdBrands['razer'];
            } elseif (str_contains($nameLower, 'dell') || str_contains($nameLower, 'alienware') || str_contains($nameLower, 'xps')) {
                $assignedBrand = $createdBrands['dell-alienware'];
            } elseif (str_contains($nameLower, 'lenovo') || str_contains($nameLower, 'legion') || str_contains($nameLower, 'thinkpad') || str_contains($nameLower, 'yoga')) {
                $assignedBrand = $createdBrands['lenovo-legion'];
            } elseif (str_contains($nameLower, 'msi') || str_contains($nameLower, 'stealth') || str_contains($nameLower, 'titan') || str_contains($nameLower, 'mag') || str_contains($nameLower, 'mpg') || str_contains($nameLower, 'meg') || str_contains($nameLower, 'optix')) {
                $assignedBrand = $createdBrands['msi-gaming'];
            } elseif (str_contains($nameLower, 'nvidia') || str_contains($nameLower, 'geforce') || str_contains($nameLower, 'rtx')) {
                $assignedBrand = $createdBrands['nvidia'];
            } elseif (str_contains($nameLower, 'lg') || str_contains($nameLower, 'ultragear')) {
                $assignedBrand = $createdBrands['lg'];
            } elseif (str_contains($nameLower, 'logitech') || str_contains($nameLower, 'pro x') || str_contains($nameLower, 'g502') || str_contains($nameLower, 'g915')) {
                $assignedBrand = $createdBrands['logitech-g'];
            } else {
                // Fallback brand distribution based on ID modulo
                $brandKeys = array_keys($createdBrands);
                $fallbackKey = $brandKeys[$product->id % count($brandKeys)];
                $assignedBrand = $createdBrands[$fallbackKey];
            }

            if ($assignedBrand) {
                $product->update(['brand_id' => $assignedBrand->id]);
            }
        }
    }
}
