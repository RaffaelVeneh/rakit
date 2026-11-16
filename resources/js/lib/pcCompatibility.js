/**
 * Client-side PC compatibility & specification helper.
 *
 * Mirrors App\Services\BuildCompatibilityService so slot filtering and rejection
 * notices react on the same frame the user clicks, while POST /rakit/validate
 * and POST /rakit/cart enforce the same rules on the server.
 */

export const SLOT_LABELS = {
    case: 'Casing',
    motherboard: 'Motherboard',
    cpu: 'Prosesor',
    ram: 'Memori RAM',
    gpu: 'Kartu Grafis',
    cooler: 'Pendingin CPU',
    storage: 'Penyimpanan',
    psu: 'Power Supply',
    fan: 'Kipas Casing',
};

export function slotLabel(slot) {
    return SLOT_LABELS[slot] || String(slot || '').toUpperCase();
}

export function calculateWattage(build = {}) {
    let totalW = 0;

    Object.entries(build).forEach(([slot, part]) => {
        if (!part || slot === 'psu' || slot === 'case') {
            return;
        }
        totalW += Number(part?.specs?.tdp_w) || 0;
    });

    const withHeadroom = totalW > 0 ? Math.ceil((totalW * 1.15) / 50) * 50 : 0;
    const gpuRec = Number(build?.gpu?.specs?.recommended_psu_w) || 0;
    const psuW = build?.psu ? Number(build.psu?.specs?.wattage_w) || 0 : null;

    return {
        totalW,
        recommendedPsuW: Math.max(withHeadroom, gpuRec),
        psuW,
    };
}

