<?php

namespace App\Services;

use App\Models\Product;

class BuildCompatibilityService
{
    /**
     * Canonical slot definitions for the interactive 3D PC builder.
     *
     * @return array<int, array{key: string, label: string, short: string, required: bool, order: int}>
     */
    public function slots(): array
    {
        return [
            ['key' => 'case', 'label' => 'Casing', 'short' => 'CASE', 'required' => true, 'order' => 1],
            ['key' => 'motherboard', 'label' => 'Motherboard', 'short' => 'MOBO', 'required' => true, 'order' => 2],
            ['key' => 'cpu', 'label' => 'Prosesor', 'short' => 'CPU', 'required' => true, 'order' => 3],
            ['key' => 'ram', 'label' => 'Memori RAM', 'short' => 'RAM', 'required' => true, 'order' => 4],
            ['key' => 'gpu', 'label' => 'Kartu Grafis', 'short' => 'GPU', 'required' => true, 'order' => 5],
            ['key' => 'cooler', 'label' => 'Pendingin CPU', 'short' => 'COOLER', 'required' => true, 'order' => 6],
            ['key' => 'storage', 'label' => 'Penyimpanan', 'short' => 'SSD/HDD', 'required' => true, 'order' => 7],
            ['key' => 'psu', 'label' => 'Power Supply', 'short' => 'PSU', 'required' => true, 'order' => 8],
            ['key' => 'fan', 'label' => 'Kipas Casing', 'short' => 'FAN', 'required' => false, 'order' => 9],
        ];
    }

    /**
     * Evaluate whether a candidate product fits into the given build without conflicts.
     *
     * @param  array<string, Product|array<string, mixed>>  $build
     * @return array{
     *     compatible: bool,
     *     headline: ?string,
     *     conflicts: array<int, array{against_slot: string, against_name: string, rule: string, message: string}>
     * }
     */
    public function evaluateCandidate(array $build, string $slot, Product $candidate): array
    {
        $candidateType = (string) ($candidate->component_type ?? '');

        if ($candidateType !== $slot) {
            return [
                'compatible' => false,
                'headline' => "Produk {$candidate->name} bukan komponen untuk slot {$this->slotLabel($slot)}.",
                'conflicts' => [[
                    'against_slot' => $slot,
                    'against_name' => $candidate->name,
                    'rule' => 'slot_type',
                    'message' => "Tipe komponen produk ini adalah {$candidateType}, tidak sesuai dengan slot {$this->slotLabel($slot)}.",
                ]],
            ];
        }

        $hypothetical = $build;
        $hypothetical[$slot] = $candidate;

        $allConflicts = $this->collectConflicts($hypothetical);
        $relevant = array_values(array_filter(
            $allConflicts,
            fn (array $conflict): bool => $conflict['slot_a'] === $slot || $conflict['slot_b'] === $slot
        ));

        if ($relevant === []) {
            return [
                'compatible' => true,
                'headline' => null,
                'conflicts' => [],
            ];
        }

        $formatted = [];
        foreach ($relevant as $conflict) {
            $againstSlot = $conflict['slot_a'] === $slot ? $conflict['slot_b'] : $conflict['slot_a'];
            $againstName = $conflict['slot_a'] === $slot ? $conflict['name_b'] : $conflict['name_a'];
            $againstLabel = $this->slotLabel($againstSlot);

            $formatted[] = [
                'against_slot' => $againstSlot,
                'against_name' => $againstName,
                'rule' => $conflict['rule'],
                'message' => "Tidak cocok dengan {$againstLabel} {$againstName} yang Anda pilih — {$conflict['reason']}",
            ];
        }

        return [
            'compatible' => false,
            'headline' => $formatted[0]['message'],
            'conflicts' => $formatted,
        ];
    }

