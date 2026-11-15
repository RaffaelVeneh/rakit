import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowLeftRight, ArrowRight, Crosshair, Minus, Plus } from 'lucide-react';
import { Callout, Dim } from '@/Components/Sheet';
import { PlatePhoto } from '@/Components/PlatePhoto';
import { Lamp, QtyStepper, Stamp, StatusLamp } from '@/Components/Controls';
import { groupCode, partNo, position, stockState } from '@/lib/catalog';
import { amount, count, rupiah } from '@/lib/format';
import { atWidth, srcSet, SIZES } from '@/lib/images';

/**
 * The drawing table.
 *
 * The storefront's opening is an instrument, not a poster: the visitor takes a real
 * position out of the register, puts it on the sheet, and inspects it. The plate can
 * be panned and magnified like a drawing under a loupe, the pins on it open real
 * fields from the record, the rail swaps position with the arrow keys, and a second
 * position can be laid beside the first so the difference between them is measured
 * rather than claimed.
 *
 * Every figure here comes from the row. Nothing is decorative, and nothing is
 * asserted that the register cannot back.
 */

/**
 * Where the three pins sit on the plate.
 *
 * Fixed, not derived from the row id. They used to be nudged by a hash of the id,
 * which looked like measurement and was noise: a pin labelled "Harga satuan" would
 * land wherever the arithmetic put it. A pin here is a tab that opens a field, and
 * it says so — the leader line runs from the pin to the reading it opens. Claiming
 * more than that would be the sheet pretending to a precision it does not have.
 */
const HOTSPOT_FIELDS = [
    { key: 'price', label: 'Harga satuan', x: 22, y: 26 },
    { key: 'stock', label: 'Di gudang', x: 58, y: 46 },
    { key: 'position', label: 'Posisi register', x: 32, y: 72 },
];

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function zoomLabel(zoom) {
    return `${Math.round(zoom * 100)}%`;
}

