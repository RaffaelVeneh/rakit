<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\OasMemo;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\SalesPerformance;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Disable foreign keys & cleanup old records
        Schema::disableForeignKeyConstraints();
        OrderItem::truncate();
        Order::truncate();
        Product::truncate();
        Category::truncate();
        User::truncate();
        Transaction::truncate();
        SalesPerformance::truncate();
        OasMemo::truncate();
        DB::table('email_info')->truncate();
        DB::table('user_info_backup')->truncate();
        DB::table('user_info')->truncate();
        DB::table('admin_info')->truncate();
        Schema::enableForeignKeyConstraints();

        // 1. Create Admins & Customer Users (22 Users total)
        $admin1 = User::create([
            'name' => 'Administrator MSI',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone' => '081234567890',
            'address' => 'Kantor Manajemen Pusat MSI, Yogyakarta',
        ]);

        $admin2 = User::create([
            'name' => 'APEX Super Admin',
            'email' => 'admin@apex.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'phone' => '081122334455',
            'address' => 'HQ APEX Digital Tower Lt. 24, SCBD Jakarta Selatan',
        ]);

        // Insert into legacy admin_info table (Bab 4 SQL requirement)
        DB::table('admin_info')->insert([
            ['admin_id' => 1, 'admin_name' => 'admin', 'admin_email' => 'admin@gmail.com', 'admin_password' => md5('password'), 'created_at' => now(), 'updated_at' => now()],
            ['admin_id' => 2, 'admin_name' => 'superadmin', 'admin_email' => 'admin@apex.com', 'admin_password' => md5('admin123'), 'created_at' => now(), 'updated_at' => now()],
        ]);

        $customersData = [
            ['name' => 'Muhammad Rama', 'email' => 'rama@gmail.com', 'phone' => '081298765432', 'address' => 'Jl. Gejayan No. 12, Condongcatur, Sleman, D.I. Yogyakarta'],
            ['name' => 'Budi Santoso', 'email' => 'budi@gmail.com', 'phone' => '081399887766', 'address' => 'Jl. Malioboro No. 45, Danurejan, Yogyakarta'],
            ['name' => 'Siti Nurhaliza', 'email' => 'siti.nur@gmail.com', 'phone' => '082133445566', 'address' => 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan'],
            ['name' => 'Dimas Arya Putra', 'email' => 'dimas.arya@yahoo.com', 'phone' => '085712348765', 'address' => 'Jl. Dago Asri No. 15, Coblong, Kota Bandung'],
            ['name' => 'Anisa Rahmawati', 'email' => 'anisa.rahma@outlook.com', 'phone' => '087812903456', 'address' => 'Jl. Manyar Kertoarjo No. 34, Gubeng, Kota Surabaya'],
            ['name' => 'Fajar Nugroho', 'email' => 'fajar.nugroho@gmail.com', 'phone' => '081277665544', 'address' => 'Jl. Pandanaran No. 102, Mugassari, Kota Semarang'],
            ['name' => 'Rizky Pratama', 'email' => 'rizky.pratama@gmail.com', 'phone' => '081900112233', 'address' => 'Jl. Sunset Road No. 77, Kuta, Badung, Bali'],
            ['name' => 'Dewi Anggraini', 'email' => 'dewi.ang@gmail.com', 'phone' => '085233449988', 'address' => 'Jl. Jenderal Sudirman No. 210, Palembang, Sumatera Selatan'],
            ['name' => 'Hendro Wijaya', 'email' => 'hendro.w@gmail.com', 'phone' => '081366554433', 'address' => 'Jl. Gatot Subroto No. 56, Medan Petisah, Kota Medan'],
            ['name' => 'Nadia Safitri', 'email' => 'nadia.safitri@gmail.com', 'phone' => '087755443322', 'address' => 'Jl. Boulevard Panakkukang No. 89, Kota Makassar'],
            ['name' => 'Eko Prasetyo', 'email' => 'eko.prasetyo@gmail.com', 'phone' => '081244556677', 'address' => 'Jl. MT Haryono No. 14, Balikpapan Selatan, Kota Balikpapan'],
            ['name' => 'Maya Indah Permata', 'email' => 'maya.indah@gmail.com', 'phone' => '085611223344', 'address' => 'Jl. Ijen No. 25, Klojen, Kota Malang'],
            ['name' => 'Gerry Alamsyah', 'email' => 'gerry.alam@gmail.com', 'phone' => '089644332211', 'address' => 'Jl. Slamet Riyadi No. 320, Laweyan, Kota Surakarta'],
            ['name' => 'Citra Kirana', 'email' => 'citra.kirana@gmail.com', 'phone' => '081388776655', 'address' => 'Jl. Pajajaran No. 45, Bogor Tengah, Kota Bogor'],
            ['name' => 'Bambang Pamungkas', 'email' => 'bambang.p@gmail.com', 'phone' => '082299887766', 'address' => 'Jl. Asia Afrika No. 110, Sumur Bandung, Kota Bandung'],
            ['name' => 'Tiara Andini', 'email' => 'tiara.andini@gmail.com', 'phone' => '085311447788', 'address' => 'Jl. Pemuda No. 88, Semarang Tengah, Kota Semarang'],
            ['name' => 'Kevin Sanjaya', 'email' => 'kevin.sanjaya@gmail.com', 'phone' => '081822334455', 'address' => 'Jl. Raya Darmo No. 125, Wonokromo, Kota Surabaya'],
            ['name' => 'Putri Wulandari', 'email' => 'putri.wulan@gmail.com', 'phone' => '087799001122', 'address' => 'Jl. Teuku Umar No. 15, Denpasar Barat, Kota Denpasar'],
            ['name' => 'Agus Setiawan', 'email' => 'agus.setiawan@gmail.com', 'phone' => '081266778899', 'address' => 'Jl. Ahmad Yani No. 90, Pekanbaru Kota, Pekanbaru'],
            ['name' => 'Vina Panduwinata', 'email' => 'vina.p@gmail.com', 'phone' => '085811224466', 'address' => 'Jl. Hayam Wuruk No. 67, Gambir, Jakarta Pusat'],
        ];

        $customerModels = [];
        foreach ($customersData as $c) {
            $customerModels[] = User::create([
                'name' => $c['name'],
                'email' => $c['email'],
                'password' => Hash::make('password'),
                'role' => 'customer',
                'phone' => $c['phone'],
                'address' => $c['address'],
            ]);
        }

        // 2. Create Categories (5 Tech Categories)
        $catLaptops = Category::create([
            'name' => 'Laptops',
            'slug' => 'laptops',
            'icon' => 'laptop',
            'description' => 'Laptop bisnis, workstation komputasi, dan ultrabook performa tinggi.',
        ]);

        $catSmartphones = Category::create([
            'name' => 'Smartphones',
            'slug' => 'smartphones',
            'icon' => 'smartphone',
            'description' => 'Ponsel cerdas digital dan mikrokomputer mobile generasi terbaru.',
        ]);

        $catCameras = Category::create([
            'name' => 'Cameras',
            'slug' => 'cameras',
            'icon' => 'camera',
            'description' => 'Kamera digital input optik profesional dan aksesoris videografi 4K/8K.',
        ]);

        $catAccessories = Category::create([
            'name' => 'Accessories',
            'slug' => 'accessories',
            'icon' => 'headphones',
            'description' => 'Peripheral input/output komputer, headphone audio hi-res, keyboard mekanikal, dan mouse presisi.',
        ]);

        $catHardware = Category::create([
            'name' => 'Hardware & Komponen PC',
            'slug' => 'hardware-pc',
            'icon' => 'cpu',
            'description' => 'CPU Processor 6.0 GHz, RAM DDR5, Storage NVMe Gen4/Gen5, PSU Titanium, dan kartu grafis GPU RTX.',
        ]);

        // 3. GENERATE 185+ AUTHENTIC TECH PRODUCTS (37 Items per Category)
        $laptopImages = [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1542393545-10f5cde2c810?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?auto=format&fit=crop&w=600&q=80',
        ];

        $smartphoneImages = [
            'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1565630916779-e303be97b6f5?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=600&q=80',
        ];

        $cameraImages = [
            'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1589872723415-8da870a78216?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
        ];

        $accessoryImages = [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=600&q=80',
        ];

        $hardwareImages = [
            'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        ];

        // Helper definition for rich catalog
        $rawCatalog = [
            // ================= 1. LAPTOPS (37 Items) =================
            'laptops' => [
                ['Apple MacBook Pro 16" M3 Max', 54999000, 12, true, 'Apple M3 Max 16-core CPU, 40-core GPU, 48GB Unified Memory, SSD 1TB NVMe, Layar Liquid Retina XDR 120Hz.'],
                ['Lenovo Legion Pro 7i Gen 9', 41500000, 8, true, 'Intel Core i9-14900HX 24-core, RTX 4080 12GB GDDR6, 32GB DDR5 5600MHz, 1TB SSD PCIe 4.0, 16" WQXGA 240Hz.'],
                ['Lenovo ThinkPad X1 Carbon Gen 11', 27800000, 15, false, 'Intel Core i7-1365U vPro, 32GB LPDDR5, 1TB SSD OPAL2, Layar 14" 2.8K OLED HDR500, Bobot 1.12 kg.'],
                ['ASUS ROG Zephyrus G16 OLED', 34999000, 7, true, 'Intel Core Ultra 9 185H NPU AI, RTX 4070 8GB, 32GB LPDDR5X, 1TB SSD, ROG Nebula OLED 2.5K 240Hz 0.2ms.'],
                ['Dell XPS 15 9530 OLED Touch', 31200000, 10, false, 'Intel Core i7-13700H 14-core, RTX 4050 6GB, 32GB DDR5, 1TB M.2 NVMe, Layar Sentuh 15.6" 3.5K OLED InfinityEdge.'],
                ['HP Omen Transcend 16 Mini-LED', 23499000, 14, false, 'Intel Core i7-14700HX, RTX 4060 8GB, 16GB DDR5, 1TB NVMe Gen4, Layar 16" WQXGA 240Hz Mini-LED 1180 nits.'],
                ['Razer Blade 16 Dual-Mode Mini-LED', 68999000, 4, true, 'Intel Core i9-14900HX, RTX 4090 16GB, 32GB DDR5, 2TB SSD PCIe 4.0, Layar Mini-LED Dual-Mode (UHD+ 120Hz / FHD+ 240Hz).'],
                ['Microsoft Surface Laptop Studio 2', 38500000, 6, false, 'Engsel lipat dinamis, Intel Core i7-13700H, RTX 4050, 32GB RAM, 1TB SSD, Layar Sentuh 14.4" PixelSense Flow 120Hz.'],
                ['MSI Titan 18 HX A14V Flagship', 84999000, 3, true, 'Desktop replacement: Intel Core i9-14900HX, RTX 4090, 64GB DDR5, 4TB SSD Gen5, Layar 18" 4K 120Hz Mini-LED.'],
                ['Acer Swift Go 14 AI OLED', 14299000, 20, false, 'Intel Core Ultra 7 155H, Intel Arc Graphics, 16GB LPDDR5X, 1TB SSD NVMe, Layar 14" 2.8K OLED 90Hz 100% DCI-P3.'],
                ['Framework Laptop 16 Modular', 29800000, 5, false, 'Laptop modular modular ports swap, AMD Ryzen 7 7840HS, Radeon RX 7700S 8GB, 32GB DDR5, 1TB NVMe.'],
                ['ASUS Zenbook 14 OLED UX3405', 16799000, 18, false, 'Ultrabook 1.2kg, Intel Core Ultra 5 125H, 16GB LPDDR5X, 512GB SSD Gen4, Layar 14" 3K Lumina OLED 120Hz.'],
                ['Apple MacBook Air 15" M3 Midnight', 21499000, 22, false, 'Chip Apple M3 8-core CPU / 10-core GPU, 16GB Unified Memory, 512GB SSD, Layar Liquid Retina 15.3", Fanless senyap.'],
                ['Dell Alienware m18 R2 Gaming', 52800000, 5, true, 'Intel Core i9-14900HX, RTX 4080 12GB, 32GB DDR5, 2TB SSD, Layar 18" QHD+ 165Hz G-Sync, Keyboard mekanikal CherryMX.'],
                ['ASUS ROG Strix SCAR 18 (2024)', 64999000, 4, true, 'Intel Core i9-14900HX, RTX 4090 16GB, 64GB DDR5, 2TB NVMe PCIe 4.0, Nebula HDR 2.5K 240Hz Mini-LED 1100 nits.'],
                ['Lenovo ThinkPad P1 Gen 6 Workstation', 48500000, 6, false, 'Intel Core i7-13800H vPro, NVIDIA RTX 4000 Ada Generation 12GB, 64GB DDR5, 2TB SSD, Layar 16" WQXGA IPS 165Hz.'],
                ['HP Spectre x360 16 2-in-1 OLED', 28999000, 9, false, 'Intel Core Ultra 7 155H, Intel Arc, 32GB LPDDR5X, 1TB PCIe Gen4, Layar Sentuh 16" 2.8K OLED 120Hz engsel 360.'],
                ['Gigabyte AORUS 17X Flagship', 46000000, 4, false, 'Intel Core i9-14900HX, RTX 4080 12GB, 32GB DDR5 5600MHz, 1TB SSD, Layar 17.3" QHD 240Hz, WINDFORCE Infinity Cooling.'],
                ['MSI Stealth 16 AI Studio OLED', 37499000, 8, true, 'Intel Core Ultra 9 185H, RTX 4070 8GB, 32GB DDR5, 1TB SSD, Layar 16" UHD+ OLED 120Hz, Bodi magnesium aluminium alloy.'],
                ['Apple MacBook Pro 14" M3 Pro Silver', 33999000, 14, true, 'Chip Apple M3 Pro 11-core CPU / 14-core GPU, 18GB Unified Memory, 512GB SSD, Layar Liquid Retina XDR 14.2" 120Hz.'],
                ['Acer Predator Helios 16 Neo', 21899000, 16, false, 'Intel Core i7-14700HX, RTX 4060 8GB, 16GB DDR5, 1TB NVMe, Layar 16" WQXGA 165Hz 100% sRGB, Kipas ganda AeroBlade 3D.'],
                ['LG Gram 17 Pro Ultra-Light', 25500000, 11, false, 'Laptop 17 inci teringan di dunia (1.35 kg): Intel Core Ultra 7 155H, 32GB LPDDR5X, 1TB NVMe, Layar WQXGA IPS anti-glare.'],
                ['Samsung Galaxy Book4 Ultra 16"', 39800000, 6, false, 'Intel Core Ultra 9 185H, RTX 4070, 32GB LPDDR5X, 1TB SSD, Layar Dynamic AMOLED 2X 3K 120Hz sentuh dengan anti-reflektif.'],
                ['ASUS TUF Gaming A15 (2024)', 17500000, 24, false, 'AMD Ryzen 7 8845HS 8-core NPU Ryzen AI, RTX 4060 8GB, 16GB DDR5, 512GB SSD Gen4, Layar 15.6" FHD 144Hz 100% sRGB.'],
                ['Lenovo Yoga Pro 9i 16 Gen 9', 36200000, 7, false, 'Intel Core Ultra 9 185H, RTX 4070 8GB, 32GB LPDDR5X, 1TB SSD, Layar PureSight Pro 16" 3.2K Mini-LED 165Hz 1200 nits.'],
                ['MSI Raider GE78 HX Smart Touchpad', 49999000, 4, true, 'Intel Core i9-14900HX, RTX 4080 12GB, 32GB DDR5, 2TB SSD, Layar 17" QHD+ 240Hz, Touchpad pintar dengan tombol shortcut.'],
                ['Dell Latitude 7440 Ultralight', 24200000, 15, false, 'Laptop enterprise magnesium ultra-ringan: Intel Core i7-1365U, 16GB LPDDR5, 512GB SSD PCIe NVMe, Kamera FHD IR shutter.'],
                ['Apple MacBook Air 13" M3 Starlight', 17499000, 25, false, 'Chip Apple M3 8-core CPU / 8-core GPU, 8GB Unified Memory, 256GB SSD, Layar Liquid Retina 13.6", Bobot hanya 1.24 kg.'],
                ['ASUS ROG Flow Z13 Gaming Tablet', 29999000, 5, true, 'Tablet gaming detachable paling bertenaga: Intel Core i9-13900H, RTX 4060, 16GB LPDDR5, 1TB SSD, Layar 13.4" QHD+ 165Hz.'],
                ['Razer Blade 14 Compact AMD', 37999000, 6, false, 'AMD Ryzen 9 8945HS, RTX 4070 8GB, 32GB DDR5 5600MHz, 1TB PCIe 4.0 SSD, Layar 14" QHD+ 240Hz IPS 100% DCI-P3.'],
                ['HP Envy 16 Creator Studio', 22800000, 12, false, 'Intel Core i7-13700H, RTX 4060 8GB, 16GB DDR5, 1TB SSD, Layar 16" WQXGA 120Hz bersertifikasi kalibrasi warna pabrik.'],
                ['Lenovo LOQ 15 Gaming Essential', 13499000, 28, false, 'Intel Core i5-13450H, RTX 4050 6GB, 16GB DDR5, 512GB SSD NVMe, Layar 15.6" FHD 144Hz G-Sync, Keyboard 4-zone RGB.'],
                ['Acer Nitro 16 AMD Ryzen Edition', 16200000, 20, false, 'AMD Ryzen 7 7840HS, RTX 4060 8GB, 16GB DDR5, 512GB SSD, Layar 16" WQXGA 165Hz 100% sRGB, Pendingin liquid metal paste.'],
                ['ASUS Vivobook Pro 15 OLED', 18999000, 14, false, 'Intel Core Ultra 7 155H, RTX 4050 6GB, 16GB LPDDR5X, 1TB SSD, Layar 15.6" 3K ASUS Lumina OLED 120Hz, DialPad virtual.'],
                ['MSI Cyborg 15 Translucent Chassis', 12999000, 25, false, 'Desain bodi semi-transparan futuristik: Intel Core i5-13420H, RTX 4050 6GB, 16GB DDR5, 512GB NVMe, Layar FHD 144Hz.'],
                ['Dell Precision 5680 Mobile Workstation', 62500000, 3, false, 'Intel Core i9-13900H vPro, NVIDIA RTX 5000 Ada 16GB GDDR6, 64GB LPDDR5, 2TB SSD, Layar 16" UHD+ OLED sentuh.'],
                ['Lenovo ThinkBook 16p Gen 5', 26800000, 10, false, 'Laptop profesional kreator: Intel Core i9-14900HX, RTX 4060, 32GB DDR5, 1TB SSD, Magic Bay modular pin connector.'],
            ],

            // ================= 2. SMARTPHONES (37 Items) =================
            'smartphones' => [
                ['Apple iPhone 16 Pro Max 1TB', 31999000, 15, true, 'Bodi Titanium Black, Chip A18 Pro 3nm, Tombol Kontrol Kamera baru, Fusion 48MP, 5x Optical Telephoto, Super Retina XDR 6.9".'],
                ['Samsung Galaxy S24 Ultra 512GB', 23999000, 18, true, 'Snapdragon 8 Gen 3, Titanium Gray, Galaxy AI terintegrasi, S-Pen, Kamera 200MP Quad Tele 5x/10x, Dynamic AMOLED 2X.'],
                ['Google Pixel 9 Pro XL 256GB', 19500000, 10, true, 'Google Tensor G4, 16GB RAM, On-device Gemini Nano AI, Super Actua LTPO OLED 120Hz 3000 nits, Triple 50MP + 48MP Tele.'],
                ['Xiaomi 14 Ultra 512GB Leica', 18999000, 8, true, 'Snapdragon 8 Gen 3, Quad Kamera Leica Summilux 50MP sensor 1-inci Sony LYT-900 Variable Aperture, 90W HyperCharge.'],
                ['OnePlus 12 5G 512GB Silky Black', 14500000, 16, false, 'Snapdragon 8 Gen 3, 16GB LPDDR5X, Kamera Hasselblad Gen-4, Layar ProXDR 2K 120Hz 4500 nits, 100W SUPERVOOC.'],
                ['Sony Xperia 1 VI 256GB Black', 21200000, 7, false, 'Sensor Exmor T for Mobile, Lensa Optik Zeiss T* True Optical Zoom 85-170mm, Layar Bravia LTPO OLED, Audio Jack Hi-Res.'],
                ['ASUS ROG Phone 8 Pro 512GB', 16999000, 9, false, 'Snapdragon 8 Gen 3, 16GB RAM, AniMe Vision LED belakang, Layar AMOLED Samsung E6 165Hz, AirTrigger touch sensor.'],
                ['Vivo X100 Pro 512GB Sunset Orange', 15999000, 11, false, 'Dimensity 9300, Kamera Zeiss APO Telephoto 50MP 100x zoom, Chip Imaging Vivo V3 6nm, FlashCharge 100W, Kulit vegan.'],
                ['Nothing Phone (2) 256GB Dark Grey', 9800000, 20, false, 'Desain transparan ikonik Glyph Interface 33 zona LED, Snapdragon 8+ Gen 1, LTPO OLED 120Hz, Sony IMX890 50MP.'],
                ['Samsung Galaxy Z Fold6 512GB', 28499000, 6, true, 'Layar utama Dynamic AMOLED 2X 7.6" 120Hz, Snapdragon 8 Gen 3, Ketahanan air IP48, Multitasking 3 jendela simultan.'],
                ['Motorola Razr 50 Ultra Flip 512GB', 17500000, 8, false, 'Layar luar terbesar 4.0" pOLED 165Hz, Snapdragon 8s Gen 3, Engsel tetesan air tanpa celah, Telefoto 50MP 2x zoom.'],
                ['Apple iPhone 16 Plus 256GB Teal', 18499000, 17, false, 'Chip A18 anyar, Tombol Action Button, Kamera ganda vertikal Spatial Video, Baterai terbesar iPhone 16, Layar 6.7".'],
                ['POCO F6 Pro 512GB White Edition', 6899000, 30, false, 'Snapdragon 8 Gen 2, 16GB RAM, Layar WQHD+ 120Hz Flow AMOLED 4000 nits, Pengisian 120W penuh dalam 19 menit.'],
                ['Apple iPhone 15 Pro 256GB Natural Titanium', 19800000, 14, false, 'Bodi Titanium grade dirgantara, Chip A17 Pro dengan GPU ray-tracing, Layar Super Retina XDR 6.1" ProMotion 120Hz.'],
                ['Samsung Galaxy S24+ 256GB Cobalt Violet', 15999000, 15, false, 'Exynos 2400 / Snapdragon 8 Gen 3, 12GB RAM, Galaxy AI, Layar QHD+ Dynamic AMOLED 2X 6.7", Baterai 4900mAh.'],
                ['Google Pixel 9 Pro 128GB Obsidian', 16800000, 12, true, 'Google Tensor G4, 16GB RAM, Desain flat kompak 6.3" LTPO OLED, Kamera telefoto 5x optik periskop, 7 tahun pembaruan OS.'],
                ['Xiaomi 14 256GB Leica Green', 11999000, 18, false, 'Flagship kompak 6.36" OLED 120Hz, Snapdragon 8 Gen 3, Triple Kamera Leica 50MP, Pengisian 90W berkabel + 50W nirkabel.'],
                ['Samsung Galaxy Z Flip6 256GB Mint', 16499000, 10, true, 'Ponsel lipat saku: Snapdragon 8 Gen 3, Kamera utama 50MP baru, FlexWindow 3.4" Super AMOLED, Baterai 4000mAh.'],
                ['OnePlus Open 512GB Emerald Dusk', 24500000, 5, true, 'Ponsel lipat tipis: Layar 7.82" Flexi-fluid LTPO3 120Hz, Kamera Hasselblad 48MP Sony LYT-T808 Pixel Stacked.'],
                ['Sony Xperia 5 V 128GB Platinum Silver', 14200000, 8, false, 'Smartphone kompak multimedia: Snapdragon 8 Gen 2, Speaker stereo panggung depan bertenaga, Baterai 5000mAh tahan 2 hari.'],
                ['Realme GT 6 512GB Fluid Silver', 7999000, 22, false, 'Snapdragon 8s Gen 3, Layar 8T LTPO 6000 nits paling terang di dunia, Sony LYT-808 OIS, Baterai 5500mAh 120W SUPERVOOC.'],
                ['iQOO 12 5G 512GB Legend White', 9999000, 19, false, 'Snapdragon 8 Gen 3 + Supercomputing Chip Q1, 16GB RAM, Kamera periskop 64MP 100x zoom, Layar AMOLED 144Hz 1.5K.'],
                ['Infinix GT 20 Pro Gaming 256GB', 4199000, 35, false, 'Chipset Dimensity 8200 Ultimate 4nm, Dedicated Gaming Display Chip Pixelworks, Lampu Mecha Loop LED belakang, 144Hz.'],
                ['Samsung Galaxy A55 5G 256GB Navy', 5999000, 40, false, 'Desain kaca dan bingkai metal premium, Exynos 1480 GPU AMD Xclipse 530, Kamera 50MP OIS, Ketahanan air debu IP67.'],
                ['Redmi Note 13 Pro+ 5G 512GB Aurora', 5799000, 30, false, 'Kamera utama 200MP Samsung HP3 OIS, Layar lengkung 1.5K CrystalRes AMOLED 120Hz, Dimensity 7200-Ultra, IP68 water resistant.'],
                ['Nothing Phone (2a) 256GB Milk White', 5999000, 25, false, 'Desain transparan artistik Glyph Interface minimalis, Mediatek Dimensity 7200 Pro, Layar AMOLED 120Hz fleksibel.'],
                ['Apple iPhone 14 128GB Midnight', 11999000, 20, false, 'Chip A15 Bionic 5-core GPU, Ceramic Shield kuat, Kamera ganda Photonic Engine, Mode Aksi sinematik super stabil.'],
                ['Vivo V30 Pro 512GB Equator Green', 7499000, 16, false, 'Kamera All-Main Camera Zeiss 50MP pertama di V Series, Aura Light Portrait pintar, Bodi tertipis baterai 5000mAh 80W.'],
                ['OPPO Find N3 Flip 256GB Sleek Black', 14999000, 7, false, 'Ponsel lipat dengan triple kamera Hasselblad pertama, Layar luar vertikal intuitif, Engsel Flexion Hinge tanpa lipatan.'],
                ['POCO X6 Pro 5G 512GB Yellow Vegan', 4899000, 32, false, 'MediaTek Dimensity 8300-Ultra rekor AnTuTu 1.4 Juta, Layar CrystalRes AMOLED 120Hz Flow, Kulit vegan kuning bertekstur.'],
                ['Huawei Pura 70 Ultra 512GB Green', 22500000, 4, true, 'Kamera Retractable Lens 1-inci berputar mekanik pop-up, Ultra Speed Snapshot 300km/h, Kaca kristal Kunlun Glass generasi 2.'],
                ['Honor Magic V2 512GB Silk Purple', 21800000, 5, false, 'Ponsel lipat paling tipis hanya 9.9mm saat tertutup, Engsel Titanium ultra-ringan, Baterai Silicon-Carbon ganda 5000mAh.'],
                ['ASUS Zenfone 10 256GB Midnight Black', 10500000, 12, false, 'Flagship satu tangan berukuran 5.9", Snapdragon 8 Gen 2, 6-Axis Hybrid Gimbal Stabilizer 2.0, Pengisian nirkabel 15W Qi.'],
                ['Samsung Galaxy S23 FE 256GB Mint', 8499000, 18, false, 'Kamera flagship 50MP dengan Nightography, Layar Dynamic AMOLED 2X 120Hz, Rangka aluminium kokoh, Sertifikasi IP68.'],
                ['Apple iPhone 13 128GB Pink', 9999000, 22, false, 'Chip A15 Bionic, Sistem kamera ganda diagonal sensor-shift OIS, Layar Super Retina XDR cerah, Daya tahan baterai seharian.'],
                ['ZTE Nubia RedMagic 9 Pro 512GB', 14500000, 8, true, 'Snapdragon 8 Gen 3, Kipas pendingin turbofan fisik 22.000 RPM ber-RGB, Layar AMOLED full screen tanpa notch/lubang.'],
                ['Meizu 21 Pro 512GB White', 11500000, 10, false, 'Desain bezel simetris tertipis di dunia 1.74mm, Snapdragon 8 Gen 3, Layar 2K+ LTPO AMOLED 120Hz, Kamera 50MP OIS.'],
            ],

            // ================= 3. CAMERAS (37 Items) =================
            'cameras' => [
                ['Sony Alpha 7 IV Mirrorless Body', 34500000, 10, true, 'Sensor Full-Frame Exmor R 33MP, Prosesor BIONZ XR, 759 titik Phase Detection AF Real-time Eye AF, Video 4K 60p 10-bit.'],
                ['Canon EOS R6 Mark II Mirrorless', 37800000, 9, true, 'Sensor 24.2MP CMOS Full-Frame, Dual Pixel CMOS AF II, Burst 40fps electronic shutter, 4K 60p oversampled dari 6K.'],
                ['Nikon Z8 Full-Frame Mirrorless', 58000000, 5, true, 'Sensor Stacked CMOS 45.7MP tanpa shutter mekanik, EXPEED 7, 8.3K 60p N-RAW internal, Zero blackout viewfinder.'],
                ['Fujifilm X-T5 Mirrorless Body Black', 26500000, 12, false, 'Sensor X-Trans CMOS 5 HR 40.2MP, X-Processor 5, 7.0 stop 5-Axis IBIS, 19 mode Simulasi Film klasik legendaris.'],
                ['Panasonic Lumix S5 IIX Body Cinema', 29999000, 7, false, 'Sensor Full-Frame 24.2MP Phase Hybrid AF, Rekaman langsung SSD via USB-C, ProRes RAW 5.8K, Active I.S.'],
                ['Leica Q3 60MP Full-Frame Compact', 105000000, 2, true, 'Sensor BSI Full-Frame Triple-Resolution 60MP/36MP/18MP, Lensa Summilux 28mm f/1.7 ASPH, Macro mode 17cm.'],
                ['Sony Cinema Line FX3 Body', 59999000, 4, true, 'Sensor Full-Frame 12.1MP Exmor R ISO hingga 409600, S-Cinetone, Kipas pendingin internal untuk 4K 120p non-stop.'],
                ['GoPro HERO12 Black Action Cam', 5899000, 25, false, 'Video 5.3K 60fps HDR, HyperSmooth 6.0 pemenang Emmy Award, Tahan air 10m tanpa casing, Audio bluetooth AirPods.'],
                ['DJI Osmo Pocket 3 Creator Combo', 9850000, 14, true, 'Gimbal 3-axis dengan sensor 1" CMOS, 4K 120fps D-Log M 10-bit, Layar sentuh putar 2.0" OLED, Termasuk Mic 2.'],
                ['Insta360 X4 8K 360 Camera', 8490000, 16, false, 'Perekaman 360 derajat resolusi 8K 30fps / 5.7K 60fps, Efek tongkat tak terlihat (Invisible Selfie Stick), Tahan air 10m.'],
                ['Blackmagic Pocket Cinema 6K G2', 31000000, 6, false, 'Sensor Super 35 HDR 6144 x 3456, Dudukan lensa Canon EF aktif, Dual Native ISO 25600, Layar miring 5" 1500 nits.'],
                ['Fujifilm GFX 100 II Medium Format', 119000000, 1, false, 'Sensor Medium Format 102MP CMOS II HS (43.8 x 32.9 mm), Video 8K 30p internal, Stabilizer 8.0 stop IBIS.'],
                ['Canon EOS R8 Mirrorless Full-Frame', 21500000, 15, false, 'Kamera Full-Frame paling ringan dari Canon (461g), Sensor 24.2MP CMOS, 4K 60p tanpa crop oversampled 6K, 40fps.'],
                ['Sony Alpha 7R V High-Resolution 61MP', 54000000, 4, true, 'Sensor BSI Full-Frame 61MP Exmor R, Unit Pemrosesan AI Deep Learning canggih, Stabilisasi gambar 8-stop IBIS, 8K 24p.'],
                ['Nikon Zf Retro Full-Frame Mirrorless', 32500000, 8, true, 'Bodi retro presisi magnesium alloy bertekstur, Sensor 24.5MP BSI CMOS, Prosesor EXPEED 7, Mode monokrom tombol geser.'],
                ['Canon EOS R5 Mark II 8K RAW', 68000000, 3, true, 'Sensor Stacked CMOS 45MP back-illuminated, Eye Control AF v2, Perekaman video 8K 60p RAW internal, Accelerated Capture Engine.'],
                ['Fujifilm X100VI Digital Compact Camera', 27999000, 2, true, 'Sensor 40.2MP X-Trans 5 HR, Lensa tetap 23mm f/2.0 II tajam, 6.0 stop IBIS internal, Hybrid Viewfinder optik/elektronik.'],
                ['Sony Alpha 6700 APS-C Flagship', 21999000, 14, false, 'Sensor APS-C 26MP BSI Exmor R, Chip Pemrosesan AI terdedikasi, Perekaman 4K 120p, S-Cinetone, Bodi ringkas tahan cuaca.'],
                ['Panasonic Lumix GH6 Micro Four Thirds', 24800000, 9, false, 'Sensor Live MOS 25.2MP tanpa low-pass filter, ProRes 422 HQ internal 5.7K 60p, Perekaman tanpa batas waktu pendingin kipas.'],
                ['DJI Osmo Action 4 Standard Combo', 4899000, 20, false, 'Sensor besar 1/1.3" CMOS performa low-light prima, Warna 10-bit D-Log M, Tahan beku hingga -20C, Tahan air 18 meter.'],
                ['Ricoh GR III Street Edition 24MP', 15990000, 6, true, 'Kamera saku fotografi jalanan legendaris: Sensor APS-C 24.2MP, Lensa 28mm f/2.8 tajam, Snap Focus kilat, Shake Reduction.'],
                ['Sony Cinema Line FX30 Super 35', 27500000, 11, false, 'Sensor Super 35 Exmor R 26MP, Dual Base ISO 800/2500, Perekaman 4K 120p 10-bit 4:2:2, Handle XLR audio profesional.'],
                ['Nikon Z6 III 6K N-RAW Full-Frame', 39999000, 7, false, 'Sensor Partially-Stacked CMOS 24.5MP pertama di dunia, EVF 5.76 juta titik kecerahan 4000 nits, Perekaman 6K 60p N-RAW.'],
                ['Canon EOS R7 APS-C Mirrorless', 21800000, 12, false, 'Sensor APS-C 32.5MP beresolusi tinggi, Kecepatan continuous 30fps electronic shutter, Stabilizer 8-stop gabungan lensa.'],
                ['Insta360 Ace Pro Co-Engineered Leica', 6590000, 18, false, 'Action cam sensor 1/1.3" AI Chip 5nm rancangan Leica, Perekaman video 8K 24fps, Layar lipat sentuh 2.4" menghadap depan.'],
                ['Fujifilm X-H2S High-Speed Flagship', 36500000, 5, false, 'Sensor Stacked X-Trans CMOS 5 HS 26.1MP, Kecepatan potret tanpa blackout 40fps, Perekaman video 6.2K 30p Apple ProRes.'],
                ['Sony Alpha 7C II Compact Full-Frame', 29999000, 10, true, 'Bodi kamera saku ringan (514g) dengan sensor Full-Frame 33MP Exmor R, AI Processing Unit, 7.0-stop IBIS, Video 4K 60p.'],
                ['Leica M11 Rangefinder Black Body', 139000000, 1, true, 'Kamera rangefinder ikonik buatan tangan Wetzlar Jerman: Sensor BSI Full-Frame 60MP, Memori internal 64GB, Sapphire Glass.'],
                ['Canon EOS R10 Mirrorless Creator Kit', 14200000, 16, false, 'Kamera pembuat konten pemula: Sensor 24.2MP CMOS APS-C, Autofokus Dual Pixel CMOS AF II pelacak subjek kendaraan/hewan.'],
                ['Blackmagic Cinema Camera 6K Full-Frame', 42500000, 4, false, 'Sensor Full-Frame 6048 x 4032 6K, L-Mount fleksibel, 13 stop dynamic range, Perekaman Blackmagic RAW ke disk SSD CFexpress.'],
                ['Panasonic Lumix G9 II Micro Four Thirds', 26500000, 8, false, 'Sensor 25.2MP baru dengan Phase Hybrid AF, Continuous shooting 60fps dengan AFC, Mode High-Res genggam 100 Megapixel.'],
                ['Ricoh GR IIIx Urban Edition 40mm', 16800000, 5, false, 'Edisi sudut pandang natural 40mm f/2.8, Sensor APS-C 24.2MP tanpa filter AA, Bodi logam ringkas masuk saku kemeja.'],
                ['Sony ZV-E1 Full-Frame Vlogging Camera', 32999000, 7, true, 'Kamera vlogging Full-Frame paling ringkas di dunia: Sensor 12.1MP, Fitur Auto Framing AI cerdas, Framing Stabilizer.'],
                ['Canon PowerShot V10 Pocket Vlog Camera', 5999000, 24, false, 'Kamera saku all-in-one vertikal dengan kickstand terpasang, Lensa ultra-wide 19mm, Mikrofon stereo omnidirectional.'],
                ['DJI Action 2 Dual-Screen Magnetic Combo', 3999000, 20, false, 'Bodi kubus magnetik inovatif dapat ditempel di baju/helm, Perekaman 4K 120fps ultra-wide 155 derajat, Layar sentuh ganda OLED.'],
                ['Nikon Z50 Mirrorless DX Kit 16-50mm', 13999000, 15, false, 'Kamera ergonomis nyaman digenggam: Sensor 20.9MP CMOS DX, Layar sentuh miring 180 derajat untuk selfie/vlogging, Video 4K UHD.'],
                ['Sony Alpha 9 III Global Shutter Sensor', 89000000, 2, true, 'Kamera fotografi olahraga revolusioner pertama dengan Full-Frame Global Shutter: Kecepatan shutter 1/80.000 detik, 120fps RAW.'],
            ],

            // ================= 4. ACCESSORIES & PERIPHERALS (37 Items) =================
            'accessories' => [
                ['Sony WH-1000XM5 Wireless ANC', 5199000, 28, true, 'Headphone noise cancelling terbaik prosesor ganda V1 dan QN1, 8 mikrofon peredam bising, driver 30mm serat karbon, baterai 30 jam.'],
                ['Logitech MX Master 3S Graphite', 1549000, 45, true, 'Mouse ergonomis profesional sensor 8000 DPI Darkfield melacak di kaca, scroll elektromagnetik MagSpeed, klik 90% lebih senyap.'],
                ['Keychron Q1 Pro Wireless Mechanical', 2890000, 20, true, 'Keyboard custom bodi aluminium 6063 full CNC, Bluetooth 5.1 & USB-C, programmable QMK/VIA, switch Gateron Jupiter Brown.'],
                ['Apple AirPods Max Space Gray', 8499000, 11, false, 'Headphone over-ear Apple: Driver dinamis akustik kustom, Active Noise Cancellation, Audio Spasial personal pelacak kepala.'],
                ['SteelSeries Arctis Nova Pro Wireless', 5750000, 15, false, 'Headset gaming audiophile GameDAC Gen 2, baterai ganda hot-swap tanpa henti, ANC aktif 4 mikrofon, dual 2.4GHz + Bluetooth.'],
                ['Elgato Stream Deck MK.2 White', 2450000, 32, true, '15 tombol display LCD yang dapat diprogram untuk kontrol siaran streaming, makro shortcut coding, automasi audio mixer.'],
                ['BenQ ScreenBar Halo Monitor Light', 2790000, 19, false, 'Lampu gantung monitor profesional dengan kontroler nirkabel presisi, sensor peredupan otomatis real-time, bebas silau layar.'],
                ['Shure SM7B Dynamic Studio Mic', 6200000, 16, true, 'Mikrofon vokal standar broadcast radio dan podcast global. Pola kardioid terfokus, pelindung elektromagnetik humbucking.'],
                ['Razer DeathAdder V3 Pro Wireless', 2299000, 35, false, 'Mouse esports ultra-ringan 63g: Sensor optik Focus Pro 30K DPI, Switch optik Gen-3 tanpa double click, Polling rate 8000Hz.'],
                ['Anker 737 Power Bank GaNPrime 140W', 1850000, 40, false, 'Power bank raksasa 24.000mAh pengisian 2 arah ultra cepat 140W PD 3.1, layar digital menampilkan watt real-time.'],
                ['CalDigit TS4 Thunderbolt 4 Dock', 6500000, 8, false, 'Docking station 18 port koneksi, pengisian laptop 98W Power Delivery, port ethernet 2.5 Gigabit, slot kartu SD UHS-II.'],
                ['Audio-Technica ATH-M50xBT2', 2650000, 26, false, 'Headphone monitor studio legendaris Bluetooth nirkabel LDAC, driver 45mm magnet rare-earth, USB-C, baterai 50 jam.'],
                ['Belkin BoostCharge Pro 3-in-1 MagSafe', 2190000, 30, false, 'Stand nirkabel bersertifikasi MagSafe resmi Apple 15W untuk iPhone, Apple Watch Ultra fast charging, dan AirPods Qi.'],
                ['Apple AirPods Pro 2 USB-C (MagSafe)', 3899000, 35, true, 'Chip H2 bertenaga, Active Noise Cancellation 2x lipat lebih senyap, Mode Transparansi Adaptif, Audio Spasial Personal.'],
                ['Logitech MX Mechanical Wireless Keyboard', 2599000, 22, false, 'Keyboard mekanikal profil rendah (low profile), switch Tactile Quiet, konektivitas Logi Bolt & Bluetooth multi-device.'],
                ['Razer BlackWidow V4 Pro Mechanical', 3499000, 14, false, 'Keyboard gaming mekanikal command dial multifungsi, switch mekanikal kuning linear halus, pencahayaan underglow 3 sisi.'],
                ['Sennheiser Momentum 4 Wireless Black', 4999000, 18, false, 'Kualitas audio audiophile khas Sennheiser dengan driver 42mm, Adaptive Noise Cancellation, daya tahan baterai fantastis 60 jam.'],
                ['Logitech G Pro X Superlight 2 Wireless', 2399000, 25, true, 'Mouse gaming kompetitif 60 gram: Switch hybrid optik-mekanikal LIGHTFORCE, sensor HERO 2 32.000 DPI, polling rate 4000Hz.'],
                ['Keychron K2 Pro QMK Wireless Keyboard', 1750000, 20, false, 'Layout 75% kompak, keycap PBT double-shot profil OSA, peredam suara busa silikon tebal ganda, kompatibel Mac & Windows.'],
                ['Sony WF-1000XM5 True Wireless Earbuds', 3999000, 24, true, 'TWS flagship sensor kebisingan presisi dengan prosesor V2 dan chip QN2e, driver Dynamic Driver X reproduksi vokal jernih.'],
                ['Elgato Wave:3 Premium USB Microphone', 2199000, 28, false, 'Kapsul kondensor kardioid 24-bit 96kHz, teknologi anti-distorsi Clipguard bawaan, mixer digital Wave Link multi-channel.'],
                ['NuPhy Air75 V2 Ultra-Slim Mechanical', 2150000, 17, false, 'Keyboard mekanikal nirkabel 75% tertipis dengan polling rate 1000Hz nirkabel, switch Gateron Low-Profile Cowberry.'],
                ['Bose QuietComfort Ultra Headphones', 5999000, 12, false, 'Peredam bising kelas dunia dengan Bose Immersive Audio spasial, bantalan telinga kulit sintetis super lembut kenyamanan total.'],
                ['Razer Huntsman V3 Pro TKL Analog', 3899000, 10, true, 'Switch optik analog Gen-2 dengan aktuasi yang dapat disetel 0.1-4.0mm, mode Rapid Trigger respons instan untuk turnamen esports.'],
                ['Logitech G915 LIGHTSPEED Wireless RGB', 2999000, 15, false, 'Keyboard gaming mekanikal ultra-tipis bahan aluminium alloy kelas pesawat tempur, switch GL Clicky, baterai 30 jam gaming.'],
                ['Anker Prime 20,000mAh Power Bank (200W)', 1999000, 30, false, 'Output daya gabungan super kencang 200W (ganda port 100W simultan), ukuran kaleng soda kompak, aplikasi monitoring pintar.'],
                ['Lian Li Strimer Plus V2 24-Pin ARGB Cable', 850000, 45, false, 'Kabel ekstensi power supply motherboard berbalut kabel optik pencahayaan ARGB warna-warni memukau sinkronisasi software.'],
                ['Audio-Technica AT2020USB-X Cardioid Mic', 1890000, 22, false, 'Mikrofon USB pembuat konten resolusi tinggi 24-bit/96kHz, tombol sentuh mute senyap indikator LED biru/merah, jack monitor.'],
                ['Rode Wireless PRO Dual Wireless Mic', 6450000, 9, true, 'Sistem mikrofon nirkabel 32-bit float on-board recording bebas clipping suara, transmisi digital 2.4GHz jarak 260m, timecode sync.'],
                ['CalDigit Connect 10G Thunderbolt 3 to 10GbE', 2490000, 14, false, 'Adaptor bus-powered Thunderbolt ke jaringan Ethernet super cepat 10 Gigabit per detik untuk transfer file NAS/server video.'],
                ['Logitech MX Anywhere 3S Compact Mouse', 1199000, 38, false, 'Mouse portabel mobilitas tinggi, klik senyap, roda scroll MagSpeed, sensor 8000 DPI dapat digunakan di atas marmer dan kaca.'],
                ['SteelSeries Apex Pro TKL (2023) Wireless', 4150000, 8, false, 'Keyboard tercepat di dunia: Switch Omnipoint 2.0 hypermagnetic waktu respon 0.7ms, Rapid Trigger 0.1mm, layar pintar OLED.'],
                ['BenQ ScreenBar Plus e-Reading LED Light', 2250000, 20, false, 'Lampu baca monitor dengan dial kontrol desktop berkabel bulat, sensor ambient light otomatis, penjepit paten tanpa baut.'],
                ['Elgato Key Light Air Professional Studio', 1990000, 25, false, 'Lampu panel studio streaming 1400 lumens bebas kedip (flicker-free), temperatur warna 2900-7000K kontrol via Wi-Fi PC/HP.'],
                ['Ugreen Nexode 100W GaN Fast Charger 4-Port', 799000, 50, false, 'Charger dinding GaN multiport 3x USB-C + 1x USB-A, protokol PD 3.0 kompatibel MacBook Pro, laptop Windows, iPhone, Android.'],
                ['Orbitkey Desk Mat Large Leather Black', 1150000, 30, false, 'Alas meja kerja kulit vegan premium tahan air dengan pengatur kabel magnetik terintegrasi dan lapisan bawah sembunyi kertas.'],
                ['Belkin UltraCharge Pro 10.000mAh Qi2', 950000, 40, false, 'Power bank nirkabel teknologi standar Qi2 15W bersertifikasi, dudukan stand lipat aluminium kokoh untuk hands-free viewing.'],
            ],

            // ================= 5. HARDWARE & KOMPONEN PC (37 Items) =================
            'hardware-pc' => [
                ['Intel Core i9-14900K 6.0 GHz Processor', 9450000, 15, true, '24 Core (8P + 16E), 32 Thread, clock speed hingga 6.0 GHz Intel Thermal Velocity Boost, Smart Cache 36MB, LGA1700.'],
                ['AMD Ryzen 9 7950X3D Desktop Processor', 10200000, 12, true, '16 Core, 32 Thread, 3D V-Cache raksasa 128MB, clock up to 5.7 GHz, efisiensi arsitektur Zen 4 5nm soket AM5.'],
                ['ASUS ROG Strix GeForce RTX 4090 24GB', 38990000, 4, true, 'NVIDIA Ada Lovelace, 24GB GDDR6X 384-bit, DLSS 3.5 Frame Generation, Ruang Uap Vapor Chamber bodi metal diecast.'],
                ['ASUS ROG Maximus Z790 Dark Hero', 12800000, 8, false, 'Motherboard Intel Z790: 20+1 power stages, PCIe 5.0 ganda, 5 slot M.2 NVMe, Wi-Fi 7 bawaan, Dual Thunderbolt 4 onboard.'],
                ['Corsair Dominator Titanium DDR5 64GB 6600MHz', 5600000, 20, true, 'Kit RAM elit 64GB (2x32GB) DDR5 6600MHz CL32, pendingin aluminium tempa premium, modul LED RGB Capellix kustom.'],
                ['Samsung 990 PRO with Heatsink 4TB NVMe', 6250000, 18, true, 'PCIe Gen 4.0 x4 M.2 2280 4TB dengan heatsink: Kecepatan baca 7.450 MB/s dan tulis 6.900 MB/s, kompatibel PS5.'],
                ['Seasonic Prime TX-1300 Titanium ATX 3.0', 7500000, 10, false, 'PSU 1300W efisiensi 80 PLUS Titanium 94%, kabel PCIe 5.0 12VHPWR natif GPU flagship, kipas FDB garansi 12 tahun.'],
                ['NZXT Kraken Elite 360 RGB AIO Cooler', 4650000, 14, false, 'Pendingin cair AIO 360mm: Layar IPS bulat 2.36" 640x640 60Hz menampilkan GIF/suhu CPU GPU, pompa Asetek Gen 7.'],
                ['Lian Li O11 Dynamic EVO RGB Case', 2890000, 22, false, 'Casing PC modular kaca tempered ganda tanpa pilar depan: Dukungan radiator 360mm tiga sisi, strip LED RGB atas bawah.'],
                ['Noctua NH-D15 chromax.black CPU Cooler', 1950000, 25, false, 'Pendingin udara menara ganda 6 heatpipe serba hitam dengan 2 kipas NF-A15 PWM 140mm senyap performa setara AIO.'],
                ['Sapphire Nitro+ Radeon RX 7900 XTX 24GB', 18750000, 7, true, 'AMD RDNA 3: 24GB GDDR6, pendingin Vapor-X chamber terintegrasi sirip gelombang, dual BIOS, ARGB light bar.'],
                ['Kingston FURY Renegade RGB DDR5 32GB 6400MHz', 2450000, 30, false, 'Kit 32GB (2x16GB) 6400 MT/s CL32 pencahayaan Infrared Sync patented Kingston dan profil Intel XMP 3.0.'],
                ['Western Digital Black SN850X 2TB NVMe SSD', 2750000, 35, false, 'PCIe Gen 4 x4 transfer baca 7.300 MB/s dan tulis 6.600 MB/s, Game Mode 2.0 untuk eliminasi waktu loading game AAA.'],
                ['AMD Ryzen 7 7800X3D Gaming Processor', 6850000, 20, true, 'Prosesor gaming paling populer: 8 Core, 16 Thread, 96MB L3 3D V-Cache, TDP 120W hemat daya, performa FPS teratas.'],
                ['Intel Core i7-14700K 20-Core Processor', 6550000, 22, false, '20 Core (8P + 12E), 28 Thread, up to 5.6 GHz turbo boost, soket LGA1700, memori DDR4/DDR5 dual channel.'],
                ['MSI GeForce RTX 4080 SUPER 16GB Gaming X Trio', 21500000, 8, true, '10240 CUDA Cores, 16GB GDDR6X 256-bit, sistem pendingin TRI FROZR 3 dengan kipas TORX FAN 5.0, bodi kokoh anti-sag.'],
                ['G.Skill Trident Z5 RGB DDR5 64GB (2x32GB) 6400MHz', 4850000, 16, true, 'Kit memori DDR5 performa ekstrem heatsink aluminium hitam bergaris elegan dengan bilah lampu RGB tembus pandang.'],
                ['Crucial T700 Gen5 NVMe SSD 2TB with Heatsink', 5100000, 11, true, 'SSD generasi terbaru PCIe 5.0 x4 berkecepatan monster: Baca 12.400 MB/s dan Tulis 11.800 MB/s, heatsink aluminium masif.'],
                ['Corsair RM1000x Shift Fully Modular 1000W', 3150000, 18, false, 'Desain kabel samping modular revolusioner memudahkan manajemen kabel case, sertifikasi efisiensi 80 PLUS Gold, ATX 3.0.'],
                ['Lian Li Galahad II Trinity SL-INF 360 AIO', 3290000, 15, false, 'Pendingin cair 360mm dilengkapi kipas Uni Fan SL-Infinity berdesain kaca cermin tanpa batas, pompa 3200 RPM.'],
                ['Fractal Design North Charcoal Black Mesh Case', 2490000, 19, true, 'Casing PC estetika interior Skandinavia panel depan kayu kenari asli (walnut), ventilasi mesh samping aliran udara prima.'],
                ['MSI MAG B650 Tomahawk WiFi Motherboard', 3650000, 25, false, 'Motherboard soket AMD AM5 andalan: 14+2+1 Duet Rail Power System, slot PCIe 4.0 x16 lapis baja, Wi-Fi 6E, LAN 2.5G.'],
                ['Intel Core i5-14600K 14-Core Processor', 4750000, 30, false, 'Prosesor mid-high serba guna: 14 Core (6P + 8E), 20 Thread, clock hingga 5.3 GHz, ideal untuk gaming kompetitif dan editing.'],
                ['ASUS TUF Gaming GeForce RTX 4070 Ti SUPER 16GB', 16200000, 10, true, '16GB GDDR6X 256-bit bandwidth tinggi, kapasitor militer grade bersertifikasi, dual ball-bearing fans 2x lebih awet.'],
                ['Thermalright Peerless Assassin 120 SE Cooler', 550000, 50, false, 'Pendingin udara CPU legendaris value terbaik: Menara ganda 6 pipa tembaga AGHP, 2 kipas TL-C12C PWM senyap efisien.'],
                ['Team T-Force Delta RGB DDR5 32GB (2x16GB) 6000MHz', 1850000, 35, false, 'Desain sayap siluet futuristik dengan pencahayaan ultra-wide 120 derajat, mendukung profil overclocking Intel XMP & AMD EXPO.'],
                ['Western Digital Black SN770 1TB NVMe Gen4 SSD', 1250000, 45, false, 'SSD M.2 NVMe DRAM-less berkecepatan 5.150 MB/s, konsumsi daya rendah cocok untuk penyimpanan utama sistem operasi OS.'],
                ['Corsair 5000D Airflow Tempered Glass White', 2650000, 14, false, 'Chassis mid-tower lega dengan panel depan jaring airflow tinggi, sistem manajemen kabel RapidRoute tersembunyi rapi.'],
                ['Gigabyte Z790 AORUS Elite AX Motherboard', 4550000, 16, false, 'Twin 16+1+2 Digital VRM, 4 slot M.2 PCIe 4.0 dengan thermal guard, antena Wi-Fi 6E berdaya tangkap sinyal tinggi.'],
                ['be quiet! Dark Power Pro 13 1300W Titanium', 6800000, 6, false, 'Efisiensi 80 PLUS Titanium hingga 94.4%, kontrol digital tanpa noise, kipas Silent Wings frameless nyaris tanpa desah suara.'],
                ['Arctic Liquid Freezer III 360 A-RGB Cooler', 2150000, 20, false, 'Watercooling radiator tebal 38mm dengan kipas VRM pendingin motherboard internal pada modul pompa CPU, performa teruji.'],
                ['ASUS Dual GeForce RTX 4060 EVO 8GB GDDR6', 5450000, 40, false, 'Kartu grafis hemat daya TDP 115W bodi kompak 2 kipas Axial-tech, DLSS 3, encoder AV1, pas di casing Mini-ITX maupun mATX.'],
                ['NZXT H9 Flow Dual-Chamber Mid-Tower Case', 2690000, 16, false, 'Desain kaca tanpa pilar ganda sudut pandang akuarium 360 derajat, ruang ganda (dual chamber) pemisah kabel & PSU.'],
                ['Seagate IronWolf Pro 8TB NAS Hard Drive', 3450000, 18, false, 'Penyimpanan massal server NAS 7200 RPM CMR cache 256MB, sensor getaran putar (RV), beban kerja operasional 24/7 non-stop.'],
                ['AMD Ryzen 5 7600X 6-Core AM5 Processor', 3450000, 35, false, '6 Core, 12 Thread, base clock 4.7 GHz boost 5.3 GHz, arsitektur Zen 4 terdepan harga terjangkau untuk rakitan PC modern.'],
                ['ASUS ROG Ryujin III 360 ARGB AIO Liquid Cooler', 5850000, 7, true, 'Watercooling ekstrem dengan layar LCD 3.5" terbesar resolusi 60Hz, pompa Asetek Gen 8, kipas magnetik daisy-chain ARGB.'],
                ['Lian Li UNI FAN TL LCD 120 Reverse Blade 3-Pack', 2450000, 25, false, 'Kipas PC pertama di dunia dengan layar LCD 1.6" personal di tengah kipas, bilah terbalik (reverse blade) untuk intake estetik.'],
            ],
        ];

        // 4. INSERT ALL 185 PRODUCTS
        $categoryMap = [
            'laptops' => $catLaptops->id,
            'smartphones' => $catSmartphones->id,
            'cameras' => $catCameras->id,
            'accessories' => $catAccessories->id,
            'hardware-pc' => $catHardware->id,
        ];

        $imageMap = [
            'laptops' => $laptopImages,
            'smartphones' => $smartphoneImages,
            'cameras' => $cameraImages,
            'accessories' => $accessoryImages,
            'hardware-pc' => $hardwareImages,
        ];

        $createdProducts = [];

        foreach ($rawCatalog as $catKey => $items) {
            $catId = $categoryMap[$catKey];
            $imgs = $imageMap[$catKey];

            foreach ($items as $idx => $item) {
                $name = $item[0];
                $price = $item[1];
                $stock = $item[2];
                $isFeatured = $item[3];
                $desc = $item[4];
                $img = $imgs[$idx % count($imgs)];
                $slug = Str::slug($name);

                $createdProducts[] = Product::create([
                    'category_id' => $catId,
                    'name' => $name,
                    'slug' => $slug,
                    'description' => $desc,
                    'price' => $price,
                    'stock' => $stock,
                    'image' => $img,
                    'is_featured' => $isFeatured,
                ]);
            }
        }

        // 5. Create 60 Realistic Orders spanning 185 products
        $paymentMethods = [
            'Transfer Bank (BCA)',
            'Transfer Bank (Mandiri)',
            'QRIS Instant Payment',
            'Virtual Account BNI',
            'Virtual Account BRI',
            'Kartu Kredit / Debit Online',
            'COD (Bayar di Tempat)',
        ];

        $orderNotes = [
            'Tolong kirimkan dengan packing kayu tebal dan asuransi penuh.',
            'Mohon lakukan QC dan tes nyala unit sebelum dikemas.',
            'Kirim saat jam kerja kantor (09:00 - 17:00 WIB).',
            'Titipkan di pos satpam jika tidak ada orang di rumah.',
            'Pastikan segel resmi masih utuh dan kartu garansi distempel.',
            'Tolong tambahkan ekstra bubble wrap tebal 5 lapis.',
            'Jangan dibanting, barang sensitif komponen PC dan optik kamera.',
            null,
            null,
            null,
        ];

        // 60 orders distribution: 38 completed, 14 processing, 6 pending, 2 cancelled
        $statuses = array_merge(
            array_fill(0, 38, 'completed'),
            array_fill(0, 14, 'processing'),
            array_fill(0, 6, 'pending'),
            array_fill(0, 2, 'cancelled')
        );
        shuffle($statuses);

        for ($i = 0; $i < 60; $i++) {
            $customer = $customerModels[$i % count($customerModels)];
            $status = $statuses[$i];
            $paymentMethod = $paymentMethods[$i % count($paymentMethods)];
            $note = $orderNotes[$i % count($orderNotes)];

            $daysAgo = rand(0, 58);
            $createdAt = now()->subDays($daysAgo)->subHours(rand(1, 23))->subMinutes(rand(1, 59));

            // Select 1 to 3 distinct products for this order
            $itemCount = rand(1, 3);
            $chosenProductIndexes = (array) array_rand($createdProducts, $itemCount);

            $orderTotal = 0;
            $itemsToCreate = [];

            foreach ($chosenProductIndexes as $prodIdx) {
                $product = $createdProducts[$prodIdx];
                $qty = rand(1, 2);
                $subtotal = $product->price * $qty;
                $orderTotal += $subtotal;

                $itemsToCreate[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => $product->price,
                    'quantity' => $qty,
                    'subtotal' => $subtotal,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
            }

            $order = Order::create([
                'order_number' => 'ORD-'.strtoupper(Str::random(4)).'-'.(1000 + $i),
                'user_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'customer_phone' => $customer->phone,
                'shipping_address' => $customer->address,
                'payment_method' => $paymentMethod,
                'total_amount' => $orderTotal,
                'status' => $status,
                'notes' => $note,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            foreach ($itemsToCreate as $itemData) {
                $itemData['order_id'] = $order->id;
                OrderItem::create($itemData);
            }
        }

        // 6. Create 35 TPS Transactions (Bab 1 & Bab 2)
        $txCategories = [
            'E-Commerce Sales',
            'Wholesale Inventory Purchase',
            'Server Cloud Infrastructure',
            'Office Logistics & Freight',
            'Hardware Components Procurement',
            'Payment Gateway Fee Settlement',
            'Customer Warranty Claim Return',
        ];

        for ($t = 1; $t <= 35; $t++) {
            $isInternal = ($t % 3 == 0);
            $type = $isInternal ? 'internal' : 'external';
            $mode = ($t % 2 == 0) ? 'online' : 'batch';
            $category = $txCategories[$t % count($txCategories)];
            $amount = rand(500, 75000) * 1000.00;
            $status = ($t % 15 == 0) ? 'pending' : (($t % 20 == 0) ? 'failed' : 'processed');

            Transaction::create([
                'code' => 'TRX-'.date('Ymd').'-'.str_pad($t, 4, '0', STR_PAD_LEFT),
                'type' => $type,
                'category' => $category,
                'party_name' => $isInternal ? 'MSI Internal Finance & Warehouse Division' : 'Mitra Vendor / Pelanggan Terdaftar #'.$t,
                'amount' => $amount,
                'mode' => $mode,
                'status' => $status,
                'source_document' => 'DOC-PO-2026-'.(2000 + $t).'.PDF',
                'notes' => 'Transaksi TPS diproses otomatis oleh modul transaksi MSI gateway.',
                'processed_at' => now()->subDays(rand(1, 45)),
                'created_at' => now()->subDays(rand(1, 45)),
                'updated_at' => now(),
            ]);
        }

        // 7. Create 24 Sales Performance Records (Bab 2 DSS & Exception Reporting)
        $regions = [
            'DKI Jakarta',
            'Jawa Barat & Banten',
            'Jawa Tengah & DIY',
            'Jawa Timur & Bali',
            'Sumatera Bagian Utara',
            'Sulawesi & Indonesia Timur',
        ];

        $salespeople = [
            'Aditya Pratama',
            'Siti Rahmawati',
            'Budi Setiawan',
            'Dian Permatasari',
            'Rian Hidayat',
            'Farhan Maulana',
        ];

        $months = ['Januari 2026', 'Februari 2026', 'Maret 2026', 'April 2026'];

        $perfIdx = 0;
        foreach ($months as $m) {
            foreach ($regions as $rIdx => $reg) {
                $target = 35000.00;

                if ($perfIdx == 3) {
                    $actual = 8450.00; // Exception: Underperforming (< $10,000)
                } elseif ($perfIdx == 7 || $perfIdx == 18) {
                    $actual = 62800.00; // Exception: High Outlier (> $50,000)
                } else {
                    $actual = rand(22, 48) * 1000.00 + rand(100, 990);
                }

                SalesPerformance::create([
                    'salesperson_name' => $salespeople[$rIdx % count($salespeople)],
                    'region' => $reg,
                    'month' => $m,
                    'target_amount' => $target,
                    'actual_sales' => $actual,
                    'transaction_count' => rand(40, 180),
                    'created_at' => now()->subMonths(4 - array_search($m, $months)),
                    'updated_at' => now(),
                ]);
                $perfIdx++;
            }
        }

        // 8. Create 8 OAS Memos (Bab 2 Office Automation System)
        $memosData = [
            [
                'title' => 'Instruksi Pemeliharaan Infrastruktur Server & Cloud Backup Rutin',
                'sender' => 'Chief Technology Officer (CTO)',
                'recipient' => 'Seluruh Tim DevOps & Database Administrator',
                'department' => 'Information Technology',
                'priority' => 'urgent',
                'content' => 'Sehubungan dengan peningkatan volume transaksi e-commerce, seluruh unit server akan menjalankan snapshot backup otomatis setiap pukul 02:00 WIB. Pastikan database replica tetap tersinkronisasi tanpa latensi.',
                'document_type' => 'Memo Operasional',
            ],
            [
                'title' => 'Kebijakan Standarisasi Pengemasan Barang Sensitif & Hardware High-End',
                'sender' => 'Kepala Divisi Logistik & Gudang',
                'recipient' => 'Staf Operasional Fulfillment',
                'department' => 'Logistics & Supply Chain',
                'priority' => 'normal',
                'content' => 'Setiap pengiriman laptop, kamera mirrorless, dan komponen PC wajib menggunakan pelindung bantalan udara (bubble wrap) 5 lapis serta segel lakban anti-tamper berlogo APEX.',
                'document_type' => 'Standard Operating Procedure',
            ],
            [
                'title' => 'Pengumuman Pencapaian Target Penjualan Kuartal I Tahun 2026',
                'sender' => 'Direktur Utama',
                'recipient' => 'Seluruh Karyawan & Divisi MSI',
                'department' => 'Executive Office',
                'priority' => 'normal',
                'content' => 'Kami mengapresiasi kerja keras seluruh tim atas tercapainya omzet penjualan retail melampaui Rp 350.000.000,- pada periode awal tahun 2026. Program insentif performa akan disalurkan akhir bulan ini.',
                'document_type' => 'Surat Edaran',
            ],
            [
                'title' => 'Protokol Keamanan Data Pelanggan & Enkripsi Kata Sandi',
                'sender' => 'Information Security Lead',
                'recipient' => 'Pengembang Aplikasi & Web Engineer',
                'department' => 'Cybersecurity',
                'priority' => 'confidential',
                'content' => 'Seluruh kata sandi pengguna wajib menggunakan hashing standar industri Bcrypt rounds 12. Larangan keras mencatat plaintext password pada file logging atau kanal publik apa pun.',
                'document_type' => 'Instruksi Keamanan',
            ],
            [
                'title' => 'Jadwal Stock Opname & Audit Inventaris Komponen Triwulan II',
                'sender' => 'Internal Audit Team',
                'recipient' => 'Supervisor Gudang Utama Yogyakarta',
                'department' => 'Finance & Audit',
                'priority' => 'normal',
                'content' => 'Pelaksanaan stock opname fisik terhadap prosesor, VGA, dan SSD akan diselenggarakan pada hari Sabtu mendatang. Mohon siapkan lembar pencatatan barcode scanner.',
                'document_type' => 'Pemberitahuan Audit',
            ],
            [
                'title' => 'Rencana Peluncuran Program Garansi Ganti Baru 14 Hari',
                'sender' => 'Head of Customer Relations',
                'recipient' => 'Tim Layanan Pelanggan & Aftersales',
                'department' => 'Customer Care',
                'priority' => 'normal',
                'content' => 'Mulai tanggal 1 bulan depan, APEX Store memberlakukan program jaminan tukar baru untuk unit dengan cacat pabrik dalam kurun 14 hari kerja sejak barang diterima pembeli.',
                'document_type' => 'Memo Kebijakan',
            ],
            [
                'title' => 'Pengadaan Lisensi Software Monitoring Performa Server',
                'sender' => 'Lead Infrastructure Engineer',
                'recipient' => 'Bagian Pengadaan & Purchasing',
                'department' => 'Procurement',
                'priority' => 'normal',
                'content' => 'Pengajuan perpanjangan langganan monitoring APM Datadog dan sentry error tracking untuk cluster server aplikasi e-commerce periode tahunan.',
                'document_type' => 'Formulir Permohonan',
            ],
            [
                'title' => 'Penyesuaian Jam Operasional Ekspedisi Pengiriman Selama Libur Nasional',
                'sender' => 'Manajer Operasional',
                'recipient' => 'Seluruh Pelanggan & Mitra Kurir',
                'department' => 'Operational Management',
                'priority' => 'urgent',
                'content' => 'Pengiriman reguler akan mengalami jeda 1 hari saat tanggal merah libur nasional. Layanan Instant Courier (Gojek/Grab) tetap melayani pesanan di wilayah Jabodetabek dan DIY.',
                'document_type' => 'Surat Pemberitahuan',
            ],
        ];

        foreach ($memosData as $memo) {
            OasMemo::create($memo);
        }

        // 9. Create 15 Records in user_info (Which automatically fires MySQL Trigger `after_user_info_insert` to populate `user_info_backup` - Bab 4)
        $sampleUserInfo = [
            ['first_name' => 'Ahmad', 'last_name' => 'Fauzi', 'email' => 'ahmad.fauzi@gmail.com', 'password' => 'fauzi123', 'mobile' => '08123456701', 'address1' => 'Jl. Kaliurang KM 5', 'address2' => 'Sleman'],
            ['first_name' => 'Rini', 'last_name' => 'Astuti', 'email' => 'rini.astuti@gmail.com', 'password' => 'rini456', 'mobile' => '08123456702', 'address1' => 'Jl. Sudirman No. 12', 'address2' => 'Jakarta'],
            ['first_name' => 'Bagus', 'last_name' => 'Kurniawan', 'email' => 'bagus.k@gmail.com', 'password' => 'bagus789', 'mobile' => '08123456703', 'address1' => 'Jl. Riau No. 44', 'address2' => 'Bandung'],
            ['first_name' => 'Dewi', 'last_name' => 'Sartika', 'email' => 'dewi.sartika@gmail.com', 'password' => 'dewi123', 'mobile' => '08123456704', 'address1' => 'Jl. Diponegoro No. 8', 'address2' => 'Semarang'],
            ['first_name' => 'Tri', 'last_name' => 'Wahyudi', 'email' => 'tri.wahyudi@gmail.com', 'password' => 'tri456', 'mobile' => '08123456705', 'address1' => 'Jl. Basuki Rahmat 99', 'address2' => 'Surabaya'],
            ['first_name' => 'Mega', 'last_name' => 'Utami', 'email' => 'mega.utami@gmail.com', 'password' => 'mega789', 'mobile' => '08123456706', 'address1' => 'Jl. Hayam Wuruk 17', 'address2' => 'Denpasar'],
            ['first_name' => 'Ilham', 'last_name' => 'Saputra', 'email' => 'ilham.s@gmail.com', 'password' => 'ilham123', 'mobile' => '08123456707', 'address1' => 'Jl. Pemuda No. 3', 'address2' => 'Medan'],
            ['first_name' => 'Nurul', 'last_name' => 'Hidayah', 'email' => 'nurul.h@gmail.com', 'password' => 'nurul456', 'mobile' => '08123456708', 'address1' => 'Jl. Pettarani No. 50', 'address2' => 'Makassar'],
            ['first_name' => 'Bayu', 'last_name' => 'Pradana', 'email' => 'bayu.p@gmail.com', 'password' => 'bayu789', 'mobile' => '08123456709', 'address1' => 'Jl. Pahlawan No. 22', 'address2' => 'Bogor'],
            ['first_name' => 'Lestari', 'last_name' => 'Putri', 'email' => 'lestari.p@gmail.com', 'password' => 'lestari123', 'mobile' => '08123456710', 'address1' => 'Jl. Veteran No. 88', 'address2' => 'Malang'],
            ['first_name' => 'Doni', 'last_name' => 'Kusuma', 'email' => 'doni.k@gmail.com', 'password' => 'doni456', 'mobile' => '08123456711', 'address1' => 'Jl. Gajah Mada No. 10', 'address2' => 'Solo'],
            ['first_name' => 'Ratna', 'last_name' => 'Sari', 'email' => 'ratna.sari@gmail.com', 'password' => 'ratna789', 'mobile' => '08123456712', 'address1' => 'Jl. Jenderal Sudirman 100', 'address2' => 'Palembang'],
            ['first_name' => 'Arif', 'last_name' => 'Wicaksono', 'email' => 'arif.w@gmail.com', 'password' => 'arif123', 'mobile' => '08123456713', 'address1' => 'Jl. Kusumanegara No. 4', 'address2' => 'Yogyakarta'],
            ['first_name' => 'Siska', 'last_name' => 'Anggraini', 'email' => 'siska.a@gmail.com', 'password' => 'siska456', 'mobile' => '08123456714', 'address1' => 'Jl. Asia Afrika No. 6', 'address2' => 'Bandung'],
            ['first_name' => 'Hendra', 'last_name' => 'Gunawan', 'email' => 'hendra.g@gmail.com', 'password' => 'hendra789', 'mobile' => '08123456715', 'address1' => 'Jl. Thamrin No. 80', 'address2' => 'Jakarta'],
        ];

        foreach ($sampleUserInfo as $u) {
            DB::table('user_info')->insert(array_merge($u, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // 10. Create 20 Newsletter Subscribers in email_info (Bab 4)
        $emails = [
            'newsletter.tech@gmail.com',
            'hardware.enthusiast@yahoo.com',
            'gadget.reviewer@gmail.com',
            'pc.masterrace.id@gmail.com',
            'indonesia.overclock@outlook.com',
            'pro.photographer@studio.com',
            'gamer.sejati@gmail.com',
            'workstation.builds@tech.id',
            'creative.designer@agency.id',
            'devops.engineer@cloud.id',
            'audiophile.indo@gmail.com',
            'apple.fanboy@icloud.com',
            'android.poweruser@gmail.com',
            'cinematography.hub@cinema.id',
            'streamer.id@live.tv',
            'data.analyst@fintech.co.id',
            'system.architect@enterprise.id',
            'it.procurement@corporation.co.id',
            'crypto.miner@hashrate.net',
            'student.informatics@campus.ac.id',
        ];

        foreach ($emails as $em) {
            DB::table('email_info')->insert([
                'email' => $em,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