    /**
     * Evaluate the entire build state, returning diagnostic checks, wattage, and price summary.
     *
     * @param  array<string, Product|array<string, mixed>>  $build
     * @return array<string, mixed>
     */
    public function evaluateBuild(array $build): array
    {
        $normalized = $this->normalizeBuild($build);
        $conflicts = $this->collectConflicts($normalized);
        $wattage = $this->calculateWattage($normalized);

        $missingRequired = [];
        $installedCount = 0;
        $totalPrice = 0.0;

        foreach ($this->slots() as $slotDef) {
            $key = $slotDef['key'];
            $part = $normalized[$key] ?? null;

            if ($part !== null) {
                $installedCount++;
                $totalPrice += (float) ($part['price'] ?? 0);
            } elseif ($slotDef['required']) {
                $missingRequired[] = [
                    'slot' => $key,
                    'label' => $slotDef['label'],
                ];
            }
        }

        $checks = $this->buildDiagnosticMatrix($normalized, $conflicts, $wattage);

        return [
            'compatible' => $conflicts === [],
            'complete' => $missingRequired === [],
            'ready' => $conflicts === [] && $missingRequired === [],
            'installed_count' => $installedCount,
            'required_count' => count(array_filter($this->slots(), fn (array $s): bool => $s['required'])),
            'total_price' => $totalPrice,
            'total_wattage_w' => $wattage['total_w'],
            'recommended_psu_w' => $wattage['recommended_psu_w'],
            'psu_wattage_w' => $wattage['psu_w'],
            'missing_required' => $missingRequired,
            'conflicts' => $conflicts,
            'checks' => $checks,
        ];
    }

    /**
     * @param  array<string, Product|array<string, mixed>>  $build
     * @return array<string, array<string, mixed>>
     */
    private function normalizeBuild(array $build): array
    {
        $normalized = [];

        foreach ($build as $slot => $item) {
            if ($item instanceof Product) {
                $normalized[$slot] = [
                    'id' => $item->id,
                    'name' => $item->name,
                    'slug' => $item->slug,
                    'component_type' => $item->component_type,
                    'price' => (float) $item->price,
                    'stock' => (int) $item->stock,
                    'specs' => is_array($item->specs) ? $item->specs : [],
                ];
            } elseif (is_array($item) && isset($item['id'])) {
                $normalized[$slot] = $item;
            }
        }

        return $normalized;
    }

