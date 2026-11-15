import React from 'react';
import { useCountUp, useMagnetic } from '@/lib/motion';
import { Link } from '@inertiajs/react';

/**
 * The world's controls. An action is a stamp; a field is a ruled box; a state is
 * a lamp. Nothing here rounds a corner or lifts off the sheet.
 */

const STAMP_SIZES = {
    sm: 'px-3 py-1.5 text-[10px] tracking-[0.12em]',
    md: '',
    lg: 'px-6 py-3.5 text-[12px] tracking-[0.16em]',
};

/**
 * The primary action. `as` takes a component (Link, a) and defaults to button.
 *
 * `magnetic` leans the stamp a few pixels toward the pointer while it is over it.
 * Opt-in, because it belongs to the few controls that are the point of their
 * surface — the add stamp on the drawing table, a filter's apply — and a page where
 * every button dodges the cursor is a page you cannot aim at.
 */
export function Stamp({
    as: As = 'button',
    variant = 'primary',
    size = 'md',
    magnetic = false,
    className = '',
    children,
    ...rest
}) {
    const variants = {
        primary: 'stamp',
        secondary: 'stamp-2',
        destructive: 'stamp stamp--red',
        'destructive-quiet': 'stamp stamp--red-quiet',
    };
    const classes = `${variants[variant] || variants.primary} ${STAMP_SIZES[size] || ''} ${className}`;
    const pull = useMagnetic(magnetic ? 5 : 0, { disabled: !magnetic || rest.disabled });

    if (As === 'button' && rest.type === undefined) {
        rest.type = 'button';
    }

    if (!magnetic) {
        return (
            <As className={classes} {...rest}>
                {children}
            </As>
        );
    }

    // Wrapped rather than transformed in place: the control keeps its own box and
    // hit area, so the pointer never chases a target that moved out from under it.
    return (
        <span ref={pull} className="inline-flex will-change-transform">
            <As className={classes} {...rest}>
                {children}
            </As>
        </span>
    );
}

/**
 * A ruled input. `measure` switches it to the measurement voice.
 *
 * 	ype defaults to `text` and is written out rather than left off: an input
 * with no type attribute *is* a text input, but a stylesheet cannot select it as
 * one, so the instrument's "typing keeps its I-beam" rule silently skipped three
 * fields on the purchase form and left them with no pointer at all.
 */
export function Field({ type = 'text', measure = false, className = '', ...rest }) {
    return (
        <input
            type={type}
            className={`field ${measure ? 'font-mono text-[12px]' : ''} ${className}`}
            {...rest}
        />
    );
}

/** A ruled select. */
export function Select({ className = '', children, ...rest }) {
    return (
        <select className={`field cursor-pointer pr-8 ${className}`} {...rest}>
            {children}
        </select>
    );
}

/** A labelled field: the label is set in the annotation voice, above the box. */
export function LabelledField({ label, hint, error, children }) {
    return (
        <label className="block">
            <span className="mb-1 block font-mono text-[9px] tracking-[0.16em] uppercase text-ink-3">
                {label}
            </span>
            {children}
            {hint && !error && <span className="mt-1 block text-[11px] text-ink-3">{hint}</span>}
            {error && <span className="mt-1 block text-[11px] font-medium text-red">{error}</span>}
        </label>
    );
}

/** Quantity: a bounded stepper. The value carries the measurement voice. */
export function QtyStepper({ value, min = 1, max = 99, onChange, disabled = false, label = 'Jumlah' }) {
    const clamp = (next) => Math.min(max, Math.max(min, next));

    return (
        <div className="inline-flex items-stretch border border-rule-2 bg-sheet" role="group" aria-label={label}>
            <button
                type="button"
                onClick={() => onChange(clamp(value - 1))}
                disabled={disabled || value <= min}
                aria-label="Kurangi jumlah"
                className="w-9 border-r border-rule-2 font-mono text-[13px] leading-none text-ink-2 transition-colors hover:bg-sheet-3 hover:text-ink disabled:cursor-not-allowed disabled:text-ink-3 disabled:hover:bg-sheet"
            >
                −
            </button>
            <span
                data-measure
                aria-live="polite"
                className="flex w-11 items-center justify-center font-mono text-[13px] font-medium text-ink"
            >
                {value}
            </span>
            <button
                type="button"
                onClick={() => onChange(clamp(value + 1))}
                disabled={disabled || value >= max}
                aria-label="Tambah jumlah"
                className="w-9 border-l border-rule-2 font-mono text-[13px] leading-none text-ink-2 transition-colors hover:bg-sheet-3 hover:text-ink disabled:cursor-not-allowed disabled:text-ink-3 disabled:hover:bg-sheet"
            >
                +
            </button>
        </div>
    );
}

