/**
 * Measurement formatting. Every figure the interface prints goes through here so
 * that one unit treatment, one separator convention, and one precision rule hold
 * across the whole system.
 */

const idr = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

/** Full rupiah amount, no symbol: `12.800.000`. */
export function amount(value) {
    return idr.format(Number(value) || 0);
}

/** Rupiah amount with the product's unit prefix: `Rp 12.800.000`. */
export function rupiah(value) {
    return `Rp ${amount(value)}`;
}

/** Count with thousands separators: `1.442`. */
export function count(value) {
    return idr.format(Number(value) || 0);
}

/** Zero-padded register position: `1` -> `014`. */
export function pad(value, width = 3) {
    return String(Number(value) || 0).padStart(width, '0');
}

const MONTHS = [
    'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
    'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES',
];

/** Document-style date stamp: `2026-09-21`. */
export function isoDate(value = new Date()) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) {
        return '—';
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
    ).padStart(2, '0')}`;
}

/** Short register date: `21 SEP 2026`. */
export function stampDate(value = new Date()) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) {
        return '—';
    }
    return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Date and time for event rows: `21 SEP · 10.41`. */
export function eventStamp(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) {
        return '—';
    }
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} · ${hh}.${mm}`;
}
