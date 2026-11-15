import React, { useEffect, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { BrandMark, BRAND } from '@/Components/Brand';
import LockScene from '@/Components/LockScene';
import { Callout, Dim, SheetHead, TitleBlock, ZoneFrame } from '@/Components/Sheet';
import { Field, LabelledField, Stamp } from '@/Components/Controls';
import { count, isoDate } from '@/lib/format';

/**
 * The sign-in sheet: one sheet of paper lying on the desk, not a card floating in
 * a void. The statement side states what an account actually holds, the form side
 * is a framed form with its own head, and — on a development machine only — the
 * seeded accounts sit underneath it as an annotation that fills the form.
 *
 * Those credentials are supplied by the server and are empty in any environment
 * that is not local: publishing a working administrator password on a public
 * sign-in page is not a demo affordance, it is a published credential. With no
 * accounts the block does not render at all.
 */

export default function Login() {
    const { cartCount = 0, demoAccounts = [] } = usePage().props;
    const [desktop, setDesktop] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
    );

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const submit = (event) => {
        event.preventDefault();
        if (processing) {
            return;
        }
        post('/login');
    };

    const fillDemo = (account) => {
        setData({ email: account.email, password: account.password });
        document.getElementById('login-submit')?.focus();
    };

    useEffect(() => {
        const media = window.matchMedia('(min-width: 1024px)');
        const update = () => setDesktop(media.matches);

        update();
        media.addEventListener('change', update);

        return () => media.removeEventListener('change', update);
    }, []);

    return (
        <ShopLayout newsletter={false}>
            <Head title="Masuk — RAKIT" />

            {/* ── The desk, and the sheet lying on it ──────────────────────── */}
            <section className="flex min-h-full flex-col justify-center border-b border-ink bg-sheet-2">
                <div className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                        {/* ── Statement side: what an account holds ────────── */}
                        <div className="lg:col-span-6">
                            <div className="flex items-center gap-3">
                                <BrandMark className="h-8 w-8 text-cyan" strokeWidth={1.75} />
                                <span className="font-display text-[22px] font-extrabold uppercase leading-none tracking-[0.14em] text-ink">
                                    {BRAND.name}
                                </span>
                            </div>

                            <h1 className="mt-7 font-display text-[32px] font-extrabold uppercase leading-[0.98] tracking-[-0.015em] text-ink sm:text-[38px]">
                                Satu akun menyimpan
                                <br />
                                semua nota Anda.
                            </h1>

                            <p className="mt-4 max-w-[54ch] text-[13px] leading-relaxed text-ink-2">
                                Pesanan yang dibuat saat Anda masuk dicatat atas nama akun ini, dan portal
                                pengguna membukanya kembali lengkap dengan angkanya. Nama, nomor telepon,
                                alamat pengiriman, dan kata sandi akun dapat Anda ubah sendiri dari portal
                                itu.
                            </p>

                            <div className="mt-7 max-w-md">
                                <TitleBlock
                                    cells={[
                                        { label: 'Lembar', value: 'Masuk / 02' },
                                        { label: 'Revisi', value: isoDate() },
                                        { label: 'Skala', value: '1:1 — IDR' },
                                    ]}
                                />
                            </div>

                            <div className="mt-6 max-w-md">
                                <Callout k="Pesanan">
                                    Tersimpan atas nama akun, terbaca lagi di portal pengguna
                                </Callout>
                                <Callout k="Data pribadi">
                                    Nama, telepon, dan alamat dapat Anda perbarui sendiri
                                </Callout>
                                <Callout k="Kata sandi">Diganti dari portal, minimal 6 karakter</Callout>
                            </div>

                            {/* One physical object for the promise above: the key.
                                Mounted only where it is visible, so a phone does
                                not pay for a hidden WebGL context. */}
                            {desktop && (
                                <div className="mt-6 max-w-md border border-ink bg-plot">
                                    <div className="flex items-center justify-between gap-3 border-b border-line-2 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                        <span className="text-chalk">Kunci akun / 01</span>
                                        <span className="flex items-center gap-1.5 text-lit">
                                            <span className="h-1 w-1 bg-lit" />
                                            3D
                                        </span>
                                    </div>
                                    <LockScene />
                                    <p className="border-t border-line px-3 py-2.5 text-[11px] leading-relaxed text-chalk-2">
                                        Satu kunci untuk pesanan, data pribadi, dan riwayat. Tidak ada
                                        salinan kunci di halaman ini — semuanya dibaca dari akun Anda.
                                    </p>
                                </div>
                            )}

                            {cartCount > 0 && (
                                <div className="mt-5 max-w-md">
                                    <Dim label="Tas belanja" value={`${count(cartCount)} posisi menunggu`} />
                                    <Link
                                        href="/cart"
                                        className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-cyan underline decoration-dotted"
                                    >
                                        Buka tas belanja
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* ── The form, framed and headed ───────────────────── */}
                        <div className="lg:col-span-6">
                            <ZoneFrame className="bg-sheet">
                                <SheetHead
                                    label="Formulir masuk"
                                    readouts={[{ label: 'Tujuan', value: 'POST /login' }]}
                                />

                                <form onSubmit={submit} className="px-4 py-5 sm:px-5">
                                    <LabelledField label="Alamat email" error={errors.email}>
                                        <Field
                                            id="login-email"
                                            name="email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            placeholder="nama@email.com"
                                            value={data.email}
                                            onChange={(event) => setData('email', event.target.value)}
                                            aria-invalid={errors.email ? true : undefined}
                                        />
                                    </LabelledField>

                                    <div className="mt-4">
                                        <LabelledField
                                            label="Kata sandi"
                                            error={errors.password}
                                        >
                                            <Field
                                                id="login-password"
                                                name="password"
                                                type="password"
                                                required
                                                autoComplete="current-password"
                                                placeholder="Kata sandi akun"
                                                value={data.password}
                                                onChange={(event) =>
                                                    setData('password', event.target.value)
                                                }
                                                aria-invalid={errors.password ? true : undefined}
                                            />
                                        </LabelledField>
                                    </div>

                                    <Stamp
                                        id="login-submit"
                                        type="submit"
                                        size="lg"
                                        disabled={processing}
                                        className="mt-5 w-full"
                                    >
                                        {processing ? 'Memeriksa' : 'Masuk'}
                                    </Stamp>
                                </form>

                                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-rule px-4 py-3 sm:px-5">
                                    <span className="text-[12px] text-ink-2">Belum punya akun?</span>
                                    <Link
                                        href="/register"
                                        className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan underline decoration-dotted"
                                    >
                                        Daftar akun baru
                                    </Link>
                                </div>
                            </ZoneFrame>

                            {/* ── Annotation: the seeded accounts ─────────────
                                Absent unless the server sends them, which it only
                                does on a development machine. */}
                            {demoAccounts.length > 0 && (
                            <div className="mt-6 border-t-2 border-ink pt-3">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                    <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink">
                                        Akun contoh
                                    </h2>
                                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">
                                        Untuk mencoba kedua alur
                                    </span>
                                </div>

                                {demoAccounts.map((account) => (
                                    <Callout key={account.email} k={account.role}>
                                        <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                                            <span className="min-w-0">
                                                <span className="block font-mono text-[11px] text-ink">
                                                    {account.email} ·{' '}
                                                    <span className="text-ink-2">{account.password}</span>
                                                </span>
                                                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                                                    Sandi akun · {account.scope}
                                                </span>
                                            </span>
                                            <Stamp
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => fillDemo(account)}
                                                aria-label={`Isi formulir dengan akun ${account.role}`}
                                            >
                                                Isi
                                            </Stamp>
                                        </span>
                                    </Callout>
                                ))}

                                <p className="mt-3 max-w-[58ch] text-[11px] leading-relaxed text-ink-3">
                                    Akun contoh untuk mencoba kedua sisi sistem: satu berperan admin dan
                                    mendarat di konsol kendali, satu berperan pelanggan dan mendarat di
                                    register katalog. Tombol Isi menyalin email dan kata sandinya ke
                                    formulir di atas, tanpa mengirim apa pun.
                                </p>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </ShopLayout>
    );
}