    /**
     * @param  array<string, Product|array<string, mixed>>  $build
     * @return array<int, array{slot_a: string, name_a: string, slot_b: string, name_b: string, rule: string, reason: string}>
     */
    private function collectConflicts(array $build): array
    {
        $parts = $this->normalizeBuild($build);
        $conflicts = [];

        $cpu = $parts['cpu'] ?? null;
        $mobo = $parts['motherboard'] ?? null;
        $ram = $parts['ram'] ?? null;
        $gpu = $parts['gpu'] ?? null;
        $cooler = $parts['cooler'] ?? null;
        $storage = $parts['storage'] ?? null;
        $case = $parts['case'] ?? null;
        $psu = $parts['psu'] ?? null;

        // 1. CPU <-> Motherboard socket & memory controller compatibility
        if ($cpu !== null && $mobo !== null) {
            $cpuSocket = (string) ($cpu['specs']['socket'] ?? '');
            $moboSocket = (string) ($mobo['specs']['socket'] ?? '');

            if ($cpuSocket !== '' && $moboSocket !== '' && $cpuSocket !== $moboSocket) {
                $conflicts[] = [
                    'slot_a' => 'cpu',
                    'name_a' => $cpu['name'],
                    'slot_b' => 'motherboard',
                    'name_b' => $mobo['name'],
                    'rule' => 'cpu_socket',
                    'reason' => "soket CPU {$cpuSocket} tidak sesuai dengan soket motherboard {$moboSocket}.",
                ];
            }

            $cpuMemory = (array) ($cpu['specs']['supported_memory'] ?? []);
            $moboMemory = (string) ($mobo['specs']['memory_type'] ?? '');

            if ($cpuMemory !== [] && $moboMemory !== '' && ! in_array($moboMemory, $cpuMemory, true)) {
                $supportedList = implode('/', $cpuMemory);
                $conflicts[] = [
                    'slot_a' => 'cpu',
                    'name_a' => $cpu['name'],
                    'slot_b' => 'motherboard',
                    'name_b' => $mobo['name'],
                    'rule' => 'cpu_mobo_memory',
                    'reason' => "prosesor hanya mendukung RAM {$supportedList}, sedangkan motherboard memakai slot {$moboMemory}.",
                ];
            }
        }

        // 2. RAM <-> Motherboard memory type, slot count, capacity
        if ($ram !== null && $mobo !== null) {
            $ramType = (string) ($ram['specs']['memory_type'] ?? '');
            $moboMemory = (string) ($mobo['specs']['memory_type'] ?? '');

            if ($ramType !== '' && $moboMemory !== '' && $ramType !== $moboMemory) {
                $conflicts[] = [
                    'slot_a' => 'ram',
                    'name_a' => $ram['name'],
                    'slot_b' => 'motherboard',
                    'name_b' => $mobo['name'],
                    'rule' => 'ram_type',
                    'reason' => "modul memori {$ramType} tidak kompatibel dengan slot {$moboMemory} pada motherboard.",
                ];
            }

            $ramModules = (int) ($ram['specs']['modules'] ?? 0);
            $moboSlots = (int) ($mobo['specs']['memory_slots'] ?? 0);
            if ($ramModules > 0 && $moboSlots > 0 && $ramModules > $moboSlots) {
                $conflicts[] = [
                    'slot_a' => 'ram',
                    'name_a' => $ram['name'],
                    'slot_b' => 'motherboard',
                    'name_b' => $mobo['name'],
                    'rule' => 'ram_slots',
                    'reason' => "kit RAM berisi {$ramModules} keping, melebihi {$moboSlots} slot DIMM motherboard.",
                ];
            }

            $ramCap = (int) ($ram['specs']['capacity_gb'] ?? 0);
            $moboMaxCap = (int) ($mobo['specs']['max_memory_gb'] ?? 0);
            if ($ramCap > 0 && $moboMaxCap > 0 && $ramCap > $moboMaxCap) {
                $conflicts[] = [
                    'slot_a' => 'ram',
                    'name_a' => $ram['name'],
                    'slot_b' => 'motherboard',
                    'name_b' => $mobo['name'],
                    'rule' => 'ram_capacity',
                    'reason' => "kapasitas RAM {$ramCap} GB melebihi batas maksimal motherboard {$moboMaxCap} GB.",
                ];
            }
        }

        // 3. RAM <-> CPU memory type
        if ($ram !== null && $cpu !== null) {
            $ramType = (string) ($ram['specs']['memory_type'] ?? '');
            $cpuMemory = (array) ($cpu['specs']['supported_memory'] ?? []);

            if ($ramType !== '' && $cpuMemory !== [] && ! in_array($ramType, $cpuMemory, true)) {
                $supportedList = implode('/', $cpuMemory);
                $conflicts[] = [
                    'slot_a' => 'ram',
                    'name_a' => $ram['name'],
                    'slot_b' => 'cpu',
                    'name_b' => $cpu['name'],
                    'rule' => 'cpu_ram_type',
                    'reason' => "prosesor hanya mendukung memori {$supportedList}, tidak cocok dengan modul {$ramType}.",
                ];
            }
        }

        // 4. Motherboard <-> Case form factor
        if ($mobo !== null && $case !== null) {
            $formFactor = (string) ($mobo['specs']['form_factor'] ?? '');
            $supported = (array) ($case['specs']['supported_form_factors'] ?? []);

            if ($formFactor !== '' && $supported !== [] && ! in_array($formFactor, $supported, true)) {
                $supportedList = implode(', ', $supported);
                $conflicts[] = [
                    'slot_a' => 'motherboard',
                    'name_a' => $mobo['name'],
                    'slot_b' => 'case',
                    'name_b' => $case['name'],
                    'rule' => 'case_form_factor',
                    'reason' => "form factor motherboard {$formFactor} tidak muat di casing (hanya mendukung {$supportedList}).",
                ];
            }
        }

        // 5. GPU <-> Case length clearance
        if ($gpu !== null && $case !== null) {
            $gpuLen = (int) ($gpu['specs']['length_mm'] ?? 0);
            $maxGpuLen = (int) ($case['specs']['max_gpu_length_mm'] ?? 0);

            if ($gpuLen > 0 && $maxGpuLen > 0 && $gpuLen > $maxGpuLen) {
                $conflicts[] = [
                    'slot_a' => 'gpu',
                    'name_a' => $gpu['name'],
                    'slot_b' => 'case',
                    'name_b' => $case['name'],
                    'rule' => 'gpu_clearance',
                    'reason' => "panjang GPU {$gpuLen} mm melebihi ruang maksimal casing {$maxGpuLen} mm.",
                ];
            }
        }

        // 6. Cooler <-> CPU / Motherboard socket support
        if ($cooler !== null) {
            $coolerSockets = (array) ($cooler['specs']['supported_sockets'] ?? []);

            if ($cpu !== null && $coolerSockets !== []) {
                $cpuSocket = (string) ($cpu['specs']['socket'] ?? '');
                if ($cpuSocket !== '' && ! in_array($cpuSocket, $coolerSockets, true)) {
                    $conflicts[] = [
                        'slot_a' => 'cooler',
                        'name_a' => $cooler['name'],
                        'slot_b' => 'cpu',
                        'name_b' => $cpu['name'],
                        'rule' => 'cooler_socket',
                        'reason' => "bracket pendingin tidak mendukung soket CPU {$cpuSocket}.",
                    ];
                }
            }

            if ($mobo !== null && $coolerSockets !== []) {
                $moboSocket = (string) ($mobo['specs']['socket'] ?? '');
                if ($moboSocket !== '' && ! in_array($moboSocket, $coolerSockets, true)) {
                    $conflicts[] = [
                        'slot_a' => 'cooler',
                        'name_a' => $cooler['name'],
                        'slot_b' => 'motherboard',
                        'name_b' => $mobo['name'],
                        'rule' => 'cooler_mobo_socket',
                        'reason' => "bracket pendingin tidak mendukung soket motherboard {$moboSocket}.",
                    ];
                }
            }
        }

        // 7. Cooler <-> Case physical clearance (radiator or tower height)
        if ($cooler !== null && $case !== null) {
            $coolerType = (string) ($cooler['specs']['cooler_type'] ?? '');
            $radMm = (int) ($cooler['specs']['radiator_mm'] ?? 0);
            $maxRadMm = (int) ($case['specs']['max_radiator_mm'] ?? 0);

            if ($coolerType === 'AIO' && $radMm > 0 && $maxRadMm > 0 && $radMm > $maxRadMm) {
                $conflicts[] = [
                    'slot_a' => 'cooler',
                    'name_a' => $cooler['name'],
                    'slot_b' => 'case',
                    'name_b' => $case['name'],
                    'rule' => 'cooler_radiator',
                    'reason' => "radiator AIO {$radMm} mm melebihi dukungan radiator casing {$maxRadMm} mm.",
                ];
            }

            $coolerHeight = (int) ($cooler['specs']['height_mm'] ?? 0);
            $maxCoolerHeight = (int) ($case['specs']['max_cooler_height_mm'] ?? 0);

            if ($coolerType === 'Air' && $coolerHeight > 0 && $maxCoolerHeight > 0 && $coolerHeight > $maxCoolerHeight) {
                $conflicts[] = [
                    'slot_a' => 'cooler',
                    'name_a' => $cooler['name'],
                    'slot_b' => 'case',
                    'name_b' => $case['name'],
                    'rule' => 'cooler_height',
                    'reason' => "tinggi air cooler {$coolerHeight} mm melebihi batas tinggi casing {$maxCoolerHeight} mm.",
                ];
            }
        }

        // 8. Storage <-> Case & Motherboard interface support
        if ($storage !== null) {
            $interface = (string) ($storage['specs']['interface'] ?? '');

            if ($interface === 'SATA 3.5"' && $case !== null) {
                $bays = (int) ($case['specs']['drive_bays_35'] ?? 0);
                if ($bays <= 0) {
                    $conflicts[] = [
                        'slot_a' => 'storage',
                        'name_a' => $storage['name'],
                        'slot_b' => 'case',
                        'name_b' => $case['name'],
                        'rule' => 'storage_bay',
                        'reason' => 'casing ini tidak memiliki ruang drive bay 3.5 inci untuk HDD.',
                    ];
                }
            }

            if ($interface === 'M.2 NVMe' && $mobo !== null) {
                $m2Slots = (int) ($mobo['specs']['m2_slots'] ?? 0);
                if ($m2Slots <= 0) {
                    $conflicts[] = [
                        'slot_a' => 'storage',
                        'name_a' => $storage['name'],
                        'slot_b' => 'motherboard',
                        'name_b' => $mobo['name'],
                        'rule' => 'storage_m2',
                        'reason' => 'motherboard tidak memiliki slot M.2 NVMe.',
                    ];
                }
            }
        }

        // 9. PSU <-> Case form factor (ATX vs SFX)
        if ($psu !== null && $case !== null) {
            $psuFf = (string) ($psu['specs']['form_factor'] ?? '');
            $supportedPsu = (array) ($case['specs']['psu_form_factors'] ?? []);

            if ($psuFf !== '' && $supportedPsu !== [] && ! in_array($psuFf, $supportedPsu, true)) {
                $supportedList = implode('/', $supportedPsu);
                $conflicts[] = [
                    'slot_a' => 'psu',
                    'name_a' => $psu['name'],
                    'slot_b' => 'case',
                    'name_b' => $case['name'],
                    'rule' => 'psu_form_factor',
                    'reason' => "ukuran PSU {$psuFf} tidak muat di casing (hanya mendukung PSU {$supportedList}).",
                ];
            }
        }

        // 10. PSU <-> Wattage load & GPU recommended PSU
        if ($psu !== null) {
            $psuWatt = (int) ($psu['specs']['wattage_w'] ?? 0);
            $wattage = $this->calculateWattage($parts);

            if ($psuWatt > 0) {
                $gpuRec = $gpu !== null ? (int) ($gpu['specs']['recommended_psu_w'] ?? 0) : 0;

                if ($gpu !== null && $gpuRec > 0 && $psuWatt < $gpuRec) {
                    $conflicts[] = [
                        'slot_a' => 'psu',
                        'name_a' => $psu['name'],
                        'slot_b' => 'gpu',
                        'name_b' => $gpu['name'],
                        'rule' => 'psu_gpu_wattage',
                        'reason' => "kapasitas PSU {$psuWatt} W kurang dari kebutuhan minimal GPU ({$gpuRec} W).",
                    ];
                } elseif ($psuWatt < $wattage['recommended_psu_w']) {
                    $anchorSlot = $gpu !== null ? 'gpu' : ($cpu !== null ? 'cpu' : 'motherboard');
                    $anchorName = $parts[$anchorSlot]['name'] ?? 'sistem';
                    $conflicts[] = [
                        'slot_a' => 'psu',
                        'name_a' => $psu['name'],
                        'slot_b' => $anchorSlot,
                        'name_b' => $anchorName,
                        'rule' => 'psu_system_wattage',
                        'reason' => "estimasi daya sistem + headroom ({$wattage['recommended_psu_w']} W) melampaui kapasitas PSU {$psuWatt} W.",
                    ];
                }
            }
        }

        return $conflicts;
    }

