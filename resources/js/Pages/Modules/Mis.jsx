import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import Chart from 'chart.js/auto';
import ModuleLayout from '@/Layouts/ModuleLayout';
import {
    Callout,
    Dim,
    PageBand,
    Plate,
    Readout,
    SectionHead,
    SheetHead,
    ZoneFrame,
} from '@/Components/Sheet';
import { EmptyState, StatusLamp } from '@/Components/Controls';
import { count } from '@/lib/format';

/**
 * MIS — the tactical level's reading of the operational stream: two reports and
 * one drawn comparison, all from the same performance rows.
 *
 * Every figure here is US-dollar denominated in the source rows and is printed
 * exactly as stored — `$` plus `number_format($x, 2)` — never converted. Counts
 * and percentages keep the Indonesian separators the rest of the system uses.
 */

/** `number_format($x, 2)`: thousands by comma, decimals by point. */
const LEDGER = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/** `number_format($x, 1, ',', '.')`. */
const RATE = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

/**
 * The chart's measurement voice. `resources/js/app.js` sets these as Chart.js
 * defaults, but that script belongs to the Blade layout: the React entry never
 * loads it, so the plotted figure states its own palette.
 */
const MONO = "'Roboto Mono', ui-monospace, monospace";

/** The figure's palette follows the temperature of the sheet it is drawn on. */
const CHART_PALETTE = {
    plot: {
        accent: '#7AA2FF',
        muted: '#98A9BA',
        grid: '#22303D',
        legend: '#DEE6EE',
    },
    sheet: {
        accent: '#0E3A8F',
        muted: '#46586B',
        grid: '#C9D3DD',
        legend: '#0C1622',
    },
};

const figure = (value) => Number(value) || 0;
const percent = (value) => `${RATE.format(figure(value))}%`;

/** A dollar figure: the symbol in the muted tone, the amount in the measurement voice. */
function Usd({ value }) {
    return (
        <>
            <span className="text-[11px] text-chalk-2">$</span> {LEDGER.format(figure(value))}
        </>
    );
}

/**
 * `SalesPerformance::isException()` and `getExceptionType()` decide which rows
 * the controller reports and what it prints beside each one. Both are methods on
 * the model, so neither survives serialisation — the thresholds and the wording
 * are restated here to stay on the sheet.
 */
const outsideBand = (value) => figure(value) < 10000 || figure(value) > 50000;

function exceptionType(value) {
    if (figure(value) < 10000) {
        return 'Underperforming ( < $10.000 )';
    }
    if (figure(value) > 50000) {
        return 'High Outlier ( > $50.000 )';
    }
    return null;
}

/** A report filter. The exception report carries the red rule, as its own does. */
function FilterTab({ active, tone = 'lit', onClick, children }) {
    const activeRule = tone === 'red' ? 'border-red' : 'border-lit';

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`border-b-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                active ? `${activeRule} text-chalk` : 'border-transparent text-chalk-2 hover:text-chalk'
            }`}
        >
            {children}
        </button>
    );
}

/** The person and period a row belongs to, in the register's own two lines. */
function PersonCell({ row }) {
    return (
        <td>
            <span className="block text-[13px] font-medium text-chalk">{row.salesperson_name}</span>
            <span className="mt-0.5 block font-mono text-[10px] text-chalk-2">{row.month}</span>
        </td>
    );
}

