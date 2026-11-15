import React, { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import TechScene from '@/Components/TechScene';
import { Callout, PageBand, Readout, SectionHead, SheetHead, TitleBlock, ZoneFrame } from '@/Components/Sheet';
import { EmptyState, Lamp, Stamp, StatusLamp } from '@/Components/Controls';
import { partNo, position, stockState } from '@/lib/catalog';
import { amount, count, isoDate } from '@/lib/format';

/**
 * Perangkat keras — the physical layer, drawn as a specification sheet.
 *
 * Two sets of figures appear here and nothing else: the stack facts the
 * application reads about itself while it runs, and the hardware positions the
 * register actually carries. Both are read from the running system; none of
 * them are typed into this file.
 */

/** The sheet's own reading of the running stack, grouped by what each row describes. */
function machineGroups(system) {
    const server = system?.database ? String(system.database).split('-')[0] : null;

    return [
        {
            key: 'aplikasi',
            title: 'Aplikasi',
            rows: [
                { k: 'PHP', v: system?.php || '—', from: 'PHP_VERSION' },
                { k: 'Laravel', v: system?.laravel || '—', from: 'app()->version()' },
                { k: 'Lingkungan', v: system?.environment || '—', from: 'app()->environment()' },
            ],
        },
        {
            key: 'basis-data',
            title: 'Basis data',
            rows: [{ k: 'Server MySQL', v: server || '—', from: 'select version()' }],
        },
    ];
}

/** Hardware positions, grouped by the catalogue group they were read from. */
function positionGroups(products, categories) {
    const byId = new Map((categories || []).map((category) => [String(category.id), category]));
    const groups = new Map();

    (products || []).forEach((product) => {
        const key = String(product?.category_id ?? 'lain');
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                name: byId.get(key)?.name || `Kelompok ${key}`,
                rows: [],
            });
        }
        groups.get(key).rows.push(product);
    });

    return [...groups.values()];
}

/**
 * The quiz: a numbered question set posted to the controller, which answers with
 * its own result sheet. One answer per question, one stamp to send.
 */
