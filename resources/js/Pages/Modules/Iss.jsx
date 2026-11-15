import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Cpu } from 'lucide-react';
import ModuleLayout from '@/Layouts/ModuleLayout';
import { Callout, PageBand, Readout, SectionHead, SheetHead, ZoneFrame } from '@/Components/Sheet';
import { EmptyState, LabelledField, Select, Stamp, StatusLamp } from '@/Components/Controls';
import { notifyError } from '@/lib/notify';
import { count } from '@/lib/format';

/**
 * ISS — three instruments on one sheet at the strategic level: a goal-seeking
 * model, a drill-down register, and a rule-based diagnosis.
 *
 * The DSS model and the register are US-dollar denominated and are printed as
 * stored — `$` plus `number_format($x, 2)` — never converted. Counts keep the
 * Indonesian separators the rest of the system uses. The goal-seeking model
 * itself works in whole dollars (`$50,000`), because every parameter it takes is
 * a whole dollar amount.
 */

/** `number_format($x, 2)`: thousands by comma, decimals by point. */
const LEDGER = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/** Whole dollars, for the model's own parameters: `$50,000`. */
const WHOLE = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

const figure = (value) => Number(value) || 0;

/** A ledger figure: the symbol in the muted tone, the amount in the measurement voice. */
function Usd({ value }) {
    return (
        <>
            <span className="text-[11px] text-chalk-2">$</span> {LEDGER.format(figure(value))}
        </>
    );
}

/** A whole-dollar figure of the goal-seeking model. */
function Dollars({ value, className = '' }) {
    return (
        <span data-measure className={`font-mono ${className}`}>
            <span className="text-[11px] text-chalk-2">$</span> {WHOLE.format(figure(value))}
        </span>
    );
}

/** The knowledge base's own keys, in the order the sheet has always listed them. */
const PROBLEM_AREAS = [
    { value: 'sales_deviation', label: 'Deviasi kinerja tenaga penjualan (<$10K / >$50K)' },
    { value: 'tps_backlog', label: 'Antrean pemrosesan transaksi TPS' },
    { value: 'executive_delay', label: 'Keterlambatan analisis pengambilan keputusan senior' },
];

const SYMPTOMS = [
    { value: 'high_variance', label: 'Variansi performa tinggi antar unit kerja' },
    { value: 'storage_delay', label: 'Beban transaksi online melebihi kapasitas I/O' },
    { value: 'unstructured_need', label: 'Kebutuhan simulasi skenario what-if' },
];

const TOOLS = [
    { key: 'dss', label: 'DSS · pencarian tujuan' },
    { key: 'eis', label: 'EIS · penelusuran' },
    { key: 'es', label: 'Sistem pakar' },
];

/**
 * The sheet held `severity: 'high'` in its own state and posted it. The rule base
 * reads the value but branches on `problem_area` alone, so it is sent as a fixed
 * field and the sheet carries no control for it.
 */
const ES_SEVERITY = 'high';

/**
 * `/iss/diagnose` is answered with plain JSON — `response()->json(...)` in
 * `MsiController::issDiagnose` — so it is the one round trip on this sheet that
 * is not an Inertia page. Inertia reports any non-Inertia response through
 * `onHttpException`, and that is where the diagnosis is read from. The same
 * reader also accepts the payload as an Inertia prop or a flash entry, so the
 * round trip keeps working if the controller is ever answered with `Inertia::render`
 * or a redirect carrying the result.
 */
function readDiagnosis(...sources) {
    const candidates = [];

    sources.forEach((source) => {
        if (!source || typeof source !== 'object') {
            return;
        }

        candidates.push(
            source,
            source.flash,
            source.diagnosis,
            source.result,
            source.flash?.diagnosis,
            source.flash?.result,
        );
    });

    for (const candidate of candidates) {
        const ruleFired = candidate?.rule_fired ?? candidate?.ruleFired;

        if (typeof ruleFired === 'string' && ruleFired !== '') {
            return {
                ruleFired,
                diagnosis: candidate.diagnosis || '',
                recommendations: Array.isArray(candidate.recommendations)
                    ? candidate.recommendations
                    : [],
            };
        }
    }

    return null;
}

