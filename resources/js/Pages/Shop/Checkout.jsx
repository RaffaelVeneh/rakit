import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { Bill, Callout, PageBand } from '@/Components/Sheet';
import { Field, LabelledField, Lamp, Stamp } from '@/Components/Controls';
import { notifyError } from '@/lib/notify';
import { amount, count, rupiah } from '@/lib/format';

/**
 * Checkout is a purchase order being filled in by hand: the delivery block and
 * the payment block on one side, the bill it produces on the other. Every figure
 * printed here is read from the cart the controller handed over; nothing about
 * shipping cost, tax, or delivery time is asserted, because the system does not
 * know any of it.
 */

const PAYMENT_METHODS = [
    { value: 'Transfer Bank (BCA / Mandiri)', label: 'Transfer bank', note: 'BCA / Mandiri' },
    { value: 'QRIS / E-Wallet (GoPay, OVO, Dana)', label: 'QRIS / e-wallet', note: 'GoPay, OVO, Dana' },
    { value: 'Cash On Delivery (COD)', label: 'Bayar di tempat', note: 'COD' },
];

/** Field names as the reader knows them, so a rejection names the column to fix. */
const FIELD_LABELS = {
    customer_name: 'Nama penerima',
    customer_email: 'Email pesanan',
    customer_phone: 'Nomor handphone',
    shipping_address: 'Alamat lengkap tujuan',
    payment_method: 'Metode pembayaran',
    notes: 'Catatan pengiriman',
};

