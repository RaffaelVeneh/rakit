import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageBand, SectionHead } from '@/Components/Sheet';
import { EmptyState, Lamp, Select, StatusLamp } from '@/Components/Controls';
import { orderState } from '@/lib/catalog';
import { amount, count, eventStamp, rupiah, stampDate } from '@/lib/format';
import { notifyError } from '@/lib/notify';

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Menunggu' },
    { value: 'processing', label: 'Diproses' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

/**
 * The ledger strip. One ruled instrument, not a row of metric cards: the figures
 * are read together and compared, so they share one frame and one baseline.
 */
function Ledger({ cells }) {
    return (
        <div className="grid grid-cols-2 gap-px border border-line-2 bg-line-2 sm:grid-cols-4">
            {cells.map((cell) => (
                <div key={cell.label} className="bg-plot-2 px-4 py-3">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                        {cell.label}
                    </span>
                    <span
                        data-measure
                        className="mt-1.5 block font-mono text-[16px] font-medium leading-none text-chalk"
                    >
                        {cell.value}
                    </span>
                    {cell.sub && (
                        <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-2">
                            {cell.sub}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

function QueueRow({ order, busyId, onChange }) {
    return (
        <tr>
            <td>
                <span className="font-mono text-[11px] text-chalk">#{order.order_number}</span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-2">
                    {eventStamp(order.created_at)}
                </span>
            </td>
            <td>
                <span className="text-[12px] text-chalk">{order.customer_name}</span>
                <span className="mt-0.5 block font-mono text-[10px] text-chalk-2">
                    {order.customer_phone || '—'}
                </span>
            </td>
            <td>
                <span className="text-[12px] text-chalk-2">{order.payment_method || '—'}</span>
            </td>
            <td className="num text-chalk">
                <span className="text-[11px] text-chalk-2">Rp</span> {amount(order.total_amount)}
            </td>
            <td>
                <StatusLamp state={orderState(order.status)} />
            </td>
            <td className="text-right">
                <label className="sr-only" htmlFor={`status-${order.id}`}>
                    Ubah status pesanan #{order.order_number}
                </label>
                <Select
                    id={`status-${order.id}`}
                    value={order.status}
                    disabled={busyId === order.id}
                    onChange={(event) => onChange(order, event.target.value)}
                    className="w-32 py-1.5 text-[11px]"
                >
                    {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            </td>
        </tr>
    );
}

export default function Dashboard({
    totalRevenue = 0,
    totalOrders = 0,
    pendingOrders = 0,
    processingOrders = 0,
    completedOrders = 0,
    totalProducts = 0,
    lowStockProducts = 0,
    totalUsers = 0,
    recentOrders = [],
    queue = [],
    categories = [],
    activityLogs = [],
}) {
    const [busyId, setBusyId] = useState(null);

    const changeStatus = (order, status) => {
        if (status === order.status) {
            return;
        }
        setBusyId(order.id);
        router.put(
            `/admin/orders/${order.id}/status`,
            { status },
            {
                preserveScroll: true,
                onError: () =>
                    notifyError('Status tidak tersimpan', 'Periksa koneksi basis data lalu ubah lagi.'),
                onFinish: () => setBusyId(null),
            },
        );
    };

    const totalCatalogue = categories.reduce((sum, category) => sum + (category.products_count || 0), 0);

    return (
        <AdminLayout sheet="01 · Antrean & posisi">
            <Head title="Antrean & posisi — Kendali RAKIT" />

            <PageBand
                tone="plot"
                path={[{ label: 'Kendali' }, { label: 'Lembar 01' }]}
                title="Antrean & posisi"
                meta="Pesanan yang masih menunggu keputusan ada di paling atas; angka katalog dan jejak basis data menyusul. Setiap baris di lembar ini dibaca dari basis data toko, bukan disimpan di halaman."
                actions={
                    <Link href="/admin/orders" className="stamp-2">
                        Semua pesanan
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Link>
                }
            />

            <div className="mx-auto max-w-[1400px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
                <Ledger
                    cells={[
                        { label: 'Omzet tercatat', value: rupiah(totalRevenue), sub: 'Tanpa pesanan batal' },
                        { label: 'Total pesanan', value: count(totalOrders), sub: 'Sepanjang register' },
                        { label: 'Menunggu', value: count(pendingOrders), sub: 'Belum diproses' },
                        { label: 'Diproses', value: count(processingOrders), sub: 'Sedang berjalan' },
                        { label: 'Selesai', value: count(completedOrders), sub: 'Terkirim' },
                        { label: 'Pelanggan', value: count(totalUsers), sub: 'Peran customer' },
                        { label: 'Posisi katalog', value: count(totalProducts), sub: `${categories.length} kelompok` },
                        {
                            label: 'Perlu restock',
                            value: count(lowStockProducts),
                            sub: lowStockProducts > 0 ? 'Stok 5 unit atau kurang' : 'Stok aman',
                        },
                    ]}
                />

                {/* What the operator is actually here to do */}
                <section>
                    <SectionHead
                        title="Antrean keputusan"
                        meta={`${count(pendingOrders + processingOrders)} pesanan belum selesai`}
                    />

                    {queue.length > 0 ? (
                        <div className="register mt-4 overflow-x-auto">
                            <table className="data-table min-w-[880px]">
                                <caption className="sr-only">
                                    Pesanan berstatus menunggu atau diproses, dengan kendali perubahan status.
                                </caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Pesanan</th>
                                        <th scope="col">Pelanggan</th>
                                        <th scope="col">Pembayaran</th>
                                        <th scope="col" className="text-right">
                                            Tagihan
                                        </th>
                                        <th scope="col">Status</th>
                                        <th scope="col" className="text-right">
                                            Ubah status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queue.map((order) => (
                                        <QueueRow
                                            key={order.id}
                                            order={order}
                                            busyId={busyId}
                                            onChange={changeStatus}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <EmptyState
                                title="Antrean kosong"
                                description="Tidak ada pesanan berstatus menunggu atau diproses. Pesanan baru muncul di sini begitu masuk."
                                action={
                                    <Link href="/admin/orders" className="stamp-2">
                                        Periksa riwayat pesanan
                                    </Link>
                                }
                            />
                        </div>
                    )}
                </section>

                <section className="grid gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <SectionHead title="Sebaran katalog" meta={`${count(totalCatalogue)} posisi`} />

                        <div className="register mt-4 overflow-x-auto">
                            <table className="data-table min-w-[560px]">
                                <caption className="sr-only">Jumlah posisi katalog per kelompok.</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Kelompok</th>
                                    <th scope="col">Sebaran</th>
                                    <th scope="col" className="text-right">
                                        Posisi
                                    </th>
                                    <th scope="col" className="text-right">
                                        Porsi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => {
                                    const positions = category.products_count || 0;
                                    const share = totalCatalogue
                                        ? Math.round((positions / totalCatalogue) * 100)
                                        : 0;
                                    return (
                                        <tr key={category.id}>
                                            <td>
                                                <Link
                                                    href={`/admin/products?category=${category.id}`}
                                                    className="text-[12px] text-chalk transition-colors hover:text-lit"
                                                >
                                                    {category.name}
                                                </Link>
                                            </td>
                                            <td className="w-[36%]">
                                                <span className="relative block h-3">
                                                    <span
                                                        className="absolute inset-x-0 bottom-0 block h-px bg-line-2"
                                                        aria-hidden="true"
                                                    />
                                                    <span
                                                        className="absolute bottom-0 left-0 block h-3 bg-lit"
                                                        style={{ width: `${share ? Math.max(share, 2) : 0}%` }}
                                                        aria-hidden="true"
                                                    />
                                                </span>
                                            </td>
                                            <td className="num text-chalk">{count(positions)}</td>
                                            <td className="num text-chalk-2">{share}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <SectionHead title="Jejak basis data" meta="Tabel logs" />

                        {activityLogs.length > 0 ? (
                            <ol className="mt-4 border border-line-2 bg-plot-2">
                                {activityLogs.map((log, index) => (
                                    <li
                                        key={log.id}
                                        className={`px-4 py-3 ${index > 0 ? 'border-t border-line' : ''}`}
                                    >
                                        <div className="flex items-baseline justify-between gap-4">
                                            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-2">
                                                {eventStamp(log.created_at)}
                                            </span>
                                            <span className="font-mono text-[10px] text-chalk-3">
                                                #{String(log.id).padStart(4, '0')}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[12px] leading-relaxed text-chalk">{log.action}</p>
                                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-2">
                                            {log.user?.name || 'Sistem'} · {log.ip_address || '—'}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <div className="mt-4">
                                <EmptyState
                                    title="Belum ada catatan"
                                    description="Tabel logs masih kosong. Baris muncul saat trigger after_orders_insert atau after_orders_status_update berjalan."
                                />
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <SectionHead
                        title="Pesanan terakhir"
                        meta={stampDate()}
                        action={
                            <Link
                                href="/admin/orders"
                                className="font-mono text-[10px] uppercase tracking-[0.14em] text-lit transition-colors hover:text-lit-2"
                            >
                                Buka lembar 04
                            </Link>
                        }
                    />

                    {recentOrders.length > 0 ? (
                        <div className="register mt-4 overflow-x-auto">
                        <table className="data-table min-w-[640px]">
                            <caption className="sr-only">Enam pesanan terakhir yang tercatat.</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Pesanan</th>
                                    <th scope="col">Pelanggan</th>
                                    <th scope="col" className="text-right">
                                        Item
                                    </th>
                                    <th scope="col" className="text-right">
                                        Tagihan
                                    </th>
                                    <th scope="col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <span className="font-mono text-[11px] text-chalk">
                                                #{order.order_number}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-[12px] text-chalk-2">{order.customer_name}</span>
                                        </td>
                                        <td className="num text-chalk-2">{count(order.items?.length || 0)}</td>
                                        <td className="num text-chalk">
                                            <span className="text-[11px] text-chalk-2">Rp</span>{' '}
                                            {amount(order.total_amount)}
                                        </td>
                                        <td>
                                            <StatusLamp state={orderState(order.status)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <EmptyState
                                title="Belum ada pesanan"
                                description="Belum ada satu pun pesanan tercatat di basis data."
                            />
                        </div>
                    )}
                </section>

                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                    <Lamp tone="lit" state="lit" />
                    Perubahan status ditulis ke tabel logs oleh trigger di dalam MySQL, bukan oleh halaman ini.
                </p>
            </div>
        </AdminLayout>
    );
}
