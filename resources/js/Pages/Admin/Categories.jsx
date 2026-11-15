import React, { useEffect, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageBand, SectionHead } from '@/Components/Sheet';
import { EmptyState, Field, LabelledField, Lamp, Stamp } from '@/Components/Controls';
import { groupCode } from '@/lib/catalog';
import { count } from '@/lib/format';
import { notifyError } from '@/lib/notify';

/**
 * Sheet 03 — the groups. A short sheet: one form that writes a group and one
 * register that reads them back with the number of positions each one holds. The
 * group is not decoration; its three-letter code is the code inside every part
 * number on sheet 02, so the register prints it.
 */

/**
 * The controller validates with the app's English message catalogue, so each
 * field states the rules it is actually held to, in the console's language.
 */
const FIELD_RULES = {
    name: 'Nama kelompok wajib diisi, maksimal 100 karakter, dan tidak boleh sama dengan kelompok yang sudah ada. Perbaiki namanya, lalu simpan lagi.',
    description: 'Keterangan tidak dapat disimpan. Perpendek keterangannya, lalu simpan lagi.',
};

export default function Categories({ categories = [] }) {
    const { props } = usePage();
    const pageErrors = props.errors;

    const rows = categories || [];
    const positions = rows.reduce((sum, category) => sum + (Number(category.products_count) || 0), 0);

    const [form, setForm] = useState({ name: '', description: '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const panelRef = useRef(null);
    const confirmRowRef = useRef(null);

    const errorKeys = Object.keys(errors).join(',');

    useEffect(() => {
        setErrors(pageErrors || {});
    }, [pageErrors]);

    // A rejection lands the operator on the field that has to change.
    useEffect(() => {
        if (!errorKeys) {
            return;
        }
        const first = errorKeys.split(',')[0];
        const field = panelRef.current?.querySelector(`[name="${first}"]`);
        if (field) {
            field.scrollIntoView({ block: 'center' });
            field.focus({ preventScroll: true });
        }
    }, [errorKeys]);

    // A confirmation is a decision: it opens with the keyboard on it.
    useEffect(() => {
        if (deleting === null) {
            return;
        }
        confirmRowRef.current?.querySelector('[data-confirm-delete]')?.focus();
    }, [deleting]);

    const fieldError = (key) =>
        errors[key] ? FIELD_RULES[key] || 'Isian ini ditolak. Perbaiki nilainya, lalu simpan lagi.' : null;

    const setField = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

    const focusForm = () => {
        panelRef.current?.scrollIntoView({ block: 'start' });
        panelRef.current?.querySelector('[name="name"]')?.focus({ preventScroll: true });
    };

    const submit = (event) => {
        event.preventDefault();
        if (busy) {
            return;
        }

        setBusy(true);
        router.post(
            '/admin/categories/store',
            { name: form.name, description: form.description },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setForm({ name: '', description: '' }),
                onError: () =>
                    notifyError(
                        'Kelompok ditolak',
                        'Kolom bertanda merah belum benar. Perbaiki kolom itu, lalu simpan lagi.',
                    ),
                onFinish: () => setBusy(false),
            },
        );
    };

    const remove = (category) => {
        setBusyId(category.id);
        router.delete(`/admin/categories/${category.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
            onError: () =>
                notifyError(
                    'Kelompok tidak terhapus',
                    `Kelompok ${category.name} masih tercatat. Muat ulang lembar ini, lalu coba lagi.`,
                ),
            onFinish: () => setBusyId(null),
        });
    };

    return (
        <AdminLayout sheet="03 · Kelompok produk">
            <Head title="Kelompok produk — Kendali RAKIT" />

            <PageBand
                tone="plot"
                path={[{ label: 'Kendali', href: '/admin' }, { label: 'Lembar 03' }]}
                title="Kelompok produk"
                meta="Kelompok menentukan kode tiga huruf yang dipakai pada nomor bagian setiap posisi di lembar 02. Satu posisi hanya berada di dalam satu kelompok, dan menghapus kelompok ikut menghapus posisi yang berada di dalamnya."
                actions={
                    <Stamp variant="secondary" onClick={focusForm}>
                        Kelompok baru
                    </Stamp>
                }
            />

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                    {/* ── The form: a ruled panel, not a window ────────── */}
                    <section
                        ref={panelRef}
                        aria-labelledby="panel-kelompok"
                        className="scroll-mt-28 self-start border border-line-2 bg-plot-2 lg:col-span-4"
                    >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line-2 px-4 py-3">
                            <h2
                                id="panel-kelompok"
                                className="font-display text-[15px] font-bold uppercase tracking-[0.06em] text-chalk"
                            >
                                Kelompok baru
                            </h2>
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                Tabel categories
                            </span>
                        </div>

                        <form onSubmit={submit} noValidate className="space-y-4 px-4 py-5">
                            <LabelledField
                                label="Nama kelompok *"
                                hint="Maksimal 100 karakter, dan tidak boleh sama dengan kelompok yang sudah ada."
                                error={fieldError('name')}
                            >
                                <Field
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={setField('name')}
                                    autoComplete="off"
                                    placeholder="Contoh: Monitor"
                                    aria-invalid={errors.name ? true : undefined}
                                />
                            </LabelledField>

                            <p className="text-[11px] leading-relaxed text-chalk-2">
                                Nama ini juga menjadi slug kelompok. Nama yang hanya berbeda tanda baca dari
                                kelompok lain akan ditolak basis data.
                            </p>

                            <LabelledField
                                label="Keterangan"
                                hint="Opsional. Dibaca pada kolom keterangan di register lembar ini."
                                error={fieldError('description')}
                            >
                                <textarea
                                    name="description"
                                    rows={3}
                                    value={form.description}
                                    onChange={setField('description')}
                                    placeholder="Apa yang masuk ke dalam kelompok ini."
                                    aria-invalid={errors.description ? true : undefined}
                                    className="field leading-relaxed"
                                />
                            </LabelledField>

                            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                                <Stamp type="submit" disabled={busy}>
                                    {busy ? 'Menyimpan…' : 'Simpan kelompok baru'}
                                </Stamp>
                                <Stamp
                                    variant="secondary"
                                    onClick={() => setForm({ name: '', description: '' })}
                                    disabled={busy}
                                >
                                    Kosongkan isian
                                </Stamp>
                            </div>
                        </form>
                    </section>

                    {/* ── The register ─────────────────────────────────── */}
                    <section className="lg:col-span-8">
                        <SectionHead
                            title="Kelompok tercatat"
                            meta={`${count(rows.length)} kelompok · ${count(positions)} posisi`}
                        />

                        {rows.length > 0 ? (
                            <div className="register mt-4 overflow-x-auto">
                                <table className="data-table min-w-[780px]">
                                    <caption className="sr-only">
                                        Kelompok produk beserta kode bagian, slug, jumlah posisi, dan porsi
                                        terhadap seluruh katalog.
                                    </caption>
                                    <thead>
                                        <tr>
                                            <th scope="col">Kode</th>
                                            <th scope="col">Kelompok</th>
                                            <th scope="col">Slug</th>
                                            <th scope="col" className="text-right">
                                                Posisi
                                            </th>
                                            <th scope="col">Porsi katalog</th>
                                            <th scope="col" className="text-right">
                                                Tindakan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((category) => {
                                            const categoryPositions = Number(category.products_count) || 0;
                                            const share = positions
                                                ? Math.round((categoryPositions / positions) * 100)
                                                : 0;
                                            const confirming = deleting === category.id;

                                            return (
                                                <React.Fragment key={category.id}>
                                                    <tr>
                                                        <td>
                                                            <span className="part-no text-chalk">
                                                                {groupCode(category.name)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="text-[13px] text-chalk">
                                                                {category.name}
                                                            </span>
                                                            {category.description && (
                                                                <span
                                                                    title={category.description}
                                                                    className="mt-0.5 block max-w-[42ch] truncate text-[11px] text-chalk-2"
                                                                >
                                                                    {category.description}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="part-no">{category.slug}</span>
                                                        </td>
                                                        <td className="num text-chalk">
                                                            {count(categoryPositions)}
                                                        </td>
                                                        <td className="w-[26%]">
                                                            <span className="flex items-center gap-3">
                                                                <span className="relative block h-3 min-w-[40px] flex-1">
                                                                    <span
                                                                        className="absolute inset-x-0 bottom-0 block h-px bg-line-2"
                                                                        aria-hidden="true"
                                                                    />
                                                                    <span
                                                                        className="absolute bottom-0 left-0 block h-3 bg-lit"
                                                                        style={{
                                                                            width: `${share ? Math.max(share, 2) : 0}%`,
                                                                        }}
                                                                        aria-hidden="true"
                                                                    />
                                                                </span>
                                                                <span className="num w-10 text-chalk-2">
                                                                    {share}%
                                                                </span>
                                                            </span>
                                                        </td>
                                                        <td className="text-right">
                                                            <Stamp
                                                                size="sm"
                                                                variant="destructive-quiet"
                                                                onClick={() => setDeleting(category.id)}
                                                                aria-label={`Hapus kelompok ${category.name}`}
                                                            >
                                                                Hapus
                                                            </Stamp>
                                                        </td>
                                                    </tr>

                                                    {confirming && (
                                                        <tr ref={confirmRowRef}>
                                                            <td colSpan={6} className="p-0">
                                                                <div
                                                                    onKeyDown={(event) => {
                                                                        if (event.key === 'Escape') {
                                                                            setDeleting(null);
                                                                        }
                                                                    }}
                                                                    className="m-3 border border-red px-4 py-3"
                                                                >
                                                                    <p className="text-[12px] leading-relaxed text-chalk">
                                                                        Hapus kelompok “{category.name}”
                                                                        {categoryPositions > 0
                                                                            ? ` beserta ${count(categoryPositions)} posisi di dalamnya?`
                                                                            : '?'}
                                                                    </p>
                                                                    <p className="mt-1 max-w-[70ch] text-[11px] leading-relaxed text-chalk-2">
                                                                        {categoryPositions > 0
                                                                            ? 'Basis data menghapus posisi satu kelompok sekaligus, termasuk tautannya dari tas belanja. Tindakan ini tidak dapat dibatalkan.'
                                                                            : 'Kelompok ini tidak berisi posisi. Tindakan ini tidak dapat dibatalkan.'}
                                                                    </p>
                                                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                                                        <Stamp
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            data-confirm-delete
                                                                            onClick={() => remove(category)}
                                                                            disabled={busyId === category.id}
                                                                        >
                                                                            {busyId === category.id
                                                                                ? 'Menghapus…'
                                                                                : 'Hapus kelompok'}
                                                                        </Stamp>
                                                                        <Stamp
                                                                            size="sm"
                                                                            variant="secondary"
                                                                            onClick={() => setDeleting(null)}
                                                                        >
                                                                            Batalkan penghapusan
                                                                        </Stamp>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="mt-4">
                                <EmptyState
                                    title="Belum ada kelompok"
                                    description="Tabel categories masih kosong, jadi belum ada posisi yang bisa dicatat di lembar 02. Catat kelompok pertama pada formulir di lembar ini."
                                    action={<Stamp onClick={focusForm}>Catat kelompok pertama</Stamp>}
                                />
                            </div>
                        )}

                        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                            <Lamp tone="lit" state="lit" />
                            Kelompok tanpa posisi tetap tercatat di sini; nomor bagian baru berlaku untuk posisi yang
                            sudah ditulis di lembar 02.
                        </p>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
