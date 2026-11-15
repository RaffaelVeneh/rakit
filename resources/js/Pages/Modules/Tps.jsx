import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FileText, Play, Plus, RotateCcw, Search } from 'lucide-react';
import ModuleLayout from '@/Layouts/ModuleLayout';
import { Callout, PageBand, Plate, Readout, SectionHead } from '@/Components/Sheet';
import {
    EmptyState,
    Field,
    LabelledField,
    Pager,
    Select,
    Stamp,
    StatusLamp,
} from '@/Components/Controls';
import { count, eventStamp } from '@/lib/format';
import { notifyError } from '@/lib/notify';

/**
 * Sheet: transaction processing system (Bab II, tingkat operasional). The page is
 * the ledger itself — the six stages the system runs, the register of rows the
 * controller paginated, and two plates: the document a row prints, and the form
 * that writes the next row. Every figure is read from the transactions table.
 */

const usd = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/**
 * The ledger is US-dollar denominated and the sheets print it that way: comma
 * grouping, two decimals, the unit mark in the muted tone. Counts keep the
 * Indonesian separators from `lib/format.js`.
 */
function dollars(value) {
    return usd.format(Number(value) || 0);
}

/** A row's state as a lamp plus its word: processed, or still in the batch queue. */
function txState(status) {
    return status === 'processed'
        ? { tone: 'lit', lamp: 'lit', label: 'Terproses' }
        : { tone: 'chalk', lamp: 'half', label: 'Antrean batch' };
}

/** The six stages, in the order the system runs them. */
const STEPS = [
    { name: 'Data entry', note: 'Dokumen sumber dicatat' },
    { name: 'Data validation', note: 'Deteksi & koreksi galat' },
    { name: 'Processing', note: 'Mode online & batch' },
    { name: 'Data storage', note: 'Simpan ke basis data' },
    { name: 'Output generation', note: 'Faktur & dokumen' },
    { name: 'Query support', note: 'Penelusuran transaksi' },
];

/**
 * The controller validates with the app's English message catalogue. Each field
 * therefore states the rules it is held to, in this sheet's own language, so a
 * rejection always names the problem and the recovery.
 */
const FIELD_RULES = {
    type: 'Tipe transaksi harus Internal atau Eksternal. Pilih salah satu, lalu simpan lagi.',
    mode: 'Mode pemrosesan harus Online atau Batch. Pilih salah satu, lalu simpan lagi.',
    category: 'Kategori wajib diisi dan maksimal 100 karakter. Perbaiki isinya, lalu simpan lagi.',
    amount: 'Nominal wajib diisi, berupa angka dolar, dan minimal 1. Contoh: 1500.00.',
    party_name:
        'Nama entitas wajib diisi dan maksimal 150 karakter. Perbaiki isinya, lalu simpan lagi.',
    source_document:
        'Dokumen sumber wajib diisi dan maksimal 100 karakter. Contoh: Faktur #INV-102.',
    notes: 'Keterangan maksimal 500 karakter. Perpendek keterangannya, lalu simpan lagi.',
};

/**
 * An overlay on this sheet closes the way the Blade's did: Escape, or a click on
 * the ground. Focus moves into the plate when it opens and returns to the control
 * that opened it when it closes, because a plate here is always a task.
 */
function usePlate(onClose) {
    const plateRef = useRef(null);

    useEffect(() => {
        const opener = document.activeElement;
        plateRef.current?.querySelector('button, select, input, textarea')?.focus();

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            if (opener instanceof HTMLElement) {
                opener.focus();
            }
        };
    }, [onClose]);

    return plateRef;
}

/**
 * Output generation: the row drawn as its own document. The figures come from the
 * register row the operator pressed, not from a second request.
 */
