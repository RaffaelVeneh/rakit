import React, { useEffect, useState } from 'react';
import { Moon, Sun, Waves, Wind } from 'lucide-react';
import { setMotionReduced, useMotionReduced } from '@/lib/motion';

/**
 * The temperature switch.
 *
 * The system has had two temperatures from the start — the issued sheet, and the
 * plotter field — but which one you got was decided by which page you were on.
 * This lets the reader decide instead, and it costs almost nothing to implement
 * because the tokens were already built for it: the dark theme is the same five
 * names re-pointed at the document root, so every device in the sheet re-tempers
 * itself with no per-component knowledge of a theme existing.
 *
 * Four details that matter:
 *
 * - The attribute is set by a blocking script in the document head, not here, so
 *   there is no flash of the wrong sheet. This component only reads and writes it.
 * - `localStorage` is wrapped: it throws in private mode on some browsers, and a
 *   theme preference is not worth an exception.
 * - It is a real toggle button with `aria-pressed`, not a switch drawn as a pill.
 * - The switch is a **circular reveal** grown from the control itself, using the
 *   View Transitions API. The new sheet is clipped to a circle at the button and
 *   the circle is animated out to the far corner, so the temperature spreads across
 *   the page rather than cutting to it. On a browser without the API, or with
 *   reduced motion asked for, the theme simply changes — the reveal is a courtesy,
 *   never the mechanism.
 */

const KEY = 'rakit-theme';
const REVEAL_MS = 620;

function current() {
    if (typeof document === 'undefined') {
        return 'sheet';
    }

    return document.documentElement.dataset.theme === 'plot' ? 'plot' : 'sheet';
}

/** Distance from the origin to the furthest corner, so the circle always clears it. */
function reach(x, y) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    return Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
}

export function ThemeToggle({ className = '' }) {
    const [theme, setTheme] = useState('sheet');
    const still = useMotionReduced();

    useEffect(() => {
        setTheme(current());
    }, []);

    const flip = (event) => {
        const next = current() === 'plot' ? 'sheet' : 'plot';

        const apply = () => {
            document.documentElement.dataset.theme = next;
            setTheme(next);

            try {
                window.localStorage.setItem(KEY, next);
            } catch (error) {
                /* Storage unavailable: the choice does not outlive the visit. */
            }
        };

        if (still || typeof document.startViewTransition !== 'function') {
            apply();

            return;
        }

        // Grown from the control that was pressed, so the new temperature spreads
        // from the thing that caused it. `clientX` is absent on a keyboard
        // activation, hence the fallback to the button's own centre.
        const box = event?.currentTarget?.getBoundingClientRect?.();
        const x = event?.clientX || (box ? box.left + box.width / 2 : window.innerWidth / 2);
        const y = event?.clientY || (box ? box.top + box.height / 2 : window.innerHeight / 2);

        const transition = document.startViewTransition(apply);

        transition.ready
            .then(() => {
                document.documentElement.animate(
                    {
                        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${reach(x, y)}px at ${x}px ${y}px)`],
                    },
                    {
                        duration: REVEAL_MS,
                        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                        pseudoElement: '::view-transition-new(root)',
                    },
                );
            })
            .catch(() => {
                /* A skipped transition is not a failure: the theme already changed. */
            });
    };

    const dark = theme === 'plot';

    return (
        <button
            type="button"
            onClick={flip}
            aria-pressed={dark}
            aria-label={dark ? 'Ganti ke lembar terang' : 'Ganti ke lembar gelap'}
            title={dark ? 'Lembar terang' : 'Lembar gelap'}
            className={`group flex h-9 w-9 items-center justify-center border border-rule-2 text-ink-2 transition-colors hover:border-ink hover:text-ink ${className}`}
        >
            {dark ? (
                <Sun className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-90" strokeWidth={1.5} />
            ) : (
                <Moon className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-12" strokeWidth={1.5} />
            )}
        </button>
    );
}

export default ThemeToggle;

/**
 * The motion switch.
 *
 * Motion is a property of this sheet, not a verdict handed down by the operating
 * system, so it gets a control rather than a media query. It defaults to `penuh`
 * and stays there whatever the OS says — a preference set for some other reason
 * should not silently strip the page of the thing it is made of.
 *
 * What the switch does not do is hide: a reader who genuinely needs the sheet to
 * hold still can say so, the choice is remembered, and every animated state has its
 * finished state as the default, so `dikurangi` is a quieter application and never
 * a broken one.
 */
export function MotionToggle({ className = '' }) {
    const still = useMotionReduced();

    return (
        <button
            type="button"
            onClick={() => setMotionReduced(!still)}
            aria-pressed={!still}
            aria-label={still ? 'Nyalakan gerak penuh' : 'Kurangi gerak'}
            title={still ? 'Gerak: dikurangi' : 'Gerak: penuh'}
            className={`group flex h-9 w-9 items-center justify-center border border-rule-2 text-ink-2 transition-colors hover:border-ink hover:text-ink ${className}`}
        >
            {still ? (
                <Wind className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
                <Waves className="h-3.5 w-3.5 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
            )}
        </button>
    );
}