import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * Motion helpers.
 *
 * The rule these follow: the finished state is the default, and JavaScript only
 * ever *arms* an animation. If the observer never runs, if the browser is old, if
 * the reader turned motion down — the content is simply there. Nothing on a sheet
 * is ever hidden behind a script that might not arrive.
 *
 * Motion is a **setting of this application**, not a hint taken from the operating
 * system. It used to be the latter, and that was wrong twice over. This sheet is
 * built out of movement — a plotter drawing rules, a register writing itself, a
 * temperature spreading across the page — so treating an OS flag as a verdict on
 * the design removed the thing the reader came for, silently, on the strength of a
 * preference they set for a different reason. An operating-system hint is not
 * consent and it is not a request about *this* application.
 *
 * What is left is a switch the reader can actually throw: `Gerak: penuh` by
 * default, always, whatever the system says; `dikurangi` if they want it, and the
 * choice is remembered. Nothing is taken away — it is moved to where the reader can
 * see it.
 */

const KEY = 'rakit-motion';

const listeners = new Set();

/** Read once at module scope; the head script has already written the attribute. */
let reduced =
    typeof document !== 'undefined' && document.documentElement.dataset.motion === 'reduced';

export function motionReduced() {
    return reduced;
}

export function setMotionReduced(next) {
    reduced = Boolean(next);

    if (typeof document !== 'undefined') {
        document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    }

    try {
        window.localStorage.setItem(KEY, reduced ? 'reduced' : 'full');
    } catch (error) {
        /* Storage unavailable: the choice does not outlive the visit. */
    }

    listeners.forEach((listener) => listener());
}

function subscribeMotion(listener) {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

/** The switch, as a value a component re-renders on. */
export function useMotionReduced() {
    return useSyncExternalStore(subscribeMotion, motionReduced, () => false);
}

/**
 * Settle-on-arrival for a section. Attach the returned ref to the element you
 * marked `data-reveal`; it arms the transition and releases it once, when the
 * element first reaches the viewport.
 *
 * `delay` staggers siblings; the caller owns the order so the stagger carries
 * meaning rather than being applied uniformly.
 */
export function useReveal({ delay = 0, threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = {}) {
    const ref = useRef(null);

    useEffect(() => {
        const node = ref.current;

        if (!node || motionReduced() || typeof IntersectionObserver === 'undefined') {
            return undefined;
        }

        node.style.setProperty('--reveal-delay', `${delay}ms`);
        node.classList.add('reveal-armed');

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }
                    entry.target.classList.add('is-settled');
                    observer.unobserve(entry.target);
                });
            },
            { threshold, rootMargin },
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
            node.classList.remove('reveal-armed', 'is-settled');
        };
    }, [delay, threshold, rootMargin]);

    return ref;
}

/**
 * Count a figure up to its value once, when it first becomes visible. Used only
 * where the number is the point — the ledger — never on every figure on a sheet,
 * which would make a register unreadable while it ran.
 *
 * The figure starts at its **real** value, not at zero. It is reset to the start
 * only in the frame the count begins, once the element is genuinely on screen. The
 * obvious version — start at zero and wait for an observer — leaves the true number
 * nowhere on the page until something scrolls it into view, so a reader on a short
 * viewport, or one whose observer never fires, is shown a zero in place of a figure
 * that the sheet has already read from the database. A number that is only
 * sometimes right is worse than one that does not move.
 */
export function useCountUp(value, { duration = 900, start = 0 } = {}) {
    const ref = useRef(null);
    const [display, setDisplay] = useState(value);
    const still = useMotionReduced();
    const done = useRef(false);

    useEffect(() => {
        // Cheap bail-outs, all of which leave the true value on screen.
        if (still || done.current) {
            setDisplay(value);
            return undefined;
        }

        const node = ref.current;
        if (!node || typeof IntersectionObserver === 'undefined') {
            setDisplay(value);
            return undefined;
        }

        let frame = 0;
        let startedAt = 0;

        const step = (now) => {
            if (!startedAt) {
                startedAt = now;
            }
            const progress = Math.min(1, (now - startedAt) / duration);
            // Exponential ease-out: fast commit, long settle.
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(start + (value - start) * eased);

            if (progress < 1) {
                frame = window.requestAnimationFrame(step);
            } else {
                setDisplay(value);
            }
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting || done.current) {
                        return;
                    }
                    observer.unobserve(entry.target);
                    // Rewound here, in the frame the count starts, rather than at
                    // mount: the true figure stays on screen for every instant the
                    // animation is not actually running.
                    done.current = true;
                    setDisplay(start);
                    frame = window.requestAnimationFrame(step);
                });
            },
            { threshold: 0.4 },
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, [value, duration, start, still]);

    return [ref, display];
}

