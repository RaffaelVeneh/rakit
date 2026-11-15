/**
 * Catalogue coordinates.
 *
 * Every part in the register carries a stable coordinate derived from its own row,
 * so a figure quoted on one sheet can be found on another. Nothing here invents
 * data: the coordinate is a function of values that already exist on the record.
 */

const ZONE_BANDS = ['A', 'B', 'C', 'D', 'E', 'F'];

const GROUP_CODES = {
    laptops: 'LPT',
    laptop: 'LPT',
    smartphones: 'SMP',
    smartphone: 'SMP',
    cameras: 'CAM',
    camera: 'CAM',
    accessories: 'ACC',
    accessory: 'ACC',
    audio: 'AUD',
    monitors: 'MON',
    monitor: 'MON',
    networking: 'NET',
    storage: 'STO',
    printers: 'PRN',
    software: 'SFW',
};

/**
 * Three-letter group code for a category name.
 * Known groups map directly; anything else is reduced to its consonants so the
 * code stays stable for the same name instead of drifting between renders.
 */
export function groupCode(categoryName) {
    const name = String(categoryName || '').trim();
    if (!name) {
        return 'GEN';
    }

    const key = name.toLowerCase();
    if (GROUP_CODES[key]) {
        return GROUP_CODES[key];
    }

    const words = key.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
    if (words.length > 1) {
        return words
            .slice(0, 3)
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .padEnd(3, 'X');
    }

    const consonants = key.replace(/[^a-z]/g, '').replace(/[aeiou]/g, '');
    const source = consonants.length >= 3 ? consonants : key.replace(/[^a-z]/g, '');
    return source.slice(0, 3).toUpperCase().padEnd(3, 'X');
}

/** Stable part number: `RKT-LPT-0037`. */
export function partNo(product) {
    if (!product) {
        return 'RKT-———-————';
    }
    const group = groupCode(product.category?.name || product.category);
    const serial = String(Number(product.id) || 0).padStart(4, '0');
    return `RKT-${group}-${serial}`;
}

/** Zone band for a record: `A` – `F`. */
export function zoneBand(id) {
    const n = Math.max(1, Number(id) || 1);
    return ZONE_BANDS[(n - 1) % ZONE_BANDS.length];
}

/** Register coordinate: `B-014`. */
export function position(product) {
    const n = Math.max(1, Number(product?.id) || 1);
    return `${zoneBand(n)}-${String(n).padStart(3, '0')}`;
}

/** Stock condition, expressed as a lamp state rather than a coloured pill. */
export function stockState(stock) {
    const n = Number(stock) || 0;
    if (n <= 0) {
        // The one stock state that is an exception: a position that cannot be sold.
        return { key: 'out', tone: 'red', lamp: 'lit', label: 'HABIS' };
    }
    if (n <= 5) {
        // Low is information, not rejection. The half-filled lamp already carries
        // it; spending the exception colour here would make an ordinary low count
        // read as a failure.
        return { key: 'low', tone: 'ink', lamp: 'half', label: `MENIPIS · ${n}` };
    }
    return { key: 'in', tone: 'cyan', lamp: 'lit', label: `TERSEDIA · ${n}` };
}

/** Order lifecycle state, expressed as a lamp state. */
export function orderState(status) {
    switch (String(status || '').toLowerCase()) {
        case 'completed':
            return { key: 'completed', tone: 'cyan', lamp: 'lit', label: 'SELESAI' };
        case 'processing':
            return { key: 'processing', tone: 'cyan', lamp: 'half', label: 'DIPROSES' };
        case 'pending':
            return { key: 'pending', tone: 'ink', lamp: 'half', label: 'MENUNGGU' };
        case 'cancelled':
            return { key: 'cancelled', tone: 'red', lamp: 'lit', label: 'DIBATALKAN' };
        default:
            return { key: 'unknown', tone: 'ink', lamp: 'half', label: String(status || '—').toUpperCase() };
    }
}

/** Summary figures read off the rows already in hand. */
export function registerSummary(products = []) {
    const rows = products.filter(Boolean);
    const prices = rows.map((row) => Number(row.price) || 0).filter((price) => price > 0);
    const stock = rows.reduce((sum, row) => sum + (Number(row.stock) || 0), 0);

    return {
        positions: rows.length,
        onHand: stock,
        low: rows.filter((row) => (Number(row.stock) || 0) <= 5).length,
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
    };
}
