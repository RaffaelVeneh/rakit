import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import ShopLayout from '@/Layouts/ShopLayout';
import { Bill, PageBand, SectionHead } from '@/Components/Sheet';
import { OrderRegister, orderRows } from '@/Components/OrderRegister';
import { PlatePhoto } from '@/Components/PlatePhoto';
import { EmptyState, QtyStepper, Stamp, Tag } from '@/Components/Controls';
import { amount, count, pad, rupiah } from '@/lib/format';
import { notifyError } from '@/lib/notify';

/**
 * The bill of materials for one order in progress: the same register form the
 * catalogue uses, with the quantity control and the running total attached.
 */
const TABS = [
    { key: 'bag', label: 'Tas belanja' },
    { key: 'orders', label: 'Pesanan' },
];

export default function Cart({ cart = {}, subtotal = 0, total = 0, tab = 'bag', orders = null }) {
    const [busyId, setBusyId] = useState(null);

    const items = Object.entries(cart || {}).map(([key, item]) => ({ key, ...item }));
    const positions = items.length;
    const units = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    // The tab count is a real figure from the paginator the server sent, not a guess.
    const orderCount = orderRows(orders).rows.length && orders?.total ? orders.total : orderRows(orders).rows.length;

    const setQuantity = (productId, next) => {
        const item = cart[productId];
        if (!item) {
            return;
        }

        const current = Number(item.quantity) || 1;
        if (next === current) {
            return;
        }

        setBusyId(productId);
        const action = next > current ? 'increase' : 'decrease';
        const steps = Math.abs(next - current);

        // The controller moves the quantity one step at a time, so a jump of more
        // than one is sent as repeated steps rather than a single invalid value.
        const send = (remaining) => {
            if (remaining === 0) {
                setBusyId(null);
                return;
            }
            router.post(
                '/cart/update',
                { product_id: productId, action },
                {
                    preserveScroll: true,
                    onError: () => {
                        notifyError('Jumlah tidak tersimpan', 'Periksa stok posisi ini lalu coba lagi.');
                        setBusyId(null);
                    },
                    onFinish: () => send(remaining - 1),
                },
            );
        };

        send(steps);
    };

    const removeItem = (productId) => {
        setBusyId(productId);
        router.get(
            `/cart/remove/${productId}`,
            {},
            {
                preserveScroll: true,
                // The controller flashes the removal; the layout reports it once.
                onFinish: () => setBusyId(null),
            },
        );
    };

    return (
        <ShopLayout>
            <Head title={tab === 'orders' ? 'Pesanan — RAKIT' : 'Tas belanja — RAKIT'} />

            <PageBand
                path={[{ label: 'Register', href: '/' }, { label: tab === 'orders' ? 'Pesanan' : 'Tas belanja' }]}
                title={tab === 'orders' ? 'Pesanan' : 'Tas belanja'}
                meta={
                    tab === 'orders'
                        ? 'Setiap pesanan yang tercatat pada akun ini, terbaru lebih dahulu. Satu baris membuka dokumen pesanannya.'
                        : positions > 0
                          ? `${count(positions)} posisi, ${count(units)} unit menunggu checkout. Jumlah pada kolom kanan dapat diubah sebelum pesanan dikirim.`
                          : undefined
                }
                actions={
                    <Link href="/#register" className="stamp-2">
                        Lanjut belanja
                    </Link>
                }
            />

            {/*
                Two registers, one visit.
                
                The bag is what you are about to buy; the order register is what you
                have bought. They were separate pages and the second had no way in —
                reachable only from a line in the footer, which is not where anybody
                looks for their orders. They are tabs now, and the tab is in the
                address bar so it can be linked, bookmarked and reloaded.
            */}
            <div className="border-b border-ink bg-sheet">
                <div className="mx-auto flex max-w-[1400px] gap-px px-4 sm:px-6 lg:px-8">
                    {TABS.map((entry) => {
                        const active = tab === entry.key;

                        return (
                            <Link
                                key={entry.key}
                                href={entry.key === 'bag' ? '/cart' : '/cart?tab=orders'}
                                aria-current={active ? 'page' : undefined}
                                className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                                    active
                                        ? 'border-cyan text-ink'
                                        : 'border-transparent text-ink-3 hover:text-ink'
                                }`}
                            >
                                {entry.label}
                                <span
                                    data-measure
                                    className={`font-mono text-[10px] ${active ? 'text-ink-2' : 'text-ink-3'}`}
                                >
                                    {entry.key === 'bag' ? pad(positions) : pad(orderCount)}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                {tab === 'orders' ? (
                    <OrderRegister orders={orders} />
                ) : positions === 0 ? (
                    <EmptyState
                        title="Tas belanja kosong"
                        description="Belum ada posisi yang ditambahkan. Buka register dan tambahkan komponen atau gear dari barisnya."
                        action={
                            <Link href="/#register" className="stamp">
                                Buka register
                                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
                        <div className="lg:col-span-8">
                            <SectionHead title="Daftar posisi" meta={`${count(units)} unit`} />

                            <div className="register mt-4 overflow-x-auto">
                                <table className="data-table min-w-[720px]">
                                    <caption className="sr-only">
                                        Posisi di tas belanja dengan jumlah, harga satuan, dan subtotal.
                                    </caption>
                                    <thead>
                                        <tr>
                                            <th scope="col">Designation</th>
                                            <th scope="col" className="text-right">
                                                Unit price
                                            </th>
                                            <th scope="col">
                                                Jumlah
                                            </th>
                                            <th scope="col" className="text-right">
                                                Subtotal
                                            </th>
                                            <th scope="col" className="text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.key}>
                                                <td>
                                                    <div className="flex items-start gap-3">
                                                        <PlatePhoto
                                                            src={item.image}
                                                            fallbackClassName="block h-12 w-12 flex-none border border-rule"
                                                            className="h-12 w-12 flex-none border border-rule object-cover"
                                                        />
                                                        <div className="min-w-0">
                                                            <Link
                                                                href={`/?search=${encodeURIComponent(item.name)}#register`}
                                                                className="block text-[13px] font-medium text-ink transition-colors hover:text-cyan hover:underline"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                            {item.category && (
                                                                <span className="mt-1 block">
                                                                    <Tag>{item.category}</Tag>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="num text-ink-2">
                                                    <span className="text-[11px] text-ink-3">Rp</span>{' '}
                                                    {amount(item.price)}
                                                </td>
                                                <td>
                                                    <QtyStepper
                                                        value={Number(item.quantity) || 1}
                                                        min={1}
                                                        max={99}
                                                        disabled={busyId === item.key}
                                                        onChange={(next) => setQuantity(item.key, next)}
                                                        label={`Jumlah ${item.name}`}
                                                    />
                                                </td>
                                                <td className="num text-ink">
                                                    <span className="text-[11px] text-ink-3">Rp</span>{' '}
                                                    {amount((Number(item.price) || 0) * (Number(item.quantity) || 0))}
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.key)}
                                                        disabled={busyId === item.key}
                                                        className="border border-rule-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-red transition-colors hover:border-red hover:bg-red-tint disabled:cursor-not-allowed disabled:border-rule disabled:text-ink-3 disabled:hover:bg-transparent"
                                                    >
                                                        Hapus
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="lg:col-span-4">
                            <Bill
                                title="Ringkasan tagihan"
                                rows={[
                                    { label: `Subtotal produk (${count(positions)} posisi)`, value: rupiah(subtotal) },
                                    { label: 'Biaya lain pada perhitungan ini', value: 'Tidak ada' },
                                ]}
                                total={rupiah(total)}
                                totalLabel="Total tagihan"
                                footnote="Total tagihan pada sistem dihitung dari subtotal posisi; checkout tidak menambahkan baris biaya lain."
                            >
                                <div className="border-t border-rule px-4 py-4">
                                    <Link href="/checkout" className="stamp w-full">
                                        Lanjut ke checkout
                                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                                    </Link>
                                </div>
                            </Bill>

                            <div className="mt-4 border border-rule bg-sheet-2 px-4 py-3">
                                <p className="text-[11px] leading-relaxed text-ink-2">
                                    Setelah pesanan dikirim, satu baris tercatat di tabel <span className="font-mono">orders</span>{' '}
                                    dan satu baris di tabel <span className="font-mono">logs</span> lewat trigger basis
                                    data. Statusnya dapat Anda pantau di riwayat pesanan.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ShopLayout>
    );
}