export function collectConflicts(build = {}) {
    const conflicts = [];

    const cpu = build.cpu || null;
    const mobo = build.motherboard || null;
    const ram = build.ram || null;
    const gpu = build.gpu || null;
    const cooler = build.cooler || null;
    const storage = build.storage || null;
    const pcCase = build.case || null;
    const psu = build.psu || null;

    // 1. CPU <-> Motherboard
    if (cpu && mobo) {
        const cpuSocket = String(cpu.specs?.socket || '');
        const moboSocket = String(mobo.specs?.socket || '');

        if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
            conflicts.push({
                slot_a: 'cpu',
                name_a: cpu.name,
                slot_b: 'motherboard',
                name_b: mobo.name,
                rule: 'cpu_socket',
                reason: `soket CPU ${cpuSocket} tidak sesuai dengan soket motherboard ${moboSocket}.`,
            });
        }

        const cpuMemory = Array.isArray(cpu.specs?.supported_memory) ? cpu.specs.supported_memory : [];
        const moboMemory = String(mobo.specs?.memory_type || '');

        if (cpuMemory.length > 0 && moboMemory && !cpuMemory.includes(moboMemory)) {
            conflicts.push({
                slot_a: 'cpu',
                name_a: cpu.name,
                slot_b: 'motherboard',
                name_b: mobo.name,
                rule: 'cpu_mobo_memory',
                reason: `prosesor hanya mendukung RAM ${cpuMemory.join('/')}, sedangkan motherboard memakai slot ${moboMemory}.`,
            });
        }
    }

    // 2. RAM <-> Motherboard
    if (ram && mobo) {
        const ramType = String(ram.specs?.memory_type || '');
        const moboMemory = String(mobo.specs?.memory_type || '');

        if (ramType && moboMemory && ramType !== moboMemory) {
            conflicts.push({
                slot_a: 'ram',
                name_a: ram.name,
                slot_b: 'motherboard',
                name_b: mobo.name,
                rule: 'ram_type',
                reason: `modul memori ${ramType} tidak kompatibel dengan slot ${moboMemory} pada motherboard.`,
            });
        }

        const ramModules = Number(ram.specs?.modules) || 0;
        const moboSlots = Number(mobo.specs?.memory_slots) || 0;
        if (ramModules > 0 && moboSlots > 0 && ramModules > moboSlots) {
            conflicts.push({
                slot_a: 'ram',
                name_a: ram.name,
                slot_b: 'motherboard',
                name_b: mobo.name,
                rule: 'ram_slots',
                reason: `kit RAM berisi ${ramModules} keping, melebihi ${moboSlots} slot DIMM motherboard.`,
            });
        }

        const ramCap = Number(ram.specs?.capacity_gb) || 0;
        const moboMaxCap = Number(mobo.specs?.max_memory_gb) || 0;
        if (ramCap > 0 && moboMaxCap > 0 && ramCap > moboMaxCap) {
            conflicts.push({
                slot_a: 'ram',
                name_a: ram.name,
                slot_b: 'motherboard',
                name_b: mobo.name,
                rule: 'ram_capacity',
                reason: `kapasitas RAM ${ramCap} GB melebihi batas maksimal motherboard ${moboMaxCap} GB.`,
            });
        }
    }

    // 3. RAM <-> CPU
    if (ram && cpu) {
        const ramType = String(ram.specs?.memory_type || '');
        const cpuMemory = Array.isArray(cpu.specs?.supported_memory) ? cpu.specs.supported_memory : [];

        if (ramType && cpuMemory.length > 0 && !cpuMemory.includes(ramType)) {
            conflicts.push({
                slot_a: 'ram',
                name_a: ram.name,
                slot_b: 'cpu',
                name_b: cpu.name,
                rule: 'cpu_ram_type',
                reason: `prosesor hanya mendukung memori ${cpuMemory.join('/')}, tidak cocok dengan modul ${ramType}.`,
            });
        }
    }

    // 4. Motherboard <-> Case
    if (mobo && pcCase) {
        const formFactor = String(mobo.specs?.form_factor || '');
        const supported = Array.isArray(pcCase.specs?.supported_form_factors)
            ? pcCase.specs.supported_form_factors
            : [];

        if (formFactor && supported.length > 0 && !supported.includes(formFactor)) {
            conflicts.push({
                slot_a: 'motherboard',
                name_a: mobo.name,
                slot_b: 'case',
                name_b: pcCase.name,
                rule: 'case_form_factor',
                reason: `form factor motherboard ${formFactor} tidak muat di casing (hanya mendukung ${supported.join(', ')}).`,
            });
        }
    }

    // 5. GPU <-> Case
    if (gpu && pcCase) {
        const gpuLen = Number(gpu.specs?.length_mm) || 0;
        const maxGpuLen = Number(pcCase.specs?.max_gpu_length_mm) || 0;

        if (gpuLen > 0 && maxGpuLen > 0 && gpuLen > maxGpuLen) {
            conflicts.push({
                slot_a: 'gpu',
                name_a: gpu.name,
                slot_b: 'case',
                name_b: pcCase.name,
                rule: 'gpu_clearance',
                reason: `panjang GPU ${gpuLen} mm melebihi ruang maksimal casing ${maxGpuLen} mm.`,
            });
        }
    }

    // 6. Cooler <-> CPU & Motherboard socket
    if (cooler) {
        const coolerSockets = Array.isArray(cooler.specs?.supported_sockets)
            ? cooler.specs.supported_sockets
            : [];

        if (cpu && coolerSockets.length > 0) {
            const cpuSocket = String(cpu.specs?.socket || '');
            if (cpuSocket && !coolerSockets.includes(cpuSocket)) {
                conflicts.push({
                    slot_a: 'cooler',
                    name_a: cooler.name,
                    slot_b: 'cpu',
                    name_b: cpu.name,
                    rule: 'cooler_socket',
                    reason: `bracket pendingin tidak mendukung soket CPU ${cpuSocket}.`,
                });
            }
        }

        if (mobo && coolerSockets.length > 0) {
            const moboSocket = String(mobo.specs?.socket || '');
            if (moboSocket && !coolerSockets.includes(moboSocket)) {
                conflicts.push({
                    slot_a: 'cooler',
                    name_a: cooler.name,
                    slot_b: 'motherboard',
                    name_b: mobo.name,
                    rule: 'cooler_mobo_socket',
                    reason: `bracket pendingin tidak mendukung soket motherboard ${moboSocket}.`,
                });
            }
        }
    }

    // 7. Cooler <-> Case physical clearance
    if (cooler && pcCase) {
        const coolerType = String(cooler.specs?.cooler_type || '');
        const radMm = Number(cooler.specs?.radiator_mm) || 0;
        const maxRadMm = Number(pcCase.specs?.max_radiator_mm) || 0;

        if (coolerType === 'AIO' && radMm > 0 && maxRadMm > 0 && radMm > maxRadMm) {
            conflicts.push({
                slot_a: 'cooler',
                name_a: cooler.name,
                slot_b: 'case',
                name_b: pcCase.name,
                rule: 'cooler_radiator',
                reason: `radiator AIO ${radMm} mm melebihi dukungan radiator casing ${maxRadMm} mm.`,
            });
        }

        const coolerHeight = Number(cooler.specs?.height_mm) || 0;
        const maxCoolerHeight = Number(pcCase.specs?.max_cooler_height_mm) || 0;

        if (coolerType === 'Air' && coolerHeight > 0 && maxCoolerHeight > 0 && coolerHeight > maxCoolerHeight) {
            conflicts.push({
                slot_a: 'cooler',
                name_a: cooler.name,
                slot_b: 'case',
                name_b: pcCase.name,
                rule: 'cooler_height',
                reason: `tinggi air cooler ${coolerHeight} mm melebihi batas tinggi casing ${maxCoolerHeight} mm.`,
            });
        }
    }

    // 8. Storage <-> Case & Motherboard
    if (storage) {
        const iface = String(storage.specs?.interface || '');

        if (iface === 'SATA 3.5"' && pcCase) {
            const bays = Number(pcCase.specs?.drive_bays_35) || 0;
            if (bays <= 0) {
                conflicts.push({
                    slot_a: 'storage',
                    name_a: storage.name,
                    slot_b: 'case',
                    name_b: pcCase.name,
                    rule: 'storage_bay',
                    reason: 'casing ini tidak memiliki ruang drive bay 3.5 inci untuk HDD.',
                });
            }
        }

        if (iface === 'M.2 NVMe' && mobo) {
            const m2Slots = Number(mobo.specs?.m2_slots) || 0;
            if (m2Slots <= 0) {
                conflicts.push({
                    slot_a: 'storage',
                    name_a: storage.name,
                    slot_b: 'motherboard',
                    name_b: mobo.name,
                    rule: 'storage_m2',
                    reason: 'motherboard tidak memiliki slot M.2 NVMe.',
                });
            }
        }
    }

    // 9. PSU <-> Case form factor
    if (psu && pcCase) {
        const psuFf = String(psu.specs?.form_factor || '');
        const supportedPsu = Array.isArray(pcCase.specs?.psu_form_factors)
            ? pcCase.specs.psu_form_factors
            : [];

        if (psuFf && supportedPsu.length > 0 && !supportedPsu.includes(psuFf)) {
            conflicts.push({
                slot_a: 'psu',
                name_a: psu.name,
                slot_b: 'case',
                name_b: pcCase.name,
                rule: 'psu_form_factor',
                reason: `ukuran PSU ${psuFf} tidak muat di casing (hanya mendukung PSU ${supportedPsu.join('/')}).`,
            });
        }
    }

    // 10. PSU <-> System & GPU wattage
    if (psu) {
        const psuWatt = Number(psu.specs?.wattage_w) || 0;
        const wattage = calculateWattage(build);

        if (psuWatt > 0) {
            const gpuRec = gpu ? Number(gpu.specs?.recommended_psu_w) || 0 : 0;

            if (gpu && gpuRec > 0 && psuWatt < gpuRec) {
                conflicts.push({
                    slot_a: 'psu',
                    name_a: psu.name,
                    slot_b: 'gpu',
                    name_b: gpu.name,
                    rule: 'psu_gpu_wattage',
                    reason: `kapasitas PSU ${psuWatt} W kurang dari kebutuhan minimal GPU (${gpuRec} W).`,
                });
            } else if (psuWatt < wattage.recommendedPsuW) {
                const anchorSlot = gpu ? 'gpu' : cpu ? 'cpu' : 'motherboard';
                const anchorName = build[anchorSlot]?.name || 'sistem';
                conflicts.push({
                    slot_a: 'psu',
                    name_a: psu.name,
                    slot_b: anchorSlot,
                    name_b: anchorName,
                    rule: 'psu_system_wattage',
                    reason: `estimasi daya sistem + headroom (${wattage.recommendedPsuW} W) melampaui kapasitas PSU ${psuWatt} W.`,
                });
            }
        }
    }

    return conflicts;
}

