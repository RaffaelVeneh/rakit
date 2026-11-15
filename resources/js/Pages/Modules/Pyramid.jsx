import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import ModuleLayout from '@/Layouts/ModuleLayout';
import PyramidScene from '@/Components/PyramidScene';
import { Callout, Dim, PageBand, Readout, SectionHead, SheetHead, ZoneFrame } from '@/Components/Sheet';
import { Lamp, Stamp } from '@/Components/Controls';
import { count } from '@/lib/format';

/**
 * Sheet: hierarki manajemen & tipe sistem informasi (Bab II). The drawing is the
 * page: four management levels stacked by span, one detail panel that answers
 * whichever level is pressed, and the four system types as a numbered register.
 * Every figure printed here is read from the module's own tables.
 */

const usd = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/**
 * The module's ledger is US-dollar denominated and the sheets print it that way:
 * comma grouping, two decimals, the unit mark in the muted tone. Counts keep the
 * Indonesian separators from `lib/format.js`.
 */
function dollars(value) {
    return usd.format(Number(value) || 0);
}

/**
 * The four levels, in the order the pyramid stacks them. `span` is the bar's
 * width, which is the level's coverage drawn to scale; the rest is what the
 * detail panel prints when the level is pressed.
 */
const LEVELS = [
    {
        key: 'top',
        code: 'T1',
        band: 'Strategis',
        name: 'Top / senior management',
        systems: 'ESS, GDSS',
        span: 'sm:col-span-6 sm:col-start-4',
        title: 'Top / senior management',
        meta: 'Tingkat 1 · Strategis',
        callouts: [
            { k: 'Pemegang', v: 'CEO & dewan direksi' },
            { k: 'Keputusan', v: 'Tidak terstruktur (unstructured decisions)' },
            { k: 'Sifat', v: 'Menetapkan dan mengubah arah jangka panjang organisasi' },
        ],
        note: 'Keputusan pada tingkat ini memerlukan penilaian subjektif, intuisi, wawasan, dan pemecahan masalah kreatif tanpa prosedur operasional standar baku.',
        components: [
            {
                name: 'Executive information system (EIS / ESS)',
                note: 'Tampilan grafis ringkas untuk eksekutif, laporan pengecualian, dan penelusuran rinci (drill-down) sampai ke unit di bawahnya.',
            },
            {
                name: 'Group DSS (GDSS)',
                note: 'Mendukung keputusan kolektif dalam forum rapat direksi atau komite eksekutif.',
            },
        ],
        handoff: { href: '/iss', label: 'Buka lab simulasi EIS & GDSS' },
    },
    {
        key: 'middle',
        code: 'T2',
        band: 'Taktis',
        name: 'Middle / tactical management',
        systems: 'DSS, MIS, expert system',
        span: 'sm:col-span-8 sm:col-start-3',
        title: 'Middle / tactical management',
        meta: 'Tingkat 2 · Taktis',
        callouts: [
            { k: 'Pemegang', v: 'Manajer cabang, regional, & divisi' },
            { k: 'Keputusan', v: 'Semi-terstruktur & taktis' },
            { k: 'Sifat', v: 'Menerjemahkan kebijakan puncak menjadi pedoman kerja operasional' },
        ],
        note: 'Kinerja dipantau secara berkala melalui laporan ringkasan dan laporan pengecualian yang diagregasi dari transaksi tingkat operasional.',
        components: [
            {
                name: 'Management information system (MIS)',
                note: 'Menyajikan laporan ringkasan (summary report) dan laporan pengecualian (exception report) dari hasil agregasi transaksi TPS.',
            },
            {
                name: 'Decision support system (DSS)',
                note: 'Pencarian tujuan (goal seeking) dan manipulasi data kuantitatif untuk mengevaluasi alternatif solusi bisnis.',
            },
        ],
        handoff: { href: '/mis', label: 'Buka laporan MIS' },
    },
    {
        key: 'knowledge',
        code: 'T3',
        band: 'Otomatisasi',
        name: 'Knowledge worker',
        systems: 'OAS, KWS',
        span: 'sm:col-span-10 sm:col-start-2',
        title: 'Knowledge level',
        meta: 'Tingkat 3 · Pengetahuan',
        callouts: [
            { k: 'Pemegang', v: 'Pekerja pengetahuan & staf administrasi' },
            { k: 'Fokus', v: 'Otomatisasi aliran kerja & komunikasi (OAS)' },
            { k: 'Sifat', v: 'Mendukung pekerjaan dokumen harian, bukan keputusan strategis' },
        ],
        note: 'Memfasilitasi pembuatan, penyimpanan, dan distribusi dokumen tertulis (memo, faktur, laporan), serta komunikasi lintas lokasi melalui telekonferensi dan surat elektronik.',
        components: [
            {
                name: 'Word processing & e-mail',
                note: 'Penyusunan dokumen formal, memo manajerial, dan distribusi pesan nirkertas.',
            },
            {
                name: 'Teleconferencing & imaging',
                note: 'Rapat virtual audio/video serta digitalisasi dokumen fisik menjadi arsip digital.',
            },
        ],
        handoff: { href: '/oas', label: 'Buka ruang kerja OAS' },
    },
    {
        key: 'operational',
        code: 'T4',
        band: 'Operasional',
        name: 'Operational management',
        systems: 'TPS (transaction processing)',
        span: 'sm:col-span-12',
        title: 'Operational management',
        meta: 'Tingkat 4 · Operasional',
        callouts: [
            { k: 'Pemegang', v: 'Supervisor & staf lapangan' },
            { k: 'Keputusan', v: 'Terstruktur / terprogram (Herbert A. Simon)' },
            { k: 'Sifat', v: 'Rutin, berulang, dan dijalankan menurut prosedur baku (SOP)' },
        ],
        note: 'Tingkat ini adalah fondasi data seluruh organisasi: setiap baris transaksi yang dicatat di sini menjadi bahan olahan tingkat di atasnya.',
        ladder: {
            label: 'Alur enam langkah transaksi TPS',
            value: 'Data entry · Data validation · Processing (online/batch) · Storage · Output generation · Query support',
        },
        handoff: { href: '/tps', label: 'Buka simulator TPS' },
    },
];

