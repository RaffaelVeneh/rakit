import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

/**
 * The route loader.
 *
 * Inertia already draws a 2px progress rule while a page is in flight, and that
 * rule is kept — but a bar with no name on it could be loading anything. This adds
 * the one fact the bar cannot carry: which sheet is being fetched, read from the
 * visit's own URL and checked against nothing else.
 *
 * It is deliberately small and it never blocks. A page that takes 80ms should not
 * flash an overlay, so the chip only appears if the visit is still running after
 * `DELAY`, and it leaves as soon as the page lands.
 */

const DELAY = 220;

/** The last segment of a path, which is the sheet's own name. */
function sheetName(url) {
    const path = String(url || '/').split('?')[0];
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) {
        return 'Register';
    }

    return segments[segments.length - 1].replace(/-/g, ' ');
}

export function RouteLoader() {
    const [target, setTarget] = useState(null);

    useEffect(() => {
        let timer = 0;

        const stop = router.on('start', (event) => {
            const url = event.detail.visit.url;

            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                setTarget(sheetName(url?.pathname ?? url));
            }, DELAY);
        });

        const clear = () => {
            window.clearTimeout(timer);
            setTarget(null);
        };

        const finish = router.on('finish', clear);
        const error = router.on('error', clear);

        return () => {
            window.clearTimeout(timer);
            stop();
            finish();
            error();
        };
    }, []);

    if (!target) {
        return null;
    }

    return (
        <div
            className="pointer-events-none fixed bottom-4 left-1/2 z-[95] -translate-x-1/2"
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-2.5 border border-ink bg-sheet px-3 py-2 shadow-[0_6px_18px_-8px_rgba(12,22,34,0.45)]">
                <span className="flex gap-0.5" aria-hidden="true">
                    <span className="h-3 w-0.5 animate-[loader-tick_700ms_steps(2,end)_infinite] bg-cyan" />
                    <span className="h-3 w-0.5 animate-[loader-tick_700ms_steps(2,end)_200ms_infinite] bg-cyan" />
                    <span className="h-3 w-0.5 animate-[loader-tick_700ms_steps(2,end)_400ms_infinite] bg-cyan" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2">
                    Mengambil lembar
                    <span className="ml-2 text-ink">{target}</span>
                </span>
            </div>
        </div>
    );
}

export default RouteLoader;
