import React, { useEffect, useState } from 'react';
import { useCountUp } from '@/lib/motion';
import { Link } from '@inertiajs/react';

/**
 * The world's devices: the frame a sheet is drawn in, the title block that
 * identifies it, the dimension strings that measure it, and the callouts that
 * annotate it. Nothing here decides layout; every piece is a mark the drawing
 * standard already defines.
 */

/** The sheet's outer frame. One drawn edge, never a shadow. */
export function ZoneFrame({ as: As = 'div', className = '', children, ...rest }) {
    return (
        <As className={`zone-frame ${className}`} {...rest}>
            {children}
        </As>
    );
}

/** A strip across the top of a frame: what this sheet is, and its readouts. */
export function SheetHead({ label, readouts = [], action = null, tone = 'sheet' }) {
    const ink = tone === 'plot' ? 'text-chalk' : 'text-ink';
    const rule = tone === 'plot' ? 'border-line-2' : 'border-ink';
    const muted = tone === 'plot' ? 'text-chalk-2' : 'text-ink-3';

    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b ${rule} px-3 py-2`}
        >
            <div className="flex items-baseline gap-3 min-w-0">
                <span
                    className={`font-mono text-[10px] tracking-[0.16em] uppercase ${ink}`}
                >
                    {label}
                </span>
                {readouts.map((readout) => (
                    <span key={readout.label} className="hidden items-baseline gap-1.5 sm:flex">
                        <span className={`font-mono text-[9px] tracking-[0.14em] uppercase ${muted}`}>
                            {readout.label}
                        </span>
                        <span className={`font-mono text-[10px] font-medium ${ink}`}>{readout.value}</span>
                    </span>
                ))}
            </div>
            {action}
        </div>
    );
}

/** A measured span. Ticks at both ends, the figure set in the measurement voice. */
export function Dim({ label, value, className = '' }) {
    return (
        <div className={`dim ${className}`}>
            <span className="dim__tick" aria-hidden="true" />
            <span className="dim__line" aria-hidden="true" />
            {value !== undefined && (
                <span className="dim__label text-ink-2">
                    <span className="text-ink-3">{label}</span> {value}
                </span>
            )}
            {value === undefined && label && <span className="dim__label">{label}</span>}
            <span className="dim__line" aria-hidden="true" />
            <span className="dim__tick" aria-hidden="true" />
        </div>
    );
}

/** A leader annotation: key on the left, the reading on the right. */
export function Callout({ k, children }) {
    return (
        <div className="callout">
            <span className="callout__key">{k}</span>
            <span className="callout__val">{children}</span>
        </div>
    );
}

/** A figure frame. Imagery is a plate on the sheet, never a background. */
export function Plate({ tab, children, className = '', bodyClassName = '' }) {
    return (
        <div className={`plate ${className}`}>
            {tab && <span className="plate__tab">{tab}</span>}
            <div className={bodyClassName}>{children}</div>
        </div>
    );
}

/** A section divider: rule, title, and what the section covers. No eyebrow. */
export function SectionHead({ title, meta, action, className = '', drawn = false }) {
    return (
        <div className={`section-head ${drawn ? 'section-head--drawn' : ''} ${className}`}>
            <div className="min-w-0">
                <h2 className="section-head__title">{title}</h2>
            </div>
            <div className="flex flex-none items-baseline gap-4">
                {meta && (
                    <span className="hidden font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3 sm:inline">
                        {meta}
                    </span>
                )}
                {action}
            </div>
        </div>
    );
}

/**
 * A labelled figure. The unit is part of the reading, not a caption.
 *
 * A readout can be given a plain string, or — with `count` — a number and the
 * formatter that turns it back into that string. Given a number, the figure counts
 * up as it enters view. Only the digits move: the currency mark, the separators and
 * the unit are produced by the formatter at every step, so the figure is never
 * wrong on its way to being right, and a reader who glances mid-count still sees a
 * real number in the sheet's own notation.
 */
export function Readout({ label, value, count = null, sub, tone = 'sheet', className = '' }) {
    const ink = tone === 'plot' ? 'text-chalk' : 'text-ink';
    const muted = tone === 'plot' ? 'text-chalk-2' : 'text-ink-3';
    const rule = tone === 'plot' ? 'border-line' : 'border-rule';

    const [counter, shown] = useCountUp(count?.to ?? 0);
    const figure = count ? count.format(shown) : value;

    return (
        <div className={`border-t ${rule} pt-2 ${className}`}>
            <span className={`block font-mono text-[9px] tracking-[0.16em] uppercase ${muted}`}>
                {label}
            </span>
            <span
                ref={count ? counter : undefined}
                data-measure
                className={`mt-1 block font-mono text-[15px] font-medium leading-none ${ink}`}
            >
                {figure}
            </span>
            {sub && <span className={`mt-1 block text-[11px] ${muted}`}>{sub}</span>}
        </div>
    );
}

/** The title block: the sheet's identity, revision, and scale in one grid. */
export function TitleBlock({ cells = [], tone = 'sheet' }) {
    const rule = tone === 'plot' ? 'border-line' : 'border-ink';
    const ink = tone === 'plot' ? 'text-chalk' : 'text-ink';
    const muted = tone === 'plot' ? 'text-chalk-2' : 'text-ink-3';

    return (
        <div className={`grid border ${rule}`} style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
            {cells.map((cell, index) => (
                <div
                    key={cell.label}
                    className={`px-3 py-2 ${index < cells.length - 1 ? `border-r ${tone === 'plot' ? 'border-line' : 'border-rule'}` : ''}`}
                >
                    <span className={`block font-mono text-[9px] tracking-[0.16em] uppercase ${muted}`}>
                        {cell.label}
                    </span>
                    <span className={`mt-0.5 block font-display text-[12px] font-semibold uppercase tracking-[0.02em] ${ink}`}>
                        {cell.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

/** A drawn hairline. Used to separate without adding a box. */
export function Rule({ tone = 'sheet', weight = 'hair', className = '' }) {
    const color =
        tone === 'plot'
            ? weight === 'hair'
                ? 'border-line'
                : 'border-line-2'
            : weight === 'hair'
              ? 'border-rule'
              : weight === 'med'
                ? 'border-rule-2'
                : 'border-ink';
    return <hr className={`border-0 border-t ${color} ${className}`} />;
}

/**
 * The band at the top of an inner sheet: where you are, what this sheet is, and
 * the actions it offers. One heading, no eyebrow above it.
 */
export function PageBand({ path = [], title, meta, actions, tone = 'sheet', children }) {
    const rule = tone === 'plot' ? 'border-line-2' : 'border-ink';
    const ink = tone === 'plot' ? 'text-chalk' : 'text-ink';
    const muted = tone === 'plot' ? 'text-chalk-2' : 'text-ink-3';
    const body = tone === 'plot' ? 'text-chalk-2' : 'text-ink-2';

    return (
        <section className={`border-b ${rule}`}>
            <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {path.length > 0 && (
                    <nav
                        aria-label="Posisi lembar"
                        className={`flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] ${muted}`}
                    >
                        {path.map((crumb, index) => (
                            <React.Fragment key={`${crumb.label}-${index}`}>
                                {index > 0 && <span aria-hidden="true">/</span>}
                                {crumb.href ? (
                                    // Inertia's Link, not a bare anchor: a crumb that
                                    // points inside the app must not force a full
                                    // document reload.
                                    <Link href={crumb.href} className="transition-colors hover:text-cyan">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className={ink}>{crumb.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}

                <div className="mt-3 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
                    <h1
                        className={`font-display text-[26px] font-extrabold uppercase leading-[1.02] tracking-[-0.015em] sm:text-[32px] ${ink}`}
                    >
                        {title}
                    </h1>
                    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                </div>

                {meta && <p className={`mt-3 max-w-[74ch] text-[12px] leading-relaxed ${body}`}>{meta}</p>}
                {children}
            </div>
        </section>
    );
}

/**
 * A bill: ruled lines, one heavy total. Figures are read, not admired, so the
 * value column is the measurement voice and never wrapped.
 */
export function Bill({ title, rows = [], total, totalLabel = 'Total', footnote, tone = 'sheet', children }) {
    const rule = tone === 'plot' ? 'border-line-2' : 'border-ink';
    const hair = tone === 'plot' ? 'border-line' : 'border-rule';
    const field = tone === 'plot' ? 'bg-plot-2' : 'bg-sheet';
    const ink = tone === 'plot' ? 'text-chalk' : 'text-ink';
    const muted = tone === 'plot' ? 'text-chalk-2' : 'text-ink-3';

    return (
        <div className={`border ${rule} ${field}`}>
            {title && (
                <h2
                    className={`border-b ${rule} px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] ${ink}`}
                >
                    {title}
                </h2>
            )}

            <dl className="px-4">
                {rows.map((row, index) => (
                    <div
                        key={`${row.label}-${index}`}
                        className={`flex items-baseline justify-between gap-6 py-2.5 ${index > 0 ? `border-t ${hair}` : ''}`}
                    >
                        <dt className={`text-[12px] ${muted}`}>{row.label}</dt>
                        <dd
                            data-measure
                            className={`flex-none font-mono text-[12px] ${row.tone === 'red' ? 'text-red' : ink}`}
                        >
                            {row.value}
                        </dd>
                    </div>
                ))}
            </dl>

            {total !== undefined && (
                <div className={`flex items-baseline justify-between gap-6 border-t ${rule} px-4 py-3`}>
                    <span className={`font-display text-[12px] font-bold uppercase tracking-[0.14em] ${ink}`}>
                        {totalLabel}
                    </span>
                    <span data-measure className={`font-mono text-[17px] font-medium ${ink}`}>
                        {total}
                    </span>
                </div>
            )}

            {children}

            {footnote && (
                <p className={`border-t ${hair} px-4 py-2.5 text-[11px] leading-relaxed ${muted}`}>{footnote}</p>
            )}
        </div>
    );
}

/**
 * The wipe: a rule drawn across the top of the viewport as a new sheet is laid
 * down over the old one.
 *
 * It plays on a client-side navigation and never on first load — the opening
 * sheet is not replacing anything, so drawing a line over it would announce a
 * change that did not happen.
 *
 * The previous URL is held at module scope rather than in a ref. Inertia swaps
 * the whole page, layout included, so this component is remounted on every
 * navigation and a ref would always be initialised to the URL that had just
 * arrived: the comparison would never see a change and the rule would never draw.
 */
let lastSeenUrl = null;

export function SheetWipe({ url }) {
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        const previous = lastSeenUrl;
        lastSeenUrl = url;

        if (previous === null || previous === url) {
            return undefined;
        }

        setPlaying(true);

        const done = window.setTimeout(() => setPlaying(false), 760);

        return () => window.clearTimeout(done);
    }, [url]);

    if (!playing) {
        return null;
    }

    return <span className="sheet-wipe" aria-hidden="true" />;
}