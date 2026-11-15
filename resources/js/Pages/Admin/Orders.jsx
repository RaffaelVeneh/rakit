import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Callout, PageBand, SectionHead } from '@/Components/Sheet';
import { EmptyState, Field, Pager, Select, Stamp, StatusLamp } from '@/Components/Controls';
import { orderState } from '@/lib/catalog';
import { amount, count, eventStamp } from '@/lib/format';
import { notifyError } from '@/lib/notify';

/**
 * Sheet 04 — the transaction register. The densest sheet in the console: one
 * ruled line per order, ten to a page, with the line items folded into the row
 * they belong to instead of being pushed onto a sheet of their own. Every figure
 * is read from the orders and order_items tables; the status is the only value
 * this sheet writes, through the route the controller already validates.
 */

/** The four values `updateOrderStatus` accepts, in lifecycle order. */
const STATUS_KEYS = ['pending', 'processing', 'completed', 'cancelled'];

/** The register's own column count, so the detail row can span all of it. */
const COLUMN_COUNT = 7;

/** The checkout form writes these strings; the register prints them short. */
const PAYMENT_LABELS = {
    'Transfer Bank (BCA / Mandiri)': 'Transfer bank',
    'QRIS / E-Wallet (GoPay, OVO, Dana)': 'QRIS / e-wallet',
    'Cash On Delivery (COD)': 'Bayar di tempat',
};

const paymentLabel = (value) => PAYMENT_LABELS[value] || value || '—';

const itemsOf = (order) => (Array.isArray(order?.items) ? order.items : []);

/** One money cell: the unit prefix in the muted tone, the figure in the measure voice. */
function Money({ value }) {
    return (
        <span className="font-mono" data-measure>
            <span className="text-[11px] text-chalk-2">Rp</span> {amount(value)}
        </span>
    );
}

/**
 * The line items of one order, plus the paperwork that was typed at checkout.
 * `items` is eager-loaded by `orders()`, so this panel costs no extra query.
 */