function DocumentPlate({ trx, onClose }) {
    const plateRef = usePlate(onClose);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Tutup dokumen transaksi"
                onClick={onClose}
                className="absolute inset-0 cursor-default bg-plot"
            />

            <div
                ref={plateRef}
                role="dialog"
                aria-modal="true"
                aria-label={`Dokumen transaksi ${trx.code}`}
                className="relative max-h-full w-full max-w-lg overflow-y-auto"
            >
                <Plate tab="Dokumen transaksi" bodyClassName="px-4 pb-4 pt-8">
                    <div className="flex items-baseline justify-between gap-4 border-b border-line-2 pb-3">
                        <div className="min-w-0">
                            <span className="block font-display text-[15px] font-semibold uppercase tracking-[0.02em] text-chalk">
                                {trx.code}
                            </span>
                            <span className="mt-0.5 block font-mono text-[10px] text-chalk-2">
                                {trx.source_document || '—'}
                            </span>
                        </div>
                        <span className="flex-none font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                            {eventStamp(trx.created_at)}
                        </span>
                    </div>

                    <div className="mt-3">
                        <Callout k="Entitas">{trx.party_name}</Callout>
                        <Callout k="Tipe / mode">
                            {`${String(trx.type).toUpperCase()} / ${String(trx.mode).toUpperCase()}`}
                        </Callout>
                        <Callout k="Kategori">{trx.category}</Callout>
                        <Callout k="Status">
                            <StatusLamp state={txState(trx.status)} />
                        </Callout>
                        <Callout k="Catatan">{trx.notes || 'Tidak ada catatan'}</Callout>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between gap-6 border-t border-line-2 pt-3">
                        <span className="font-display text-[12px] font-bold uppercase tracking-[0.14em] text-chalk">
                            Total
                        </span>
                        <span data-measure className="font-mono text-[17px] font-medium text-chalk">
                            <span className="text-[11px] text-chalk-2">$</span> {dollars(trx.amount)}
                        </span>
                    </div>

                    <div className="mt-5 flex justify-end">
                        <Stamp variant="secondary" onClick={onClose}>
                            Tutup dokumen
                        </Stamp>
                    </div>
                </Plate>
            </div>
        </div>
    );
}

/**
 * Data entry: one new row for the ledger. The field names are the ones the
 * controller validates; the request itself is an Inertia visit, so nothing here
 * reloads the document.
 */