    /**
     * @param  array<string, array<string, mixed>>  $parts
     * @return array{total_w: int, recommended_psu_w: int, psu_w: ?int}
     */
    private function calculateWattage(array $parts): array
    {
        $totalW = 0;

        foreach ($parts as $slot => $part) {
            if ($slot === 'psu' || $slot === 'case') {
                continue;
            }

            $totalW += (int) ($part['specs']['tdp_w'] ?? 0);
        }

        $withHeadroom = $totalW > 0 ? (int) (ceil(($totalW * 1.15) / 50) * 50) : 0;
        $gpuRec = isset($parts['gpu']) ? (int) ($parts['gpu']['specs']['recommended_psu_w'] ?? 0) : 0;
        $psuW = isset($parts['psu']) ? (int) ($parts['psu']['specs']['wattage_w'] ?? 0) : null;

        return [
            'total_w' => $totalW,
            'recommended_psu_w' => max($withHeadroom, $gpuRec),
            'psu_w' => $psuW,
        ];
    }

    /**
     * Produce structured diagnostic lines for the compatibility matrix strip.
     *
     * @param  array<string, array<string, mixed>>  $parts
     * @param  array<int, array<string, string>>  $conflicts
     * @param  array{total_w: int, recommended_psu_w: int, psu_w: ?int}  $wattage
     * @return array<int, array{key: string, label: string, status: string, detail: string}>
     */
    private function buildDiagnosticMatrix(array $parts, array $conflicts, array $wattage): array
    {
        $findConflict = function (array $rules) use ($conflicts): ?array {
            foreach ($conflicts as $conflict) {
                if (in_array($conflict['rule'], $rules, true)) {
                    return $conflict;
                }
            }

            return null;
        };

        $rows = [];

        // Socket CPU <-> Motherboard
        $socketConflict = $findConflict(['cpu_socket', 'cpu_mobo_memory']);
        if ($socketConflict !== null) {
            $rows[] = ['key' => 'socket', 'label' => 'Soket CPU ↔ Board', 'status' => 'error', 'detail' => $socketConflict['reason']];
        } elseif (isset($parts['cpu'], $parts['motherboard'])) {
            $rows[] = [
                'key' => 'socket',
                'label' => 'Soket CPU ↔ Board',
                'status' => 'ok',
                'detail' => ($parts['cpu']['specs']['socket'] ?? '—').' cocok',
            ];
        } else {
            $rows[] = ['key' => 'socket', 'label' => 'Soket CPU ↔ Board', 'status' => 'pending', 'detail' => 'Pilih CPU & Motherboard'];
        }

        // Memory DDR
        $ramConflict = $findConflict(['ram_type', 'ram_slots', 'ram_capacity', 'cpu_ram_type']);
        if ($ramConflict !== null) {
            $rows[] = ['key' => 'ram', 'label' => 'Memori RAM', 'status' => 'error', 'detail' => $ramConflict['reason']];
        } elseif (isset($parts['ram'], $parts['motherboard'])) {
            $rows[] = [
                'key' => 'ram',
                'label' => 'Memori RAM',
                'status' => 'ok',
                'detail' => ($parts['ram']['specs']['memory_type'] ?? '—').' · '.($parts['ram']['specs']['capacity_gb'] ?? '—').' GB',
            ];
        } else {
            $rows[] = ['key' => 'ram', 'label' => 'Memori RAM', 'status' => 'pending', 'detail' => 'Menunggu RAM & Motherboard'];
        }

        // Form factor Case <-> Motherboard
        $caseConflict = $findConflict(['case_form_factor']);
        if ($caseConflict !== null) {
            $rows[] = ['key' => 'form_factor', 'label' => 'Form Factor Casing', 'status' => 'error', 'detail' => $caseConflict['reason']];
        } elseif (isset($parts['case'], $parts['motherboard'])) {
            $rows[] = [
                'key' => 'form_factor',
                'label' => 'Form Factor Casing',
                'status' => 'ok',
                'detail' => ($parts['motherboard']['specs']['form_factor'] ?? '—').' muat di casing',
            ];
        } else {
            $rows[] = ['key' => 'form_factor', 'label' => 'Form Factor Casing', 'status' => 'pending', 'detail' => 'Menunggu Casing & Motherboard'];
        }

        // GPU & Cooler physical clearance
        $clearanceConflict = $findConflict(['gpu_clearance', 'cooler_radiator', 'cooler_height', 'cooler_socket', 'cooler_mobo_socket', 'storage_bay', 'storage_m2']);
        if ($clearanceConflict !== null) {
            $rows[] = ['key' => 'clearance', 'label' => 'Clearance Dimensi', 'status' => 'error', 'detail' => $clearanceConflict['reason']];
        } elseif (isset($parts['case']) && (isset($parts['gpu']) || isset($parts['cooler']))) {
            $gpuLen = $parts['gpu']['specs']['length_mm'] ?? null;
            $maxGpu = $parts['case']['specs']['max_gpu_length_mm'] ?? null;
            $rows[] = [
                'key' => 'clearance',
                'label' => 'Clearance Dimensi',
                'status' => 'ok',
                'detail' => $gpuLen && $maxGpu ? "GPU {$gpuLen} / {$maxGpu} mm" : 'Semua dimensi fisik muat',
            ];
        } else {
            $rows[] = ['key' => 'clearance', 'label' => 'Clearance Dimensi', 'status' => 'pending', 'detail' => 'Cek panjang GPU & tinggi cooler'];
        }

        // PSU wattage & form factor
        $psuConflict = $findConflict(['psu_form_factor', 'psu_gpu_wattage', 'psu_system_wattage']);
        if ($psuConflict !== null) {
            $rows[] = ['key' => 'psu', 'label' => 'Kapasitas & Ukuran PSU', 'status' => 'error', 'detail' => $psuConflict['reason']];
        } elseif (isset($parts['psu'])) {
            $rows[] = [
                'key' => 'psu',
                'label' => 'Kapasitas & Ukuran PSU',
                'status' => 'ok',
                'detail' => "{$wattage['total_w']} W beban / {$wattage['psu_w']} W PSU",
            ];
        } else {
            $rows[] = [
                'key' => 'psu',
                'label' => 'Kapasitas & Ukuran PSU',
                'status' => 'pending',
                'detail' => $wattage['recommended_psu_w'] > 0 ? "Rekomendasi ≥ {$wattage['recommended_psu_w']} W" : 'Pilih Power Supply',
            ];
        }

        return $rows;
    }

    private function slotLabel(string $slot): string
    {
        foreach ($this->slots() as $entry) {
            if ($entry['key'] === $slot) {
                return $entry['label'];
            }
        }

        return ucfirst($slot);
    }
}
