import React, { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import ShopLayout from '@/Layouts/ShopLayout';
import DrawingTable from '@/Components/DrawingTable';
import NeonHero from '@/Components/NeonHero';
import { Dim, Plate, Readout, SectionHead, TitleBlock, ZoneFrame } from '@/Components/Sheet';
import { Field, Pager, Select, Stamp, StatusLamp, Tag } from '@/Components/Controls';
import { RegisterPlates } from '@/Components/Register';
import { PlatePhoto } from '@/Components/PlatePhoto';
import { partNo, position, stockState } from '@/lib/catalog';
import { amount, count, isoDate, rupiah } from '@/lib/format';

const SORTS = [
    { key: 'latest', label: 'Terbaru' },
    { key: 'price_asc', label: 'Harga naik' },
    { key: 'price_desc', label: 'Harga turun' },
    { key: 'popular', label: 'Unggulan' },
];

const SYSTEM_NOTES = [
    { k: 'Sumber angka', v: 'Tabel products, orders, order_items — MySQL 8' },
    { k: 'Pesanan baru', v: 'Trigger after_orders_insert menulis ke tabel logs' },
    { k: 'Perubahan status', v: 'Trigger after_orders_status_update, hanya saat status berubah' },
    { k: 'Riwayat', v: 'Tabel logs, dibaca konsol kendali sebagai jejak audit' },
    { k: 'Prosedur tersimpan', v: 'getcat(cid) untuk membaca katalog per kelompok' },
];

export default function Index({
    products,
    featuredProducts,
    heroProducts = [],
    heroFiltered = false,
    heroGroup = null,
    categories = [],
    brands = [],
    register = {},
    currentSort = 'latest',
    currentCategory = null,
    currentBrand = null,
    currentSearch = null,
}) {
    // Whether anyone is signed in is a fact about the reader, not about the
    // catalogue, and it decides which of the two add controls is honest to show.
    const { auth } = usePage().props;
    const signedIn = Boolean(auth?.user);

    const [query, setQuery] = useState(currentSearch || '');
    const [busyId, setBusyId] = useState(null);

    const rows = products?.data || [];
    const featured = featuredProducts?.[0] || rows[0] || null;
    // The cover and the drawing table must be showing the same position, or the
    // opening advertises a part the instrument below does not load.
    const opening = heroProducts?.[0] || featured;
    const plates = categories.slice(0, 3);

    const activeCategory = useMemo(
        () => categories.find((category) => String(category.id) === String(currentCategory)) || null,
        [categories, currentCategory],
    );
    const activeBrand = useMemo(
        () => brands.find((brand) => String(brand.slug) === String(currentBrand) || String(brand.id) === String(currentBrand)) || null,
        [brands, currentBrand],
    );

    const filtersActive = Boolean(activeCategory || activeBrand || currentSearch);

    const addToOrder = (product) => {
        setBusyId(product.id);
        router.post(
            '/cart/add',
            { product_id: product.id, quantity: 1 },
            {
                preserveScroll: true,
                // Success and the out-of-stock refusal both come back as a server
                // flash, which the layout reports once. Adding a notice here too
                // would raise two toasts for a single press.
                onFinish: () => setBusyId(null),
            },
        );
    };

    const applyFilters = (overrides = {}) => {
        const next = {
            category: currentCategory,
            brand: currentBrand,
            search: currentSearch,
            sort: currentSort === 'latest' ? null : currentSort,
            ...overrides,
        };
        const params = {};
        Object.entries(next).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params[key] = value;
            }
        });
        router.get('/', params, { preserveScroll: true, preserveState: false });
    };

    const buildHref = (overrides = {}) => {
        const next = {
            category: currentCategory,
            brand: currentBrand,
            search: currentSearch,
            sort: currentSort === 'latest' ? null : currentSort,
            ...overrides,
        };
        const params = new URLSearchParams();
        Object.entries(next).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params.set(key, value);
            }
        });
        const serialised = params.toString();
        return serialised ? `/?${serialised}` : '/';
    };

    return (
        <ShopLayout>
            <Head title="Register katalog — RAKIT" />

            {/* ── The cover ──────────────────────────────────────────────────
                A holographic display case for the featured position, not a
                second hero in the register's own voice. Every figure on the cube
                is read from the row the drawing table loads below it, so the
                opening can shout without claiming anything the data cannot back. */}
            <NeonHero product={opening} register={register} />

            {/* ── The drawing table ─────────────────────────────────────────
                The opening is an instrument: a real position on the sheet, which the
                visitor pans, magnifies, reads fields off, and compares against its
                neighbour. The register below is the same object at full length. */}
            <div id="meja-gambar" className="scroll-mt-16">
                <DrawingTable
                    products={heroProducts.length ? heroProducts : featuredProducts}
                    filtered={heroFiltered}
                    group={heroGroup}
                    signedIn={signedIn}
                />
            </div>

            {/* ── What the register holds, and what it is ──────────────────── */}
            <section className="border-b border-ink bg-sheet-2">
                <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
                        <div className="lg:col-span-4">
                            <TitleBlock
                                cells={[
                                    { label: 'Lembar', value: 'Register / 01' },
                                    { label: 'Revisi', value: isoDate() },
                                    { label: 'Skala', value: '1:1 — IDR' },
                                ]}
                            />
                            <p className="mt-4 max-w-[52ch] text-[12px] leading-relaxed text-ink-2">
                                {count(register.positions || 0)} posisi komponen dan gear, masing-masing dengan
                                nomor bagian, posisi register, jumlah di gudang, dan harga satuan. Semua angka di
                                lembar ini dibaca langsung dari basis data toko.
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <a href="#register" className="stamp-2">
                                    Buka register
                                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                                </a>
                                <a href="#piringan" className="stamp-2">
                                    Lihat piringan
                                </a>
                            </div>
                        </div>

                        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:col-span-8">
                            {/* Every figure here counts up as the strip enters view.
                                The formatter runs at each step, so what is on screen
                                mid-count is a real number in the sheet's notation —
                                never a placeholder rounded off on the way. */}
                            <Readout
                                label="Posisi"
                                count={{ to: register.positions || 0, format: count }}
                            />
                            <Readout
                                label="Kelompok"
                                count={{ to: register.groups || 0, format: count }}
                            />
                            <Readout label="Merk" count={{ to: register.brands || 0, format: count }} />
                            <Readout
                                label="Unit di gudang"
                                count={{ to: register.onHand || 0, format: count }}
                            />
                            <Readout
                                label="Rentang harga"
                                value={`${amount(register.minPrice || 0)} – ${amount(register.maxPrice || 0)}`}
                            />
                            <Readout
                                label="Perlu restock"
                                count={{ to: register.lowStock || 0, format: count }}
                                sub={
                                    register.outOfStock > 0
                                        ? `${count(register.outOfStock)} posisi habis`
                                        : 'Tidak ada posisi habis'
                                }
                            />
                        </dl>
                    </div>
                </div>
            </section>

            {/* ── The register ─────────────────────────────────────────────── */}
            <section id="register" className="scroll-mt-16">
                <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
                    <SectionHead
                        drawn
                        title="Register katalog"
                        meta={
                            filtersActive
                                ? 'Saringan aktif'
                                : `${count(register.positions || 0)} posisi · halaman ${products?.current_page || 1} dari ${products?.last_page || 1}`
                        }
                        action={
                            filtersActive ? (
                                <Link
                                    href="/"
                                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-red underline decoration-dotted"
                                >
                                    Bersihkan saringan
                                </Link>
                            ) : null
                        }
                    />

                    {/* Filter row: one ruled strip, no floating pills */}
                    <form
                        className="mt-4 grid gap-px border border-ink bg-rule sm:grid-cols-2 lg:grid-cols-12"
                        onSubmit={(event) => {
                            event.preventDefault();
                            applyFilters({ search: query.trim() || null });
                        }}
                    >
                        <div className="bg-sheet px-3 py-3 lg:col-span-4">
                            <label
                                htmlFor="register-search"
                                className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3"
                            >
                                Cari
                            </label>
                            <Field
                                id="register-search"
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Nama atau keterangan"
                            />
                        </div>

                        <div className="bg-sheet px-3 py-3 lg:col-span-3">
                            <label
                                htmlFor="register-group"
                                className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3"
                            >
                                Kelompok
                            </label>
                            <Select
                                id="register-group"
                                value={currentCategory || ''}
                                onChange={(event) => applyFilters({ category: event.target.value || null })}
                            >
                                <option value="">Semua kelompok</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name} ({category.products_count})
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="bg-sheet px-3 py-3 lg:col-span-3">
                            <label
                                htmlFor="register-brand"
                                className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3"
                            >
                                Merk
                            </label>
                            <Select
                                id="register-brand"
                                value={currentBrand || ''}
                                onChange={(event) => applyFilters({ brand: event.target.value || null })}
                            >
                                <option value="">Semua merk</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.slug}>
                                        {brand.name} ({brand.products_count})
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="flex items-end bg-sheet px-3 py-3 lg:col-span-2">
                            <Stamp type="submit" variant="secondary" className="w-full">
                                Terapkan
                            </Stamp>
                        </div>
                    </form>

                    {/* Active filters, stated in words */}
                    {filtersActive && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                Saringan
                            </span>
                            {activeCategory && (
                                <Link href={buildHref({ category: null })} aria-label="Hapus saringan kelompok">
                                    <Tag tone="ink">
                                        {activeCategory.name}
                                        <span aria-hidden="true">×</span>
                                    </Tag>
                                </Link>
                            )}
                            {activeBrand && (
                                <Link href={buildHref({ brand: null })} aria-label="Hapus saringan merk">
                                    <Tag tone="ink">
                                        {activeBrand.name}
                                        <span aria-hidden="true">×</span>
                                    </Tag>
                                </Link>
                            )}
                            {currentSearch && (
                                <Link href={buildHref({ search: null })} aria-label="Hapus saringan pencarian">
                                    <Tag tone="ink">
                                        “{currentSearch}”
                                        <span aria-hidden="true">×</span>
                                    </Tag>
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Sort + view */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-3">
                        <div className="flex items-center gap-1">
                            <span className="mr-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                Urut
                            </span>
                            {SORTS.map((sort) => (
                                <button
                                    key={sort.key}
                                    type="button"
                                    onClick={() => applyFilters({ sort: sort.key === 'latest' ? null : sort.key })}
                                    className={`whitespace-nowrap border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                                        currentSort === sort.key
                                            ? 'border-ink bg-ink text-sheet'
                                            : 'border-rule-2 text-ink-2 hover:border-ink hover:text-ink'
                                    }`}
                                >
                                    {sort.label}
                                </button>
                            ))}
                        </div>

                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                            Menampilkan {products?.from || 0}–{products?.to || 0} dari{' '}
                            {count(products?.total || 0)}
                        </span>
                    </div>

                    {/* The catalogue, as plates.
                        The register's table was the right shape for comparing a
                        hundred and eighty-four positions and the wrong one for the
                        thing a shop is actually for: recognising a part. Every plate
                        is still a register entry — same fields, same order, same
                        measurement voice, and the position and part number are the
                        first two things on it — but the eye can now find a thing by
                        what it looks like. */}
                    {rows.length > 0 ? (
                        <RegisterPlates
                            className="mt-5"
                            products={rows}
                            action={(product) => {
                                const out = Number(product.stock) <= 0;

                                return (
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">
                                            {out ? 'Tidak bisa dipesan' : signedIn ? 'Siap dikirim' : 'Perlu akun'}
                                        </span>
                                        {signedIn ? (
                                            <Stamp
                                                size="sm"
                                                onClick={() => addToOrder(product)}
                                                disabled={out || busyId === product.id}
                                                aria-label={`Tambah ${product.name} ke tas belanja`}
                                            >
                                                {out ? 'Stok habis' : busyId === product.id ? 'Mengirim…' : 'Tambah'}
                                            </Stamp>
                                        ) : (
                                            /* A guest is offered the way in, not a control that
                                               would be refused the moment they pressed it. The
                                               server holds the same rule; this only means they read
                                               it before they act rather than after. */
                                            <Link
                                                href="/login"
                                                className="stamp-2"
                                                aria-label={`Masuk untuk menambahkan ${product.name}`}
                                            >
                                                Masuk
                                            </Link>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    ) : (
                        <ZoneFrame className="mt-5">
                            <div className="px-6 py-14 text-center">
                                <p className="font-display text-[15px] font-bold uppercase tracking-[0.02em] text-ink">
                                    Tidak ada posisi yang cocok
                                </p>
                                <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-ink-2">
                                    Register tidak memuat baris untuk kombinasi saringan ini. Longgarkan salah
                                    satu saringan untuk melihat posisi lain.
                                </p>
                                <Link href="/" className="stamp-2 mt-5">
                                    Bersihkan saringan
                                </Link>
                            </div>
                        </ZoneFrame>
                    )}

                    {products?.links?.length > 3 && (
                        <div className="mt-5 flex justify-center">
                            <Pager paginator={products} />
                        </div>
                    )}
                </div>
            </section>

            {/* ── Plates ───────────────────────────────────────────────────── */}
            <section id="piringan" className="scroll-mt-16 border-t border-ink bg-sheet-2">
                <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
                    <SectionHead
                        title="Piringan"
                        meta={featured ? 'Gambar rujukan, bukan pengganti angka' : undefined}
                    />

                    <div className="mt-6 grid gap-6 lg:grid-cols-12">
                        {featured && (
                            <div className="lg:col-span-7">
                                <Plate tab={`Piringan 01 · ${featured.category?.name || 'Katalog'}`}>
                                    <Link href={`/product/${featured.slug}`} className="block">
                                        <PlatePhoto
                                            src={featured.image}
                                            alt={`${featured.name} — gambar rujukan katalog`}
                                            fallbackClassName="block aspect-[4/3] w-full"
                                            className="aspect-[4/3] w-full object-cover"
                                        />
                                    </Link>
                                </Plate>

                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-8">
                                    <Dim
                                        label="Harga satuan"
                                        value={rupiah(featured.price)}
                                        className="sm:flex-1"
                                    />
                                    <Dim
                                        label="Di gudang"
                                        value={`${count(featured.stock)} unit`}
                                        className="sm:flex-1"
                                    />
                                </div>

                                <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-rule pt-4">
                                    <div className="min-w-0">
                                        <span className="part-no">{partNo(featured)}</span>
                                        <h3 className="mt-1 font-display text-[19px] font-bold uppercase leading-tight tracking-[-0.01em] text-ink">
                                            <Link href={`/product/${featured.slug}`} className="hover:text-cyan">
                                                {featured.name}
                                            </Link>
                                        </h3>
                                        <p className="mt-1 text-[12px] text-ink-2">
                                            {featured.brand?.name ? `${featured.brand.name} · ` : ''}
                                            {position(featured)}
                                        </p>
                                    </div>
                                    <Stamp onClick={() => addToOrder(featured)} disabled={busyId === featured.id || Number(featured.stock) <= 0}>
                                        {Number(featured.stock) <= 0 ? 'Stok habis' : 'Tambah ke tas'}
                                    </Stamp>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-6 lg:col-span-5 lg:content-start">
                            {plates.map((category, index) => {
                                const sample = category.products?.[0];
                                return (
                                    <Link
                                        key={category.id}
                                        href={`/?category=${category.id}#register`}
                                        className="group grid grid-cols-[112px_1fr] items-stretch border border-ink bg-sheet transition-colors hover:bg-sheet-3"
                                    >
                                        <div className="relative overflow-hidden border-r border-ink bg-sheet-2">
                                            <PlatePhoto
                                                src={sample?.image}
                                                alt={`Contoh posisi pada kelompok ${category.name}`}
                                                fallbackClassName="block h-full w-full"
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                            />
                                        </div>
                                        <div className="px-4 py-3">
                                            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                                Piringan {String(index + 2).padStart(2, '0')}
                                            </span>
                                            <h3 className="mt-1 font-display text-[15px] font-bold uppercase leading-tight tracking-[0.01em] text-ink">
                                                {category.name}
                                            </h3>
                                            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
                                                {count(category.products_count)} posisi
                                            </p>
                                            <span className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-cyan">
                                                Buka di register
                                                <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}

                            <div className="border border-ink bg-sheet px-4 py-4">
                                <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
                                    Catatan piringan
                                </h3>
                                <p className="mt-2 text-[12px] leading-relaxed text-ink-2">
                                    Gambar pada piringan adalah foto rujukan dari basis data katalog dan belum
                                    tentu mewakili unit yang dikirim. Angka pada register yang mengikat.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How the register is kept ─────────────────────────────────── */}
            <section className="border-t border-ink">
                <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
                        <div className="lg:col-span-5">
                            <h2 className="font-display text-[26px] font-extrabold uppercase leading-[1.02] tracking-[-0.015em] text-ink sm:text-[32px]">
                                Angkanya dijaga oleh basis data, bukan oleh halaman ini.
                            </h2>
                            <p className="mt-4 max-w-[52ch] text-[13px] leading-relaxed text-ink-2">
                                Setiap pesanan dan setiap perubahan status dicatat oleh trigger di dalam MySQL.
                                Halaman ini hanya membaca. Konsol kendali yang menampilkan jejaknya.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <Link href="/admin" className="stamp-2">
                                    Buka konsol kendali
                                </Link>
                                <Link href="/pyramid" className="stamp-2">
                                    Modul rujukan
                                </Link>
                            </div>
                        </div>

                        <dl className="lg:col-span-7">
                            {SYSTEM_NOTES.map((note, index) => (
                                <div
                                    key={note.k}
                                    className={`grid grid-cols-1 gap-1 py-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-6 ${
                                        index > 0 ? 'border-t border-rule' : ''
                                    }`}
                                >
                                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                                        {note.k}
                                    </dt>
                                    <dd className="text-[12px] leading-relaxed text-ink">{note.v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </section>
        </ShopLayout>
    );
}