export default function DrawingTable({
    products = [],
    filtered = false,
    group = null,
    signedIn = false,
    className = '',
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [openSpot, setOpenSpot] = useState(null);
    const [compareOn, setCompareOn] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [sending, setSending] = useState(false);

    const frameRef = useRef(null);
    const plateRef = useRef(null);
    const panRef = useRef({ x: 0, y: 0 });
    // A few pixels of drift toward the pointer while the drawing is unmagnified.
    // It gives the plate depth without moving it far enough to break the illusion
    // that it is a sheet lying on a table rather than a photograph on a page.
    const parallaxRef = useRef({ x: 0, y: 0 });
    const dragRef = useRef(null);
    const readoutRef = useRef(null);
    const zoomRef = useRef(1);

    const active = products[activeIndex] ?? null;

    /**
     * What to compare against.
     *
     * This used to be simply the next row in the rail, which is the next newest
     * featured product — so the sheet would happily measure a solid-state drive
     * against a processor and print a difference between two things nobody is
     * choosing between. A position can only be compared with one from its own
     * group; among those, the nearest price is the one the buyer is actually
     * weighing. When the group holds nothing else, the sheet says so instead of
     * inventing a pairing.
     */
    const rival = useMemo(() => {
        if (!active) {
            return null;
        }

        const neighbours = products.filter(
            (product) => product.id !== active.id && product.category_id === active.category_id,
        );

        if (neighbours.length === 0) {
            return null;
        }

        return neighbours.reduce((closest, product) =>
            Math.abs(Number(product.price) - Number(active.price)) <
            Math.abs(Number(closest.price) - Number(active.price))
                ? product
                : closest,
        );
    }, [products, active]);

    zoomRef.current = zoom;

    const clampPan = useCallback((x, y, z) => {
        const frame = frameRef.current;
        if (!frame) {
            return { x, y };
        }
        const limit = ((z - 1) * frame.clientWidth) / 2;
        const limitY = ((z - 1) * frame.clientHeight) / 2;
        return {
            x: Math.max(-limit, Math.min(limit, x)),
            y: Math.max(-limitY, Math.min(limitY, y)),
        };
    }, []);

    const paint = useCallback(() => {
        const plate = plateRef.current;
        if (!plate) {
            return;
        }
        const { x, y } = panRef.current;
        const { x: px, y: py } = parallaxRef.current;
        plate.style.transform = `translate3d(${x + px}px, ${y + py}px, 0) scale(${zoomRef.current})`;
        if (readoutRef.current) {
            readoutRef.current.textContent = `X ${String(Math.round(-x)).padStart(4, '0')} · Y ${String(
                Math.round(-y),
            ).padStart(4, '0')} · ${zoomLabel(zoomRef.current)}`;
        }
    }, []);

    const resetView = useCallback(() => {
        panRef.current = { x: 0, y: 0 };
        zoomRef.current = 1;
        setZoom(1);
        paint();
    }, [paint]);

    // A new position is a new drawing: recentre it rather than inheriting the
    // previous one's magnification.
    useEffect(() => {
        resetView();
        setOpenSpot(null);
        setQuantity(1);
    }, [activeIndex, resetView]);

    useEffect(() => {
        paint();
    }, [zoom, paint]);

    const onPointerDown = (event) => {
        if (zoomRef.current <= MIN_ZOOM || event.button !== 0) {
            return;
        }
        const frame = frameRef.current;
        if (!frame) {
            return;
        }
        dragRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            originX: panRef.current.x,
            originY: panRef.current.y,
        };
        frame.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag) {
            return;
        }
        panRef.current = clampPan(
            drag.originX + (event.clientX - drag.startX),
            drag.originY + (event.clientY - drag.startY),
            zoomRef.current,
        );
        paint();
    };

    const endDrag = (event) => {
        if (!dragRef.current) {
            return;
        }
        dragRef.current = null;
        frameRef.current?.releasePointerCapture?.(event.pointerId);
    };

    /** The plate leans toward the pointer. Magnified, panning takes over. */
    const onPlateMove = (event) => {
        const frame = frameRef.current;

        if (!frame || dragRef.current || zoomRef.current > MIN_ZOOM) {
            return;
        }

        const box = frame.getBoundingClientRect();
        const dx = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
        const dy = (event.clientY - (box.top + box.height / 2)) / (box.height / 2);

        parallaxRef.current = {
            x: Math.max(-1, Math.min(1, dx)) * -7,
            y: Math.max(-1, Math.min(1, dy)) * -7,
        };
        paint();
    };

    const onPlateLeave = () => {
        parallaxRef.current = { x: 0, y: 0 };
        paint();
    };

    const applyWheel = (event) => {
        event.preventDefault();
        const next = Math.max(
            MIN_ZOOM,
            Math.min(MAX_ZOOM, Number((zoomRef.current + (event.deltaY < 0 ? 0.25 : -0.25)).toFixed(2))),
        );
        zoomRef.current = next;
        setZoom(next);
        panRef.current = clampPan(panRef.current.x, panRef.current.y, next);
        paint();
    };

    /**
     * Bound by hand with passive: false.
     *
     * React 19 registers wheel as a passive listener at the root, so a
     * preventDefault() inside a JSX onWheel does nothing: the drawing zoomed
     * and the page scrolled underneath it on every tick.
     */
    useEffect(() => {
        const frame = frameRef.current;

        if (!frame) {
            return undefined;
        }

        frame.addEventListener('wheel', applyWheel, { passive: false });

        return () => frame.removeEventListener('wheel', applyWheel);
    });

    const nudgeZoom = (delta) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number((zoomRef.current + delta).toFixed(2))));
        zoomRef.current = next;
        setZoom(next);
        panRef.current = clampPan(panRef.current.x, panRef.current.y, next);
        paint();
    };

    const move = (step) => {
        if (!products.length) {
            return;
        }
        setActiveIndex((index) => (index + step + products.length) % products.length);
    };

    const onKeyDown = (event) => {
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            move(1);
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            move(-1);
        } else if (event.key.toLowerCase() === 'b') {
            event.preventDefault();
            setCompareOn((value) => !value);
        }
    };

    const addToOrder = () => {
        if (!active) {
            return;
        }
        setSending(true);
        router.post(
            '/cart/add',
            { product_id: active.id, quantity },
            {
                preserveScroll: true,
                // The controller flashes its own confirmation; the layout reports it.
                onFinish: () => setSending(false),
            },
        );
    };

    const readings = useMemo(() => {
        if (!active) {
            return [];
        }
        const difference = rival ? Number(rival.price) - Number(active.price) : 0;
        return [
            { key: 'price', label: 'Harga satuan', value: rupiah(active.price) },
            { key: 'stock', label: 'Di gudang', value: `${count(active.stock)} unit` },
            { key: 'position', label: 'Posisi register', value: position(active) },
            { key: 'difference', value: difference },
        ];
    }, [active, rival]);

    if (!active) {
        // The storefront's `h1` is the cover above this component; an empty
        // catalogue still gets a heading and a way onward instead of nothing.
        return (
            <section className={`border-b border-ink ${className}`} aria-labelledby="drawing-table-title">
                <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                    <h2
                        id="drawing-table-title"
                        className="font-display text-[32px] font-extrabold uppercase leading-[0.94] tracking-[-0.02em] text-ink sm:text-[38px] lg:text-[44px]"
                    >
                        Beli dengan angka,
                        <br />
                        bukan gambar.
                    </h2>
                    <p className="mt-5 max-w-[58ch] text-[13px] leading-relaxed text-ink-2">
                        Meja gambar belum memuat satu posisi pun. Register katalog kosong, jadi tidak ada
                        nomor bagian, stok, atau harga yang bisa dibaca.
                    </p>
                    <Link href="/admin/products" className="stamp-2 mt-5 inline-flex">
                        Buka register katalog di konsol
                    </Link>
                </div>
            </section>
        );
    }

    const condition = stockState(active.stock);
    const out = Number(active.stock) <= 0;
    const difference = readings.find((row) => row.key === 'difference')?.value ?? 0;

    return (
        <section
            className={`border-b border-ink ${className}`}
            aria-labelledby="drawing-table-title"
            onKeyDown={onKeyDown}
            tabIndex={-1}
        >
            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
                    {/* ---- the drawing ------------------------------------- */}
                    <div className="lg:col-span-7">
                        <div className="flex flex-wrap items-end justify-between gap-3 pb-3">
                            <div className="min-w-0">
                                <h2
                                    id="drawing-table-title"
                                    className="font-display text-[32px] font-extrabold uppercase leading-[0.94] tracking-[-0.02em] text-ink sm:text-[38px] lg:text-[44px]"
                                >
                                    Beli dengan angka,
                                    <br />
                                    bukan gambar.
                                </h2>
                            </div>
                            <span className="part-no flex-none pb-1">
                                {filtered && group ? `${group} · ` : ''}
                                {partNo(active)} · {groupCode(active.category?.name)}
                            </span>
                        </div>

                        <div className="plot-in mb-3 block h-px bg-ink" aria-hidden="true" />

                        <div
                            ref={frameRef}
                            data-cursor={zoom > MIN_ZOOM ? 'drag' : undefined}
                            onPointerDown={onPointerDown}
                            onPointerMove={(event) => {
                                onPointerMove(event);
                                onPlateMove(event);
                            }}
                            onPointerUp={endDrag}
                            onPointerCancel={endDrag}
                            onPointerLeave={onPlateLeave}
                            className="plate relative aspect-[4/3] touch-pan-y select-none overflow-hidden"
                        >
                            <span className="plate__tab z-20">
                                Piringan 01 · {active.category?.name || 'Katalog'}
                            </span>

                            <PlatePhoto
                                key={active.id}
                                photoRef={plateRef}
                                src={atWidth(active.image, 1200) || active.image}
                                srcSet={srcSet(active.image, [600, 900, 1200, 1600])}
                                sizes={SIZES.plate}
                                alt={`${active.name} — foto rujukan kelompok, bukan gambar resmi`}
                                width="1200"
                                height="900"
                                loading="eager"
                                className="fade-in absolute inset-0 h-full w-full origin-center object-cover"
                                style={{ transform: 'translate3d(0,0,0) scale(1)' }}
                                draggable="false"
                            />

                            {/* The drawn grid: part of the sheet, not an effect. */}
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 z-10 opacity-[0.14] mix-blend-multiply"
                                style={{
                                    backgroundImage:
                                        'linear-gradient(to right, #0C1622 1px, transparent 1px), linear-gradient(to bottom, #0C1622 1px, transparent 1px)',
                                    backgroundSize: '48px 48px',
                                }}
                            />

                            {/* Pins: real fields, opened by the visitor. */}
                            {HOTSPOT_FIELDS.map((spot, index) => {
                                const reading = readings.find((row) => row.key === spot.key);
                                if (!reading) {
                                    return null;
                                }
                                const open = openSpot === spot.key;

                                return (
                                    <div
                                        key={spot.key}
                                        className="absolute z-20"
                                        style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                                    >
                                        <button
                                            type="button"
                                            data-cursor="measure"
                                            onClick={() => setOpenSpot(open ? null : spot.key)}
                                            aria-expanded={open}
                                            aria-label={`${spot.label}: ${reading.value}`}
                                            className={`relative flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center border transition-colors ${
                                                open
                                                    ? 'border-cyan bg-cyan text-sheet'
                                                    : 'border-ink bg-sheet/90 text-ink hover:border-cyan hover:text-cyan'
                                            }`}
                                        >
                                            <Crosshair className="h-2.5 w-2.5" strokeWidth={1.5} />
                                        </button>

                                        {/* The leader: a hairline from the pin to the
                                            reading it opens, the same grammar the rest
                                            of the sheet uses for an annotation. */}
                                        {open && (
                                            <>
                                            <span
                                                aria-hidden="true"
                                                className="measure-in absolute left-[10px] top-1/2 h-px w-1.5 bg-ink"
                                            />
                                            <div className="measure-in absolute left-4 top-1/2 z-30 w-max max-w-[15rem] -translate-y-1/2 border border-ink bg-sheet px-3 py-2 shadow-[0_6px_18px_-8px_rgba(12,22,34,0.45)]">
                                                <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                                    {spot.label}
                                                </span>
                                                <span
                                                    data-measure
                                                    className="mt-0.5 block font-mono text-[12px] font-medium text-ink"
                                                >
                                                    {reading.value}
                                                </span>
                                            </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}

                            {/* The loupe instrument. */}
                            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-px border border-ink bg-sheet">
                                <button
                                    type="button"
                                    onClick={() => nudgeZoom(-0.25)}
                                    disabled={zoom <= MIN_ZOOM}
                                    aria-label="Perkecil gambar"
                                    className="flex h-7 w-7 items-center justify-center text-ink transition-colors hover:bg-sheet-2 disabled:text-ink-3 disabled:hover:bg-sheet"
                                >
                                    <Minus className="h-3 w-3" strokeWidth={1.5} />
                                </button>
                                <span
                                    data-measure
                                    className="flex h-7 w-14 items-center justify-center border-x border-rule font-mono text-[10px] text-ink"
                                >
                                    {zoomLabel(zoom)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => nudgeZoom(0.25)}
                                    disabled={zoom >= MAX_ZOOM}
                                    aria-label="Perbesar gambar"
                                    className="flex h-7 w-7 items-center justify-center text-ink transition-colors hover:bg-sheet-2 disabled:text-ink-3 disabled:hover:bg-sheet"
                                >
                                    <Plus className="h-3 w-3" strokeWidth={1.5} />
                                </button>
                                <button
                                    type="button"
                                    onClick={resetView}
                                    className="h-7 border-l border-rule px-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-2 transition-colors hover:bg-sheet-2 hover:text-ink"
                                >
                                    Pusatkan
                                </button>
                            </div>

                            <span
                                ref={readoutRef}
                                data-measure
                                className="absolute bottom-3 right-3 z-20 bg-sheet/85 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-2"
                            >
                                X 0000 · Y 0000 · 100%
                            </span>
                        </div>

                        {/* The plate carries a group reference photograph, not a photograph
                            of this position. Said here, next to it, rather than only in the
                            colophon three thousand pixels below. */}
                        <p className="mt-2 max-w-[70ch] text-[10px] leading-relaxed text-ink-3">
                            Piringan memuat foto rujukan kelompok, bukan gambar resmi{' '}
                            {partNo(active)}. Seluruh angka pada lembar ini dibaca dari barisnya.
                        </p>

                        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                            {/* Panning is only possible once magnified, so it is only
                                advertised once magnified. */}
                            {zoom > MIN_ZOOM && (
                                <>
                                    <span>Geser: menggeser</span>
                                    <span aria-hidden="true">·</span>
                                </>
                            )}
                            <span>Gulir: memperbesar</span>
                            <span aria-hidden="true">·</span>
                            <span>Klik penanda: baca medan</span>
                        </p>

                        {/* ---- the rail ------------------------------------ */}
                        <div
                            role="tablist"
                            aria-label="Posisi di atas meja gambar"
                            className="mt-5 grid grid-cols-3 gap-px border border-ink bg-rule sm:grid-cols-6"
                        >
                            {products.map((product, index) => {
                                const selected = index === activeIndex;
                                const stock = stockState(product.stock);
                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={selected}
                                        tabIndex={selected ? 0 : -1}
                                        onClick={() => setActiveIndex(index)}
                                        style={{ animationDelay: `${index * 55}ms` }}
                                        className={`rise-in group relative bg-sheet px-2 pb-2 pt-14 text-left transition-[background-color,transform] duration-300 hover:-translate-y-0.5 ${
                                            selected ? 'bg-sheet-2' : 'hover:bg-sheet-2'
                                        }`}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`absolute inset-x-0 top-0 h-[2px] ${
                                                selected ? 'bg-cyan' : 'bg-transparent'
                                            }`}
                                        />
                                        <PlatePhoto
                                            src={atWidth(product.image, 200) || product.image}
                                            srcSet={srcSet(product.image, [120, 200, 320])}
                                            sizes={SIZES.listThumb}
                                            width="200"
                                            height="200"
                                            className="absolute inset-x-0 top-0 h-12 w-full object-cover"
                                        />
                                        <span className="block font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">
                                            {position(product)}
                                        </span>
                                        <span className="mt-0.5 block truncate text-[11px] font-medium text-ink">
                                            {product.name}
                                        </span>
                                        <span className="mt-1 flex items-center gap-1.5">
                                            <Lamp tone={stock.tone} state={stock.lamp} />
                                            <span
                                                data-measure
                                                className="font-mono text-[10px] text-ink-2"
                                            >
                                                {amount(product.price)}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                            Tombol ← → memindahkan posisi · B membandingkan
                        </p>
                    </div>

                    {/* ---- the reading ------------------------------------- */}
                    <div className="lg:col-span-5">
                        <div className="zone-frame">
                            <div className="flex items-baseline justify-between gap-4 border-b border-ink px-4 py-3">
                                <span className="part-no text-ink">{partNo(active)}</span>
                                <StatusLamp state={condition} />
                            </div>

                            <div className="px-4 py-4">
                                <h2 className="font-display text-[19px] font-bold uppercase leading-tight tracking-[-0.01em] text-ink">
                                    <Link href={`/product/${active.slug}`} className="hover:text-cyan">
                                        {active.name}
                                    </Link>
                                </h2>
                                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                                    {active.brand?.name ? `${active.brand.name} · ` : ''}
                                    {position(active)}
                                </p>

                                <div className="mt-3">
                                    <Callout k="Kelompok">{active.category?.name || '—'}</Callout>
                                    <Callout k="Merk">{active.brand?.name || '—'}</Callout>
                                    <Callout k="Di gudang">
                                        {count(active.stock)} unit · {condition.label}
                                    </Callout>
                                    <Callout k="Harga satuan">{rupiah(active.price)}</Callout>
                                </div>

                                <div className="mt-4 border-t border-rule pt-4">
                                    {out ? (
                                        <>
                                            <p className="text-[12px] leading-relaxed text-ink-2">
                                                Posisi ini sedang tidak ada stoknya. Pilih posisi lain di rel
                                                bawah, atau buka kelompoknya di register.
                                            </p>
                                            <Link
                                                href={`/?category=${active.category_id}#register`}
                                                className="stamp-2 mt-4 w-full"
                                            >
                                                Lihat posisi sekelompok
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                                    Jumlah
                                                </span>
                                                <QtyStepper
                                                    value={quantity}
                                                    max={Number(active.stock) || 1}
                                                    onChange={setQuantity}
                                                    disabled={sending}
                                                />
                                            </div>

                                            <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-rule pt-3">
                                                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                                    Subtotal
                                                </span>
                                                <span
                                                    data-measure
                                                    className="font-mono text-[17px] font-medium text-ink"
                                                >
                                                    <span className="text-[12px] text-ink-3">Rp</span>{' '}
                                                    {amount((Number(active.price) || 0) * quantity)}
                                                </span>
                                            </div>

                                            {signedIn ? (
                                                <Stamp
                                                    size="lg"
                                                    magnetic
                                                    className="mt-3 w-full"
                                                    onClick={addToOrder}
                                                    disabled={sending}
                                                >
                                                    {sending ? 'Mengirim' : 'Tambah ke tas'}
                                                </Stamp>
                                            ) : (
                                                /* The way in, offered before the refusal rather
                                                   than after it. The server enforces the same
                                                   rule; this only means a guest reads it while
                                                   they are deciding. */
                                                <Link href="/login" className="stamp mt-3 w-full">
                                                    Masuk untuk membeli
                                                </Link>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-rule px-4 py-3">
                                {/* Only offered when the group holds something to compare
                                    with. A comparison across groups measures two things
                                    nobody is choosing between, so the sheet declines
                                    rather than printing a number. */}
                                {rival ? (
                                    <button
                                        type="button"
                                        onClick={() => setCompareOn((value) => !value)}
                                        aria-pressed={compareOn}
                                        className={`flex w-full items-center justify-between gap-3 border px-3 py-2 transition-colors ${
                                            compareOn
                                                ? 'border-cyan bg-cyan-tint text-cyan'
                                                : 'border-rule-2 text-ink-2 hover:border-ink hover:text-ink'
                                        }`}
                                    >
                                        <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                                            Bandingkan dengan {partNo(rival)}
                                        </span>
                                        <ArrowLeftRight className="h-3.5 w-3.5 flex-none" strokeWidth={1.5} />
                                    </button>
                                ) : (
                                    <p className="border border-rule px-3 py-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-ink-3">
                                        Tidak ada posisi sejenis pada meja ini untuk dibandingkan
                                    </p>
                                )}
                            </div>
                        </div>

                        {compareOn && rival && (
                            <div className="measure-in zone-frame mt-4">
                                <div className="flex items-baseline justify-between gap-4 border-b border-ink px-4 py-3">
                                    <span className="part-no text-ink">{partNo(rival)}</span>
                                    <StatusLamp state={stockState(rival.stock)} />
                                </div>
                                <div className="px-4 py-4">
                                    <h3 className="font-display text-[15px] font-bold uppercase leading-tight text-ink">
                                        <Link href={`/product/${rival.slug}`} className="hover:text-cyan">
                                            {rival.name}
                                        </Link>
                                    </h3>
                                    <div className="mt-3">
                                        <Callout k="Merk">{rival.brand?.name || '—'}</Callout>
                                        <Callout k="Di gudang">{count(rival.stock)} unit</Callout>
                                        <Callout k="Harga satuan">{rupiah(rival.price)}</Callout>
                                    </div>
                                </div>
                                <div className="border-t border-ink px-4 py-3">
                                    <Dim
                                        label="Selisih harga"
                                        value={
                                            difference === 0
                                                ? 'Sama'
                                                : `${difference > 0 ? '+' : '−'} Rp ${amount(Math.abs(difference))}`
                                        }
                                    />
                                    <p className="mt-2 text-[11px] leading-relaxed text-ink-2">
                                        {difference === 0
                                            ? 'Kedua posisi dibanderol dengan harga yang sama.'
                                            : `${rival.name} ${difference > 0 ? 'lebih mahal' : 'lebih murah'} Rp ${amount(
                                                  Math.abs(difference),
                                              )} dari ${active.name}.`}
                                    </p>
                                </div>
                            </div>
                        )}

                        <Link
                            href="#register"
                            className="mt-4 flex items-center justify-between gap-3 border border-ink px-4 py-3 text-ink transition-colors hover:bg-sheet-2"
                        >
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                                Buka register lengkap
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 flex-none" strokeWidth={1.5} />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
