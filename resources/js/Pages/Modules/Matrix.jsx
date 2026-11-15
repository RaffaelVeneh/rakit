import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import ModuleLayout from '@/Layouts/ModuleLayout';
import { Dim, PageBand, SectionHead } from '@/Components/Sheet';
import { count } from '@/lib/format';

/**
 * Matrix — the comparison this chapter exists to make: four types of information
 * system read across six identical axes. Attributes run down the side, systems
 * across the top, and every cell is a string the controller passed. The matrix
 * transposes at lg and stacks one system at a time below it; both forms print the
 * same six axes in the same order, so a reader never has to re-learn the sheet.
 */

/** The six axes. `hierarchy_level` carries a second reading: the decision type it supports. */
const AXES = [
    { key: 'hierarchy_level', label: 'Hierarki & keputusan', note: 'decision_type' },
    { key: 'input', label: 'Karakteristik input', note: null },
    { key: 'processing', label: 'Metode pemrosesan', note: null },
    { key: 'output', label: 'Bentuk output', note: null },
    { key: 'users', label: 'Pengguna', note: null },
    { key: 'application', label: 'Contoh aplikasi', note: null },
];

/**
 * Where each type is built out in full. `matrixData` also carries a `badge_color`
 * per system; it is deliberately not printed. A per-system colour code would put
 * four competing hues on a sheet whose palette allows one chromatic actor for
 * structure and one red for rejection, and it would say nothing the acronym and
 * the hierarchy level do not already say.
 */
const WORK_SHEETS = [
    {
        acronym: 'TPS',
        level: 'Operasional',
        href: '/tps',
        label: 'Buka register transaksi',
    },
    {
        acronym: 'OAS',
        level: 'Pengetahuan & administrasi',
        href: '/oas',
        label: 'Buka arsip memo',
    },
    {
        acronym: 'MIS',
        level: 'Taktis',
        href: '/mis',
        label: 'Buka laporan',
    },
    {
        acronym: 'ISS',
        level: 'Strategis',
        href: '/iss',
        label: 'Buka tiga instrumen',
    },
];

export default function Matrix({ matrixData = [] }) {
    const systems = matrixData || [];

    return (
        <ModuleLayout sheet="Matriks komparasi">
            <Head title="Matriks Karakteristik Sistem Informasi — RAKIT" />

            {/* ── Sheet band: the comparison this sheet exists to make ─────── */}
            <PageBand
                tone="plot"
                path={[
                    { label: 'Piramida', href: '/pyramid' },
                    { label: 'Modul rujukan' },
                    { label: 'Matriks komparasi' },
                ]}
                title="Matriks karakteristik tipe sistem informasi"
                meta="Perbandingan empat tipe sistem informasi pada enam sumbu yang sama: hierarki dan tipe keputusan, input, pemrosesan, output, pengguna, dan contoh aplikasinya."
            />

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                {/* ── The matrix, transposed at lg ─────────────────────────── */}
                <section>
                    <SectionHead
                        title="Enam sumbu perbandingan"
                        meta={`${count(systems.length)} tipe sistem`}
                    />

                    <div className="register mt-4 hidden overflow-x-auto lg:block">
                        <table className="data-table min-w-[1000px]">
                            <caption className="sr-only">
                                Matriks perbandingan TPS, OAS, MIS, dan ISS pada enam sumbu
                                karakteristik.
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col" className="w-56">
                                        <span
                                            className="block font-mono text-[8px] font-normal text-chalk-2"
                                            aria-hidden="true"
                                        >
                                            1
                                        </span>
                                        Sumbu perbandingan
                                    </th>
                                    {systems.map((system, index) => (
                                        <th key={system.acronym} scope="col">
                                            <span
                                                className="block font-mono text-[8px] font-normal text-chalk-2"
                                                aria-hidden="true"
                                            >
                                                {index + 2}
                                            </span>
                                            {system.acronym}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {AXES.map((axis) => (
                                    <tr key={axis.key}>
                                        <th
                                            scope="row"
                                            className="border-b border-line px-3 py-2.5 text-left align-top"
                                        >
                                            <span className="block font-display text-[12px] font-semibold uppercase leading-tight tracking-[0.02em] text-chalk">
                                                {axis.label}
                                            </span>
                                        </th>
                                        {systems.map((system) => (
                                            <td key={system.acronym} className="align-top">
                                                <span className="block text-[12px] leading-relaxed text-chalk">
                                                    {system[axis.key]}
                                                </span>
                                                {axis.note && (
                                                    <span className="mt-1 block text-[11px] leading-relaxed text-chalk-2">
                                                        {system[axis.note]}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Narrow widths: the same six axes, read one system at a time. */}
                    <div className="mt-4 space-y-4 lg:hidden">
                        {systems.map((system) => (
                            <div key={system.acronym} className="register px-4 py-4">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line-2 pb-3">
                                    <h3 className="font-display text-[15px] font-semibold uppercase tracking-[0.02em] text-chalk">
                                        {system.acronym}
                                    </h3>
                                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-2">
                                        {system.system}
                                    </span>
                                </div>

                                <div className="mt-2">
                                    {AXES.map((axis) => (
                                        <div key={axis.key} className="border-b border-line py-2.5">
                                            <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                                {axis.label}
                                            </span>
                                            <span className="mt-1 block text-[12px] leading-relaxed text-chalk">
                                                {system[axis.key]}
                                            </span>
                                            {axis.note && (
                                                <span className="mt-0.5 block text-[11px] leading-relaxed text-chalk-2">
                                                    {system[axis.note]}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Where each system is built out in full ───────────────── */}
                <section className="mt-10">
                    <SectionHead title="Lembar kerja tiap tipe" meta="Rujukan silang" />

                    <div className="register mt-4 overflow-x-auto">
                        <table className="data-table min-w-[720px]">
                            <caption className="sr-only">
                                Tipe sistem, tingkat hierarki, dan lembar yang membangunnya secara
                                rinci.
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
                                        Tipe sistem
                                    </th>
                                    <th scope="col">
                                        <span
                                            className="block font-mono text-[8px] font-normal text-chalk-2"
                                            aria-hidden="true"
                                        >
                                            2
                                        </span>
                                        Tingkat hierarki
                                    </th>
                                    <th scope="col" className="text-right">
                                        <span
                                            className="block font-mono text-[8px] font-normal text-chalk-2"
                                            aria-hidden="true"
                                        >
                                            3
                                        </span>
                                        Lembar
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {WORK_SHEETS.map((row) => (
                                    <tr key={row.acronym}>
                                        <td>
                                            <span className="font-display text-[13px] font-semibold uppercase tracking-[0.02em] text-chalk">
                                                {row.acronym}
                                            </span>
                                        </td>
                                        <td className="text-[12px] text-chalk-2">{row.level}</td>
                                        <td className="num">
                                            <Link
                                                href={row.href}
                                                className="inline-flex items-center gap-1.5 text-lit transition-colors hover:text-lit-2"
                                            >
                                                {row.label}
                                                <ChevronRight
                                                    className="h-3 w-3"
                                                    strokeWidth={1.5}
                                                    aria-hidden="true"
                                                />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Dim label="Empat tipe · enam sumbu" className="mt-4" />
                </section>
            </div>
        </ModuleLayout>
    );
}