function ItemsPanel({ order }) {
    const rows = itemsOf(order);

    return (
        <div className="grid gap-x-10 gap-y-5 lg:grid-cols-12">
            <div className="lg:col-span-8">
                <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                    Baris item pesanan · #{order.order_number}
                </span>

                {rows.length > 0 ? (
                    <table className="data-table mt-2">
                        <caption className="sr-only">
                            Baris tabel order_items untuk pesanan #{order.order_number}.
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col">Nama item</th>
                                <th scope="col" className="text-right">
                                    Jumlah
                                </th>
                                <th scope="col" className="text-right">
                                    Harga satuan
                                </th>
                                <th scope="col" className="text-right">
                                    Subtotal
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((item) => (
                                <tr key={item.id}>
                                    <td className="text-chalk">{item.product_name}</td>
                                    <td className="num text-chalk-2">{count(item.quantity)}</td>
                                    <td className="num text-chalk-2">
                                        <Money value={item.price} />
                                    </td>
                                    <td className="num text-chalk">
                                        <Money value={item.subtotal} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="mt-2 border-t border-line pt-3 text-[12px] leading-relaxed text-chalk-2">
                        Tabel order_items tidak memuat baris untuk pesanan ini, jadi rincian item tidak
                        dapat ditampilkan. Periksa pesanan langsung di basis data sebelum memprosesnya.
                    </p>
                )}
            </div>

            <div className="lg:col-span-4">
                <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                    Keterangan tercatat
                </span>

                <div className="mt-1">
                    <Callout k="Email">{order.customer_email || '—'}</Callout>
                    <Callout k="Bayar">{order.payment_method || '—'}</Callout>
                    <Callout k="Kirim ke">{order.shipping_address || '—'}</Callout>
                    {order.notes ? <Callout k="Catatan">{order.notes}</Callout> : null}
                </div>

                <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-line-2 pt-2.5">
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-chalk">
                        Total tagihan
                    </span>
                    <span className="font-mono text-[14px] font-medium text-chalk" data-measure>
                        <span className="text-[11px] text-chalk-2">Rp</span> {amount(order.total_amount)}
                    </span>
                </div>
            </div>
        </div>
    );
}

function OrderRow({ order, open, busy, onToggle, onStatusChange }) {
    const rows = itemsOf(order);

    return (
        <tr>
            <td>
                <div className="flex items-start gap-2.5">
                    <button
                        type="button"
                        onClick={() => onToggle(order.id)}
                        aria-expanded={open}
                        aria-controls={open ? `rincian-${order.id}` : undefined}
                        aria-label={`${open ? 'Tutup' : 'Buka'} rincian item pesanan #${order.order_number}`}
                        className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center border transition-colors ${
                            open
                                ? 'border-chalk text-chalk'
                                : 'border-line-2 text-chalk-2 hover:border-chalk hover:text-chalk'
                        }`}
                    >
                        <ChevronRight
                            className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
                            strokeWidth={1.5}
                        />
                    </button>

                    <span className="min-w-0">
                        <span className="block font-mono text-[11px] text-chalk">
                            #{order.order_number}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-2">
                            {eventStamp(order.created_at)}
                        </span>
                    </span>
                </div>
            </td>

            <td>
                <span className="text-[12px] text-chalk">{order.customer_name}</span>
                <span className="mt-0.5 block font-mono text-[10px] text-chalk-2">
                    {order.customer_phone || '—'}
                </span>
            </td>

            <td>
                <span className="text-[12px] text-chalk-2">{paymentLabel(order.payment_method)}</span>
            </td>

            <td className="num text-chalk-2">{count(rows.length)}</td>

            <td className="num text-chalk">
                <Money value={order.total_amount} />
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
                    disabled={busy}
                    onChange={(event) => onStatusChange(order, event.target.value)}
                    className={`w-36 py-1.5 text-[11px] ${busy ? 'opacity-60' : ''}`}
                >
                    {STATUS_KEYS.map((key) => (
                        <option key={key} value={key}>
                            {orderState(key).label}
                        </option>
                    ))}
                </Select>
            </td>
        </tr>
    );
}

export default function Orders({ orders }) {
    const { url = '' } = usePage();

    const params = useMemo(() => new URLSearchParams(String(url).split('?')[1] || ''), [url]);
    const currentStatus = params.get('status') || '';
    const currentSearch = params.get('search') || '';

    const [query, setQuery] = useState(currentSearch);
    const [openRows, setOpenRows] = useState({});
    const [busyId, setBusyId] = useState(null);

    // The register is read from the address bar, so a cleared filter empties the field too.
    useEffect(() => {
        setQuery(currentSearch);
    }, [currentSearch]);

    const rows = orders?.data || [];
    const totalMatching = Number(orders?.total) || 0;
    // A hand-edited page number can point past the end of a filtered register:
    // the filter still matches rows, this page simply has none.
    const pastLastPage = rows.length === 0 && totalMatching > 0;
    const filtersActive = Boolean(currentStatus || currentSearch);

    /** The filter set as query parameters, empties dropped, page reset. */
    const mergeFilters = (overrides = {}) => {
        const next = { status: currentStatus, search: currentSearch, ...overrides };
        const nextParams = {};
        Object.entries(next).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                nextParams[key] = value;
            }
        });
        return nextParams;
    };

    const applyFilters = (overrides = {}) => {
        router.get('/admin/orders', mergeFilters(overrides), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const registerHref = (overrides = {}) => {
        const query = new URLSearchParams(mergeFilters(overrides)).toString();
        return query ? `/admin/orders?${query}` : '/admin/orders';
    };

    const submitSearch = (event) => {
        event.preventDefault();
        applyFilters({ search: query.trim() });
    };

    const toggleRow = (id) => setOpenRows((current) => ({ ...current, [id]: !current[id] }));

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
                    notifyError(
                        'Status tidak tersimpan',
                        `Pesanan #${order.order_number} masih ${orderState(order.status).label}. Periksa koneksi basis data lalu ubah lagi.`,
                    ),
                onFinish: () => setBusyId(null),
            },
        );
    };

    const statusWord = currentStatus ? orderState(currentStatus).label : null;
    const activeFilters = [
        statusWord ? `status ${statusWord}` : null,
        currentSearch ? `pencarian “${currentSearch}”` : null,
    ].filter(Boolean);

    return (
        <AdminLayout sheet="04 · Pesanan">
            <Head title="Pesanan — Kendali RAKIT" />

            <PageBand
                tone="plot"
                path={[{ label: 'Kendali', href: '/admin' }, { label: 'Lembar 04' }]}
                title="Pesanan"
                meta="Register transaksi, sepuluh baris per halaman, yang terbaru lebih dahulu. Baris dibaca dari tabel orders dan order_items; perubahan status dikirim ke server dan dicatat trigger after_orders_status_update di dalam MySQL."
                actions={
                    <Link href="/admin" className="stamp-2">
                        Antrean keputusan
                    </Link>
                }
            />

            <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section>
                    <SectionHead
                        title="Register pesanan"
                        meta={`${count(orders?.total || 0)} pesanan · halaman ${orders?.current_page || 1} dari ${orders?.last_page || 1}`}
                        action={
                            filtersActive ? (
                                <Link
                                    href="/admin/orders"
                                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-lit underline decoration-dotted transition-colors hover:text-lit-2"
                                >
                                    Bersihkan saringan
                                </Link>
                            ) : null
                        }
                    />

                    {/* Filter strip: one ruled instrument, no floating pills */}
                    <form
                        onSubmit={submitSearch}
                        className="mt-4 grid gap-px border border-line-2 bg-line lg:grid-cols-12"
                    >
                        <div className="min-w-0 bg-plot-2 px-3 py-3 lg:col-span-7">
                            <span
                                id="order-status-saringan"
                                className="block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2"
                            >
                                Status pesanan
                            </span>
                            <div
                                role="group"
                                aria-labelledby="order-status-saringan"
                                className="mt-1.5 flex flex-wrap gap-1"
                            >
                                <button
                                    type="button"
                                    aria-pressed={currentStatus === ''}
                                    onClick={() => applyFilters({ status: '' })}
                                    className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                                        currentStatus === ''
                                            ? 'border-chalk bg-chalk text-plot'
                                            : 'border-line-2 text-chalk-2 hover:border-chalk hover:text-chalk'
                                    }`}
                                >
                                    Semua
                                </button>
                                {STATUS_KEYS.map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        aria-pressed={currentStatus === key}
                                        onClick={() => applyFilters({ status: key })}
                                        className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                                            currentStatus === key
                                                ? 'border-chalk bg-chalk text-plot'
                                                : 'border-line-2 text-chalk-2 hover:border-chalk hover:text-chalk'
                                        }`}
                                    >
                                        {orderState(key).label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="min-w-0 bg-plot-2 px-3 py-3 lg:col-span-5">
                            <label
                                htmlFor="order-search"
                                className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2"
                            >
                                Cari nomor pesanan, nama, atau email
                            </label>
                            <div className="flex gap-2">
                                <Field
                                    id="order-search"
                                    type="search"
                                    name="search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="ORD-… / nama / email"
                                    className="min-w-0 flex-1"
                                />
                                <Stamp type="submit" variant="secondary" className="flex-none">
                                    Cari
                                </Stamp>
                            </div>
                        </div>
                    </form>

                    {rows.length > 0 ? (
                        <>
                            <div className="register mt-4 overflow-x-auto">
                                <table className="data-table min-w-[920px]">
                                    <caption className="sr-only">
                                        Register pesanan: nomor dan waktu, pelanggan, metode bayar, jumlah item,
                                        tagihan, status, dan kendali perubahan status. Tombol rincian membuka
                                        baris item pesanan.
                                    </caption>
                                    <thead>
                                        <tr>
                                            <th scope="col">Pesanan</th>
                                            <th scope="col">Pelanggan</th>
                                            <th scope="col">Pembayaran</th>
                                            <th scope="col" className="text-right">
                                                Item
                                            </th>
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
                                        {rows.map((order) => {
                                            const open = Boolean(openRows[order.id]);
                                            return (
                                                <React.Fragment key={order.id}>
                                                    <OrderRow
                                                        order={order}
                                                        open={open}
                                                        busy={busyId === order.id}
                                                        onToggle={toggleRow}
                                                        onStatusChange={changeStatus}
                                                    />
                                                    {open && (
                                                        <tr id={`rincian-${order.id}`}>
                                                            <td colSpan={COLUMN_COUNT} className="bg-plot-2">
                                                                <ItemsPanel order={order} />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                    Menampilkan {orders?.from || 0}–{orders?.to || 0} dari{' '}
                                    {count(orders?.total || 0)} pesanan
                                </span>
                                {orders?.links?.length > 3 && <Pager paginator={orders} />}
                            </div>
                        </>
                    ) : (
                        <div className="mt-4">
                            <EmptyState
                                title={
                                    pastLastPage
                                        ? `Halaman ${orders?.current_page || 1} berada di luar register`
                                        : activeFilters.length > 0
                                          ? `Tidak ada pesanan untuk ${activeFilters.join(' dan ')}`
                                          : 'Register pesanan masih kosong'
                                }
                                description={
                                    pastLastPage
                                        ? `Saringan memuat ${count(totalMatching)} pesanan, tetapi halaman ini tidak memuat satu baris pun. Kembali ke halaman pertama untuk membacanya.`
                                        : activeFilters.length > 0
                                          ? `Saringan aktif: ${activeFilters.join(' dan ')}. Tidak ada baris di tabel orders yang cocok. Longgarkan salah satu saringan, atau bersihkan keduanya untuk membaca seluruh register.`
                                          : 'Tabel orders belum berisi satu baris pun. Pesanan tercatat di sini setelah pelanggan menyelesaikan checkout di toko.'
                                }
                                action={
                                    pastLastPage ? (
                                        <Link href={registerHref()} className="stamp-2">
                                            Ke halaman pertama
                                        </Link>
                                    ) : activeFilters.length > 0 ? (
                                        <Link href="/admin/orders" className="stamp-2">
                                            Bersihkan saringan
                                        </Link>
                                    ) : (
                                        <Link href="/" className="stamp-2">
                                            Buka toko
                                        </Link>
                                    )
                                }
                            />
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