function NewTransactionPlate({ onClose }) {
    const plateRef = usePlate(onClose);

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'external',
        mode: 'online',
        category: '',
        amount: '',
        party_name: '',
        source_document: '',
        notes: '',
    });

    const fieldError = (key) =>
        errors[key] ? FIELD_RULES[key] || 'Isian ini ditolak. Perbaiki nilainya, lalu simpan lagi.' : null;

    const submit = (event) => {
        event.preventDefault();

        if (processing) {
            return;
        }

        // The controller answers with a redirect to the register and its own flash
        // message, which the layout reports once. State is preserved so a rejection
        // keeps this plate open with the operator's figures still in it.
        post('/tps/store', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                reset();
                onClose();
            },
            onError: () =>
                notifyError(
                    'Transaksi ditolak',
                    'Kolom bertanda merah belum benar. Perbaiki kolom itu, lalu simpan lagi.',
                ),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Tutup formulir transaksi"
                onClick={onClose}
                className="absolute inset-0 cursor-default bg-plot"
            />

            <div
                ref={plateRef}
                role="dialog"
                aria-modal="true"
                aria-label="Input transaksi baru"
                className="relative max-h-full w-full max-w-2xl overflow-y-auto"
            >
                <Plate tab="Input transaksi baru" bodyClassName="px-4 pb-4 pt-8">
                    <form action="/tps/store" method="post" onSubmit={submit}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <LabelledField label="Tipe transaksi" error={fieldError('type')}>
                                <Select
                                    name="type"
                                    value={data.type}
                                    onChange={(event) => setData('type', event.target.value)}
                                    required
                                    aria-invalid={errors.type ? true : undefined}
                                >
                                    <option value="external">Eksternal (pelanggan / pemasok)</option>
                                    <option value="internal">Internal (antar departemen)</option>
                                </Select>
                            </LabelledField>

                            <LabelledField label="Mode pemrosesan" error={fieldError('mode')}>
                                <Select
                                    name="mode"
                                    value={data.mode}
                                    onChange={(event) => setData('mode', event.target.value)}
                                    required
                                    aria-invalid={errors.mode ? true : undefined}
                                >
                                    <option value="online">Online (real-time)</option>
                                    <option value="batch">Batch processing</option>
                                </Select>
                            </LabelledField>

                            <LabelledField label="Kategori transaksi" error={fieldError('category')}>
                                <Field
                                    name="category"
                                    type="text"
                                    value={data.category}
                                    onChange={(event) => setData('category', event.target.value)}
                                    placeholder="Contoh: Penjualan produk, ATK"
                                    required
                                    aria-invalid={errors.category ? true : undefined}
                                />
                            </LabelledField>

                            <LabelledField label="Nominal ($)" error={fieldError('amount')}>
                                <Field
                                    measure
                                    name="amount"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="1"
                                    value={data.amount}
                                    onChange={(event) => setData('amount', event.target.value)}
                                    placeholder="1500.00"
                                    required
                                    aria-invalid={errors.amount ? true : undefined}
                                />
                            </LabelledField>

                            <div className="sm:col-span-2">
                                <LabelledField
                                    label="Nama entitas / pihak terkait"
                                    error={fieldError('party_name')}
                                >
                                    <Field
                                        name="party_name"
                                        type="text"
                                        value={data.party_name}
                                        onChange={(event) => setData('party_name', event.target.value)}
                                        placeholder="Contoh: PT Multi Sinergi / Divisi Logistik"
                                        required
                                        aria-invalid={errors.party_name ? true : undefined}
                                    />
                                </LabelledField>
                            </div>

                            <div className="sm:col-span-2">
                                <LabelledField label="Dokumen sumber" error={fieldError('source_document')}>
                                    <Field
                                        name="source_document"
                                        type="text"
                                        value={data.source_document}
                                        onChange={(event) =>
                                            setData('source_document', event.target.value)
                                        }
                                        placeholder="Contoh: Faktur #INV-102, PO #PO-90"
                                        required
                                        aria-invalid={errors.source_document ? true : undefined}
                                    />
                                </LabelledField>
                            </div>

                            <div className="sm:col-span-2">
                                <LabelledField label="Keterangan tambahan" error={fieldError('notes')}>
                                    <textarea
                                        name="notes"
                                        rows={2}
                                        value={data.notes}
                                        onChange={(event) => setData('notes', event.target.value)}
                                        placeholder="Catatan transaksi"
                                        aria-invalid={errors.notes ? true : undefined}
                                        className="field text-[12px]"
                                    />
                                </LabelledField>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line-2 pt-4">
                            <p className="max-w-[46ch] text-[11px] leading-relaxed text-chalk-2">
                                Mode online langsung terproses. Mode batch masuk antrean dan baru terproses
                                saat antrean dieksekusi.
                            </p>

                            <div className="flex flex-none items-center gap-2">
                                <Stamp variant="secondary" onClick={onClose} disabled={processing}>
                                    Batal
                                </Stamp>
                                <Stamp type="submit" disabled={processing}>
                                    {processing ? 'Menyimpan…' : 'Simpan transaksi'}
                                </Stamp>
                            </div>
                        </div>
                    </form>
                </Plate>
            </div>
        </div>
    );
}

