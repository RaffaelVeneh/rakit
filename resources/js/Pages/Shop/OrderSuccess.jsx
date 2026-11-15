import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import Confetti from '@/Components/Confetti';
import { Bill, Callout, PageBand, Readout } from '@/Components/Sheet';
import { Stamp, StatusLamp } from '@/Components/Controls';
import { orderState } from '@/lib/catalog';
import { amount, count, rupiah, stampDate } from '@/lib/format';

/**
 * The issued receipt. It is a document, not a celebration: the order number is
 * the sheet's identity, the status is a lamp, and the figures are the ones the
 * controller read back out of the order row. Nothing is promised that the
 * database does not already hold.
 */

function Blank({ title }) {
    return (
        <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
            <div className="border border-rule bg-sheet-2 px-6 py-14 text-center">
                <h2 className="font-display text-[15px] font-semibold uppercase tracking-[0.02em] text-ink">
                    {title}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-ink-2">
                    Alamat dokumen ini tidak memuat pesanan. Buka riwayat pesanan untuk melihat pesanan
                    yang tercatat pada akun Anda.
                </p>
                <Link href="/cart?tab=orders" className="stamp-2 mt-5">
                    Riwayat pesanan
                </Link>
            </div>
        </div>
    );
}

export default function OrderSuccess({ order }) {
    if (!order?.order_number) {
        return (
            <ShopLayout>
                <Head title="Dokumen pesanan — RAKIT" />
                <PageBand
                    path={[{ label: 'Register', href: '/' }, { label: 'Pesanan' }]}
                    title="Dokumen pesanan tidak ditemukan"
                />
                <Blank title="Pesanan tidak terbaca" />
            </ShopLayout>
        );
    }

    const items = order.items || [];
    const state = orderState(order.status);

    return (
        <ShopLayout>
            <Head title={`${order.order_number} — dokumen pesanan RAKIT`} />
            <Confetti active />

            <PageBand
                path={[
                    { label: 'Register', href: '/' },
                    { label: 'Riwayat pesanan', href: '/cart?tab=orders' },
                    { label: order.order_number },
                ]}
                title="Pesanan tercatat"
                meta="Pesanan ini sudah tersimpan di basis data. Simpan nomor pesanan untuk menanyakan statusnya."
            />

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                    {/* ── The document head: identity, date, status ─────────── */}
                    <div className="lg:col-span-7">
                        <div className="zone-frame px-4 py-5 sm:px-6">
                            <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
                                Nomor pesanan
                            </span>
                            <div className="mt-1.5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                                <p className="font-mono text-[24px] font-medium uppercase leading-none tracking-[0.02em] text-ink sm:text-[32px]">
                                    {order.order_number}
                                </p>
                                <StatusLamp state={state} />
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-4 sm:grid-cols-3">
                                <Readout label="Tanggal" value={stampDate(order.created_at)} />
                                <Readout label="Total" value={rupiah(order.total_amount)} />
                                <Readout label="Posisi" value={count(items.length)} />
                            </div>
                        </div>

                        {/* ── Destination ──────────────────────────────────────── */}
                        <section className="mt-8 border-t-2 border-ink pt-4">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                                <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.12em] text-ink">
                                    Tujuan pengiriman
                                </h2>
                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2">
                                    Status pesanan: {order.status || '—'}
                                </span>
                            </div>
                            <div className="mt-3">
                                <Callout k="Penerima">{order.customer_name}</Callout>
                                <Callout k="Telepon">{order.customer_phone}</Callout>
                                <Callout k="Email">{order.customer_email}</Callout>
                                <Callout k="Alamat">{order.shipping_address}</Callout>
                                <Callout k="Pembayaran">{order.payment_method}</Callout>
                                {order.notes && <Callout k="Catatan">{order.notes}</Callout>}
                            </div>
                        </section>
                    </div>

                    {/* ── The bill ─────────────────────────────────────────── */}
                    <div className="lg:col-span-5">
                        <div className="lg:sticky lg:top-24">
                            <Bill
                                title={`Rincian pesanan · ${count(items.length)} posisi`}
                                rows={items.map((item) => ({
                                    label: `${item.product_name} — ${count(item.quantity)} × ${amount(item.price)}`,
                                    value: (
                                        <>
                                            <span className="text-[11px] text-ink-3">Rp</span>{' '}
                                            {amount(item.subtotal)}
                                        </>
                                    ),
                                }))}
                                total={rupiah(order.total_amount)}
                                totalLabel="Jumlah tagihan"
                                footnote="Angka di atas dibaca dari baris pesanan yang tersimpan. Tidak ada biaya lain yang ditambahkan sistem di luar ini."
                            />

                            <div className="mt-4 border border-rule bg-sheet px-4 py-3">
                                <Callout k="Status">{order.status || '—'}</Callout>
                                <Callout k="Pembayaran">{order.payment_method}</Callout>
                                <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
                                    Nomor pesanan di atas yang dikutip saat menanyakan pesanan ini. Setiap
                                    perubahan statusnya tercatat sebagai jejak audit di basis data.
                                </p>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <Stamp as={Link} href="/cart?tab=orders">
                                    Lacak pesanan
                                </Stamp>
                                <Stamp as={Link} variant="secondary" href="/">
                                    Kembali ke register
                                </Stamp>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