export default function Mis({
    performances = [],
    totalSales = 0,
    totalTarget = 0,
    totalTrx = 0,
    achievement = 0,
    exceptions = {},
    tpsSummary = {},
}) {
    const [filter, setFilter] = useState('all');
    const [theme, setTheme] = useState(
        () => (typeof document !== 'undefined' && document.documentElement.dataset.theme) || 'sheet',
    );
    const chartCanvas = useRef(null);

    /**
     * Chart.js paints to a bitmap, so it cannot inherit CSS tokens. Keep a small
     * observer on the document's theme attribute and rebuild the figure with the
     * matching palette.
     */
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setTheme(document.documentElement.dataset.theme || 'sheet');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        return () => observer.disconnect();
    }, []);

    const palette = CHART_PALETTE[theme] || CHART_PALETTE.sheet;

    /** Held by identity so a tab switch never rebuilds the drawn chart. */
    const rows = useMemo(() => performances || [], [performances]);

    /**
     * `exceptions` is a filtered collection, so the controller hands Inertia the
     * surviving keys — 3, 7 and 18 on the seeded data — and JSON encodes a
     * non-sequential array as an object. Reading it by value keeps every row.
     */
    const exceptionRows = useMemo(() => Object.values(exceptions || {}), [exceptions]);

    /** `$performances->pluck('month')->filter()->unique()`, then first to last. */
    const period = useMemo(() => {
        const months = [...new Set(rows.map((row) => row.month).filter(Boolean))];

        if (months.length === 0) {
            return 'Periode tidak tercatat';
        }

        return months.length === 1 ? String(months[0]) : `${months[0]} – ${months[months.length - 1]}`;
    }, [rows]);

    /** The two series the chart draws, taken row by row from the same register. */
    const series = useMemo(
        () => ({
            // The bar is a person-month, so the label carries both. Labelled by
            // name alone, four different bars shared one label and the month a
            // figure belonged to was nowhere on the figure that drew it.
            labels: rows.map((row) => `${row.salesperson_name} · ${row.month}`),
            actuals: rows.map((row) => figure(row.actual_sales)),
            targets: rows.map((row) => figure(row.target_amount)),
        }),
        [rows],
    );

    /**
     * The canvas lives outside React's tree: one chart per mounted canvas. The
     * cleanup destroys it, so a re-render or a sheet change never leaves a second
     * chart drawing onto the same bitmap.
     */
    useEffect(() => {
        const canvas = chartCanvas.current;

        if (!canvas) {
            return undefined;
        }

        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: series.labels,
                datasets: [
                    {
                        label: 'Realisasi ($)',
                        data: series.actuals,
                        backgroundColor: palette.accent,
                        borderRadius: 0,
                        // No fixed bar thickness: at forty-eight periods a pinned
                        // 24px bar overflows the plot area and the chart draws a
                        // cluster at the origin instead of a series. Letting the
                        // bars share the width is what makes the figure readable
                        // at every viewport.
                        categoryPercentage: 0.86,
                        barPercentage: 0.9,
                    },
                    {
                        label: 'Target ($)',
                        data: series.targets,
                        type: 'line',
                        borderColor: palette.muted,
                        borderDash: [4, 4],
                        borderWidth: 2,
                        pointRadius: 3,
                        tension: 0,
                        fill: false,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        grid: { color: palette.grid },
                        ticks: { color: palette.muted, font: { family: MONO, size: 10 } },
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: palette.muted,
                            font: { family: MONO, size: 10 },
                            // Forty-eight rotated labels would overlap into a grey
                            // band. Twelve legible ticks carry the axis; the full
                            // series stays in the table beneath the figure.
                            autoSkip: true,
                            maxTicksLimit: 12,
                            maxRotation: 0,
                        },
                    },
                },
                plugins: {
                    legend: {
                        labels: {
                            color: palette.legend,
                            boxWidth: 8,
                            boxHeight: 8,
                            font: { family: MONO, size: 10 },
                        },
                    },
                },
            },
        });

        return () => chart.destroy();
    }, [series, palette]);

    const showExceptions = filter === 'all' || filter === 'exception';
    const showSummary = filter === 'all' || filter === 'summary';

    return (
        <ModuleLayout sheet="Management Information System (MIS)">
            <Head title="Management Information System (MIS) — RAKIT" />

            <PageBand
                tone="plot"
                path={[
                    { label: 'Piramida', href: '/pyramid' },
                    { label: 'Modul rujukan' },
                    { label: 'MIS · Tingkat taktis' },
                ]}
                title="Management information system (MIS)"
                meta="Pengolahan data transaksi tingkat operasional menjadi dua bentuk laporan untuk manajer tingkat menengah: laporan ringkasan berkala, dan laporan pengecualian yang hanya menyoroti kinerja di luar ambang."
                actions={
                    <div
                        role="group"
                        aria-label="Pilih laporan"
                        className="flex flex-wrap items-center gap-1 border-b border-line"
                    >
                        <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>
                            Semua laporan
                        </FilterTab>
                        <FilterTab active={filter === 'summary'} onClick={() => setFilter('summary')}>
                            Laporan ringkasan
                        </FilterTab>
                        <FilterTab
                            active={filter === 'exception'}
                            tone="red"
                            onClick={() => setFilter('exception')}
                        >
                            Laporan pengecualian ({count(exceptionRows.length)})
                        </FilterTab>
                    </div>
                }
            />

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                {/* ── The four figures the two reports rest on ──────────────── */}
                <section>
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Readout's sub is the annotation voice; every figure in it
                            stays in the measurement voice, as the sheet had it. */}
                        <Readout
                            tone="plot"
                            label="Realisasi penjualan"
                            value={<Usd value={totalSales} />}
                            sub={<span className="font-mono">{percent(achievement)} dari target</span>}
                        />
                        <Readout
                            tone="plot"
                            label="Target penjualan"
                            value={<Usd value={totalTarget} />}
                            sub={
                                <span className="font-mono">
                                    {count(rows.length)} baris kinerja
                                </span>
                            }
                        />
                        <Readout
                            tone="plot"
                            label="Agregasi dari TPS"
                            value={<Usd value={tpsSummary?.total_amount} />}
                            sub={
                                <span className="font-mono">
                                    {count(tpsSummary?.total_trx)} baris transaksi
                                </span>
                            }
                        />
                        <Readout
                            tone="plot"
                            label="Baris di luar ambang"
                            value={count(exceptionRows.length)}
                            sub={<span className="font-mono">Kriteria &lt; $10.000 atau &gt; $50.000</span>}
                        />
                    </dl>
                </section>

                {/* ── Realisation against target, drawn from the same rows ──── */}
                <section className="mt-10">
                    <SectionHead title="Realisasi terhadap target" meta={period} />

                    <div className="mt-4 max-w-[74ch]">
                        <Callout k="Batang">Realisasi ($) tiap baris kinerja.</Callout>
                        <Callout k="Garis putus-putus">
                            Target ($) yang ditetapkan untuk baris yang sama.
                        </Callout>
                    </div>

                    <Plate tab="Grafik 01 · batang dan garis" className="mt-4" bodyClassName="px-3 pb-3 pt-9">
                        <div className="relative h-64 w-full">
                            <canvas
                                ref={chartCanvas}
                                role="img"
                                aria-label="Grafik batang realisasi terhadap target untuk setiap baris kinerja. Angka yang sama tercetak pada tabel di bawah grafik."
                            />
                        </div>
                    </Plate>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-8">
                        <Dim label="Jumlah realisasi" value={`$${LEDGER.format(figure(totalSales))}`} className="sm:flex-1" />
                        <Dim label="Jumlah target" value={`$${LEDGER.format(figure(totalTarget))}`} className="sm:flex-1" />
                    </div>

                    {/*
                     * The chart is a convenience; the numbers are the evidence. The
                     * same rows the bars and the line are drawn from, ruled as a
                     * register, so the figures survive the canvas not being read.
                     *
                     * Folded by default: the series is forty-eight periods long, and
                     * laid open it doubles the length of the sheet and buries the two
                     * reports below it. A `<details>` keeps every figure one press
                     * away without making the reader scroll past them.
                     */}
                    <details className="group mt-6">
                        <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-chalk-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-2 transition-colors hover:text-chalk">
                            <span>
                                Angka grafik
                                <span className="ml-3 text-chalk-3">
                                    {count(rows.length)} baris · {period}
                                </span>
                            </span>
                            <span className="text-chalk-3 group-open:hidden">Buka</span>
                            <span className="hidden text-chalk-3 group-open:inline">Tutup</span>
                        </summary>

                    <ZoneFrame className="mt-3">
                        <SheetHead
                            tone="plot"
                            label="Angka grafik"
                            readouts={[
                                { label: 'Baris', value: count(rows.length) },
                                { label: 'Periode', value: period },
                            ]}
                        />

                        {rows.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="data-table">
                                    <caption className="sr-only">
                                        Angka yang digambar pada grafik: nama personel, bulan, realisasi, dan
                                        target setiap baris kinerja.
                                    </caption>
                                    <thead>
                                        <tr>
                                            <th scope="col">
                                                <span
                                                    className="block font-mono text-[8px] font-normal text-chalk-2"
                                                    aria-hidden="true"
                                                >
                                                    1
                                                </span>
                                                Nama personel
                                            </th>
                                            <th scope="col" className="text-right">
                                                <span
                                                    className="block font-mono text-[8px] font-normal text-chalk-2"
                                                    aria-hidden="true"
                                                >
                                                    2
                                                </span>
                                                Realisasi
                                            </th>
                                            <th scope="col" className="text-right">
                                                <span
                                                    className="block font-mono text-[8px] font-normal text-chalk-2"
                                                    aria-hidden="true"
                                                >
                                                    3
                                                </span>
                                                Target
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <tr key={row.id}>
                                                <PersonCell row={row} />
                                                <td className="num text-chalk">
                                                    <Usd value={row.actual_sales} />
                                                </td>
                                                <td className="num text-chalk-2">
                                                    <Usd value={row.target_amount} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="px-4 py-10">
                                <p className="font-display text-[13px] font-semibold uppercase tracking-[0.02em] text-chalk">
                                    Tidak ada baris kinerja
                                </p>
                                <p className="mt-1 max-w-[60ch] text-[12px] leading-relaxed text-chalk-2">
                                    Tabel kinerja penjualan kosong, sehingga tidak ada yang bisa digambar.
                                    Isi barisnya lebih dahulu, lalu muat ulang lembar ini.
                                </p>
                            </div>
                        )}
                    </ZoneFrame>
                    </details>
                </section>

                {/* ── Exception report: only the rows outside the band ──────── */}
                {showExceptions && (
                    <section className="mt-10">
                        <SectionHead
                            title="Laporan pengecualian"
                            meta={`${count(exceptionRows.length)} baris di luar ambang`}
                        />

                        <p className="mt-3 max-w-[74ch] text-[12px] leading-relaxed text-chalk-2">
                            Menyoroti tenaga penjual dengan realisasi di bawah $10.000 atau di atas $50.000.
                            Baris di dalam rentang tersebut tidak ditampilkan pada laporan ini.
                        </p>

                        {exceptionRows.length > 0 ? (
                            /*
                             * A register, not a zone frame: this table is wider than a
                             * phone, and `.register` is the device that carries the
                             * containment keeping the layout viewport at 390px while it
                             * scrolls sideways.
                             */
                            <div className="register mt-4">
                                <SheetHead
                                    tone="plot"
                                    label="Baris di luar ambang"
                                    readouts={[{ label: 'Ambang', value: '< $10.000 atau > $50.000' }]}
                                />

                                <div className="overflow-x-auto">
                                    <table className="data-table min-w-[560px]">
                                        <caption className="sr-only">
                                            Laporan pengecualian: nama personel, wilayah, realisasi, dan jenis
                                            pengecualian.
                                        </caption>
                                        <thead>
                                            <tr>
                                                <th scope="col">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        1
                                                    </span>
                                                    Nama personel
                                                </th>
                                                <th scope="col">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        2
                                                    </span>
                                                    Wilayah
                                                </th>
                                                <th scope="col" className="text-right">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        3
                                                    </span>
                                                    Realisasi
                                                </th>
                                                <th scope="col">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        4
                                                    </span>
                                                    Jenis pengecualian
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {exceptionRows.map((row) => {
                                                const actual = figure(row.actual_sales);
                                                const under = actual < 10000;

                                                return (
                                                    <tr key={row.id}>
                                                        <PersonCell row={row} />
                                                        <td>
                                                            <span className="text-[12px] text-chalk-2">
                                                                {row.region}
                                                            </span>
                                                        </td>
                                                        <td className="num text-chalk">
                                                            <Usd value={actual} />
                                                        </td>
                                                        <td>
                                                            {/* Under the band is the red lamp; above it, the lit one. */}
                                                            <StatusLamp
                                                                state={{
                                                                    tone: under ? 'lit-red' : 'lit',
                                                                    lamp: 'lit',
                                                                    label:
                                                                        exceptionType(actual) || '—',
                                                                }}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                title="Tidak ada baris di luar ambang"
                                description="Seluruh baris kinerja berada di antara $10.000 dan $50.000, sehingga tidak ada yang perlu disoroti pada laporan ini."
                            />
                        )}
                    </section>
                )}

                {/* ── Summary report: every row, against its own target ─────── */}
                {showSummary && (
                    <section className="mt-10">
                        <SectionHead
                            title="Laporan ringkasan kinerja"
                            meta={`${count(rows.length)} baris · ${count(totalTrx)} transaksi`}
                        />

                        {rows.length > 0 ? (
                            <div className="register mt-4">
                                <SheetHead
                                    tone="plot"
                                    label="Semua baris kinerja"
                                    readouts={[
                                        { label: 'Baris', value: count(rows.length) },
                                        { label: 'Transaksi', value: count(totalTrx) },
                                        { label: 'Periode', value: period },
                                    ]}
                                />

                                <div className="overflow-x-auto">
                                    <table className="data-table min-w-[880px]">
                                        <caption className="sr-only">
                                            Laporan ringkasan: nama personel, wilayah, volume transaksi, target,
                                            realisasi, pencapaian, dan status MIS.
                                        </caption>
                                        <thead>
                                            <tr>
                                                <th scope="col">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        1
                                                    </span>
                                                    Nama personel
                                                </th>
                                                <th scope="col">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        2
                                                    </span>
                                                    Wilayah
                                                </th>
                                                <th scope="col" className="text-right">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        3
                                                    </span>
                                                    Volume transaksi
                                                </th>
                                                <th scope="col" className="text-right">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        4
                                                    </span>
                                                    Target
                                                </th>
                                                <th scope="col" className="text-right">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        5
                                                    </span>
                                                    Realisasi
                                                </th>
                                                <th scope="col" className="text-right">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        6
                                                    </span>
                                                    Pencapaian
                                                </th>
                                                <th scope="col">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        7
                                                    </span>
                                                    Status MIS
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row) => {
                                                const target = figure(row.target_amount);
                                                const actual = figure(row.actual_sales);
                                                const rate = target > 0 ? (actual / target) * 100 : 0;
                                                const flagged = outsideBand(actual);

                                                return (
                                                    <tr key={row.id}>
                                                        <PersonCell row={row} />
                                                        <td>
                                                            <span className="text-[12px] text-chalk-2">
                                                                {row.region}
                                                            </span>
                                                        </td>
                                                        <td className="num text-chalk-2">
                                                            {count(row.transaction_count)}
                                                        </td>
                                                        <td className="num text-chalk-2">
                                                            <Usd value={row.target_amount} />
                                                        </td>
                                                        <td className="num text-chalk">
                                                            <Usd value={row.actual_sales} />
                                                        </td>
                                                        <td
                                                            className={`num ${
                                                                rate >= 100 ? 'text-lit' : 'text-chalk'
                                                            }`}
                                                        >
                                                            {percent(rate)}
                                                        </td>
                                                        <td>
                                                            {flagged ? (
                                                                <StatusLamp
                                                                    state={{
                                                                        tone:
                                                                            actual < 10000
                                                                                ? 'lit-red'
                                                                                : 'lit',
                                                                        lamp: 'lit',
                                                                        label: 'Pengecualian',
                                                                    }}
                                                                />
                                                            ) : (
                                                                <StatusLamp
                                                                    state={{
                                                                        tone: 'chalk',
                                                                        lamp: 'unlit',
                                                                        label: 'Dalam ambang',
                                                                    }}
                                                                />
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                title="Tidak ada baris kinerja"
                                description="Tabel kinerja penjualan tidak mengembalikan baris, sehingga laporan ringkasan tidak punya isi. Isi tabelnya lebih dahulu, lalu muat ulang lembar ini."
                            />
                        )}
                    </section>
                )}
            </div>
        </ModuleLayout>
    );
}
