import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageBand, SectionHead } from '@/Components/Sheet';
import { EmptyState, Field, Pager, Stamp, StatusLamp } from '@/Components/Controls';
import { count, stampDate } from '@/lib/format';

/**
 * Sheet 05 — the customer register. Accounts as rows: who they are, how to reach
 * them, what they have bought, and when they arrived. The console has no route
 * that changes a role, so the role is printed as a reading and never as a control
 * that pretends to work.
 */

/**
 * Role as a lamp state. Read-only: `AdminController::users` counts orders and
 * lists accounts, and no route updates `users.role`.
 */
function roleState(role) {
    const key = String(role || '').toLowerCase();

    if (key === 'admin') {
        return { key: 'admin', tone: 'lit', lamp: 'lit', label: 'ADMIN' };
    }

    if (key === 'customer') {
        return { key: 'customer', tone: 'chalk', lamp: 'lit', label: 'PELANGGAN' };
    }

    return { key: 'unknown', tone: 'chalk', lamp: 'half', label: key ? key.toUpperCase() : 'TANPA PERAN' };
}

function CustomerRow({ user }) {
    const orders = Number(user.orders_count) || 0;
    // The orders sheet searches order_number, customer_name, and customer_email;
    // checkout fills customer_email from the account, so this search lands on the
    // customer's own orders.
    const ordersHref = `/admin/orders?search=${encodeURIComponent(user.email || '')}`;

    return (
        <tr>
            <td>
                <span className="text-[12px] text-chalk">{user.name}</span>
            </td>

            <td>
                <span className="block max-w-[30ch] break-words text-[12px] text-chalk-2">
                    {user.email}
                </span>
            </td>

            <td>
                <span className="font-mono text-[11px] text-chalk-2">{user.phone || '—'}</span>
            </td>

            <td>
                <span className="block max-w-[34ch] text-[12px] leading-relaxed text-chalk-2">
                    {user.address || '—'}
                </span>
            </td>

            <td>
                <StatusLamp state={roleState(user.role)} />
            </td>

            <td className="num">
                {orders > 0 ? (
                    <>
                        <span className="text-chalk">{count(orders)}</span>
                        <Link
                            href={ordersHref}
                            aria-label={`Buka register pesanan untuk ${user.name}, disaring dengan email ${user.email}`}
                            className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-lit transition-colors hover:text-lit-2"
                        >
                            Lihat pesanan
                        </Link>
                    </>
                ) : (
                    <span className="text-chalk-2">0</span>
                )}
            </td>

            <td>
                <span className="font-mono text-[11px] text-chalk-2">{stampDate(user.created_at)}</span>
            </td>
        </tr>
    );
}