/**
 * Settle a whole sheet's sections as they arrive.
 *
 * Called by each layout with its root element, so it re-runs on every Inertia
 * navigation without a page ever wiring anything up.
 *
 * Two deliberate restraints:
 *
 * - **The first viewport is never animated.** A section already on screen at load
 *   is content the reader is looking at; fading it in delays the one thing they
 *   came for. Only what sits below the fold is armed.
 * - **One gesture, staggered by position.** Sections get a small increasing delay
 *   so a scroll reads as the sheet settling rather than a dozen elements
 *   independently popping.
 */
export function useSettle(rootRef, deps = []) {
    const still = useMotionReduced();

    useEffect(() => {
        const root = rootRef.current;

        if (!root || still || typeof IntersectionObserver === 'undefined') {
            return undefined;
        }

        const fold = window.innerHeight * 0.9;
        const targets = Array.from(
            root.querySelectorAll('main > section, main > div > section, [data-reveal]'),
        );

        if (targets.length === 0) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }
                    entry.target.classList.add('is-settled');
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
        );

        let armed = 0;
        const pending = [];

        targets.forEach((element) => {
            // Decide first, mark second. Marking before the fold test and then
            // skipping on a re-run left an element that was armed once but whose
            // observer had been disconnected sitting at `opacity: 0` for good.
            const alreadyHandled = element.dataset.settleArmed === 'true';

            if (alreadyHandled) {
                return;
            }

            if (element.getBoundingClientRect().top < fold) {
                // Content the reader is already looking at is never animated.
                element.dataset.settleArmed = 'true';
                return;
            }

            element.dataset.settleArmed = 'true';
            element.style.setProperty('--reveal-delay', `${Math.min(armed, 4) * 70}ms`);
            element.classList.add('reveal-armed');
            observer.observe(element);
            pending.push(element);
            armed += 1;
        });

        /*
         * The net under the whole mechanism.
         *
         * An intersection observer reports the changes it observes, and a jump —
         * the End key, a scrollbar dragged to the middle, a restored scroll
         * position on reload — can carry a section from below the viewport to above
         * it without it ever having been inside it. Nothing fires, and the section
         * sits at zero opacity until the reader happens to scroll back through it.
         *
         * No reader should be able to reach a state where content is invisible and
         * nothing will bring it back, so anything still armed after a few seconds
         * is released. The worst case stops being "hidden for ever" and becomes
         * "arrived a little late"; the common case is untouched, because the
         * observer has long since settled it.
         */
        const net = window.setTimeout(() => {
            pending.forEach((element) => element.classList.add('is-settled'));
            observer.disconnect();
        }, 5000);

        return () => {
            window.clearTimeout(net);
            observer.disconnect();
        };
    }, [...deps, still]);
}

/**
 * The reading on a live coordinate. Returns a formatter plus a subscriber hook so
 * a component can print the pointer's position in its own coordinate space
 * without a state update per movement.
 */
export function formatCoordinate(value, width = 4) {
    return String(Math.max(0, Math.round(value))).padStart(width, '0');
}

/**
 * A pull toward the pointer.
 *
 * The element leans a few pixels toward the cursor while it is over it and springs
 * back when it leaves. It is written as a transform on a wrapper, so the control's
 * own layout, hit area and focus ring are untouched — a button that moved its box
 * would move its own target out from under the pointer.
 *
 * The lean is capped by `strength` (in pixels) rather than by a fraction of the
 * element, because a wide stamp should not swing further than a small one. Off
 * entirely under reduced motion.
 */
export function useMagnetic(strength = 5, { disabled = false } = {}) {
    const ref = useRef(null);
    const still = useMotionReduced();

    useEffect(() => {
        const node = ref.current;

        if (!node || disabled || still) {
            return undefined;
        }

        let frame = 0;
        let target = { x: 0, y: 0 };
        let current = { x: 0, y: 0 };

        const paint = () => {
            frame = 0;
            current.x += (target.x - current.x) * 0.18;
            current.y += (target.y - current.y) * 0.18;
            node.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0)`;

            if (Math.abs(target.x - current.x) > 0.05 || Math.abs(target.y - current.y) > 0.05) {
                frame = window.requestAnimationFrame(paint);
            }
        };

        const schedule = () => {
            if (!frame) {
                frame = window.requestAnimationFrame(paint);
            }
        };

        const onMove = (event) => {
            const box = node.getBoundingClientRect();
            const dx = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
            const dy = (event.clientY - (box.top + box.height / 2)) / (box.height / 2);

            target = {
                x: Math.max(-1, Math.min(1, dx)) * strength,
                y: Math.max(-1, Math.min(1, dy)) * strength,
            };
            schedule();
        };

        const onLeave = () => {
            target = { x: 0, y: 0 };
            schedule();
        };

        node.addEventListener('pointermove', onMove, { passive: true });
        node.addEventListener('pointerleave', onLeave, { passive: true });
        node.addEventListener('blur', onLeave, { passive: true });

        return () => {
            node.removeEventListener('pointermove', onMove);
            node.removeEventListener('pointerleave', onLeave);
            node.removeEventListener('blur', onLeave);
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, [strength, disabled, still]);

    return ref;
}