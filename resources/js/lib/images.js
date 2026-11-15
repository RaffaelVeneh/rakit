/**
 * Image delivery.
 *
 * The catalogue's photographs are hosted by a third party (see PRODUCT.md: these
 * are placeholder assets, not owned catalogue photography). That host resizes on
 * demand through a `w=` parameter, so the same URL can be asked for several widths
 * and handed to the browser as a srcset. Without it a 112px thumbnail downloads
 * the 600px file, and the register page pulls two megabytes of images nobody sees
 * at full size.
 */

const DEFAULT_WIDTHS = [200, 400, 800, 1200];

/**
 * Rewrite a resizable image URL to a given width. Returns the original URL
 * untouched when the host is not one we know how to resize, so a self-hosted
 * image degrades to "one file, no srcset" rather than to a broken URL.
 */
export function atWidth(url, width) {
    if (typeof url !== 'string' || !url) {
        return url;
    }

    try {
        const parsed = new URL(url);

        if (!/(^|\.)unsplash\.com$/.test(parsed.hostname)) {
            return url;
        }

        parsed.searchParams.set('w', String(width));
        parsed.searchParams.set('auto', 'format');
        parsed.searchParams.set('fit', 'crop');
        parsed.searchParams.set('q', '72');

        return parsed.toString();
    } catch {
        return url;
    }
}

/** `srcset` for a resizable URL, or `undefined` so the attribute is omitted. */
export function srcSet(url, widths = DEFAULT_WIDTHS) {
    if (typeof url !== 'string' || !url) {
        return undefined;
    }

    const first = atWidth(url, widths[0]);
    if (first === url) {
        return undefined;
    }

    return widths.map((width) => `${atWidth(url, width)} ${width}w`).join(', ');
}

/**
 * A `sizes` hint describing how wide the image is actually laid out, so the
 * browser can pick from the srcset instead of guessing.
 */
export const SIZES = {
    /** The drawing table's plate: it genuinely occupies most of the viewport. */
    plate: '(min-width: 1024px) 58vw, 100vw',
    /**
     * A plate in the catalogue grid: one of three or four across, never full
     * width. It used to borrow plate's hint, so a 330px card asked the host for
     * an 835px file — four times the pixels nobody would see.
     */
    card: '(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw',
    listThumb: '112px',
    cartThumb: '48px',
    registerThumb: '64px',
};
