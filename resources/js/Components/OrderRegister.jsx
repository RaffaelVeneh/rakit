import React from 'react';
import { Link } from '@inertiajs/react';
import { EmptyState, Pager, Stamp, StatusLamp } from '@/Components/Controls';
import { Rule } from '@/Components/Sheet';
import { count, amount, stampDate } from '@/lib/format';
import { orderState } from '@/lib/catalog';

/**
 * The customer's own register of orders.
 *
 * One ruled row per order — number, date, how many positions, the total, and the
 * status as a lamp and a word — with every figure read from the order rather than
 * restated by the page. The narrow sheet carries the same five fields as blocks,
 * because five columns do not fit a phone and a receipt is not worth squinting at.
 *
 * It is a component rather than a page because it now has two homes: the second tab
 * of the bag, which is where anyone actually looks for their orders, and the order
 * receipt's own "back to the register" path. A page that can only be reached by a
 * line in the footer is a page nobody reads.
 */

const COLUMNS = [
    { key: 'number', label: 'No. pesanan' },
    { key: 'date', label: 'Tanggal' },
    { key: 'positions', label: 'Posisi', numeric: true },
    { key: 'total', label: 'Total', numeric: true },
    { key: 'status', label: 'Status' },
];

/** The prop may be a paginator or a plain list; both are supported. */
export function orderRows(orders) {
    if (Array.isArray(orders)) {
        return { rows: orders, paginator: null };
    }

    if (orders && typeof orders === 'object') {
        return { rows: Array.isArray(orders.data) ? orders.data : [], paginator: orders };
    }

    return { rows: [], paginator: null };
}

const itemPositions = (order) => order?.items_count ?? (order?.items?.length || 0);

function pagerRange(paginator) {
    if (!paginator || !paginator.total) {
        return null;
    }

    return `Menampilkan ${paginator.from ?? 0}–${paginator.to ?? 0} dari ${count(paginator.total)} pesanan`;
}

export function OrderRegister({ orders }) {
    const { rows, paginator } = orderRows(orders);
    const range = pagerRange(paginator);
    const hasPages = (paginator?.links?.length || 0) > 3 && (paginator?.last_page || 1) > 1;

    if (rows.length === 0) {
        return (
            <EmptyState
                title="Belum ada pesanan"
                description="Tidak ada pesanan yang tercatat pada akun ini, jadi registernya masih kosong. Mulai dari register katalog, tambahkan posisi ke tas, lalu kirim pesanannya."
                action={
                    <Stamp as={Link} href="/">
                        Mulai dari register
                    </Stamp>
                }
            />
        );
    }

    return (
        <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink pb-2">
                <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.12em] text-ink">
                    Register pesanan
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                    {range || `${count(rows.length)} baris pada lembar ini`}
                </span>
            </div>

            {/* Wide sheet */}
            <div className="register mt-4 hidden overflow-x-auto lg:block">
                <table className="data-table">
                    <caption className="sr-only">
                        Riwayat pesanan: nomor pesanan, tanggal, jumlah posisi, total, dan status.
                    </caption>
                    <thead>
                        <tr>
                            {COLUMNS.map((column, index) => (
                                <th key={column.key} scope="col" className={column.numeric ? 'num' : undefined}>
                                    <span
                                        aria-hidden="true"
                                        className="block font-mono text-[8px] font-normal text-ink-3"
                                    >
                                        {index + 1}
                                    </span>
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((order) => (
                            <tr key={order.id} className="snap-rule">
                                <td>
                                    <Link
                                        href={`/order/success/${order.id}`}
                                        className="font-mono text-[12px] font-medium text-ink transition-colors hover:text-cyan hover:underline"
                                    >
                                        {order.order_number}
                                    </Link>
                                </td>
                                <td>
                                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2">
                                        {stampDate(order.created_at)}
                                    </span>
                                </td>
                                <td className="num text-ink-2">{count(itemPositions(order))}</td>
                                <td className="num text-ink">
                                    <span className="text-[11px] text-ink-3">Rp</span>{' '}
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

            {/* Narrow sheet: the same five fields, one block per order */}
            <ul className="mt-4 border border-ink bg-sheet lg:hidden">
                {rows.map((order, index) => (
                    <li key={order.id} className={index > 0 ? 'border-t border-rule' : ''}>
                        <Link
                            href={`/order/success/${order.id}`}
                            className="block px-3 py-3 transition-colors hover:bg-sheet-2"
                        >
                            <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                                <span className="font-mono text-[12px] font-medium text-ink">
                                    {order.order_number}
                                </span>
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                                    {stampDate(order.created_at)}
                                </span>
                            </span>
                            <span className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                                <StatusLamp state={orderState(order.status)} />
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                                    {count(itemPositions(order))} posisi
                                </span>
                                <span data-measure className="font-mono text-[12px] font-medium text-ink">
                                    <span className="text-[11px] text-ink-3">Rp</span>{' '}
                                    {amount(order.total_amount)}
                                </span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>

            {hasPages && (
                <>
                    <Rule weight="med" className="mt-6" />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                            {`Halaman ${paginator.current_page} dari ${paginator.last_page}`}
                        </span>
                        <Pager paginator={paginator} />
                    </div>
                </>
            )}
        </>
    );
}

export default OrderRegister;
