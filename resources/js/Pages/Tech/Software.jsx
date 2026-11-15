import React, { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import ShopLayout from '@/Layouts/ShopLayout';
import TechScene from '@/Components/TechScene';
import { Callout, PageBand, Readout, SectionHead, SheetHead, TitleBlock, ZoneFrame } from '@/Components/Sheet';
import { EmptyState, LabelledField, Lamp, Select, Stamp, StatusLamp } from '@/Components/Controls';
import { notifyError, notifySuccess } from '@/lib/notify';
import { count, isoDate, stampDate } from '@/lib/format';

/**
 * Perangkat lunak — the data layer, drawn as a data sheet.
 *
 * The relations this page reads are printed as they come back, one ruled table
 * per relation, and the stored procedure `getcat(cid)` is a working control: it
 * is executed by the controller and its rows are printed here unchanged.
 */

/** Column order is the relation's own order where it is known, and the row's order otherwise. */
const COLUMN_ORDER = [
    'admin_id',
    'user_id',
    'email_id',
    'id',
    'first_name',
    'last_name',
    'admin_name',
    'name',
    'email',
    'admin_email',
    'mobile',
    'address1',
    'address2',
    'slug',
    'icon',
    'description',
    'admin_password',
    'password',
    'created_at',
    'updated_at',
];

const isCredentialColumn = (column) => /password|token|secret/i.test(column);
const isDateColumn = (column) => /(_at|_date)$/i.test(column);

/** MySQL hands back `2026-09-14 06:40:30`; the sheet prints it as `14 SEP 2026`. */
function sheetStamp(value) {
    return stampDate(typeof value === 'string' ? value.replace(' ', 'T') : value);
}

function columnsFor(rows = []) {
    const present = new Set();
    rows.forEach((row) => Object.keys(row || {}).forEach((key) => present.add(key)));

    const ordered = COLUMN_ORDER.filter((key) => present.has(key));
    const rest = [...present].filter((key) => !COLUMN_ORDER.includes(key)).sort();

    return [...ordered, ...rest];
}

function rowKey(row, index) {
    return row?.admin_id ?? row?.user_id ?? row?.email_id ?? row?.id ?? index;
}

function Cell({ column, value }) {
    if (isCredentialColumn(column)) {
        return (
            <span className="font-mono text-[11px] text-ink-3" title="Kata sandi tidak dicetak">
                ••••••••
            </span>
        );
    }

    if (value === null || value === undefined || value === '') {
        return <span className="text-ink-3">—</span>;
    }

    if (isDateColumn(column)) {
        return (
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
                {sheetStamp(value)}
            </span>
        );
    }

    if (typeof value === 'number' || /(^|_)id$/i.test(column)) {
        return <span className="font-mono text-[12px] text-ink">{value}</span>;
    }

    return (
        <span className="inline-block max-w-[46ch] align-top text-[12px] leading-relaxed text-ink-2">
            {String(value)}
        </span>
    );
}

/** One relation, printed as it came back: same columns, same order, same values. */
function RelationTable({ title, read, note, rows = [] }) {
    const columns = useMemo(() => columnsFor(rows), [rows]);

    return (
        <ZoneFrame className="mt-4">
            <SheetHead
                label={title}
                readouts={[
                    { label: 'Baris', value: count(rows.length) },
                    { label: 'Kolom', value: count(columns.length) },
                ]}
                action={<span className="part-no">{read}</span>}
            />

            {rows.length === 0 ? (
                <p className="px-3 py-6 text-[12px] leading-relaxed text-ink-2">
                    Relasi {title} tidak mengembalikan baris, jadi tidak ada yang bisa dicetak. Isi
                    relasinya lebih dahulu, lalu muat ulang lembar ini.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="data-table min-w-[620px]">
                        <caption className="sr-only">
                            Isi relasi {title}: {columns.join(', ')}.
                        </caption>
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th key={column} scope="col">
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={rowKey(row, index)}>
                                    {columns.map((column) => (
                                        <td key={column}>
                                            <Cell column={column} value={row?.[column]} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {note && (
                <p className="border-t border-rule px-3 py-2 text-[11px] leading-relaxed text-ink-3">
                    {note}
                </p>
            )}
        </ZoneFrame>
    );
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
                    <Stamp as={Link} href="/software" variant="secondary">
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

export default function Software({
    adminInfo = [],
    emailInfo = [],
    userInfo = [],
    userInfoBackup = [],
    questions = [],
    categories = [],
}) {
    const [categoryId, setCategoryId] = useState(() => Number(categories?.[0]?.id ?? 1));
    const [result, setResult] = useState(null);
    const [failure, setFailure] = useState('');
    const [running, setRunning] = useState(false);

    const categoryOptions = categories || [];
    const resultRows = useMemo(() => (Array.isArray(result?.data) ? result.data : []), [result]);
    const resultColumns = useMemo(() => columnsFor(resultRows), [resultRows]);

    const relations = [
        {
            key: 'admin_info',
            title: 'admin_info',
            read: '->select(nama, email, waktu)->get()',
            rows: adminInfo || [],
            note: "Dibaca dengan DB::table('admin_info')->select('admin_id', 'admin_name', 'admin_email', ...)->get(). Kolom admin_password sengaja tidak ikut dibaca, jadi nilainya tidak pernah sampai ke halaman ini.",
        },
        {
            key: 'email_info',
            title: 'email_info',
            read: '->latest()->take(5)',
            rows: emailInfo || [],
            note: "Dibaca dengan DB::table('email_info')->latest()->take(5): lima baris terbaru. Barisnya ditulis formulir pemberitahuan rilis di kaki halaman toko.",
        },
        {
            key: 'user_info',
            title: 'user_info',
            read: '->latest()->take(5)',
            rows: userInfo || [],
            note: "Dibaca dengan DB::table('user_info')->latest()->take(5): lima baris terbaru pengguna portal. Setiap baris baru disalin otomatis ke user_info_backup oleh trigger after_user_info_insert.",
        },
        {
            key: 'user_info_backup',
            title: 'user_info_backup',
            read: '->latest()->take(5)',
            rows: userInfoBackup || [],
            note: "Dibaca dengan DB::table('user_info_backup')->latest()->take(5): lima baris terbaru dari salinan yang ditulis trigger after_user_info_insert AFTER INSERT pada user_info.",
        },
    ];

    const runProcedure = async () => {
        setRunning(true);
        setFailure('');

        try {
            const response = await axios.post('/software/run-procedure', { category_id: categoryId });
            const returned = Array.isArray(response.data?.data) ? response.data.data.length : 0;

            setResult(response.data);
            notifySuccess(
                'Rutin dijalankan',
                `${response.data?.procedure_called || `CALL getcat(${categoryId})`} — ${count(returned)} baris dikembalikan.`,
            );
        } catch (error) {
            setResult(null);
            setFailure(
                error?.response?.data?.message ||
                    `Rutin tidak menjawab. Periksa koneksi basis data lalu jalankan CALL getcat(${categoryId}) sekali lagi.`,
            );
            notifyError('Rutin tidak dijalankan', `CALL getcat(${categoryId}) tidak dijawab server.`);
        } finally {
            setRunning(false);
        }
    };

    return (
        <ShopLayout newsletter={false}>
            <Head title="Perangkat lunak sistem — RAKIT" />

            <PageBand
                path={[
                    { label: 'Register', href: '/' },
                    { label: 'Berkas sistem' },
                    { label: 'Perangkat lunak' },
                ]}
                title="Perangkat lunak"
                meta="Lembar data lapisan data: rutin tersimpan getcat(cid) yang dijalankan dari sini, baris yang dikembalikannya, dan empat relasi yang dibaca halaman ini apa adanya."
                actions={
                    <>
                        <Stamp as="a" variant="secondary" href="#relasi">
                            Relasi basis data
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
                            Barisnya dicetak, bukan dikutip.
                        </h2>
                        <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-ink-2">
                            Setiap relasi di lembar ini dibaca dengan satu kueri saat halaman dibuka, lalu
                            dicetak dengan kolom dan nilai yang sama seperti yang dikembalikan basis data.
                            Rutin tersimpan getcat(cid) dijalankan dari lembar ini juga, dan baris
                            hasilnya muncul di bawah tombolnya.
                        </p>
                        <p className="mt-3 max-w-[62ch] text-[12px] leading-relaxed text-ink-3">
                            Tidak ada angka yang diketik ke dalam berkas ini. Jika sebuah relasi kosong,
                            lembarnya mengatakan kosong.
                        </p>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="mb-6 border border-ink bg-plot">
                            <div className="flex items-center justify-between gap-3 border-b border-line-2 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                <span className="text-chalk">Perangkat lunak / 3D</span>
                                <span className="flex items-center gap-1.5 text-lit">
                                    <span className="h-1 w-1 bg-lit" />
                                    LIVE
                                </span>
                            </div>
                            <TechScene variant="software" />
                            <p className="border-t border-line px-3 py-2 text-[11px] leading-relaxed text-chalk-2">
                                Tumpukan lapisan data. Isi relasi yang sebenarnya tetap dicetak di
                                tabel bawah.
                            </p>
                        </div>

                        <TitleBlock
                            cells={[
                                { label: 'Lembar', value: 'Berkas sistem / 04' },
                                { label: 'Revisi', value: isoDate() },
                                { label: 'Skala', value: '1:1 — IDR' },
                            ]}
                        />

                        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                            <Readout label="Relasi dibaca" value={count(relations.length)} />
                            <Readout label="Baris admin_info" value={count((adminInfo || []).length)} />
                            <Readout label="Baris email_info" value={count((emailInfo || []).length)} />
                            <Readout label="Baris user_info" value={count((userInfo || []).length)} />
                            <Readout
                                label="Baris user_info_backup"
                                value={count((userInfoBackup || []).length)}
                            />
                            <Readout label="Soal latihan" value={count(questions.length)} />
                        </dl>
                    </div>
                </div>

                {/* ── Stored procedure ─────────────────────────────────────── */}
                <section id="prosedur" className="mt-10 scroll-mt-16">
                    <SectionHead
                        title="Rutin tersimpan"
                        meta="Dijalankan dari lembar ini"
                        action={
                            <span className="part-no">getcat(IN cid INT)</span>
                        }
                    />

                    <ZoneFrame className="mt-4">
                        <SheetHead
                            label="Rutin katalog per kelompok"
                            readouts={[
                                { label: 'Badan rutin', value: 'SELECT * FROM categories' },
                                { label: 'Baris', value: result ? count(resultRows.length) : '—' },
                            ]}
                            action={
                                result ? (
                                    <StatusLamp
                                        state={
                                            String(result.status || 'success').toLowerCase() === 'success'
                                                ? {
                                                      tone: 'cyan',
                                                      lamp: 'lit',
                                                      label: 'RUTIN DIJALANKAN',
                                                  }
                                                : {
                                                      tone: 'red',
                                                      lamp: 'lit',
                                                      label: String(result.status).toUpperCase(),
                                                  }
                                        }
                                    />
                                ) : null
                            }
                        />

                        <div className="grid gap-px bg-rule lg:grid-cols-12">
                            <div className="plot lg:col-span-7">
                                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line-2 px-3 py-2">
                                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                        Pernyataan yang dikirim
                                    </span>
                                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-2">
                                        Basis data toko
                                    </span>
                                </div>
                                <pre className="overflow-x-auto px-3 py-3 font-mono text-[11px] leading-relaxed">
                                    <span className="text-chalk">{`CALL getcat(${categoryId});`}</span>
                                    {'\n'}
                                    <span className="text-chalk-2">
                                        {'-- badan rutin, disalin dari msi_db.sql\nSELECT * FROM categories WHERE id = cid;'}
                                    </span>
                                </pre>
                            </div>

                            <div className="bg-sheet px-3 py-3 lg:col-span-5">
                                <LabelledField
                                    label="Parameter cid"
                                    hint="Satu kelompok katalog, dibaca dari tabel categories."
                                >
                                    <Select
                                        value={categoryId}
                                        onChange={(event) => setCategoryId(Number(event.target.value))}
                                    >
                                        {categoryOptions.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.id} — {category.name}
                                            </option>
                                        ))}
                                    </Select>
                                </LabelledField>

                                <Stamp
                                    onClick={runProcedure}
                                    disabled={running || categoryOptions.length === 0}
                                    className="mt-3 w-full sm:w-auto"
                                >
                                    {running ? 'Menjalankan' : 'Jalankan getcat'}
                                </Stamp>

                                {categoryOptions.length === 0 ? (
                                    <p className="mt-3 text-[11px] leading-relaxed text-red">
                                        Daftar kelompok tidak terbaca dari lembar ini, jadi parameter cid
                                        tidak bisa dipilih. Muat ulang halaman sebelum menjalankan rutin.
                                    </p>
                                ) : (
                                    <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
                                        Rutin dijalankan oleh pengendali, bukan oleh peramban. Lembar ini
                                        hanya mengirim nomor kelompoknya.
                                    </p>
                                )}
                            </div>
                        </div>

                        {failure && (
                            <p className="border-t border-red bg-red-tint px-3 py-2.5 text-[12px] leading-relaxed text-red">
                                {failure}
                            </p>
                        )}

                        {result ? (
                            <div className="border-t border-ink">
                                <SheetHead
                                    label="Hasil eksekusi"
                                    readouts={[
                                        {
                                            label: 'Pernyataan',
                                            value: result.procedure_called || `CALL getcat(${categoryId})`,
                                        },
                                        { label: 'Baris', value: count(resultRows.length) },
                                    ]}
                                />

                                {resultRows.length === 0 ? (
                                    <p className="px-3 py-6 text-[12px] leading-relaxed text-ink-2">
                                        Rutin dijalankan tetapi tidak mengembalikan baris untuk cid{' '}
                                        {categoryId}. Kelompok itu tidak ada di tabel categories; pilih
                                        kelompok lain lalu jalankan lagi.
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="data-table min-w-[620px]">
                                            <caption className="sr-only">
                                                Baris yang dikembalikan CALL getcat({categoryId}) dari tabel
                                                categories.
                                            </caption>
                                            <thead>
                                                <tr>
                                                    {resultColumns.map((column) => (
                                                        <th key={column} scope="col">
                                                            {column}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {resultRows.map((row, index) => (
                                                    <tr key={rowKey(row, index)}>
                                                        {resultColumns.map((column) => (
                                                            <td key={column}>
                                                                <Cell
                                                                    column={column}
                                                                    value={row?.[column]}
                                                                />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : (
                            !failure && (
                                <p className="border-t border-rule px-3 py-6 text-[12px] leading-relaxed text-ink-2">
                                    Pilih kelompok pada parameter cid, lalu jalankan rutinnya. Baris yang
                                    dikembalikan akan dicetak di sini, satu baris per kelompok katalog.
                                </p>
                            )
                        )}
                    </ZoneFrame>
                </section>

                {/* ── Relations ───────────────────────────────────────────── */}
                <section id="relasi" className="mt-10 scroll-mt-16">
                    <SectionHead
                        title="Relasi basis data"
                        meta={`${count(relations.length)} relasi dibaca halaman ini`}
                    />

                    {relations.map((relation) => (
                        <RelationTable
                            key={relation.key}
                            title={relation.title}
                            read={relation.read}
                            note={relation.note}
                            rows={relation.rows}
                        />
                    ))}

                    <ZoneFrame className="mt-4">
                        <SheetHead label="Cara membaca relasi" />
                        <div className="px-3 py-1">
                            <Callout k="Kata sandi">
                                Kolom kata sandi tidak ikut dibaca dari basis data, jadi nilainya tidak
                                pernah sampai ke peramban. Kalau sebuah kolom sandi tetap muncul, isinya
                                diganti delapan titik.
                            </Callout>
                            <Callout k="Waktu">
                                Kolom created_at dan updated_at dicetak sebagai tanggal singkat, bukan
                                stempel waktu penuh.
                            </Callout>
                            <Callout k="Kosong">
                                Tanda — berarti kolomnya tidak berisi nilai pada baris itu.
                            </Callout>
                        </div>
                    </ZoneFrame>
                </section>

                {/* ── Quiz ─────────────────────────────────────────────────── */}
                <section id="latihan" className="mt-10 scroll-mt-16">
                    <SectionHead
                        title="Latihan"
                        meta={`${count(questions.length)} soal · dinilai pengendali`}
                    />

                    <QuestionSet
                        questions={questions}
                        action="/software/quiz"
                        note="Jawaban dikirim ke pengendali sebagai satu berkas, dinilai di sana, lalu hasilnya diterbitkan sebagai lembar tersendiri berisi kunci dan penjelasan. Satu jawaban per soal; soal yang belum dijawab menahan pengiriman."
                    />
                </section>
            </div>
        </ShopLayout>
    );
}
