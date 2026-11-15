import { useEffect, useRef, useState } from 'react';
import { motionReduced } from '@/lib/motion';

/**
 * The instrument.
 *
 * On a fine pointer the cursor stops being an arrow and becomes the tool the rest
 * of the sheet is drawn with: a drafting crosshair with a plotted head, a live
 * coordinate readout in the measurement face, and a state that names what is under
 * it (a link, an action, a field, or the hero's measuring table).
 *
 * Three rules this component holds to:
 *
 * - It writes to the DOM through refs inside one animation frame loop. A React
 *   state update per `pointermove` would re-render the tree sixty times a second
 *   for no reason, which is exactly the kind of cost this pass exists to remove.
 * - It only takes over when it can do the job: a fine pointer, a hover-capable
 *   device, and a browser that reported a real pointer position. Every other case
 *   keeps the platform cursor, so nothing is lost on touch or on a keyboard.
 * - `prefers-reduced-motion` keeps the crosshair — it is an instrument, not an
 *   effect — and drops only the trailing ring.
 */

/**
 * What is under the pointer, and what the instrument should become.
 *
 * Order matters: the first match wins, so the most specific claim is listed first.
 * A text field is the one case that draws a different *shape* rather than a
 * different colour — an I-beam, the mark every text cursor has used for forty
 * years — because that shape is the affordance, not a decoration on it.
 */
const LABELS = [
    ['[data-cursor="measure"]', 'Ukur', 'measure'],
    ['[data-cursor="drag"]', 'Geser', 'drag'],
    ['input[type="range"]', 'Geser', 'drag'],
    ['textarea', 'Ketik', 'text'],
    [
        'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="image"])',
        'Ketik',
        'text',
    ],
    ['select', 'Pilih', 'action'],
    ['input[type="checkbox"], input[type="radio"], input[type="file"]', 'Pilih', 'action'],
    ['button:not(:disabled)', 'Aksi', 'action'],
    ['a[href]', 'Tautan', 'action'],
];

function labelFor(target) {
    if (!(target instanceof Element)) {
        return null;
    }

    for (const [selector, label, state] of LABELS) {
        const match = target.closest(selector);
        if (match && !match.hasAttribute('disabled')) {
            return { label, state };
        }
    }

    return null;
}

