import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ShopLayout from '@/Layouts/ShopLayout';
import { Callout, Dim, PageBand, Plate, SectionHead } from '@/Components/Sheet';
import { QtyStepper, Stamp, StatusLamp } from '@/Components/Controls';
import { PlatePhoto } from '@/Components/PlatePhoto';
import { RegisterList, RegisterTable } from '@/Components/Register';
import { partNo, position, stockState } from '@/lib/catalog';
import { atWidth, srcSet } from '@/lib/images';
import { amount, count, rupiah } from '@/lib/format';

/**
 * The part sheet: one position out of the register, drawn large, with the same
 * figures the register prints. Nothing here repeats a claim the register cannot
 * back.
 */
export default function Product({ product, relatedProducts = [] }) {
    // Whether anyone is signed in is a fact about the reader, not about the part,
    // and it decides which of the two actions below is honest to show them.
    const { auth } = usePage().props;
    const signedIn = Boolean(auth?.user);
    const [quantity, setQuantity] = useState(1);
    const [sending, setSending] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const condition = stockState(product?.stock);
    const out = Number(product?.stock) <= 0;

    const addRelated = (related) => {
        setBusyId(related.id);
        router.post(
            '/cart/add',
            { product_id: related.id, quantity: 1 },
            {
                preserveScroll: true,
                // The server flashes its own confirmation; the layout reports it once.
                onFinish: () => setBusyId(null),
            },
        );
    };

    const addToOrder = (event) => {
        event.preventDefault();
        setSending(true);
        router.post(
            '/cart/add',
            { product_id: product.id, quantity },
            {
                preserveScroll: true,
                // The server flashes its own confirmation (and its own refusal when
                // stock is short); the layout reports that once.
                onFinish: () => setSending(false),
            },
        );
    };

    if (!product) {
        return (
            <ShopLayout>
                <Head title="Posisi tidak ditemukan — RAKIT" />
                <PageBand
                    path={[{ label: 'Register', href: '/' }, { label: 'Tidak ditemukan' }]}
                    title="Posisi tidak ada di register"
                    meta="Nomor bagian yang Anda buka tidak ada pada katalog ini."
                    actions={
                        <Link href="/" className="stamp">
                            Kembali ke register
                        </Link>
                    }
                />
            </ShopLayout>
        );
    }

    return (
        <ShopLayout>
            <Head title={`${partNo(product)} · ${product.name} — RAKIT`} />

            <PageBand
                path={[
                    { label: 'Register', href: '/' },
                    ...(product.category
                        ? [{ label: product.category.name, href: `/?category=${product.category_id}#register` }]
                        : []),
                    { label: partNo(product) },
                ]}
                title={product.name}
                actions={
                    <Link href="/#register" className="stamp-2">
                        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Kembali ke register
                    </Link>
                }
            />

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                    {/* The plate */}
                    <div className="lg:col-span-7">
                        <Plate tab={`Piringan · ${product.category?.name || 'Katalog'}`}>
                            <PlatePhoto
                                src={atWidth(product.image, 1200) || product.image}
                                srcSet={srcSet(product.image, [600, 900, 1200])}
                                sizes="(min-width: 1024px) 58vw, 100vw"
                                alt={`${product.name} — gambar rujukan katalog`}
                                width="1200"
                                height="1200"
                                loading="eager"
                                fallbackClassName="block aspect-square w-full"
                                className="aspect-square w-full object-cover"
                            />
                        </Plate>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-8">
                            <Dim label="Harga satuan" value={rupiah(product.price)} className="sm:flex-1" />
                            <Dim label="Di gudang" value={`${count(product.stock)} unit`} className="sm:flex-1" />
                        </div>

                        <p className="mt-4 border-t border-rule pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                            Gambar adalah foto rujukan dari basis data katalog dan belum tentu mewakili unit
                            yang dikirim.
                        </p>

                        <section className="mt-10">
                            <SectionHead title="Uraian" />
                            <p className="mt-4 max-w-[72ch] text-[13px] leading-relaxed text-ink">
                                {product.description || 'Belum ada uraian yang dicatat untuk posisi ini.'}
                            </p>
                        </section>
                    </div>

                    {/* The specification block and the order control */}
                    <div className="lg:col-span-5">
                        <div className="border border-ink bg-sheet">
                            <div className="flex items-baseline justify-between gap-4 border-b border-ink px-4 py-3">
                                <span className="part-no text-ink">{partNo(product)}</span>
                                <StatusLamp state={condition} />
                            </div>

                            <div className="px-4 py-1">
                                <Callout k="Posisi">{position(product)}</Callout>
                                <Callout k="Kelompok">{product.category?.name || '—'}</Callout>
                                <Callout k="Merk">{product.brand?.name || '—'}</Callout>
                                <Callout k="Harga satuan">{rupiah(product.price)}</Callout>
                                <Callout k="Di gudang">{count(product.stock)} unit</Callout>
                            </div>

                            <div className="border-t border-ink px-4 py-4">
                                {out ? (
                                    <>
                                        <p className="text-[12px] leading-relaxed text-ink-2">
                                            Posisi ini sedang tidak ada stoknya. Tambahkan ke daftar pantau lewat
                                            halaman kelompok, atau pilih posisi lain yang setara.
                                        </p>
                                        <Link
                                            href={
                                                product.category_id
                                                    ? `/?category=${product.category_id}#register`
                                                    : '/#register'
                                            }
                                            className="stamp-2 mt-4 w-full"
                                        >
                                            Lihat posisi sekelompok
                                        </Link>
                                    </>
                                ) : (
                                    <form onSubmit={addToOrder}>
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                                Jumlah
                                            </span>
                                            <QtyStepper
                                                value={quantity}
                                                max={Number(product.stock) || 1}
                                                onChange={setQuantity}
                                                disabled={sending}
                                            />
                                        </div>

                                        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-rule pt-4">
                                            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                                Subtotal
                                            </span>
                                            <span
                                                data-measure
                                                className="font-mono text-[17px] font-medium text-ink"
                                            >
                                                <span className="text-[12px] text-ink-3">Rp</span>{' '}
                                                {amount((Number(product.price) || 0) * quantity)}
                                            </span>
                                        </div>

                                        {signedIn ? (
                                            <Stamp type="submit" size="lg" className="mt-4 w-full" disabled={sending}>
                                                {sending ? 'Mengirim' : 'Tambah ke tas'}
                                            </Stamp>
                                        ) : (
                                            /* A guest is offered the way in, not a control that
                                               would be refused the moment they pressed it. The
                                               server enforces the same rule; this only means they
                                               read it before they act rather than after. */
                                            <Link href="/login" className="stamp mt-4 w-full">
                                                Masuk untuk membeli
                                                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                                            </Link>
                                        )}

                                        {signedIn && (
                                            <Link href="/cart" className="stamp-2 mt-2 w-full">
                                                Periksa tas & checkout
                                            </Link>
                                        )}
                                    </form>
                                )}
                            </div>

                            <p className="border-t border-rule px-4 py-3 text-[11px] leading-relaxed text-ink-2">
                                Angka pada lembar ini dibaca dari basis data saat halaman dimuat. Jumlah di gudang
                                dapat berubah sebelum pesanan dikonfirmasi.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Positions from the same group, kept in the register's own form */}
                {relatedProducts.length > 0 && (
                    <section className="mt-14">
                        <SectionHead
                            title="Posisi sekelompok"
                            meta={product.category?.name}
                            action={
                                <Link
                                    href={`/?category=${product.category_id}#register`}
                                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan hover:underline"
                                >
                                    Buka di register
                                </Link>
                            }
                        />

                        {/* Wide screens get the register's column form; a phone gets
                            the same ruled block list the storefront uses, so the price
                            and the stock — the two fields the decision rests on — are
                            never pushed off-frame. */}
                        <RegisterTable
                            products={relatedProducts}
                            onAdd={addRelated}
                            busyId={busyId}
                            className="mt-4 hidden lg:block"
                        />
                        <RegisterList
                            products={relatedProducts}
                            onAdd={addRelated}
                            busyId={busyId}
                            className="mt-4 lg:hidden"
                        />
                    </section>
                )}
            </div>
        </ShopLayout>
    );
}