export default function Users({ users, filters = {} }) {
    const currentSearch = filters?.search || '';

    const [query, setQuery] = useState(currentSearch);

    // The search term the server actually used is the source of truth for the field.
    useEffect(() => {
        setQuery(currentSearch);
    }, [currentSearch]);

    const rows = users?.data || [];
    const totalAccounts = Number(users?.total) || 0;
    // A hand-edited page number can point past the end of a filtered register:
    // the search still matches accounts, this page simply has none.
    const pastLastPage = rows.length === 0 && totalAccounts > 0;
    const searchActive = Boolean(currentSearch);
    const registerHref = currentSearch ? `/admin/users?search=${encodeURIComponent(currentSearch)}` : '/admin/users';

    const submitSearch = (event) => {
        event.preventDefault();
        const term = query.trim();
        router.get(
            '/admin/users',
            term ? { search: term } : {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AdminLayout sheet="05 · Pelanggan">
            <Head title="Pelanggan — Kendali RAKIT" />

            <PageBand
                tone="plot"
                path={[{ label: 'Kendali', href: '/admin' }, { label: 'Lembar 05' }]}
                title="Pelanggan"
                meta="Register akun, lima belas baris per halaman, yang terbaru lebih dahulu. Jumlah pesanan dihitung dari relasi orders; peran dibaca apa adanya dari kolom users.role dan tidak diubah dari konsol ini."
            />

            <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section>
                    <SectionHead
                        title="Register pelanggan"
                        meta={`${count(users?.total || 0)} akun · halaman ${users?.current_page || 1} dari ${users?.last_page || 1}`}
                        action={
                            searchActive ? (
                                <Link
                                    href="/admin/users"
                                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-lit underline decoration-dotted transition-colors hover:text-lit-2"
                                >
                                    Bersihkan pencarian
                                </Link>
                            ) : null
                        }
                    />

                    {/* One ruled strip: the field, then the stamp that submits it */}
                    <form
                        onSubmit={submitSearch}
                        className="mt-4 grid gap-px border border-line-2 bg-line sm:grid-cols-[minmax(0,1fr)_auto]"
                    >
                        <div className="min-w-0 bg-plot-2 px-3 py-3">
                            <label
                                htmlFor="pelanggan-search"
                                className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2"
                            >
                                Cari nama, email, telepon, atau alamat
                            </label>
                            <Field
                                id="pelanggan-search"
                                type="search"
                                name="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Nama, email, telepon, atau alamat"
                            />
                        </div>

                        <div className="flex items-end bg-plot-2 px-3 py-3">
                            <Stamp type="submit" variant="secondary" className="w-full sm:w-auto">
                                Cari
                            </Stamp>
                        </div>
                    </form>

                    {rows.length > 0 ? (
                        <>
                            <div className="register mt-4 overflow-x-auto">
                                <table className="data-table min-w-[900px]">
                                    <caption className="sr-only">
                                        Register pelanggan: nama, email, telepon, alamat, peran, jumlah pesanan,
                                        dan tanggal bergabung.
                                    </caption>
                                    <thead>
                                        <tr>
                                            <th scope="col">Pelanggan</th>
                                            <th scope="col">Email</th>
                                            <th scope="col">Telepon</th>
                                            <th scope="col">Alamat</th>
                                            <th scope="col">Peran</th>
                                            <th scope="col" className="text-right">
                                                Pesanan
                                            </th>
                                            <th scope="col">Bergabung</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((user) => (
                                            <CustomerRow key={user.id} user={user} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                    Menampilkan {users?.from || 0}–{users?.to || 0} dari{' '}
                                    {count(users?.total || 0)} pelanggan
                                </span>
                                {users?.links?.length > 3 && <Pager paginator={users} />}
                            </div>
                        </>
                    ) : (
                        <div className="mt-4">
                            <EmptyState
                                title={
                                    pastLastPage
                                        ? `Halaman ${users?.current_page || 1} berada di luar register`
                                        : searchActive
                                          ? `Tidak ada pelanggan yang cocok dengan “${currentSearch}”`
                                          : 'Register pelanggan masih kosong'
                                }
                                description={
                                    pastLastPage
                                        ? `Pencarian memuat ${count(totalAccounts)} akun, tetapi halaman ini tidak memuat satu baris pun. Kembali ke halaman pertama untuk membacanya.`
                                        : searchActive
                                          ? `Pencarian “${currentSearch}” hanya menelusuri nama, email, telepon, dan alamat pada tabel users. Periksa ejaan istilahnya, atau bersihkan pencarian untuk membaca seluruh register.`
                                          : 'Tabel users belum berisi satu akun pun. Akun tercatat di sini setelah pendaftaran di halaman daftar toko.'
                                }
                                action={
                                    pastLastPage ? (
                                        <Link href={registerHref} className="stamp-2">
                                            Ke halaman pertama
                                        </Link>
                                    ) : searchActive ? (
                                        <Link href="/admin/users" className="stamp-2">
                                            Bersihkan pencarian
                                        </Link>
                                    ) : (
                                        <Link href="/register" className="stamp-2">
                                            Buka halaman daftar
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
