import React, { useEffect, useRef } from 'react';

/**
 * A rule that keeps the reader's place.
 *
 * One 3px gradient strip pinned to the top of the viewport, scaled from 0 to 1 as
 * the document is read. It uses the same transform-only approach as the rest of
 * the motion system: the scroll listener writes one style property inside a single
 * animation frame, never a React state update per scroll event.
 *
 * It sits above every layout — it is mounted once beside the Inertia app — so it
 * survives navigation without being remounted.
 */
export function ScrollProgress() {
    const barRef = useRef(null);

    useEffect(() => {
        let frame = 0;

        const paint = () => {
            frame = 0;
            const doc = document.documentElement;
            const max = doc.scrollHeight - window.innerHeight;
            const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

            if (barRef.current) {
                barRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
            }
        };

        const onScroll = () => {
            if (!frame) {
                frame = window.requestAnimationFrame(paint);
            }
        };

        paint();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        // A route swap can change the document height after the first paint; the
        // observer below catches that without waiting for the next scroll.
        const settle = window.setTimeout(paint, 500);
        const observer =
            typeof ResizeObserver === 'undefined'
                ? null
                : new ResizeObserver(() => paint());
        if (observer) {
            observer.observe(document.body);
        }

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            window.clearTimeout(settle);
            observer?.disconnect();
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, []);

    return (
        <div className="kilau-progress" aria-hidden="true">
            <div ref={barRef} className="kilau-progress__bar" />
        </div>
    );
}

export default ScrollProgress;