export function evaluateCandidate(build, slot, candidate) {
    if (!candidate || candidate.component_type !== slot) {
        return {
            compatible: false,
            headline: `Produk ini bukan komponen untuk slot ${slotLabel(slot)}.`,
            conflicts: [],
        };
    }

    const hypothetical = { ...build, [slot]: candidate };
    const allConflicts = collectConflicts(hypothetical);
    const relevant = allConflicts.filter((c) => c.slot_a === slot || c.slot_b === slot);

    if (relevant.length === 0) {
        return {
            compatible: true,
            headline: null,
            conflicts: [],
        };
    }

    const formatted = relevant.map((conflict) => {
        const againstSlot = conflict.slot_a === slot ? conflict.slot_b : conflict.slot_a;
        const againstName = conflict.slot_a === slot ? conflict.name_b : conflict.name_a;
        return {
            against_slot: againstSlot,
            against_name: againstName,
            rule: conflict.rule,
            message: `Tidak cocok dengan ${slotLabel(againstSlot)} ${againstName} yang Anda pilih — ${conflict.reason}`,
        };
    });

    return {
        compatible: false,
        headline: formatted[0].message,
        conflicts: formatted,
    };
}

export function evaluateBuild(build = {}, slots = []) {
    const conflicts = collectConflicts(build);
    const wattage = calculateWattage(build);

    const missingRequired = [];
    let installedCount = 0;
    let totalPrice = 0;

    slots.forEach((slotDef) => {
        const part = build[slotDef.key] || null;
        if (part) {
            installedCount += 1;
            totalPrice += Number(part.price) || 0;
        } else if (slotDef.required) {
            missingRequired.push({ slot: slotDef.key, label: slotDef.label });
        }
    });

    const findConflict = (rules) => conflicts.find((c) => rules.includes(c.rule)) || null;

    const checks = [];

    const socketConflict = findConflict(['cpu_socket', 'cpu_mobo_memory']);
    if (socketConflict) {
        checks.push({ key: 'socket', label: 'Soket CPU ↔ Board', status: 'error', detail: socketConflict.reason });
    } else if (build.cpu && build.motherboard) {
        checks.push({
            key: 'socket',
            label: 'Soket CPU ↔ Board',
            status: 'ok',
            detail: `${build.cpu.specs?.socket || '—'} cocok`,
        });
    } else {
        checks.push({ key: 'socket', label: 'Soket CPU ↔ Board', status: 'pending', detail: 'Pilih CPU & Motherboard' });
    }

    const ramConflict = findConflict(['ram_type', 'ram_slots', 'ram_capacity', 'cpu_ram_type']);
    if (ramConflict) {
        checks.push({ key: 'ram', label: 'Memori RAM', status: 'error', detail: ramConflict.reason });
    } else if (build.ram && build.motherboard) {
        checks.push({
            key: 'ram',
            label: 'Memori RAM',
            status: 'ok',
            detail: `${build.ram.specs?.memory_type || '—'} · ${build.ram.specs?.capacity_gb || '—'} GB`,
        });
    } else {
        checks.push({ key: 'ram', label: 'Memori RAM', status: 'pending', detail: 'Menunggu RAM & Motherboard' });
    }

    const caseConflict = findConflict(['case_form_factor']);
    if (caseConflict) {
        checks.push({ key: 'form_factor', label: 'Form Factor Casing', status: 'error', detail: caseConflict.reason });
    } else if (build.case && build.motherboard) {
        checks.push({
            key: 'form_factor',
            label: 'Form Factor Casing',
            status: 'ok',
            detail: `${build.motherboard.specs?.form_factor || '—'} muat di casing`,
        });
    } else {
        checks.push({ key: 'form_factor', label: 'Form Factor Casing', status: 'pending', detail: 'Menunggu Casing & Motherboard' });
    }

    const clearanceConflict = findConflict([
        'gpu_clearance',
        'cooler_radiator',
        'cooler_height',
        'cooler_socket',
        'cooler_mobo_socket',
        'storage_bay',
        'storage_m2',
    ]);
    if (clearanceConflict) {
        checks.push({ key: 'clearance', label: 'Clearance Dimensi', status: 'error', detail: clearanceConflict.reason });
    } else if (build.case && (build.gpu || build.cooler)) {
        const gpuLen = build.gpu?.specs?.length_mm;
        const maxGpu = build.case?.specs?.max_gpu_length_mm;
        checks.push({
            key: 'clearance',
            label: 'Clearance Dimensi',
            status: 'ok',
            detail: gpuLen && maxGpu ? `GPU ${gpuLen} / ${maxGpu} mm` : 'Semua dimensi fisik muat',
        });
    } else {
        checks.push({ key: 'clearance', label: 'Clearance Dimensi', status: 'pending', detail: 'Cek GPU, cooler & bay' });
    }

    const psuConflict = findConflict(['psu_form_factor', 'psu_gpu_wattage', 'psu_system_wattage']);
    if (psuConflict) {
        checks.push({ key: 'psu', label: 'Kapasitas & Ukuran PSU', status: 'error', detail: psuConflict.reason });
    } else if (build.psu) {
        checks.push({
            key: 'psu',
            label: 'Kapasitas & Ukuran PSU',
            status: 'ok',
            detail: `${wattage.totalW} W beban / ${wattage.psuW} W PSU`,
        });
    } else {
        checks.push({
            key: 'psu',
            label: 'Kapasitas & Ukuran PSU',
            status: 'pending',
            detail: wattage.recommendedPsuW > 0 ? `Rekomendasi ≥ ${wattage.recommendedPsuW} W` : 'Pilih Power Supply',
        });
    }

    const requiredCount = slots.filter((s) => s.required).length;

    return {
        compatible: conflicts.length === 0,
        complete: missingRequired.length === 0,
        ready: conflicts.length === 0 && missingRequired.length === 0,
        installedCount,
        requiredCount,
        totalPrice,
        totalWattageW: wattage.totalW,
        recommendedPsuW: wattage.recommendedPsuW,
        psuWattageW: wattage.psuW,
        missingRequired,
        conflicts,
        checks,
    };
}