/** The four system types, as the register prints them: level, mark, scope, sheet. */
const SYSTEMS = [
    {
        level: 'Operasional',
        code: 'TPS',
        scope: 'Mencatat, memvalidasi, dan menyimpan transaksi harian bisnis internal maupun eksternal.',
        href: '/tps',
    },
    {
        level: 'Pengetahuan',
        code: 'OAS',
        scope: 'Otomatisasi perkantoran untuk penanganan dokumen, komunikasi, dan koordinasi kerja.',
        href: '/oas',
    },
    {
        level: 'Taktis',
        code: 'MIS',
        scope: 'Penyusunan laporan ringkasan berkala dan laporan pengecualian untuk manajer menengah.',
        href: '/mis',
    },
    {
        level: 'Strategis',
        code: 'ISS',
        scope: 'Pencarian tujuan, penelusuran eksekutif, dan penalaran pakar untuk keputusan tidak terstruktur.',
        href: '/iss',
    },
];

/** The selected level's panel: who holds it, what it decides, and what it runs. */
function LevelPanel({ level }) {
    return (
        <section className="border border-line-2 bg-plot-2 px-4 py-4 sm:px-5">
            <SectionHead title={level.title} meta={level.meta} />

            <div className="mt-4">
                {level.callouts.map((callout) => (
                    <Callout key={callout.k} k={callout.k}>
                        {callout.v}
                    </Callout>
                ))}
            </div>

            <p className="mt-4 max-w-[74ch] text-[12px] leading-relaxed text-chalk-2">{level.note}</p>

            {level.components ? (
                <ul className="mt-5 space-y-3">
                    {level.components.map((component) => (
                        <li key={component.name} className="border-t border-line pt-3">
                            <h3 className="font-display text-[13px] font-semibold uppercase tracking-[0.02em] text-chalk">
                                {component.name}
                            </h3>
                            <p className="mt-1 max-w-[74ch] text-[12px] leading-relaxed text-chalk-2">
                                {component.note}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="mt-5 border-t border-line pt-3">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                        {level.ladder.label}
                    </span>
                    <p className="mt-2 max-w-[74ch] text-[12px] leading-relaxed text-chalk">
                        {level.ladder.value}
                    </p>
                </div>
            )}

            <div className="mt-5 border-t border-line pt-4">
                <Stamp as={Link} href={level.handoff.href} variant="secondary" size="sm">
                    {level.handoff.label}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Stamp>
            </div>
        </section>
    );
}

export default function Pyramid({ stats = {} }) {
    const [selectedLevel, setSelectedLevel] = useState('top');

    const selected = LEVELS.find((level) => level.key === selectedLevel) || LEVELS[0];

    return (
        <ModuleLayout sheet="Bab II · Piramida">
            <Head title="Hierarki & Piramida Sistem Informasi — RAKIT" />

            <PageBand
                tone="plot"
                path={[{ label: 'Toko', href: '/' }, { label: 'Modul rujukan' }, { label: 'Bab II · Piramida' }]}
                title="Hierarki manajemen & tipe sistem informasi"
                meta="Klasifikasi sistem informasi organisasi menurut tingkat hierarki manajerial dan tipe keputusan yang diambil pada tiap tingkat. Pilih satu tingkat pada piramida untuk membaca karakteristik kerjanya."
                actions={
                    <>
                        <Stamp as={Link} href="/tps" variant="secondary" size="sm">
                            Buka TPS
                        </Stamp>
                        <Stamp as={Link} href="/mis" variant="secondary" size="sm">
                            Buka MIS
                        </Stamp>
                        <Stamp as={Link} href="/iss" variant="secondary" size="sm">
                            Buka ISS
                        </Stamp>
                    </>
                }
            />

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                {/* ── Figures read from the module's own tables ─────────────── */}
                <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                    <Readout
                        tone="plot"
                        label="Baris transaksi TPS"
                        value={count(stats.total_transactions)}
                    />
                    <Readout
                        tone="plot"
                        label="Nilai transaksi terproses"
                        value={
                            <>
                                <span className="text-[11px] text-chalk-2">$</span>{' '}
                                {dollars(stats.total_sales_value)}
                            </>
                        }
                    />
                    <Readout tone="plot" label="Memo OAS terarsip" value={count(stats.total_memos)} />
                    <Readout
                        tone="plot"
                        label="Wilayah di luar ambang MIS"
                        value={count(stats.total_exceptions)}
                    />
                </dl>

                {/* ── The pyramid, drawn as four stacked levels ─────────────── */}
                <div className="mt-8 grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
                    <div className="lg:col-span-5">
                        <ZoneFrame className="border-line-2 bg-plot-2">
                            <SheetHead
                                tone="plot"
                                label="Piramida tingkat manajerial"
                                readouts={[{ label: 'Terpilih', value: `${selected.code} · ${selected.band}` }]}
                            />

                            <div className="border-b border-line">
                                <PyramidScene
                                    selected={selectedLevel}
                                    onSelect={setSelectedLevel}
                                />
                                <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2 font-mono text-[8px] uppercase tracking-[0.16em] text-chalk-2 sm:px-4">
                                    <span>Piramida 3D · klik tingkat</span>
                                    <span className="text-chalk-3">
                                        T1–T4 · {selected.band}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-2 p-3 sm:p-4">
                                {LEVELS.map((level) => {
                                    const active = level.key === selectedLevel;

                                    return (
                                        <button
                                            key={level.key}
                                            type="button"
                                            onClick={() => setSelectedLevel(level.key)}
                                            aria-pressed={active}
                                            className={`col-span-12 flex items-center justify-between gap-4 border px-4 py-3 text-left transition-colors ${level.span} ${
                                                active
                                                    ? 'border-lit bg-plot-3 text-chalk'
                                                    : 'border-line-2 bg-plot-2 text-chalk-2 hover:border-chalk-2 hover:text-chalk'
                                            }`}
                                        >
                                            <span className="min-w-0">
                                                <span className="block font-mono text-[9px] uppercase tracking-[0.16em]">
                                                    {level.code} · {level.band}
                                                </span>
                                                <span className="mt-1 block font-display text-[13px] font-semibold uppercase tracking-[0.02em]">
                                                    {level.name}
                                                </span>
                                                <span className="mt-0.5 block font-mono text-[10px]">
                                                    {level.systems}
                                                </span>
                                            </span>

                                            <span className="flex flex-none items-center gap-2">
                                                <Lamp
                                                    tone={active ? 'lit' : 'chalk'}
                                                    state={active ? 'lit' : 'off'}
                                                />
                                                <span className="font-mono text-[9px] uppercase tracking-[0.14em]">
                                                    {active ? 'Dipilih' : 'Pilih'}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </ZoneFrame>

                        <Dim label="Empat tingkat manajerial" className="mt-4" />

                        <p className="mt-4 max-w-[52ch] text-[12px] leading-relaxed text-chalk-2">
                            Lebar setiap batang menunjukkan luas cakupan tingkat tersebut: makin rendah
                            tingkatnya, makin banyak transaksi dan orang yang bekerja di dalamnya.
                        </p>
                    </div>

                    <div className="lg:col-span-7">
                        <LevelPanel level={selected} />
                    </div>
                </div>

                {/* ── The four system types, as a register ─────────────────── */}
                <section className="mt-10">
                    <SectionHead
                        drawn
                        title="Empat tipe sistem informasi utama"
                        meta="Ringkasan per tingkat"
                    />

                    <div className="register mt-4 overflow-x-auto">
                        <table className="data-table min-w-[720px]">
                            <caption className="sr-only">
                                Tingkat hierarki, singkatan sistem, cakupan kerja, dan lembar yang membukanya.
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
                                        Tingkat
                                    </th>
                                    <th scope="col">
                                        <span
                                            className="block font-mono text-[8px] font-normal text-chalk-2"
                                            aria-hidden="true"
                                        >
                                            2
                                        </span>
                                        Sistem
                                    </th>
                                    <th scope="col">
                                        <span
                                            className="block font-mono text-[8px] font-normal text-chalk-2"
                                            aria-hidden="true"
                                        >
                                            3
                                        </span>
                                        Cakupan kerja
                                    </th>
                                    <th scope="col" className="text-right">
                                        <span
                                            className="block font-mono text-[8px] font-normal text-chalk-2"
                                            aria-hidden="true"
                                        >
                                            4
                                        </span>
                                        Lembar
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {SYSTEMS.map((system) => (
                                    <tr key={system.code}>
                                        <td>
                                            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-chalk-2">
                                                {system.level}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="font-display text-[13px] font-semibold uppercase tracking-[0.02em] text-chalk">
                                                {system.code}
                                            </span>
                                        </td>
                                        <td className="text-[12px] text-chalk-2">{system.scope}</td>
                                        <td className="num">
                                            <Link
                                                href={system.href}
                                                className="inline-flex items-center gap-1.5 text-lit transition-colors hover:text-lit-2"
                                            >
                                                Buka
                                                <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ── Bab VII: People di Dalam Sistem Informasi ───────────── */}
                <section className="mt-10">
                    <SectionHead
                        drawn
                        title="People di dalam sistem informasi (Bab VII)"
                        meta="Peran pencipta, pengelola, manajemen & pengguna"
                    />

                    <div className="register mt-4 overflow-x-auto">
                        <table className="data-table min-w-[720px]">
                            <thead>
                                <tr>
                                    <th scope="col">Kelompok</th>
                                    <th scope="col">Peran SI</th>
                                    <th scope="col">Tanggung jawab inti (Bab VII)</th>
                                    <th scope="col">Representasi di RAKIT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    [
                                        'Creators',
                                        'Systems Analyst & Programmer',
                                        'Mengidentifikasi kebutuhan bisnis, merancang alur/skema DB, serta menulis perangkat lunak.',
                                        'Arsitektur Laravel, migrasi SQL & modul KMS/EIS.',
                                    ],
                                    [
                                        'Operations',
                                        'Database Administrator (DBA)',
                                        'Mengontrol skema basis data, otorisasi akses, optimasi indeks, dan pencadangan.',
                                        'Pengelolaan trigger `logs`, prosedur `getcat`, dan indeks katalog.',
                                    ],
                                    [
                                        'Operations',
                                        'Help Desk / Support Analyst',
                                        'Membantu pengguna akhir menyelesaikan kendala teknis serta menjaga pengetahuan FAQ.',
                                        'Chatbot KMS (/kms) dan diagnosa kompatibilitas (/iss).',
                                    ],
                                    [
                                        'Management',
                                        'CIO & CISO',
                                        'Penyelarasan strategi TI dengan bisnis (CIO) dan kebijakan keamanan informasi (CISO).',
                                        'Panel Kendali Admin (/admin), RBAC, dan rate-limit auth.',
                                    ],
                                    [
                                        'Management',
                                        'Project Manager',
                                        'Memastikan proyek TI selesai tepat waktu, sesuai anggaran, dan menjaga kualitas.',
                                        'Manajemen tugas & tenggat operasional pada modul /oas.',
                                    ],
                                    [
                                        'Users',
                                        'End Users (Internal & Eksternal)',
                                        'Mengoperasikan TPS harian, menyusun laporan MIS, serta memanfaatkan layanan etalase.',
                                        'Admin operasional & pelanggan etalase RAKIT (/dashboard).',
                                    ],
                                ].map(([group, role, duty, appMap]) => (
                                    <tr key={role}>
                                        <td className="font-mono text-[10px] uppercase text-lit">
                                            {group}
                                        </td>
                                        <td className="font-medium text-chalk">{role}</td>
                                        <td className="text-[12px] text-chalk-2">{duty}</td>
                                        <td className="text-[12px] text-chalk-2">{appMap}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </ModuleLayout>
    );
}