export function InstrumentCursor() {
    const rootRef = useRef(null);
    const headRef = useRef(null);
    const ringRef = useRef(null);
    const vRef = useRef(null);
    const hRef = useRef(null);
    const readoutRef = useRef(null);
    const labelRef = useRef(null);
    const [active, setActive] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return undefined;
        }

        const fine = window.matchMedia('(pointer: fine) and (hover: hover)');
        // The ring only trails while the reader has motion on. Read live rather
        // than captured, so the switch takes effect without a reload.
        const still = { get matches() { return motionReduced(); } };

        let frame = 0;
        let visible = false;
        let seen = false;
        let tonePath = null;
        const pointer = { x: -100, y: -100 };
        const ring = { x: -100, y: -100 };
        let state = 'idle';
        let label = '';

        /**
         * Which temperature the sheet under the pointer is drawn in.
         *
         * This cannot be answered in CSS: the cursor is mounted as a sibling after
         * the app root, so neither a descendant nor a sibling selector can reach
         * from one to the other, and keyed on ancestry the crosshair stayed
         * cyanotype on the plot ground — 1.88:1, effectively invisible over the
         * whole console. The path is the cheapest reliable signal: it changes
         * exactly when the page does.
         */
        const applyTone = () => {
            const root = rootRef.current;
            if (root) {
                root.dataset.tone = document.querySelector('.plot') ? 'plot' : 'sheet';
            }
            tonePath = window.location.pathname;
        };

        const paint = () => {
            frame = 0;

            const { x, y } = pointer;
            const root = rootRef.current;
            if (!root) {
                return;
            }

            if (headRef.current) {
                // Centred by percentage, not by a hardcoded half-size: the head
                // changes shape between states (crosshair, I-beam, filled square),
                // so a fixed offset would leave the I-beam off the pointer.
                headRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
            }
            if (vRef.current) {
                vRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
            }
            if (hRef.current) {
                hRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
            }
            if (readoutRef.current) {
                readoutRef.current.style.transform = `translate3d(${x + 16}px, ${y + 14}px, 0)`;
                readoutRef.current.textContent = `X ${String(Math.max(0, Math.round(x))).padStart(4, '0')}  Y ${String(
                    Math.max(0, Math.round(y)),
                ).padStart(4, '0')}`;
            }
            if (labelRef.current) {
                labelRef.current.style.transform = `translate3d(${x + 16}px, ${y - 26}px, 0)`;
                if (labelRef.current.textContent !== label) {
                    labelRef.current.textContent = label;
                }
            }

            if (ringRef.current && !still.matches) {
                ring.x += (x - ring.x) * 0.18;
                ring.y += (y - ring.y) * 0.18;
                ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
            } else if (ringRef.current) {
                ringRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
            }

            // Keep animating only while there is something to catch up on.
            if (!still.matches && (Math.abs(x - ring.x) > 0.4 || Math.abs(y - ring.y) > 0.4)) {
                schedule();
            }
        };

        const schedule = () => {
            if (!frame) {
                frame = window.requestAnimationFrame(paint);
            }
        };

        const setState = (next) => {
            if (next === state) {
                return;
            }
            state = next;
            const root = rootRef.current;
            if (root) {
                root.dataset.state = next;
            }
        };

        const onMove = (event) => {
            if (event.pointerType === 'touch') {
                return;
            }

            // Suppressed while the reader is typing: the I-beam is theirs.
            const editing = event.target instanceof Element && event.target.closest('input, textarea');
            const root = rootRef.current;

            if (tonePath !== window.location.pathname) {
                applyTone();
            }

            pointer.x = event.clientX;
            pointer.y = event.clientY;

            if (!seen) {
                seen = true;
                ring.x = pointer.x;
                ring.y = pointer.y;
                visible = true;
                if (root) {
                    root.dataset.visible = 'true';
                }
            }

            const found = labelFor(event.target);
            label = found?.label ?? '';
            setState(found?.state ?? 'idle');

            if (root) {
                root.dataset.editing = editing ? 'true' : 'false';
            }

            schedule();
        };

        const onDown = () => {
            if (rootRef.current) {
                rootRef.current.dataset.pressed = 'true';
            }
        };
        const onUp = () => {
            if (rootRef.current) {
                rootRef.current.dataset.pressed = 'false';
            }
        };
        const onLeave = () => {
            visible = false;
            if (rootRef.current) {
                rootRef.current.dataset.visible = 'false';
            }
        };
        const onEnter = () => {
            if (seen) {
                visible = true;
                if (rootRef.current) {
                    rootRef.current.dataset.visible = 'true';
                }
            }
        };

        const enable = () => {
            const on = fine.matches;
            setActive(on);
            document.documentElement.classList.toggle('has-instrument', on);
        };

        enable();

        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerdown', onDown, { passive: true });
        window.addEventListener('pointerup', onUp, { passive: true });
        document.addEventListener('pointerleave', onLeave);
        document.addEventListener('pointerenter', onEnter);
        fine.addEventListener('change', enable);

        return () => {
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointerup', onUp);
            document.removeEventListener('pointerleave', onLeave);
            document.removeEventListener('pointerenter', onEnter);
            fine.removeEventListener('change', enable);
            document.documentElement.classList.remove('has-instrument');
        };
    }, []);

    /**
     * Keep the instrument's temperature matched to the sheet under it.
     *
     * This is its own effect because the first one cannot do it: `enable()` only
     * sets state, so on that pass the component has not rendered yet and the root
     * ref is still null — the tone was written to nothing and the crosshair stayed
     * cyanotype on the plot ground, which measures 1.88:1.
     *
     * It re-applies on navigation by watching the app root's children, which is
     * exactly what Inertia swaps.
     */
    useEffect(() => {
        if (!active) {
            return undefined;
        }

        const app = document.getElementById('app') ?? document.body;

        const applyTone = () => {
            const root = rootRef.current;

            if (root) {
                // The temperature is the reader's theme, not the class on the
                // surface: module and admin sheets now re-temper with the theme
                // instead of forcing the plot ground.
                const plot = document.documentElement.dataset.theme === 'plot';

                root.dataset.tone = plot ? 'plot' : 'sheet';
            }
        };

        applyTone();

        // Inertia swaps the app root's children on navigation; the theme switch
        // rewrites an attribute on <html>. Neither is visible to the other, so
        // both are watched.
        const observer = new MutationObserver(applyTone);
        observer.observe(app, { childList: true });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        return () => observer.disconnect();
    }, [active]);

    if (!active) {
        return null;
    }

    return (
        <div ref={rootRef} className="instr" data-state="idle" data-visible="false" aria-hidden="true">
            <span ref={vRef} className="instr__axis instr__axis--v" />
            <span ref={hRef} className="instr__axis instr__axis--h" />
            <span ref={ringRef} className="instr__ring" />
            <span ref={headRef} className="instr__head" />
            <span ref={readoutRef} className="instr__readout" />
            <span ref={labelRef} className="instr__label" />
        </div>
    );
}

export default InstrumentCursor;