function QuestionSet({ questions = [], action, note }) {
    const [chosen, setChosen] = useState({});
    const { post, processing } = useForm({});

    const sending = processing;

    const answered = questions.filter((question) => chosen[question.id]).length;

    if (questions.length === 0) {
        return (
            <EmptyState
                title="Tidak ada soal pada lembar ini"
                description="Pengendali tidak mengirim daftar soal, jadi tidak ada yang bisa dijawab. Muat ulang halaman untuk meminta daftarnya sekali lagi."
                action={
                    <Stamp as={Link} href="/hardware" variant="secondary">
                        Muat ulang lembar
                    </Stamp>
                }
            />
        );
    }

    return (
        <form
            method="POST"
            action={action}
            onSubmit={(event) => {
                // Answered through Inertia rather than by the browser. The native
                // submit this replaced left the SPA for a full document load, which
                // is the one thing the conversion to Inertia was for.
                event.preventDefault();

                if (processing) {
                    return;
                }

                post(action, { preserveScroll: true });
            }}
            className="mt-4"
        >
            <ol className="border border-ink bg-sheet">
                {questions.map((question, index) => (
                    <li key={question.id} className={index > 0 ? 'border-t border-ink' : ''}>
                        <div className="flex items-baseline justify-between gap-4 border-b border-rule px-3 py-2">
                            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink">
                                Soal {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">
                                1 poin
                            </span>
                        </div>

                        <div className="px-3 py-3">
                            <p className="max-w-[80ch] text-[13px] leading-relaxed text-ink">
                                {question.question}
                            </p>

                            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                                {Object.entries(question.options || {}).map(([optionKey, optionText]) => {
                                    const isChosen = chosen[question.id] === optionKey;

                                    return (
                                        <label
                                            key={optionKey}
                                            className={`flex cursor-pointer items-start gap-2.5 border px-3 py-2.5 transition-colors ${
                                                isChosen
                                                    ? 'border-cyan bg-cyan-tint'
                                                    : 'border-rule hover:border-ink-3 hover:bg-sheet-2'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`answers[${question.id}]`}
                                                value={optionKey}
                                                required
                                                checked={isChosen}
                                                onChange={() =>
                                                    setChosen((previous) => ({
                                                        ...previous,
                                                        [question.id]: optionKey,
                                                    }))
                                                }
                                                className="mt-[3px] h-3.5 w-3.5 flex-none"
                                            />
                                            <span
                                                className={`font-mono text-[11px] uppercase leading-5 ${
                                                    isChosen ? 'text-cyan' : 'text-ink-3'
                                                }`}
                                            >
                                                {optionKey}
                                            </span>
                                            <span className="flex-1 text-[12px] leading-5 text-ink">
                                                {optionText}
                                            </span>
                                            <Lamp
                                                tone={isChosen ? 'cyan' : 'ink'}
                                                state={isChosen ? 'lit' : 'unlit'}
                                                className="mt-1.5"
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-ink pt-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                    Terjawab {count(answered)} / {count(questions.length)}
                </span>
                <Stamp type="submit" disabled={sending}>
                    {sending ? 'Mengirim' : 'Kirim jawaban'}
                </Stamp>
            </div>

            {note && <p className="mt-3 max-w-[80ch] text-[11px] leading-relaxed text-ink-3">{note}</p>}
        </form>
    );
}

export default function Hardware({ hardwareProducts = [], questions = [], categories = [], system }) {
    const products = hardwareProducts || [];
    const groups = useMemo(() => positionGroups(products, categories), [products, categories]);
    const machine = useMemo(() => machineGroups(system), [system]);

    const onHand = products.reduce((sum, product) => sum + (Number(product?.stock) || 0), 0);
    const connected = Boolean(system?.database);

    return (
        <ShopLayout newsletter={false}>
            <Head title="Perangkat keras sistem — RAKIT" />

            <PageBand
                path={[
                    { label: 'Register', href: '/' },
                    { label: 'Berkas sistem' },
                    { label: 'Perangkat keras' },
                ]}
                title="Perangkat keras"
                meta="Lembar spesifikasi mesin yang menjalankan toko ini, disusul posisi perangkat keras yang benar-benar ada di register. Setiap angka di lembar ini dibaca dari sistem yang sedang berjalan atau dari baris yang sedang ditampilkan, tidak ada yang diketik ke dalam berkas ini."
                actions={
                    <>
                        <Stamp as="a" variant="secondary" href="#register-perangkat">
                            Posisi perangkat keras
                        </Stamp>
                        <Stamp as="a" href="#latihan">
                            Buka latihan
                        </Stamp>
                    </>
                }
            />

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                {/* ── Identity of the sheet ─────────────────────────────────── */}
                <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
                    <div className="lg:col-span-7">
                        <h2 className="font-display text-[26px] font-extrabold uppercase leading-[1.02] tracking-[-0.015em] text-ink sm:text-[32px]">
                            Mesinnya diperiksa, bukan diceritakan.
                        </h2>
                        <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-ink-2">
                            Versi PHP, versi Laravel, versi server basis data, dan nama lingkungan dibaca
                            dari proses yang sedang melayani permintaan ini. Di bawahnya, posisi perangkat
                            keras yang tercatat di register: nomor bagian, jumlah di gudang, dan harga
                            satuannya.
                        </p>
                        <p className="mt-3 max-w-[62ch] text-[12px] leading-relaxed text-ink-3">
                            Lembar ini adalah dokumen rujukan. Tidak ada yang dijual di sini; yang dijual
                            ada di register katalog.
                        </p>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="mb-6 border border-ink bg-plot">
                            <div className="flex items-center justify-between gap-3 border-b border-line-2 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                <span className="text-chalk">Perangkat keras / 3D</span>
                                <span className="flex items-center gap-1.5 text-lit">
                                    <span className="h-1 w-1 bg-lit" />
                                    LIVE
                                </span>
                            </div>
                            <TechScene variant="hardware" />
                            <p className="border-t border-line px-3 py-2 text-[11px] leading-relaxed text-chalk-2">
                                Ornamen gear 3D. Spesifikasi mesin yang sebenarnya dibaca dari runtime
                                di tabel bawah.
                            </p>
                        </div>

                        <TitleBlock
                            cells={[
                                { label: 'Lembar', value: 'Berkas sistem / 03' },
                                { label: 'Revisi', value: isoDate() },
                                { label: 'Skala', value: '1:1 — IDR' },
                            ]}
                        />

                        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                            <Readout label="Posisi di lembar" value={count(products.length)} />
                            <Readout label="Unit pada posisi ini" value={count(onHand)} />
                            <Readout label="Kelompok" value={count(groups.length)} />
                            <Readout label="Soal latihan" value={count(questions.length)} />
                            <Readout
                                label="Mesin"
                                value={system?.php || '—'}
                                sub={system?.laravel ? `Laravel ${system.laravel}` : 'Laravel tidak terbaca'}
                            />
                            <Readout
                                label="Basis data"
                                value={system?.database ? String(system.database).split('-')[0] : '—'}
                                sub={connected ? 'Terhubung' : 'Tidak terbaca'}
                            />
                        </dl>
                    </div>
                </div>

                {/* ── Specification sheet ───────────────────────────────────── */}
                <section className="mt-10">
                    <SectionHead title="Spesifikasi mesin" meta="Dibaca saat permintaan dilayani" />

                    <ZoneFrame className="mt-4">
                        <SheetHead
                            label="Fakta lingkungan"
                            readouts={[{ label: 'Sumber', value: 'Runtime aplikasi' }]}
                            action={
                                <StatusLamp
                                    state={
                                        connected
                                            ? { tone: 'cyan', lamp: 'lit', label: 'BASIS DATA TERBACA' }
                                            : { tone: 'red', lamp: 'lit', label: 'BASIS DATA TIDAK TERBACA' }
                                    }
                                />
                            }
                        />

                        <table className="data-table">
                            <caption className="sr-only">
                                Fakta lingkungan tempat aplikasi berjalan: versi PHP, versi Laravel, nama
                                lingkungan, dan versi server basis data, beserta asal setiap angka.
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col">Perkara</th>
                                    <th scope="col">Nilai</th>
                                    <th scope="col" className="hidden sm:table-cell">
                                        Dibaca dari
                                    </th>
                                </tr>
                            </thead>
                            {machine.map((group) => (
                                <tbody key={group.key}>
                                    <tr className="bg-sheet-2">
                                        <th
                                            scope="colgroup"
                                            colSpan={3}
                                            className="border-b border-rule px-3 py-1.5 text-left font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-ink-3"
                                        >
                                            {group.title}
                                        </th>
                                    </tr>
                                    {group.rows.map((row) => (
                                        <tr key={row.k}>
                                            <td className="text-[12px] text-ink-2">{row.k}</td>
                                            <td>
                                                <span data-measure className="font-mono text-[12px] text-ink">
                                                    {row.v}
                                                </span>
                                            </td>
                                            <td className="hidden sm:table-cell">
                                                <span className="part-no">{row.from}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            ))}
                        </table>

                        <div className="border-t border-rule px-3 py-1">
                            <Callout k="Sumber">
                                Dibaca dari proses yang sedang berjalan, lalu disimpan satu jam sebelum
                                dibaca ulang.
                            </Callout>
                            <Callout k="Kosong">
                                Tanda — berarti angka itu tidak terbaca saat lembar ini dicetak.
                            </Callout>
                        </div>
                    </ZoneFrame>
                </section>

                {/* ── Hardware positions ────────────────────────────────────── */}
                <section id="register-perangkat" className="mt-10 scroll-mt-16">
                    <SectionHead
                        title="Posisi perangkat keras"
                        meta={`${count(products.length)} posisi pada ${count(groups.length)} kelompok`}
                        action={
                            <Link
                                href="/#register"
                                className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan underline decoration-dotted hover:text-cyan-2"
                            >
                                Buka register katalog
                            </Link>
                        }
                    />

                    {groups.length === 0 ? (
                        <EmptyState
                            title="Tidak ada posisi perangkat keras"
                            description="Register tidak mengembalikan baris untuk kelompok perangkat keras. Tambahkan posisi pada kelompok itu di konsol kendali, lalu muat ulang lembar ini."
                            action={
                                <Stamp as={Link} href="/" variant="secondary">
                                    Buka register
                                </Stamp>
                            }
                        />
                    ) : (
                        groups.map((group) => {
                            const units = group.rows.reduce(
                                (sum, product) => sum + (Number(product?.stock) || 0),
                                0,
                            );

                            return (
                                <ZoneFrame key={group.key} className="mt-4">
                                    <SheetHead
                                        label={group.name}
                                        readouts={[
                                            { label: 'Posisi', value: count(group.rows.length) },
                                            { label: 'Unit', value: count(units) },
                                        ]}
                                    />

                                    <div className="overflow-x-auto">
                                        <table className="data-table">
                                            <caption className="sr-only">
                                                Posisi perangkat keras pada kelompok {group.name}: posisi
                                                register, nomor bagian, nama, jumlah di gudang, dan harga
                                                satuan.
                                            </caption>
                                            <thead>
                                                <tr>
                                                    <th scope="col" className="hidden sm:table-cell">
                                                        Pos
                                                    </th>
                                                    <th scope="col" className="hidden sm:table-cell">
                                                        Part No
                                                    </th>
                                                    <th scope="col">Designation</th>
                                                    <th scope="col">On Hand</th>
                                                    <th scope="col" className="text-right">
                                                        Unit Price
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.rows.map((product) => (
                                                    <tr key={product.id}>
                                                        <td className="hidden sm:table-cell">
                                                            <span className="part-no text-ink-2">
                                                                {position(product)}
                                                            </span>
                                                        </td>
                                                        <td className="hidden sm:table-cell">
                                                            <span className="part-no">
                                                                {partNo({
                                                                    id: product.id,
                                                                    category: group.name,
                                                                })}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <Link
                                                                href={`/product/${product.slug}`}
                                                                className="text-[13px] font-medium text-ink transition-colors hover:text-cyan hover:underline"
                                                            >
                                                                {product.name}
                                                            </Link>
                                                            <span className="mt-0.5 block max-w-[46ch] truncate text-[11px] text-ink-3">
                                                                {product.description || 'Tanpa keterangan'}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap">
                                                            <StatusLamp state={stockState(product.stock)} />
                                                        </td>
                                                        <td className="num text-ink">
                                                            <span className="text-[11px] text-ink-3">Rp</span>{' '}
                                                            {amount(product.price)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </ZoneFrame>
                            );
                        })
                    )}
                </section>

                {/* ── Quiz ─────────────────────────────────────────────────── */}
                <section id="latihan" className="mt-10 scroll-mt-16">
                    <SectionHead
                        title="Latihan"
                        meta={`${count(questions.length)} soal · dinilai pengendali`}
                    />

                    <QuestionSet
                        questions={questions}
                        action="/hardware/quiz"
                        note="Jawaban dikirim ke pengendali sebagai satu berkas, dinilai di sana, lalu hasilnya diterbitkan sebagai lembar tersendiri berisi kunci dan penjelasan. Satu jawaban per soal; soal yang belum dijawab menahan pengiriman."
                    />
                </section>
            </div>
        </ShopLayout>
    );
}