export default function Checkout({ cart, subtotal, total, user }) {
    const { errors = {} } = usePage().props;

    const items = Object.values(cart || {});
    const positions = items.length;
    const lineValue = (item) => Number(item.price) * Number(item.quantity);
    const totalValue = Number(total ?? subtotal ?? items.reduce((sum, item) => sum + lineValue(item), 0));

    const [form, setForm] = useState({
        customer_name: user?.name || '',
        customer_phone: user?.phone || '',
        customer_email: user?.email || '',
        shipping_address: user?.address || '',
        notes: '',
        payment_method: PAYMENT_METHODS[0].value,
    });
    const [processing, setProcessing] = useState(false);

    const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

    const submit = (event) => {
        event.preventDefault();
        if (processing) {
            return;
        }
        setProcessing(true);
        router.post('/checkout/process', form, {
            onError: (rejected) => {
                const first = Object.keys(rejected || {})[0];
                notifyError(
                    'Pesanan ditolak',
                    first
                        ? `Kolom "${FIELD_LABELS[first] || first}" belum benar. Perbaiki isian bertanda merah.`
                        : 'Periksa kembali isian formulir yang bertanda merah.',
                );
            },
            onFinish: () => setProcessing(false),
        });
    };

    if (positions === 0) {
        return (
            <ShopLayout>
                <Head title="Pesanan pembelian — RAKIT" />
                <PageBand
                    path={[{ label: 'Register', href: '/' }, { label: 'Pesanan pembelian' }]}
                    title="Pesanan pembelian"
                />
                <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
                    <div className="border border-rule bg-sheet-2 px-6 py-14 text-center">
                        <h2 className="font-display text-[15px] font-semibold uppercase tracking-[0.02em] text-ink">
                            Tidak ada posisi untuk dipesan
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-ink-2">
                            Tas belanja kosong, jadi tidak ada yang bisa dicatat sebagai pesanan. Tambahkan
                            posisi dari register terlebih dahulu.
                        </p>
                        <Link href="/" className="stamp-2 mt-5">
                            Buka register
                        </Link>
                    </div>
                </div>
            </ShopLayout>
        );
    }

    return (
        <ShopLayout>
            <Head title="Pesanan pembelian — RAKIT" />

            <PageBand
                path={[{ label: 'Register', href: '/' }, { label: 'Tas belanja', href: '/cart' }, { label: 'Pesanan pembelian' }]}
                title="Pesanan pembelian"
                meta="Lengkapi alamat pengiriman dan pilih metode pembayaran. Semua kolom bertanda * harus diisi sebelum pesanan dapat dicatat."
            />

            <form onSubmit={submit} noValidate className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                    {/* ── The order itself ─────────────────────────────────── */}
                    <div className="lg:col-span-7">
                        <fieldset className="border-t-2 border-ink pt-4">
                            <legend className="sr-only">Pengiriman</legend>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                                <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.12em] text-ink">
                                    Pengiriman
                                </h2>
                                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                    Penerima &amp; alamat tujuan
                                </span>
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <LabelledField
                                    label="Nama penerima *"
                                    hint="Nama yang menerima paket di alamat tujuan."
                                    error={errors.customer_name}
                                >
                                    <Field
                                        name="customer_name"
                                        value={form.customer_name}
                                        onChange={set('customer_name')}
                                        autoComplete="name"
                                        placeholder="Nama lengkap"
                                        aria-invalid={errors.customer_name ? true : undefined}
                                    />
                                </LabelledField>

                                <LabelledField
                                    label="Nomor handphone *"
                                    error={errors.customer_phone}
                                >
                                    <Field
                                        name="customer_phone"
                                        value={form.customer_phone}
                                        onChange={set('customer_phone')}
                                        autoComplete="tel"
                                        inputMode="tel"
                                        placeholder="08xxxxxxxxxx"
                                        aria-invalid={errors.customer_phone ? true : undefined}
                                    />
                                </LabelledField>

                                <div className="sm:col-span-2">
                                    <LabelledField
                                        label="Email pesanan *"
                                        hint="Alamat yang dicatat pada dokumen pesanan."
                                        error={errors.customer_email}
                                    >
                                        <Field
                                            name="customer_email"
                                            type="email"
                                            value={form.customer_email}
                                            onChange={set('customer_email')}
                                            autoComplete="email"
                                            placeholder="nama@email.com"
                                            aria-invalid={errors.customer_email ? true : undefined}
                                        />
                                    </LabelledField>
                                </div>

                                <div className="sm:col-span-2">
                                    <LabelledField
                                        label="Alamat lengkap tujuan *"
                                        hint="Jalan, nomor, kelurahan, kota, provinsi, dan kode pos."
                                        error={errors.shipping_address}
                                    >
                                        <textarea
                                            name="shipping_address"
                                            rows={3}
                                            value={form.shipping_address}
                                            onChange={set('shipping_address')}
                                            autoComplete="street-address"
                                            placeholder="Nama jalan, nomor gedung, kelurahan, kota, provinsi, kode pos"
                                            aria-invalid={errors.shipping_address ? true : undefined}
                                            className="field leading-relaxed"
                                        />
                                    </LabelledField>
                                </div>

                                <div className="sm:col-span-2">
                                    <LabelledField
                                        label="Catatan pengiriman"
                                        hint="Opsional. Dipakai operator saat menyiapkan paket."
                                        error={errors.notes}
                                    >
                                        <Field
                                            name="notes"
                                            value={form.notes}
                                            onChange={set('notes')}
                                            maxLength={500}
                                            placeholder="Contoh: titipkan ke resepsionis"
                                        />
                                    </LabelledField>
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="mt-8 border-t-2 border-ink pt-4">
                            <legend className="sr-only">Pembayaran</legend>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                                <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.12em] text-ink">
                                    Pembayaran
                                </h2>
                                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                    Satu metode per pesanan
                                </span>
                            </div>

                            <div className="mt-4 border-t border-rule" role="group" aria-labelledby="payment-group-label">
                                <h3 id="payment-group-label" className="sr-only">
                                    Metode pembayaran
                                </h3>
                                {PAYMENT_METHODS.map((method) => {
                                    const selected = form.payment_method === method.value;
                                    return (
                                        <label
                                            key={method.value}
                                            className={`relative flex cursor-pointer items-start gap-3 border-b border-rule py-3 pl-4 pr-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-cyan ${
                                                selected ? 'bg-cyan-tint' : 'hover:bg-sheet-2'
                                            }`}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={`absolute inset-y-0 left-0 w-[2px] ${
                                                    selected ? 'bg-cyan' : 'bg-transparent'
                                                }`}
                                            />
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value={method.value}
                                                checked={selected}
                                                onChange={set('payment_method')}
                                                className="sr-only"
                                            />
                                            <span
                                                aria-hidden="true"
                                                className={`mt-0.5 h-3.5 w-3.5 flex-none border ${
                                                    selected ? 'border-cyan bg-cyan' : 'border-rule-2 bg-sheet'
                                                }`}
                                            />
                                            <span className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-4 gap-y-1">
                                                <span className="min-w-0">
                                                    <span className="block font-display text-[13px] font-semibold uppercase tracking-[0.04em] text-ink">
                                                        {method.label}
                                                    </span>
                                                    {/* On the tinted ground the note is tinted from that
                                                        hue, not grey: annotation ink on cyan-tint measures
                                                        4.02:1, under AA for text this size. */}
                                                    <span
                                                        className={`mt-0.5 block font-mono text-[10px] uppercase tracking-[0.12em] ${
                                                            selected ? 'text-cyan' : 'text-ink-3'
                                                        }`}
                                                    >
                                                        {method.note}
                                                    </span>
                                                </span>
                                                <span className="flex flex-none items-center gap-2 pt-0.5">
                                                    <Lamp tone="cyan" state={selected ? 'lit' : 'unlit'} />
                                                    {/* The word stays at every width: a lamp alone is a
                                                        shape, and the contract is lamp plus word. */}
                                                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-2">
                                                        {selected ? 'Dipilih' : 'Tersedia'}
                                                    </span>
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            {errors.payment_method && (
                                <p className="mt-2 text-[11px] font-medium text-red">{errors.payment_method}</p>
                            )}
                        </fieldset>

                        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-4">
                            <Link
                                href="/cart"
                                className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan underline decoration-dotted"
                            >
                                Kembali ke tas belanja
                            </Link>
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                                {count(positions)} posisi · {rupiah(totalValue)}
                            </span>
                        </div>

                        <Stamp
                            type="submit"
                            size="lg"
                            disabled={processing}
                            className="mt-4 w-full"
                        >
                            {processing ? 'Mencatat pesanan' : 'Kirim pesanan'}
                        </Stamp>

                        <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
                            Setelah dikirim, pesanan dicatat di basis data dengan nomor pesanan baru, jumlah
                            stok tiap posisi dikurangi, dan tas belanja dikosongkan. Anda akan dibawa ke
                            dokumen pesanan.
                        </p>
                    </div>

                    {/* ── The bill it produces ─────────────────────────────── */}
                    <div className="lg:col-span-5">
                        <div className="lg:sticky lg:top-24">
                            <Bill
                                title={`Pesanan · ${count(positions)} posisi`}
                                rows={[
                                    { label: 'Subtotal posisi', value: rupiah(subtotal ?? totalValue) },
                                    { label: 'Jumlah baris', value: count(positions) },
                                ]}
                                total={rupiah(total ?? subtotal ?? totalValue)}
                                totalLabel="Total tagihan"
                                footnote="Angka di atas dibaca dari tas belanja saat ini, tanpa tambahan biaya lain. Nomor pesanan dan total dicatat saat pesanan dikirim."
                            >
                                <ul className="border-t border-rule">
                                    {items.map((item, index) => (
                                        <li
                                            key={item.id ?? index}
                                            className={`flex items-start justify-between gap-4 px-4 py-2.5 ${
                                                index > 0 ? 'border-t border-rule' : ''
                                            }`}
                                        >
                                            <span className="min-w-0">
                                                <span className="block text-[12px] leading-snug text-ink">
                                                    {item.name}
                                                </span>
                                                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                                                    {item.category ? `${item.category} · ` : ''}
                                                    {count(item.quantity)} × {amount(item.price)}
                                                </span>
                                            </span>
                                            <span data-measure className="flex-none font-mono text-[12px] text-ink">
                                                <span className="text-[11px] text-ink-3">Rp</span>{' '}
                                                {amount(lineValue(item))}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </Bill>

                            <div className="mt-4 border border-rule bg-sheet px-4 py-3">
                                <Callout k="Metode">
                                    {PAYMENT_METHODS.find((method) => method.value === form.payment_method)?.label}
                                </Callout>
                                <Callout k="Status awal">Menunggu verifikasi operator</Callout>
                                <Callout k="Pengiriman">Dikoordinasi operator setelah pesanan dicatat</Callout>
                                <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
                                    Pembayaran belum terjadi di halaman ini. Saat pesanan dikirim, sistem
                                    menerbitkan nomor pesanan dan mencatatnya dengan status MENUNGGU.
                                </p>
                            </div>

                            <div className="mt-3 flex flex-col gap-1 border border-rule px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                    Jalur pesanan
                                </span>
                                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-2">
                                    Register · Tas · Pesanan
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </ShopLayout>
    );
}