/**
 * Concise engineering spec chips for a product row in the builder and detail sheet.
 */
export function formatSpecBadges(componentType, specs = {}) {
    if (!specs || typeof specs !== 'object') {
        return [];
    }

    switch (componentType) {
        case 'cpu':
            return [
                specs.socket,
                specs.cores,
                Array.isArray(specs.supported_memory) ? specs.supported_memory.join('/') : null,
                specs.tdp_w ? `${specs.tdp_w} W` : null,
            ].filter(Boolean);
        case 'motherboard':
            return [
                specs.socket,
                specs.form_factor,
                specs.memory_type,
                specs.m2_slots ? `${specs.m2_slots}× M.2` : null,
            ].filter(Boolean);
        case 'ram':
            return [
                specs.memory_type,
                specs.capacity_gb ? `${specs.capacity_gb} GB` : null,
                specs.speed_mhz ? `${specs.speed_mhz} MHz` : null,
                specs.modules ? `${specs.modules} keping` : null,
            ].filter(Boolean);
        case 'gpu':
            return [
                specs.vram_gb ? `${specs.vram_gb} GB VRAM` : null,
                specs.length_mm ? `Panjang ${specs.length_mm} mm` : null,
                specs.tdp_w ? `${specs.tdp_w} W` : null,
                specs.recommended_psu_w ? `PSU ≥ ${specs.recommended_psu_w} W` : null,
            ].filter(Boolean);
        case 'cooler':
            return [
                specs.cooler_type === 'AIO'
                    ? `AIO ${specs.radiator_mm || 240} mm`
                    : `Air ${specs.height_mm || 155} mm`,
                Array.isArray(specs.supported_sockets) ? specs.supported_sockets.join(' / ') : null,
            ].filter(Boolean);
        case 'storage':
            return [
                specs.interface,
                specs.pcie_gen,
                specs.capacity_gb ? `${specs.capacity_gb >= 1000 ? `${specs.capacity_gb / 1000} TB` : `${specs.capacity_gb} GB`}` : null,
            ].filter(Boolean);
        case 'case':
            return [
                Array.isArray(specs.supported_form_factors) ? specs.supported_form_factors.join('/') : null,
                specs.max_gpu_length_mm ? `GPU ≤ ${specs.max_gpu_length_mm} mm` : null,
                specs.max_radiator_mm ? `Rad ≤ ${specs.max_radiator_mm} mm` : null,
                Array.isArray(specs.psu_form_factors) ? `PSU ${specs.psu_form_factors.join('/')}` : null,
            ].filter(Boolean);
        case 'psu':
            return [
                specs.wattage_w ? `${specs.wattage_w} W` : null,
                specs.form_factor,
                specs.efficiency,
                specs.modular,
            ].filter(Boolean);
        case 'fan':
            return [
                specs.fan_size_mm ? `${specs.fan_size_mm} mm` : null,
                specs.pack_qty ? `${specs.pack_qty} Pack` : null,
            ].filter(Boolean);
        default:
            return [];
    }
}