/** A tool on the sheet. One is shown at a time; the strip says which. */
function ToolTab({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`border-b-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                active ? 'border-lit text-chalk' : 'border-transparent text-chalk-2 hover:text-chalk'
            }`}
        >
            {children}
        </button>
    );
}

/** One parameter of the goal-seeking model: the reading, then the slide. */
function ParameterSlider({ id, label, min, max, step, value, onChange }) {
    return (
        <div className="mt-5 first:mt-0">
            <div className="flex items-baseline justify-between gap-4">
                <label htmlFor={id} className="text-[12px] text-chalk-2">
                    {label}
                </label>
                <Dollars value={value} className="text-[12px] font-medium text-chalk" />
            </div>
            <input
                type="range"
                id={id}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="mt-2 w-full cursor-pointer"
            />
        </div>
    );
}

export default function Iss({ performances = [], regions = [] }) {
    const [tool, setTool] = useState('dss');

    // DSS goal seeking.
    const [targetProfit, setTargetProfit] = useState(50000);
    const [unitPrice, setUnitPrice] = useState(250);
    const [unitCost, setUnitCost] = useState(150);
    const [fixedCost, setFixedCost] = useState(20000);

    // EIS drill-down.
    const [region, setRegion] = useState('all');

    // Expert system.
    const [problemArea, setProblemArea] = useState('sales_deviation');
    const [symptom, setSymptom] = useState('high_variance');
    const [running, setRunning] = useState(false);
    const [diagnosis, setDiagnosis] = useState(null);

    const rows = useMemo(() => performances || [], [performances]);

    /**
     * `$performances->pluck('region')->unique()` hands Inertia the keys that
     * survived, which JSON encodes as an object whenever they are not sequential.
     * Reading the values keeps every region in the list.
     */
    const regionList = useMemo(() => Object.values(regions || {}), [regions]);

    const shownRows = useMemo(
        () => (region === 'all' ? rows : rows.filter((row) => row.region === region)),
        [rows, region],
    );

    /**
     * The goal-seeking model, with the same arithmetic the sheet's own getters
     * used: margin floored at 1, volume rounded up, revenue taken from the
     * rounded volume rather than from the margin.
     */
    const model = useMemo(() => {
        const margin = Math.max(1, figure(unitPrice) - figure(unitCost));
        const requiredUnits = Math.ceil((figure(targetProfit) + figure(fixedCost)) / margin);

        return {
            margin,
            requiredUnits,
            requiredRevenue: requiredUnits * figure(unitPrice),
            breakEvenUnits: Math.ceil(figure(fixedCost) / margin),
        };
    }, [targetProfit, unitPrice, unitCost, fixedCost]);

    /**
     * The inference engine is on the server; this is only the round trip. Inertia
     * carries it, so the sheet is never reloaded and the operator stays on the
     * instrument they were reading.
     */
    const runDiagnosis = () => {
        setRunning(true);

        router.post(
            '/iss/diagnose',
            { problem_area: problemArea, symptom, severity: ES_SEVERITY },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const result = readDiagnosis(page?.props, page?.flash);

                    if (result) {
                        setDiagnosis(result);
                    } else {
                        notifyError(
                            'Aturan tidak terbaca',
                            'Jawaban server tidak memuat aturan yang dijalankan. Jalankan penalaran sekali lagi.',
                        );
                    }
                },
                onHttpException: (response) => {
                    const result = readDiagnosis(response?.data);

                    if (result) {
                        setDiagnosis(result);
                    } else {
                        notifyError(
                            'Inferensi gagal dijalankan',
                            `Server menjawab ${response?.status ?? '—'}. Periksa domain masalah dan gejalanya, lalu jalankan lagi.`,
                        );
                    }

                    // False keeps Inertia's plain-JSON dialog off the sheet: the
                    // diagnosis is this endpoint's own answer, not a broken visit.
                    return false;
                },
                onNetworkError: () => {
                    notifyError(
                        'Inferensi tidak terkirim',
                        'Server tidak menjawab. Periksa sambungan, lalu jalankan penalaran sekali lagi.',
                    );

                    return false;
                },
                onFinish: () => setRunning(false),
            },
        );
    };

    const resultState = running
        ? { tone: 'lit', lamp: 'half', label: 'Inferensi berjalan' }
        : diagnosis
          ? { tone: 'lit', lamp: 'lit', label: 'Aturan dijalankan' }
          : { tone: 'chalk', lamp: 'unlit', label: 'Belum dijalankan' };

    return (
        <ModuleLayout sheet="Intelligent Support Systems (ISS)">
            <Head title="Intelligent Support Systems (ISS) — RAKIT" />

            <PageBand
                tone="plot"
                path={[
                    { label: 'Piramida', href: '/pyramid' },
                    { label: 'Modul rujukan' },
                    { label: 'ISS · Tingkat strategis' },
                ]}
                title="Intelligent support systems (ISS)"
                meta={
                    <>
                        Tiga alat untuk keputusan semi-terstruktur dan tidak terstruktur: model pencarian
                        tujuan (<span className="font-mono text-[11px]">DSS</span>), penelusuran data sampai
                        tingkat wilayah (<span className="font-mono text-[11px]">EIS</span>), dan penalaran
                        berbasis aturan (<span className="font-mono text-[11px]">sistem pakar</span>).
                    </>
                }
                actions={
                    <div
                        role="group"
                        aria-label="Pilih alat"
                        className="flex flex-wrap items-center gap-1 border-b border-line"
                    >
                        {TOOLS.map((entry) => (
                            <ToolTab
                                key={entry.key}
                                active={tool === entry.key}
                                onClick={() => setTool(entry.key)}
                            >
                                {entry.label}
                            </ToolTab>
                        ))}
                    </div>
                }
            />

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                {/* ── DSS: the goal-seeking model ───────────────────────────── */}
                {tool === 'dss' && (
                    <section>
                        <SectionHead title="Analisis pencarian tujuan" meta="Model kuantitatif" />

                        <p className="mt-3 max-w-[74ch] text-[12px] leading-relaxed text-chalk-2">
                            Menghitung volume penjualan yang dibutuhkan untuk mencapai target laba bersih
                            tertentu, dengan harga jual, biaya variabel per unit, dan biaya tetap sebagai
                            parameter.
                        </p>

                        <div className="mt-5 grid items-start gap-6 lg:grid-cols-12">
                            <div className="lg:col-span-6">
                                <ZoneFrame>
                                    <SheetHead
                                        tone="plot"
                                        label="Parameter finansial & target"
                                        readouts={[{ label: 'Satuan', value: 'USD' }]}
                                    />

                                    <div className="px-4 py-4">
                                        <ParameterSlider
                                            id="dss-target-profit"
                                            label="Target laba bersih"
                                            min={10000}
                                            max={200000}
                                            step={5000}
                                            value={targetProfit}
                                            onChange={setTargetProfit}
                                        />
                                        <ParameterSlider
                                            id="dss-unit-price"
                                            label="Harga jual per unit"
                                            min={160}
                                            max={500}
                                            step={10}
                                            value={unitPrice}
                                            onChange={setUnitPrice}
                                        />
                                        <ParameterSlider
                                            id="dss-unit-cost"
                                            label="Biaya variabel per unit"
                                            min={50}
                                            max={150}
                                            step={5}
                                            value={unitCost}
                                            onChange={setUnitCost}
                                        />
                                        <ParameterSlider
                                            id="dss-fixed-cost"
                                            label="Biaya tetap operasional"
                                            min={5000}
                                            max={50000}
                                            step={2500}
                                            value={fixedCost}
                                            onChange={setFixedCost}
                                        />

                                        <p className="mt-5 border-t border-line pt-3 text-[11px] leading-relaxed text-chalk-2">
                                            Geser satu parameter untuk melihat perubahan kebutuhan volume
                                            secara langsung. Nilai dihitung ulang saat slider bergerak.
                                        </p>
                                    </div>
                                </ZoneFrame>
                            </div>

                            <div className="lg:col-span-6">
                                <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                    <Readout
                                        tone="plot"
                                        label="Volume wajib terjual"
                                        value={`${count(model.requiredUnits)} unit`}
                                    />
                                    <Readout
                                        tone="plot"
                                        label="Proyeksi pendapatan bruto"
                                        value={<Dollars value={model.requiredRevenue} />}
                                    />
                                </dl>

                                <div className="mt-5 border-t border-line pt-1">
                                    {/* The callout's value is the annotation voice, so the
                                        figures inside it carry the measurement voice. */}
                                    <Callout k="Margin kontribusi">
                                        <span className="font-mono">
                                            <Dollars value={model.margin} /> per unit
                                        </span>
                                    </Callout>
                                    <Callout k="Titik impas (BEP)">
                                        <span className="font-mono">
                                            {count(model.breakEvenUnits)} unit
                                        </span>
                                    </Callout>
                                </div>

                                <p className="mt-3 max-w-[60ch] text-[11px] leading-relaxed text-chalk-2">
                                    Titik impas adalah volume saat pendapatan menutup seluruh biaya tetap,
                                    sebelum target laba mulai terpenuhi.
                                </p>

                                <div className="mt-4 border border-line-2 bg-plot-2 px-4 py-3">
                                    <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                        Perhitungan yang dipakai
                                    </span>
                                    <p className="mt-2 font-mono text-[12px] leading-relaxed text-chalk">
                                        Volume = (target laba + biaya tetap) ÷ margin kontribusi
                                    </p>
                                    <p className="mt-1 font-mono text-[12px] leading-relaxed text-chalk-2">
                                        Margin kontribusi = harga jual − biaya variabel per unit
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── EIS: drill-down from the aggregate to the region ──────── */}
                {tool === 'eis' && (
                    <section>
                        <SectionHead
                            title="Penelusuran kinerja per wilayah"
                            meta={`${count(rows.length)} baris kinerja`}
                        />

                        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border border-line-2 bg-plot-2 px-4 py-3">
                            <div className="w-full sm:w-auto sm:min-w-[240px]">
                                <LabelledField label="Wilayah yang ditelusuri">
                                    <Select
                                        id="eis-region"
                                        className="text-[12px]"
                                        value={region}
                                        onChange={(event) => setRegion(event.target.value)}
                                    >
                                        <option value="all">Semua wilayah (nasional)</option>
                                        {regionList.map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </Select>
                                </LabelledField>
                            </div>

                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                Menampilkan {count(shownRows.length)} dari {count(rows.length)} baris
                            </span>

                            <p className="max-w-[52ch] text-[11px] leading-relaxed text-chalk-2">
                                Pilih satu wilayah untuk menyaring baris di bawah; pilih semua wilayah untuk
                                membaca agregat nasional.
                            </p>
                        </div>

                        {shownRows.length > 0 ? (
                            <div className="register mt-4">
                                <SheetHead
                                    tone="plot"
                                    label={region === 'all' ? 'Nasional · seluruh wilayah' : region}
                                    readouts={[{ label: 'Baris', value: count(shownRows.length) }]}
                                />

                                <div className="overflow-x-auto">
                                    <table className="data-table min-w-[720px]">
                                        <caption className="sr-only">
                                            Penelusuran kinerja: nama personel, bulan, wilayah, realisasi, dan
                                            target.
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
                                                <th scope="col" className="text-right">
                                                    <span
                                                        className="block font-mono text-[8px] font-normal text-chalk-2"
                                                        aria-hidden="true"
                                                    >
                                                        4
                                                    </span>
                                                    Target
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shownRows.map((row) => (
                                                <tr key={row.id}>
                                                    <td>
                                                        <span className="block text-[13px] font-medium text-chalk">
                                                            {row.salesperson_name}
                                                        </span>
                                                        <span className="mt-0.5 block font-mono text-[10px] text-chalk-2">
                                                            {row.month}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="text-[12px] text-chalk-2">
                                                            {row.region}
                                                        </span>
                                                    </td>
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
                            </div>
                        ) : (
                            <EmptyState
                                title={`Tidak ada baris untuk ${region}`}
                                description="Tidak ada baris kinerja yang tercatat pada wilayah ini. Pilih wilayah lain, atau pilih semua wilayah untuk membaca agregat nasional."
                            />
                        )}
                    </section>
                )}

                {/* ── Expert system: knowledge base, engine, interface ──────── */}
                {tool === 'es' && (
                    <section>
                        <SectionHead
                            title="Penalaran sistem pakar"
                            meta="Basis aturan · mesin inferensi"
                        />

                        <div className="mt-5 grid items-start gap-6 lg:grid-cols-12">
                            <div className="lg:col-span-5">
                                <ZoneFrame>
                                    <SheetHead tone="plot" label="Parameter masalah organisasi" />

                                    <div className="px-4 py-4">
                                        <LabelledField label="Domain masalah">
                                            <Select
                                                id="es-problem-area"
                                                className="text-[12px]"
                                                value={problemArea}
                                                onChange={(event) => setProblemArea(event.target.value)}
                                            >
                                                {PROBLEM_AREAS.map((entry) => (
                                                    <option key={entry.value} value={entry.value}>
                                                        {entry.label}
                                                    </option>
                                                ))}
                                            </Select>
                                        </LabelledField>

                                        <div className="mt-4">
                                            <LabelledField label="Gejala operasional">
                                                <Select
                                                    id="es-symptom"
                                                    className="text-[12px]"
                                                    value={symptom}
                                                    onChange={(event) => setSymptom(event.target.value)}
                                                >
                                                    {SYMPTOMS.map((entry) => (
                                                        <option key={entry.value} value={entry.value}>
                                                            {entry.label}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </LabelledField>
                                        </div>

                                        <div className="mt-4">
                                            <Callout k="Bobot gejala">
                                                {ES_SEVERITY} — dikirim tetap pada kolom{' '}
                                                <span className="font-mono text-[11px]">severity</span>;
                                                basis aturan memilih rekaman dari domain masalah.
                                            </Callout>
                                        </div>

                                        <Stamp
                                            type="button"
                                            onClick={runDiagnosis}
                                            disabled={running}
                                            aria-busy={running}
                                            className="mt-5 w-full"
                                        >
                                            <Cpu className="h-3.5 w-3.5" strokeWidth={1.5} />
                                            {running
                                                ? 'Menjalankan inferensi…'
                                                : 'Jalankan penalaran pakar'}
                                        </Stamp>

                                        <p className="mt-3 text-[11px] leading-relaxed text-chalk-2">
                                            Inferensi dijalankan di server terhadap basis aturan yang
                                            tersimpan, bukan di peramban.
                                        </p>
                                    </div>
                                </ZoneFrame>
                            </div>

                            <div className="lg:col-span-7">
                                <ZoneFrame className="min-h-[240px]">
                                    <SheetHead
                                        tone="plot"
                                        label="Hasil inferensi"
                                        action={<StatusLamp state={resultState} />}
                                    />

                                    <div className="px-4 py-4" aria-live="polite">
                                        {diagnosis ? (
                                            <>
                                                <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-lit">
                                                    {diagnosis.ruleFired}
                                                </span>

                                                <p className="mt-2 max-w-[74ch] text-[13px] leading-relaxed text-chalk">
                                                    {diagnosis.diagnosis}
                                                </p>

                                                <span className="mt-5 block border-t border-line pt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                                    Rekomendasi tindakan
                                                </span>

                                                <ol className="mt-2">
                                                    {diagnosis.recommendations.map(
                                                        (recommendation, index) => (
                                                            <li
                                                                key={recommendation}
                                                                className="flex items-start gap-3 border-b border-line py-2.5"
                                                            >
                                                                <span className="flex-none font-mono text-[10px] text-lit">
                                                                    {index + 1}.
                                                                </span>
                                                                <span className="text-[12px] leading-relaxed text-chalk-2">
                                                                    {recommendation}
                                                                </span>
                                                            </li>
                                                        ),
                                                    )}
                                                </ol>
                                            </>
                                        ) : (
                                            <p className="max-w-[64ch] text-[12px] leading-relaxed text-chalk-2">
                                                Belum ada aturan yang dijalankan pada lembar ini. Pilih domain
                                                masalah dan gejalanya, lalu jalankan penalaran pakar untuk
                                                membaca diagnosis beserta rekomendasinya.
                                            </p>
                                        )}
                                    </div>
                                </ZoneFrame>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </ModuleLayout>
    );
}
