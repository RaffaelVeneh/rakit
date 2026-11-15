import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageBand, SectionHead } from '@/Components/Sheet';
import {
    EmptyState,
    Field,
    LabelledField,
    Lamp,
    Pager,
    Select,
    Stamp,
    StatusLamp,
    Tag,
} from '@/Components/Controls';
import { RegisterPlates } from '@/Components/Register';
import { partNo, position, stockState } from '@/lib/catalog';
import { amount, count } from '@/lib/format';
import { notifyError } from '@/lib/notify';

/**
 * Sheet 02 — the catalogue as a working register: the filters are a ruled strip,
 * the positions are a bill of materials, and the form is a panel drawn on the
 * same sheet instead of a window floating above it. Everything printed here is
 * read from the paginator the controller handed over; the sheet invents nothing.
 */

/**
 * The controller validates with the app's English message catalogue. Each field
 * therefore states the rules it is held to, in the console's own language, so a
 * rejection always names the problem and the recovery.
 */
const VIEWS = [
    { key: 'plates', label: 'Piringan' },
    { key: 'register', label: 'Register' },
];

const VIEW_KEY = 'rakit-catalogue-view';

const FIELD_RULES = {
    category_id: 'Kelompok belum dipilih, atau kelompok itu tidak ada lagi di daftar. Pilih satu kelompok, lalu simpan lagi.',
    brand_id: 'Merk yang dipilih tidak ada di daftar merk. Pilih merk lain, atau kosongkan kolomnya.',
    name: 'Nama posisi wajib diisi dan maksimal 200 karakter. Perbaiki namanya, lalu simpan lagi.',
    price: 'Harga wajib diisi, harus berupa angka, dan tidak boleh negatif. Contoh: 15000000.',
    stock: 'Stok wajib diisi, harus berupa bilangan bulat, dan tidak boleh negatif. Contoh: 25.',
    image: 'Alamat gambar harus berupa URL lengkap yang diawali https://. Perbaiki alamatnya, atau kosongkan kolomnya.',
    description: 'Keterangan tidak dapat disimpan. Perpendek keterangannya, lalu simpan lagi.',
    is_featured: 'Tanda unggulan tidak terbaca. Muat ulang lembar ini, lalu simpan lagi.',
};

