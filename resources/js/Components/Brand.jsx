/**
 * The mark is drawn, not imported: two corner brackets joined by a diagonal,
 * the way two parts are located and fixed to each other.
 */
export function BrandMark({ className = 'h-6 w-6', strokeWidth = 2 }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="square"
            className={className}
            aria-hidden="true"
        >
            <path d="M3 10V3h7" />
            <path d="M21 14v7h-7" />
            <path d="M8.5 15.5 15.5 8.5" strokeWidth={strokeWidth * 0.75} />
        </svg>
    );
}

export const BRAND = {
    name: 'RAKIT',
    kind: 'Toko komponen & gear komputer',
    console: 'Kendali',
};

export default BRAND;