const LAMP_TONES = {
    cyan: 'text-cyan',
    red: 'text-red',
    ink: 'text-ink-2',
    lit: 'text-lit',
    chalk: 'text-chalk-2',
    'lit-red': 'text-lit-red',
};

/** A drawn lamp. State is lit / half / unlit, never a coloured pill. */
export function Lamp({ tone = 'ink', state = 'lit', className = '' }) {
    const modifier = state === 'lit' ? 'lamp--lit' : state === 'half' ? 'lamp--half' : '';
    return (
        <span
            aria-hidden="true"
            className={`lamp ${modifier} ${LAMP_TONES[tone] || LAMP_TONES.ink} ${className}`}
        />
    );
}

/** A lamp plus its label, so state never depends on colour alone. */
export function StatusLamp({ state, className = '' }) {
    if (!state) {
        return null;
    }

    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <Lamp tone={state.tone} state={state.lamp} />
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-2">
                {state.label}
            </span>
        </span>
    );
}

/** A tag: a bounded label set in the annotation voice. */
export function Tag({ children, tone = 'sheet', className = '' }) {
    const tones = {
        sheet: 'border-rule-2 text-ink-2 bg-sheet',
        ink: 'border-ink bg-ink text-sheet',
        cyan: 'border-cyan bg-cyan-tint text-cyan',
        red: 'border-red bg-red-tint text-red',
        plot: 'border-line-2 text-chalk-2 bg-plot-2',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[9px] tracking-[0.14em] uppercase ${tones[tone] || tones.sheet} ${className}`}
        >
            {children}
        </span>
    );
}

/**
 * Register pager. Laravel's link labels carry markup and English words; both are
 * rewritten into the sheet's own vocabulary before they reach the page.
 */
export function pagerModel(paginator) {
    if (!paginator?.links?.length) {
        return null;
    }

    const strip = (label) => String(label || '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, '').trim();

    return paginator.links
        .filter((link) => strip(link.label) !== '')
        .map((link) => {
            const text = strip(link.label);
            const isPrevious = /previous/i.test(text);
            const isNext = /next/i.test(text);

            return {
                url: link.url,
                active: Boolean(link.active),
                label: isPrevious ? 'MUNDUR' : isNext ? 'MAJU' : text,
                kind: isPrevious ? 'step' : isNext ? 'step' : 'page',
            };
        });
}

export function Pager({ paginator, className = '' }) {
    const model = pagerModel(paginator);
    if (!model) {
        return null;
    }

    return (
        <nav className={`flex flex-wrap items-center gap-1 ${className}`} aria-label="Navigasi halaman register">
            {model.map((link, index) =>
                link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveScroll
                        aria-current={link.active ? 'page' : undefined}
                        className={`min-w-9 border px-2.5 py-1.5 text-center font-mono text-[10px] tracking-[0.1em] uppercase transition-colors ${
                            link.active
                                ? 'border-cyan bg-cyan text-sheet'
                                : 'border-rule-2 text-ink-2 hover:border-ink hover:text-ink'
                        } ${link.kind === 'step' ? 'px-3' : ''}`}
                    >
                        {link.label}
                    </Link>
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        aria-disabled="true"
                        className="hatch min-w-9 cursor-not-allowed border border-rule px-2.5 py-1.5 text-center font-mono text-[10px] tracking-[0.1em] uppercase text-ink-3"
                    >
                        {link.label}
                    </span>
                ),
            )}
        </nav>
    );
}

/** An empty register: the state says what is missing and how to recover. */
export function EmptyState({ title, description, action }) {
    return (
        <div className="border border-rule bg-sheet-2 px-6 py-14 text-center">
            <div className="mx-auto max-w-md space-y-3">
                {/* h2, not h3: an empty state either follows a section head or
                    stands in for one, and an h3 straight after the page's h1 is a
                    heading-order jump. */}
                <h2 className="font-display text-[15px] font-semibold uppercase tracking-[0.02em] text-ink">
                    {title}
                </h2>
                {description && <p className="text-[12px] leading-relaxed text-ink-2">{description}</p>}
                {action && <div className="pt-2">{action}</div>}
            </div>
        </div>
    );
}
