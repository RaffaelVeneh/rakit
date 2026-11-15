import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import ShopLayout from '@/Layouts/ShopLayout';
import { Callout, PageBand, Readout, SectionHead, SheetHead, ZoneFrame } from '@/Components/Sheet';
import { EmptyState, Field, LabelledField, Lamp, Pager, Stamp, StatusLamp } from '@/Components/Controls';
import { notifyError } from '@/lib/notify';
import { orderState } from '@/lib/catalog';
import { amount, count, eventStamp, rupiah, stampDate } from '@/lib/format';

/**
 * The customer's own file: who the account belongs to, what it has spent, the two
 * editable fields the controller accepts, and the orders it holds. Status is a
 * lamp, money and dates are measurements, and nothing here is asserted that the
 * controller did not pass.
 */

const TABS = [
    { key: 'profile', label: 'Data pribadi' },
    { key: 'laporan', label: 'Riwayat pesanan' },
];

/** One order: a scannable summary row that opens onto its own positions. */
function OrderRow({ order }) {
    const items = order.items || [];

    return (
        <details className="group">
            <summary className="grid cursor-pointer list-none grid-cols-[auto_1fr_auto] items-center gap-x-3 px-3 py-3 transition-colors hover:bg-sheet-2 [&::-webkit-details-marker]:hidden">
                <ChevronRight
                    className="h-3.5 w-3.5 text-ink-3 transition-transform group-open:rotate-90"
                    strokeWidth={1.5}
                />

                <span className="min-w-0">
                    <span className="block font-mono text-[12px] font-medium uppercase tracking-[0.02em] text-ink">
                        {order.order_number}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
                        {eventStamp(order.created_at)} · {count(items.length)} posisi
                    </span>
                </span>

                <span className="flex flex-none flex-col items-end gap-1.5">
                    <StatusLamp state={orderState(order.status)} />
                    <span data-measure className="font-mono text-[12px] text-ink">
                        <span className="text-[11px] text-ink-3">Rp</span> {amount(order.total_amount)}
                    </span>
                </span>
            </summary>

            <div className="border-t border-rule bg-sheet-2 px-3 py-2">
                {items.length > 0 ? (
                    <ul>
                        {items.map((item, index) => (
                            <li
                                key={item.id}
                                className={`flex items-baseline justify-between gap-4 py-2 ${
                                    index > 0 ? 'border-t border-rule' : ''
                                }`}
                            >
                                <span className="min-w-0 text-[12px] leading-snug text-ink">
                                    {item.product_name}
                                </span>
                                <span className="flex flex-none items-baseline gap-3 font-mono text-[11px]">
                                    <span className="text-ink-3">
                                        {count(item.quantity)} × {amount(item.price)}
                                    </span>
                                    <span data-measure className="text-[12px] text-ink">
                                        <span className="text-[11px] text-ink-3">Rp</span>{' '}
                                        {amount(item.subtotal)}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="py-2 text-[12px] leading-relaxed text-ink-2">
                        Pesanan ini tercatat tanpa baris posisi yang terbaca.
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-rule pt-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                        Bayar · {order.payment_method || '—'}
                    </span>
                    <Link
                        href={`/order/success/${order.id}`}
                        className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan underline decoration-dotted"
                    >
                        Buka dokumen pesanan
                    </Link>
                </div>
            </div>
        </details>
    );
}

export default function Dashboard({ user, stats = {}, orders, activeTab = 'profile' }) {
    const account = user || {};
    const tab = activeTab === 'laporan' ? 'laporan' : 'profile';
    const orderList = orders?.data || [];
    const recordedOrders = orders?.total ?? orderList.length;
    const roleLabel = account.role === 'admin' ? 'Admin' : 'Pelanggan';

    const { data, setData, put, processing, errors, reset } = useForm({
        name: account.name || '',
        phone: account.phone || '',
        address: account.address || '',
        password: '',
        password_confirmation: '',
    });

    const saveProfile = (event) => {
        event.preventDefault();
        if (processing) {
            return;
        }
        put('/user/profile', {
            preserveScroll: true,
            // Success is reported once, by the layout, from the controller's own
            // flash message: "Data pribadi pengguna berhasil diperbarui!".
            onSuccess: () => reset('password', 'password_confirmation'),
            onError: () =>
                notifyError('Data ditolak', 'Periksa kolom bertanda merah, lalu simpan lagi.'),
        });
    };

    const logout = () => router.post('/logout');

    return (
        <ShopLayout>
            <Head title="Portal pengguna — RAKIT" />

            <PageBand
                path={[{ label: 'Beranda', href: '/' }, { label: 'Portal pengguna' }]}
                title="Portal pengguna"
                meta="Berkas akun Anda: identitas yang tercatat, angka pesanan, data pribadi yang dapat diubah, dan riwayat pesanan. Setiap angka di lembar ini dibaca dari tabel users, orders, dan order_items saat halaman diminta."
                actions={
                    <>
                        <Stamp as={Link} href="/" variant="secondary">
                            Buka register
                        </Stamp>
                        <Stamp variant="secondary" onClick={logout}>
                            Keluar
                        </Stamp>
                    </>
                }
            />

            <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                {/* ── Who the account is, and what it has spent ────────────── */}
                <section className="grid gap-8 lg:grid-cols-12 lg:gap-12">
                    <div className="lg:col-span-5">
                        <ZoneFrame className="bg-sheet">
                            <SheetHead
                                label="Identitas akun"
                                readouts={[{ label: 'Peran', value: roleLabel }]}
                            />
                            <div className="px-4 py-3">
                                <Callout k="Nama">{account.name}</Callout>
                                <Callout k="Email">
                                    <span className="font-mono text-[11px]">{account.email}</span>
                                </Callout>
                                <Callout k="Telepon">{account.phone || 'Belum diisi'}</Callout>
                                <Callout k="Alamat">{account.address || 'Belum diisi'}</Callout>
                                <Callout k="Terdaftar">{stampDate(account.created_at)}</Callout>
                            </div>
                        </ZoneFrame>

                        <p className="mt-3 max-w-[58ch] text-[11px] leading-relaxed text-ink-3">
                            Nama, telepon, dan alamat di atas yang dipakai sebagai isi awal formulir
                            pengiriman saat Anda memesan.
                        </p>
                    </div>

                    <div className="lg:col-span-7">
                        <SectionHead title="Angka akun" meta={`Dibaca ${stampDate()}`} />

                        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                            <Readout
                                label="Total belanja"
                                value={rupiah(stats.totalSpent)}
                                sub="Tanpa status cancelled"
                            />
                            <Readout
                                label="Total pesanan"
                                value={count(stats.totalOrders)}
                                sub="Seluruh status"
                            />
                            <Readout
                                label="Selesai"
                                value={count(stats.completedOrders)}
                                sub="Status completed"
                            />
                            <Readout
                                label="Diproses"
                                value={count(stats.processingOrders)}
                                sub="Status processing"
                            />
                            <Readout
                                label="Tingkat"
                                value={stats.membershipTier || '—'}
                                sub="Dihitung dari total belanja"
                            />
                        </dl>
                    </div>
                </section>

                {/* ── Which part of the file is open ───────────────────────── */}
                <nav
                    aria-label="Bidang portal"
                    className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-3"
                >
                    <div className="flex items-center gap-1">
                        <span className="mr-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                            Bidang
                        </span>
                        {TABS.map((item) => {
                            const current = tab === item.key;
                            return (
                                <Link
                                    key={item.key}
                                    href={`/user?tab=${item.key}`}
                                    aria-current={current ? 'page' : undefined}
                                    className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                                        current
                                            ? 'border-ink bg-ink text-sheet'
                                            : 'border-rule-2 text-ink-2 hover:border-ink hover:text-ink'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                        {count(recordedOrders)} pesanan tercatat atas nama akun ini
                    </span>
                </nav>

                {/* ── Data pribadi ─────────────────────────────────────────── */}
                {tab === 'profile' ? (
                    <section>
                        <ZoneFrame className="bg-sheet">
                            <SheetHead
                                label="Formulir data pribadi"
                                readouts={[{ label: 'Tujuan', value: 'PUT /user/profile' }]}
                            />

                            <form onSubmit={saveProfile} className="px-4 py-5 sm:px-5">
                                <p className="mb-4 border-b border-rule pb-3 text-[11px] leading-relaxed text-ink-3">
                                    Email{' '}
                                    <span className="font-mono text-[11px] text-ink-2">
                                        {account.email}
                                    </span>{' '}
                                    adalah ID login akun ini dan tidak diubah dari formulir ini.
                                </p>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <LabelledField
                                        label="Nama lengkap *"
                                        hint="Dipakai sebagai nama penerima saat Anda memesan."
                                        error={errors.name}
                                    >
                                        <Field
                                            id="profile-name"
                                            name="name"
                                            type="text"
                                            required
                                            maxLength={100}
                                            autoComplete="name"
                                            placeholder="Nama lengkap Anda"
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                            aria-invalid={errors.name ? true : undefined}
                                        />
                                    </LabelledField>

                                    <LabelledField
                                        label="Nomor telepon / WhatsApp"
                                        hint="Opsional. Menjadi isi awal nomor penerima saat memesan."
                                        error={errors.phone}
                                    >
                                        <Field
                                            id="profile-phone"
                                            name="phone"
                                            type="text"
                                            inputMode="tel"
                                            maxLength={25}
                                            autoComplete="tel"
                                            placeholder="08xxxxxxxxxx"
                                            value={data.phone}
                                            onChange={(event) => setData('phone', event.target.value)}
                                            aria-invalid={errors.phone ? true : undefined}
                                        />
                                    </LabelledField>
                                </div>

                                <div className="mt-4">
                                    <LabelledField
                                        label="Alamat pengiriman"
                                        hint="Opsional. Menjadi isi awal alamat tujuan saat memesan."
                                        error={errors.address}
                                    >
                                        <textarea
                                            id="profile-address"
                                            name="address"
                                            rows={3}
                                            maxLength={500}
                                            autoComplete="street-address"
                                            placeholder="Nama jalan, nomor rumah, kelurahan, kota, provinsi, kode pos"
                                            value={data.address}
                                            onChange={(event) => setData('address', event.target.value)}
                                            aria-invalid={errors.address ? true : undefined}
                                            className="field leading-relaxed"
                                        />
                                    </LabelledField>
                                </div>

                                <fieldset className="mt-7 border-t-2 border-ink pt-4">
                                    <legend className="sr-only">Ganti kata sandi</legend>
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                                        <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.12em] text-ink">
                                            Kata sandi
                                        </h2>
                                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                            Kosongkan bila tidak diganti
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <LabelledField
                                            label="Kata sandi baru"
                                            hint="Minimal 6 karakter."
                                            error={errors.password}
                                        >
                                            <Field
                                                id="profile-password"
                                                name="password"
                                                type="password"
                                                autoComplete="new-password"
                                                placeholder="Kata sandi baru"
                                                value={data.password}
                                                onChange={(event) =>
                                                    setData('password', event.target.value)
                                                }
                                                aria-invalid={errors.password ? true : undefined}
                                            />
                                        </LabelledField>

                                        <LabelledField
                                            label="Ulangi kata sandi baru"
                                            hint="Harus sama persis dengan kata sandi baru."
                                        >
                                            <Field
                                                id="profile-password-confirmation"
                                                name="password_confirmation"
                                                type="password"
                                                autoComplete="new-password"
                                                placeholder="Ulangi kata sandi baru"
                                                value={data.password_confirmation}
                                                onChange={(event) =>
                                                    setData('password_confirmation', event.target.value)
                                                }
                                            />
                                        </LabelledField>
                                    </div>
                                </fieldset>

                                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-4">
                                    <p className="max-w-[46ch] text-[11px] leading-relaxed text-ink-3">
                                        Yang dikirim ke basis data: nama, telepon, alamat, dan kata sandi
                                        baru bila kolomnya diisi. Email tidak ikut dikirim.
                                    </p>
                                    <Stamp type="submit" size="lg" disabled={processing}>
                                        {processing ? 'Menyimpan' : 'Simpan perubahan'}
                                    </Stamp>
                                </div>
                            </form>
                        </ZoneFrame>
                    </section>
                ) : (
                    /* ── Riwayat pesanan ──────────────────────────────────── */
                    <section>
                        <SectionHead
                            title="Riwayat pesanan"
                            meta={
                                orderList.length > 0
                                    ? `Menampilkan ${count(orders.from)}–${count(orders.to)} dari ${count(recordedOrders)}`
                                    : 'Belum ada baris'
                            }
                        />

                        {orderList.length > 0 ? (
                            <>
                                <div className="register mt-4 bg-sheet">
                                    {orderList.map((order, index) => (
                                        <div
                                            key={order.id}
                                            className={index > 0 ? 'border-t border-rule' : ''}
                                        >
                                            <OrderRow order={order} />
                                        </div>
                                    ))}
                                </div>

                                {orders?.links?.length > 3 && (
                                    <div className="mt-5 flex justify-center">
                                        <Pager paginator={orders} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="mt-4">
                                <EmptyState
                                    title="Belum ada pesanan tercatat"
                                    description="Tidak ada baris pesanan yang menunjuk ke akun ini di tabel orders. Pesanan yang dibuat saat Anda masuk akan muncul di sini beserta nomornya."
                                    action={
                                        <Link href="/" className="stamp-2">
                                            Buka register
                                        </Link>
                                    }
                                />
                            </div>
                        )}
                    </section>
                )}

                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-rule pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                    <Lamp tone="cyan" state="lit" />
                    Angka di lembar ini dibaca dari tabel users, orders, dan order_items — bukan disimpan
                    di halaman.
                </p>
            </div>
        </ShopLayout>
    );
}