export default function Tps({
    transactions = {},
    batchPendingCount = 0,
    onlineCount = 0,
    totalAmount = 0,
}) {
    const { url = '' } = usePage();
    const query = new URLSearchParams(String(url).split('?')[1] || '');

    const currentSearch = query.get('search') || '';
    const currentType = query.get('type') || '';
    const currentMode = query.get('mode') || '';
    const filtersActive = Boolean(currentSearch || currentType || currentMode);

    const rows = transactions?.data || [];
    const total = Number(transactions?.total || 0);
    const currentPage = Number(transactions?.current_page || 1);
    const lastPage = Number(transactions?.last_page || 1);

    // The strip holds what the operator has typed; the address bar holds what the
    // controller actually filtered on. They meet when "Cari" is pressed.
    const [draft, setDraft] = useState({ search: currentSearch, type: currentType, mode: currentMode });
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [openForm, setOpenForm] = useState(false);
    const [busyBatch, setBusyBatch] = useState(false);

    useEffect(() => {
        setDraft({ search: currentSearch, type: currentType, mode: currentMode });
    }, [currentSearch, currentType, currentMode]);

    const closeDoc = useCallback(() => setSelectedTrx(null), []);
    const closeForm = useCallback(() => setOpenForm(false), []);

    const applyFilters = (event) => {
        event.preventDefault();

        const params = {};
        if (draft.search.trim()) {
            params.search = draft.search.trim();
        }
        if (draft.type) {
            params.type = draft.type;
        }
        if (draft.mode) {
            params.mode = draft.mode;
        }

        router.get('/tps', params, { preserveScroll: true });
    };

    const processBatch = () => {
        if (busyBatch) {
            return;
        }

        setBusyBatch(true);
        // The controller flashes how many rows it processed; the layout reports it.
        router.post(
            '/tps/process-batch',
            {},
            {
                preserveScroll: true,
                onError: () =>
                    notifyError(
                        'Antrean batch tidak terproses',
                        'Periksa koneksi basis data lalu jalankan antrean sekali lagi.',
                    ),
                onFinish: () => setBusyBatch(false),
            },
        );
    };

    return (
        <ModuleLayout sheet="TPS · Operasional">
            <Head title="Transaction Processing System (TPS) — RAKIT" />

            <PageBand
                tone="plot"
                path={[
                    { label: 'Piramida', href: '/pyramid' },
                    { label: 'Modul rujukan' },
                    { label: 'TPS · Operasional' },
                ]}
                title="Transaction processing system (TPS)"
                meta="Pencatatan, validasi, dan penyimpanan transaksi bisnis internal maupun eksternal, baik secara online real-time maupun sebagai antrean batch. Setiap baris di bawah ini adalah satu baris tabel transaksi."
                actions={
                    <>
                        {batchPendingCount > 0 && (
                            <Stamp variant="secondary" onClick={processBatch} disabled={busyBatch}>
                                <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
                                {busyBatch
                                    ? 'Memproses antrean…'
                                    : `Proses antrean batch (${count(batchPendingCount)})`}
                            </Stamp>
                        )}

                        <Stamp onClick={() => setOpenForm(true)}>
                            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                            Input transaksi
                        </Stamp>
                    </>
                }
            />

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                {/* ── Register figures, read from the transactions table ────── */}
                <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                    <Readout
                        tone="plot"
                        label="Nilai transaksi terproses"
                        value={
                            <>
                                <span className="text-[11px] text-chalk-2">$</span>{' '}
                                {dollars(totalAmount)}
                            </>
                        }
                    />
                    <Readout tone="plot" label="Transaksi online" value={count(onlineCount)} />
                    <Readout tone="plot" label="Antrean batch" value={count(batchPendingCount)} />
                    <Readout tone="plot" label="Baris pada register" value={count(total)} />
                </dl>

                {/* ── The six stages, in the order the system runs them ─────── */}
                <section className="mt-8">
                    <SectionHead title="Enam tahap pemrosesan transaksi" meta="Berurutan" />

                    <ol className="mt-4 grid gap-px border border-line-2 bg-line sm:grid-cols-3 lg:grid-cols-6">
                        {STEPS.map((step, index) => (
                            <li key={step.name} className="bg-plot-2 px-3 py-3">
                                <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                    Langkah {index + 1}
                                </span>
                                <span className="mt-1 block font-display text-[12px] font-semibold uppercase leading-tight tracking-[0.02em] text-chalk">
                                    {step.name}
                                </span>
                                <span className="mt-1 block font-mono text-[10px] text-chalk-2">
                                    {step.note}
                                </span>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* ── The ledger itself ─────────────────────────────────────── */}
                <section className="mt-8">
                    <SectionHead
                        drawn
                        title="Register transaksi"
                        meta={`${count(total)} baris · halaman ${count(currentPage)} dari ${count(lastPage)}`}
                    />

                    {/* One ruled strip: search, type, mode, apply. */}
                    <form
                        method="get"
                        action="/tps"
                        onSubmit={applyFilters}
                        className="mt-4 grid gap-px border border-line-2 bg-line sm:grid-cols-2 lg:grid-cols-12"
                    >
                        <div className="bg-plot px-3 py-3 lg:col-span-5">
                            <label
                                htmlFor="tps-search"
                                className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2"
                            >
                                Cari transaksi
                            </label>
                            <div className="relative">
                                <Search
                                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-chalk-2"
                                    strokeWidth={1.5}
                                />
                                <Field
                                    id="tps-search"
                                    name="search"
                                    type="search"
                                    value={draft.search}
                                    onChange={(event) =>
                                        setDraft((current) => ({ ...current, search: event.target.value }))
                                    }
                                    placeholder="Kode, entitas, kategori, atau nomor dokumen"
                                    className="pl-9 text-[12px]"
                                />
                            </div>
                        </div>

                        <div className="bg-plot px-3 py-3 lg:col-span-3">
                            <label
                                htmlFor="tps-type"
                                className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2"
                            >
                                Tipe transaksi
                            </label>
                            <Select
                                id="tps-type"
                                name="type"
                                value={draft.type}
                                onChange={(event) =>
                                    setDraft((current) => ({ ...current, type: event.target.value }))
                                }
                                className="text-[12px]"
                            >
                                <option value="">Semua tipe</option>
                                <option value="internal">Internal</option>
                                <option value="external">Eksternal</option>
                            </Select>
                        </div>

                        <div className="bg-plot px-3 py-3 lg:col-span-2">
                            <label
                                htmlFor="tps-mode"
                                className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2"
                            >
                                Mode
                            </label>
                            <Select
                                id="tps-mode"
                                name="mode"
                                value={draft.mode}
                                onChange={(event) =>
                                    setDraft((current) => ({ ...current, mode: event.target.value }))
                                }
                                className="text-[12px]"
                            >
                                <option value="">Semua mode</option>
                                <option value="online">Online</option>
                                <option value="batch">Batch</option>
                            </Select>
                        </div>

                        <div className="flex items-end gap-2 bg-plot px-3 py-3 lg:col-span-2">
                            <Stamp type="submit" variant="secondary" className="flex-1">
                                Cari
                            </Stamp>

                            {filtersActive && (
                                <Stamp
                                    as={Link}
                                    href="/tps"
                                    variant="destructive-quiet"
                                    size="sm"
                                    className="flex-none"
                                    aria-label="Bersihkan saringan"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                                    Bersihkan
                                </Stamp>
                            )}
                        </div>
                    </form>

                    {rows.length > 0 ? (
                        <>
                            <div className="register mt-4 overflow-x-auto">
                                <table className="data-table min-w-[900px]">
                                    <caption className="sr-only">
                                        Register transaksi: kode, tipe dan dokumen sumber, entitas, kategori,
                                        nominal, mode, status, dan dokumen.
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
                                                Kode transaksi
                                            </th>
                                            <th scope="col">
                                                <span
                                                    className="block font-mono text-[8px] font-normal text-chalk-2"
                                                    aria-hidden="true"
                                                >
                                                    2
                                                </span>
                                                Tipe & sumber
                                            </th>
                                            <th scope="col">
                                                <span
                                                    className="block font-mono text-[8px] font-normal text-chalk-2"
                                                    aria-hidden="true"
                                                >
                                                    3
                                                </span>
                                                Entitas / pihak
                                            </th>
                                            <th scope="col">
                                                <span
                                                    className="block font-mono text-[8px] font-normal text-chalk-2"
                                                    aria-hidden="true"
                                                >
                                                    4
                                                </span>
                                                Kategori
                                            </th>
                                            <th scope="col" className="text-right">
                                                <span
                                                    className="block font-mono text-[8px] font-normal text-chalk-2"
                                                    aria-hidden="true"
                                                >
                                                    5
                                                </span>
                                                Nominal
                                            </th>
                                            <th scope="col">
                                                <span
                                                    className="block font-mono text-[8px] font-normal text-chalk-2"
                                                    aria-hidden="true"
                                                >
                                                    6
                                                </span>
                                                Mode
                                            </th>
                                            <th scope="col">
                                                <span
                                                    className="block font-mono text-[8px] font-normal text-chalk-2"
                                                    aria-hidden="true"
                                                >
                                                    7
                                                </span>
                                                Status
                                            </th>
                                            <th scope="col" className="text-right">
                                                <span
                                                    className="block font-mono text-[8px] font-normal text-chalk-2"
                                                    aria-hidden="true"
                                                >
                                                    8
                                                </span>
                                                Dokumen
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((trx) => (
                                            <tr key={trx.id}>
                                                <td>
                                                    <span className="block font-mono text-[12px] font-medium text-chalk">
                                                        {trx.code}
                                                    </span>
                                                    <span className="mt-0.5 block font-mono text-[10px] text-chalk-2">
                                                        {eventStamp(trx.created_at)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-chalk">
                                                        {trx.type === 'internal'
                                                            ? 'Internal'
                                                            : 'Eksternal'}
                                                    </span>
                                                    <span className="mt-0.5 block font-mono text-[10px] text-chalk-2">
                                                        {trx.source_document || '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="block text-[13px] font-medium text-chalk">
                                                        {trx.party_name}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="block text-[12px] text-chalk-2">
                                                        {trx.category}
                                                    </span>
                                                </td>
                                                <td className="num text-chalk">
                                                    <span className="text-[11px] text-chalk-2">$</span>{' '}
                                                    {dollars(trx.amount)}
                                                </td>
                                                <td>
                                                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-2">
                                                        {trx.mode === 'online' ? 'Online' : 'Batch'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <StatusLamp state={txState(trx.status)} />
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedTrx(trx)}
                                                        aria-label={`Buka dokumen transaksi ${trx.code}`}
                                                        className="inline-flex items-center gap-1.5 border border-line-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-2 transition-colors hover:border-chalk-2 hover:text-chalk"
                                                    >
                                                        <FileText
                                                            className="h-3.5 w-3.5"
                                                            strokeWidth={1.5}
                                                        />
                                                        Dokumen
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {lastPage > 1 && (
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                        Menampilkan {count(transactions?.from || 0)}–
                                        {count(transactions?.to || 0)} dari {count(total)} baris
                                    </span>

                                    <Pager paginator={transactions} />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="mt-4">
                            {filtersActive ? (
                                <EmptyState
                                    title="Tidak ada baris yang cocok"
                                    description="Register tidak memuat transaksi untuk kombinasi pencarian dan saringan ini. Longgarkan salah satu saringan, atau kosongkan pencarian."
                                    action={
                                        <Link href="/tps" className="stamp-2">
                                            Bersihkan saringan
                                        </Link>
                                    }
                                />
                            ) : (
                                <EmptyState
                                    title="Register transaksi masih kosong"
                                    description="Belum ada satu baris pun yang tercatat. Catat transaksi pertama lewat tombol Input transaksi pada lembar ini."
                                    action={<Stamp onClick={() => setOpenForm(true)}>Input transaksi</Stamp>}
                                />
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* ── Output generation, and data entry ────────────────────────── */}
            {selectedTrx && <DocumentPlate trx={selectedTrx} onClose={closeDoc} />}
            {openForm && <NewTransactionPlate onClose={closeForm} />}
        </ModuleLayout>
    );
}