export default function Products({ products = {}, categories = [], brands = [], currentBrand = null }) {
    const { url = '', props } = usePage();
    const pageErrors = props.errors;

    const query = new URLSearchParams(String(url).split('?')[1] || '');
    const currentCategory = query.get('category') || '';
    const currentSearch = query.get('search') || '';
    const activeBrand = currentBrand === null || currentBrand === undefined ? '' : String(currentBrand);

    const rows = products?.data || [];
    const total = Number(products?.total || 0);
    const from = Number(products?.from || 0);
    const to = Number(products?.to || 0);
    const firstPage = Number(products?.current_page || 1);
    const lastPage = Number(products?.last_page || 1);
    const filtersActive = Boolean(currentSearch || currentCategory || activeBrand);

    const emptyForm = () => ({
        category_id: categories?.[0]?.id ? String(categories[0].id) : '',
        brand_id: '',
        name: '',
        price: '',
        stock: '',
        image: '',
        description: '',
        is_featured: false,
    });

    const [searchDraft, setSearchDraft] = useState(currentSearch);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState(emptyForm);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [busy, setBusy] = useState(false);
    const [busyId, setBusyId] = useState(null);

    /*
     * Which shape the catalogue is drawn in.
     *
     * Plates by default, and remembered. This is a reading preference in the same
     * sense the temperature is, so it is stored the same way — and read inside a
     * try, because storage throws in private mode and a view preference is not
     * worth an exception.
     */
    const [view, setView] = useState(() => {
        try {
            return window.localStorage.getItem(VIEW_KEY) === 'register' ? 'register' : 'plates';
        } catch (error) {
            return 'plates';
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(VIEW_KEY, view);
        } catch (error) {
            /* Storage unavailable: the choice does not outlive the visit. */
        }
    }, [view]);

    const panelRef = useRef(null);
    const confirmRowRef = useRef(null);

    const errorKeys = Object.keys(errors).join(',');

    // The address bar is the record of what is being shown; the strip follows it.
    useEffect(() => {
        setSearchDraft(currentSearch);
    }, [currentSearch]);

    useEffect(() => {
        setErrors(pageErrors || {});
    }, [pageErrors]);

    // A rejection lands the operator on the first field that has to change.
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

    const buildQuery = (overrides = {}) => {
        const next = {
            search: currentSearch,
            category: currentCategory,
            brand: activeBrand,
            ...overrides,
        };
        const params = {};
        Object.entries(next).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params[key] = value;
            }
        });
        return params;
    };

    const applyFilters = (overrides = {}) => {
        router.get('/admin/products', buildQuery(overrides), { preserveScroll: true });
    };

    const buildHref = (overrides = {}) => {
        const params = new URLSearchParams(buildQuery(overrides)).toString();
        return params ? `/admin/products?${params}` : '/admin/products';
    };

    const setField = (key) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setForm((current) => ({ ...current, [key]: value }));
    };

    const fieldError = (key) =>
        errors[key] ? FIELD_RULES[key] || 'Isian ini ditolak. Perbaiki nilainya, lalu simpan lagi.' : null;

    const openPanel = (fieldName) => {
        panelRef.current?.scrollIntoView({ block: 'start' });
        panelRef.current?.querySelector(`[name="${fieldName}"]`)?.focus({ preventScroll: true });
    };

    const startCreate = () => {
        setDeleting(null);
        setEditing(null);
        setErrors({});
        setForm(emptyForm());
        openPanel('name');
    };

    const startEdit = (product) => {
        setDeleting(null);
        setEditing(product);
        setErrors({});
        setForm({
            category_id: product.category_id
                ? String(product.category_id)
                : categories?.[0]?.id
                  ? String(categories[0].id)
                  : '',
            brand_id: product.brand_id ? String(product.brand_id) : '',
            name: product.name || '',
            price: product.price ?? '',
            stock: product.stock ?? '',
            image: product.image || '',
            description: product.description || '',
            is_featured: Boolean(product.is_featured),
        });
        openPanel('name');
    };

    const submit = (event) => {
        event.preventDefault();
        if (busy) {
            return;
        }

        const payload = {
            category_id: form.category_id,
            brand_id: form.brand_id,
            name: form.name,
            price: form.price,
            stock: form.stock,
            image: form.image,
            description: form.description,
        };

        // An unchecked box posts nothing at all, which is what the controller reads.
        if (form.is_featured) {
            payload.is_featured = true;
        }

        const options = {
            preserveScroll: true,
            preserveState: true,
            onError: () =>
                notifyError(
                    'Isian ditolak',
                    'Kolom bertanda merah belum benar. Perbaiki kolom itu, lalu simpan lagi.',
                ),
            onFinish: () => setBusy(false),
        };

        setBusy(true);

        if (editing) {
            router.put(`/admin/products/${editing.id}`, payload, {
                ...options,
                onSuccess: () => {
                    setEditing(null);
                    setForm(emptyForm());
                },
            });
            return;
        }

        router.post('/admin/products/store', payload, {
            ...options,
            onSuccess: () => setForm(emptyForm()),
        });
    };

    const remove = (product) => {
        setBusyId(product.id);
        router.delete(`/admin/products/${product.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
            onError: () =>
                notifyError(
                    'Posisi tidak terhapus',
                    `${partNo(product)} masih tercatat di register. Muat ulang lembar ini, lalu coba lagi.`,
                ),
            onFinish: () => setBusyId(null),
        });
    };

    return (
        <AdminLayout sheet="02 · Katalog produk">
            <Head title="Katalog produk — Kendali RAKIT" />

            <PageBand
                tone="plot"
                path={[{ label: 'Kendali', href: '/admin' }, { label: 'Lembar 02' }]}
                title="Katalog produk"
                meta="Setiap posisi di lembar ini adalah satu baris tabel products beserta kelompok dan merknya. Saringan dibaca dari alamat halaman, daftar dibaca dari basis data, dan formulir di bawah menulis kembali ke baris yang sama."
                actions={
                    <Stamp variant="secondary" onClick={startCreate}>
                        Tambah posisi
                    </Stamp>
                }
            />

            <div className="mx-auto max-w-[1400px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
                {/* ── The form: a ruled panel on the sheet, not a window ── */}
                <section
                    ref={panelRef}
                    aria-labelledby="panel-posisi"
                    className="scroll-mt-28 border border-line-2 bg-plot-2"
                >
                    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line-2 px-4 py-3">
                        <h2
                            id="panel-posisi"
                            className="font-display text-[15px] font-bold uppercase tracking-[0.06em] text-chalk"
                        >
                            {editing ? 'Ubah posisi' : 'Posisi baru'}
                        </h2>

                        {editing ? (
                            <span className="flex flex-wrap items-center gap-3">
                                <Lamp tone="lit" state="lit" />
                                <span className="part-no text-chalk">{partNo(editing)}</span>
                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                    {position(editing)} · {editing.name}
                                </span>
                            </span>
                        ) : (
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                Belum tercatat di register
                            </span>
                        )}
                    </div>

                    <form onSubmit={submit} noValidate className="space-y-5 px-4 py-5">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="sm:col-span-2">
                                <LabelledField
                                    label="Nama posisi *"
                                    hint="Dibaca pada register toko. Maksimal 200 karakter."
                                    error={fieldError('name')}
                                >
                                    <Field
                                        name="name"
                                        type="text"
                                        value={form.name}
                                        onChange={setField('name')}
                                        autoComplete="off"
                                        placeholder="Contoh: MacBook Pro 16 M3 Max"
                                        aria-invalid={errors.name ? true : undefined}
                                    />
                                </LabelledField>
                            </div>

                            <LabelledField
                                label="Kelompok *"
                                hint="Satu posisi hanya berada di dalam satu kelompok."
                                error={fieldError('category_id')}
                            >
                                <Select
                                    name="category_id"
                                    value={form.category_id}
                                    onChange={setField('category_id')}
                                    aria-invalid={errors.category_id ? true : undefined}
                                >
                                    {categories.length === 0 && <option value="">Belum ada kelompok</option>}
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </Select>
                            </LabelledField>

                            <LabelledField
                                label="Merk"
                                hint="Opsional. Kosongkan bila posisi tidak bermerk."
                                error={fieldError('brand_id')}
                            >
                                <Select
                                    name="brand_id"
                                    value={form.brand_id}
                                    onChange={setField('brand_id')}
                                    aria-invalid={errors.brand_id ? true : undefined}
                                >
                                    <option value="">Tanpa merk</option>
                                    {brands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </Select>
                            </LabelledField>

                            <LabelledField
                                label="Harga satuan (Rp) *"
                                hint="Angka penuh tanpa titik atau simbol. Contoh: 15000000."
                                error={fieldError('price')}
                            >
                                <Field
                                    measure
                                    name="price"
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    step="any"
                                    value={form.price}
                                    onChange={setField('price')}
                                    placeholder="15000000"
                                    aria-invalid={errors.price ? true : undefined}
                                />
                            </LabelledField>

                            <LabelledField
                                label="Jumlah stok *"
                                hint="Bilangan bulat. Stok 0 membuat posisi berstatus HABIS di toko."
                                error={fieldError('stock')}
                            >
                                <Field
                                    measure
                                    name="stock"
                                    type="number"
                                    inputMode="numeric"
                                    min="0"
                                    step="1"
                                    value={form.stock}
                                    onChange={setField('stock')}
                                    placeholder="25"
                                    aria-invalid={errors.stock ? true : undefined}
                                />
                            </LabelledField>

                            <div className="sm:col-span-2">
                                <LabelledField
                                    label="Alamat gambar"
                                    hint={
                                        editing
                                            ? 'Alamat URL gambar. Kosongkan untuk mempertahankan gambar yang sekarang.'
                                            : 'Alamat URL gambar. Kosongkan untuk memakai gambar bawaan katalog.'
                                    }
                                    error={fieldError('image')}
                                >
                                    <Field
                                        name="image"
                                        type="url"
                                        value={form.image}
                                        onChange={setField('image')}
                                        autoComplete="off"
                                        placeholder="https://"
                                        aria-invalid={errors.image ? true : undefined}
                                    />
                                </LabelledField>
                            </div>

                            <div className="sm:col-span-2">
                                <LabelledField
                                    label="Keterangan"
                                    hint="Opsional. Tampil sebagai uraian posisi di halaman produk toko."
                                    error={fieldError('description')}
                                >
                                    <textarea
                                        name="description"
                                        rows={3}
                                        value={form.description}
                                        onChange={setField('description')}
                                        placeholder="Prosesor, memori, layar, dan kelengkapan posisi ini."
                                        aria-invalid={errors.description ? true : undefined}
                                        className="field leading-relaxed"
                                    />
                                </LabelledField>
                            </div>

                            {/* A ruled row with a lamp, not a card: the flag is a state. */}
                            <div className="flex flex-col justify-end sm:col-span-2">
                                <label className="flex cursor-pointer flex-wrap items-center justify-between gap-x-6 gap-y-3 border border-line-2 bg-plot px-3 py-3">
                                    <span className="flex items-center gap-3">
                                        <input
                                            name="is_featured"
                                            type="checkbox"
                                            checked={form.is_featured}
                                            onChange={setField('is_featured')}
                                            className="h-4 w-4 cursor-pointer"
                                        />
                                        <span className="text-[12px] text-chalk">
                                            Tandai posisi ini sebagai unggulan
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Lamp
                                            tone={form.is_featured ? 'lit' : 'chalk'}
                                            state={form.is_featured ? 'lit' : 'off'}
                                        />
                                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                            {form.is_featured ? 'Unggulan' : 'Reguler'}
                                        </span>
                                    </span>
                                </label>
                                <p className="mt-1 text-[11px] leading-relaxed text-chalk-2">
                                    Posisi unggulan tampil lebih dulu pada urutan Unggulan di toko.
                                </p>
                                {errors.is_featured && (
                                    <p className="mt-1 text-[11px] font-medium text-red">
                                        {fieldError('is_featured')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                            <Stamp type="submit" disabled={busy}>
                                {busy
                                    ? 'Menyimpan…'
                                    : editing
                                      ? 'Simpan perubahan'
                                      : 'Simpan posisi baru'}
                            </Stamp>

                            {editing ? (
                                <Stamp variant="secondary" onClick={startCreate} disabled={busy}>
                                    Batalkan perubahan
                                </Stamp>
                            ) : (
                                <Stamp
                                    variant="secondary"
                                    onClick={() => setForm(emptyForm())}
                                    disabled={busy}
                                >
                                    Kosongkan isian
                                </Stamp>
                            )}

                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                {editing
                                    ? `Menulis ulang ${partNo(editing)}`
                                    : 'Menambah satu baris baru ke tabel products'}
                            </span>
                        </div>
                    </form>
                </section>

                {/* ── The register ─────────────────────────────────────── */}
                <section>
                    <SectionHead
                        title="Register katalog"
                        meta={`${count(total)} posisi · halaman ${count(firstPage)} dari ${count(lastPage)}`}
                        action={
                            filtersActive ? (
                                <Link
                                    href="/admin/products"
                                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-red underline decoration-dotted"
                                >
                                    Bersihkan saringan
                                </Link>
                            ) : null
                        }
                    />

                    {/* One ruled strip: search, group, brand, apply. */}
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            applyFilters({ search: searchDraft.trim() });
                        }}
                        className="mt-4 grid gap-px border border-line-2 bg-line sm:grid-cols-2 lg:grid-cols-12"
                    >
                        <div className="bg-plot-2 px-3 py-3 lg:col-span-4">
                            <label
                                htmlFor="saring-nama"
                                className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2"
                            >
                                Cari nama posisi
                            </label>
                            <Field
                                id="saring-nama"
                                type="search"
                                value={searchDraft}
                                onChange={(event) => setSearchDraft(event.target.value)}
                                placeholder="Contoh: MacBook"
                            />
                        </div>

                        <div className="bg-plot-2 px-3 py-3 lg:col-span-3">
                            <label
                                htmlFor="saring-kelompok"
                                className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2"
                            >
                                Kelompok
                            </label>
                            <Select
                                id="saring-kelompok"
                                value={currentCategory}
                                onChange={(event) => applyFilters({ category: event.target.value })}
                            >
                                <option value="">Semua kelompok ({count(categories.length)})</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="bg-plot-2 px-3 py-3 lg:col-span-3">
                            <label
                                htmlFor="saring-merk"
                                className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2"
                            >
                                Merk
                            </label>
                            <Select
                                id="saring-merk"
                                value={activeBrand}
                                onChange={(event) => applyFilters({ brand: event.target.value })}
                            >
                                <option value="">Semua merk ({count(brands.length)})</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="flex items-end bg-plot-2 px-3 py-3 lg:col-span-2">
                            <Stamp type="submit" variant="secondary" className="w-full">
                                Terapkan saringan
                            </Stamp>
                        </div>
                    </form>

                    {filtersActive && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                Saringan aktif
                            </span>

                            {currentSearch && (
                                <Link
                                    href={buildHref({ search: null })}
                                    aria-label="Hapus saringan pencarian"
                                    className="transition-colors hover:text-chalk"
                                >
                                    <Tag tone="plot" className="hover:border-red hover:text-red">
                                        “{currentSearch}”
                                        <span aria-hidden="true">×</span>
                                    </Tag>
                                </Link>
                            )}

                            {currentCategory && (
                                <Link
                                    href={buildHref({ category: null })}
                                    aria-label="Hapus saringan kelompok"
                                    className="transition-colors hover:text-chalk"
                                >
                                    <Tag tone="plot" className="hover:border-red hover:text-red">
                                        {categories.find(
                                            (category) => String(category.id) === String(currentCategory),
                                        )?.name || `Kelompok #${currentCategory}`}
                                        <span aria-hidden="true">×</span>
                                    </Tag>
                                </Link>
                            )}

                            {activeBrand && (
                                <Link
                                    href={buildHref({ brand: null })}
                                    aria-label="Hapus saringan merk"
                                    className="transition-colors hover:text-chalk"
                                >
                                    <Tag tone="plot" className="hover:border-red hover:text-red">
                                        {brands.find((brand) => String(brand.id) === String(activeBrand))?.name ||
                                            `Merk #${activeBrand}`}
                                        <span aria-hidden="true">×</span>
                                    </Tag>
                                </Link>
                            )}
                        </div>
                    )}

                    {rows.length > 0 ? (
                        <>
                            {/* ── How the catalogue is drawn ─────────────────────
                                Plates are the default: most visits to a catalogue
                                are spent finding a thing, and a thing is easier to
                                find by its face than by its row. The register stays
                                one press away for the visits spent comparing figures
                                down a column, which is the one job a plate is worse
                                at. The choice is remembered — an operator who reads
                                columns all day should not have to re-choose. */}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border border-line-2 bg-plot-2 px-3 py-2">
                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-3">
                                    Tampilan katalog
                                </span>
                                <div className="flex items-center gap-px border border-line-2">
                                    {VIEWS.map((option) => (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => setView(option.key)}
                                            aria-pressed={view === option.key}
                                            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                                                view === option.key
                                                    ? 'bg-lit text-plot'
                                                    : 'text-chalk-2 hover:bg-plot-3 hover:text-chalk'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {view === 'plates' ? (
                                <RegisterPlates
                                    className="mt-3"
                                    products={rows}
                                    confirmingId={deleting}
                                    onCancelConfirm={() => setDeleting(null)}
                                    confirm={(product, close) => (
                                        <>
                                            <span className="part-no text-ink">{partNo(product)}</span>
                                            <p className="mt-2 text-[12px] leading-relaxed text-ink">
                                                Hapus “{product.name}” dari katalog?
                                            </p>
                                            <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                                                Posisi ini juga hilang dari tas belanja yang belum dipesan. Baris
                                                pesanan lama tetap tersimpan tanpa tautan ke posisi ini. Tidak dapat
                                                dibatalkan.
                                            </p>
                                            <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                                                <Stamp
                                                    size="sm"
                                                    variant="destructive"
                                                    data-confirm-delete
                                                    onClick={() => remove(product)}
                                                    disabled={busyId === product.id}
                                                >
                                                    {busyId === product.id ? 'Menghapus…' : 'Hapus produk'}
                                                </Stamp>
                                                <Stamp size="sm" variant="secondary" onClick={close}>
                                                    Batal
                                                </Stamp>
                                            </div>
                                        </>
                                    )}
                                    action={(product) => (
                                        <div className="flex items-center gap-2">
                                            <Stamp
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => startEdit(product)}
                                                aria-label={`Ubah ${product.name}`}
                                            >
                                                Ubah
                                            </Stamp>
                                            <Stamp
                                                size="sm"
                                                variant="destructive-quiet"
                                                onClick={() => setDeleting(product.id)}
                                                aria-label={`Hapus ${product.name}`}
                                            >
                                                Hapus
                                            </Stamp>
                                        </div>
                                    )}
                                />
                            ) : (
                            <div className="register overflow-x-auto border border-t-0 border-line-2">
                                <table className="data-table min-w-[960px]">
                                    <caption className="sr-only">
                                        Register katalog: posisi, nomor bagian, penamaan, kelompok, merk, stok,
                                        harga satuan, dan tindakan per baris.
                                    </caption>
                                    <thead>
                                        <tr>
                                            <th scope="col">Pos</th>
                                            <th scope="col">Part No</th>
                                            <th scope="col">Penamaan</th>
                                            <th scope="col">Kelompok</th>
                                            <th scope="col">Merk</th>
                                            <th scope="col">Stok</th>
                                            <th scope="col" className="text-right">
                                                Harga satuan
                                            </th>
                                            <th scope="col" className="text-right">
                                                Tindakan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((product) => {
                                            const open = editing?.id === product.id;
                                            const confirming = deleting === product.id;

                                            return (
                                                <React.Fragment key={product.id}>
                                                    <tr className={open ? 'bg-plot-3' : undefined}>
                                                        <td>
                                                            <span className="part-no text-chalk-2">
                                                                {position(product)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="part-no">{partNo(product)}</span>
                                                        </td>
                                                        <td>
                                                            <Link
                                                                href={`/product/${product.slug}`}
                                                                className="text-[13px] text-chalk transition-colors hover:text-lit"
                                                            >
                                                                {product.name}
                                                            </Link>
                                                            {product.description && (
                                                                <span
                                                                    title={product.description}
                                                                    className="mt-0.5 block max-w-[46ch] truncate text-[11px] text-chalk-2"
                                                                >
                                                                    {product.description}
                                                                </span>
                                                            )}
                                                            {Boolean(product.is_featured) && (
                                                                <span className="mt-1 flex items-center gap-2">
                                                                    <Lamp tone="lit" state="lit" />
                                                                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                                                        Unggulan
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="text-[12px] text-chalk-2">
                                                                {product.category?.name || '—'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="text-[12px] text-chalk-2">
                                                                {product.brand?.name || '—'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <StatusLamp state={stockState(product.stock)} />
                                                        </td>
                                                        <td className="num text-chalk">
                                                            <span className="text-[11px] text-chalk-2">Rp</span>{' '}
                                                            {amount(product.price)}
                                                        </td>
                                                        <td className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Stamp
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    onClick={() => startEdit(product)}
                                                                    aria-label={`Ubah ${product.name}`}
                                                                >
                                                                    Ubah
                                                                </Stamp>
                                                                <Stamp
                                                                    size="sm"
                                                                    variant="destructive-quiet"
                                                                    onClick={() => setDeleting(product.id)}
                                                                    aria-label={`Hapus ${product.name}`}
                                                                >
                                                                    Hapus
                                                                </Stamp>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {confirming && (
                                                        <tr ref={confirmRowRef}>
                                                            <td colSpan={8} className="p-0">
                                                                <div
                                                                    onKeyDown={(event) => {
                                                                        if (event.key === 'Escape') {
                                                                            setDeleting(null);
                                                                        }
                                                                    }}
                                                                    className="m-3 border border-red px-4 py-3"
                                                                >
                                                                    <p className="text-[12px] leading-relaxed text-chalk">
                                                                        Hapus{' '}
                                                                        <span className="part-no text-chalk">
                                                                            {partNo(product)}
                                                                        </span>{' '}
                                                                        — “{product.name}” dari katalog?
                                                                    </p>
                                                                    <p className="mt-1 max-w-[70ch] text-[11px] leading-relaxed text-chalk-2">
                                                                        Posisi ini juga hilang dari tas belanja
                                                                        yang belum dipesan. Baris pesanan lama tetap
                                                                        tersimpan tanpa tautan ke posisi ini. Tindakan
                                                                        ini tidak dapat dibatalkan.
                                                                    </p>
                                                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                                                        <Stamp
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            data-confirm-delete
                                                                            onClick={() => remove(product)}
                                                                            disabled={busyId === product.id}
                                                                        >
                                                                            {busyId === product.id
                                                                                ? 'Menghapus…'
                                                                                : 'Hapus produk'}
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
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border border-t-0 border-line-2 bg-plot-2 px-4 py-3">
                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                    Menampilkan {count(from)}–{count(to)} dari {count(total)} posisi
                                </span>

                                {lastPage > 1 && <Pager paginator={products} />}
                            </div>
                        </>
                    ) : (
                        <div className="mt-4">
                            {filtersActive ? (
                                <EmptyState
                                    title="Tidak ada posisi yang cocok"
                                    description="Register tidak memuat baris untuk kombinasi saringan ini. Longgarkan salah satu saringan untuk melihat posisi lain."
                                    action={
                                        <Link href="/admin/products" className="stamp-2">
                                            Bersihkan saringan
                                        </Link>
                                    }
                                />
                            ) : (
                                <EmptyState
                                    title="Katalog masih kosong"
                                    description="Tabel products belum berisi satu baris pun. Catat posisi pertama pada formulir di atas lembar ini."
                                    action={
                                        <Stamp onClick={startCreate}>Tambah posisi pertama</Stamp>
                                    }
                                />
                            )}
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
