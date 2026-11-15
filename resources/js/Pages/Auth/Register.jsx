import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import ShopLayout from '@/Layouts/ShopLayout';
import { BrandMark, BRAND } from '@/Components/Brand';
import { Callout, Dim, SheetHead, TitleBlock, ZoneFrame } from '@/Components/Sheet';
import { Field, LabelledField, Stamp } from '@/Components/Controls';
import { count, isoDate } from '@/lib/format';

/**
 * The registration sheet, built like the sign-in sheet: statement on the left,
 * the framed form on the right, and an annotation underneath that says what the
 * controller does with the six fields once they are sent. The only password rules
 * printed here are the two the controller actually enforces.
 */

export default function Register() {
    const { cartCount = 0 } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        username: '',
        email: '',
        password_1: '',
        password_2: '',
        phone: '',
        address: '',
    });

    const submit = (event) => {
        event.preventDefault();
        if (processing) {
            return;
        }
        post('/register');
    };

    return (
        <ShopLayout newsletter={false}>
            <Head title="Daftar — RAKIT" />

            {/* ── The desk, and the sheet lying on it ──────────────────────── */}
            <section className="flex min-h-full flex-col justify-center border-b border-ink bg-sheet-2">
                <div className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
                        {/* ── Statement side: what registering does ────────── */}
                        <div className="lg:col-span-6">
                            <div className="flex items-center gap-3">
                                <BrandMark className="h-8 w-8 text-cyan" strokeWidth={1.75} />
                                <span className="font-display text-[22px] font-extrabold uppercase leading-none tracking-[0.14em] text-ink">
                                    {BRAND.name}
                                </span>
                            </div>

                            <h1 className="mt-7 font-display text-[32px] font-extrabold uppercase leading-[0.98] tracking-[-0.015em] text-ink sm:text-[38px]">
                                Buat akun, agar nota
                                <br />
                                tersimpan atas nama Anda.
                            </h1>

                            <p className="mt-4 max-w-[54ch] text-[13px] leading-relaxed text-ink-2">
                                Formulir ini membuat akun Anda sendiri di basis data toko. Nama, email, dan
                                kata sandi menjadi ID login Anda; nomor telepon dan alamat yang Anda isi di
                                sini muncul sebagai isi awal formulir pengiriman saat Anda memesan.
                            </p>

                            <div className="mt-7 max-w-md">
                                <TitleBlock
                                    cells={[
                                        { label: 'Lembar', value: 'Daftar / 03' },
                                        { label: 'Revisi', value: isoDate() },
                                        { label: 'Skala', value: '1:1 — IDR' },
                                    ]}
                                />
                            </div>

                            <div className="mt-6 max-w-md">
                                <Callout k="Peran">Akun baru tercatat sebagai customer di tabel users</Callout>
                                <Callout k="Kata sandi">
                                    Minimal 6 karakter, konfirmasi harus sama, disimpan sebagai hash
                                </Callout>
                                <Callout k="Isi awal">
                                    Telepon dan alamat mengisi formulir pengiriman saat memesan
                                </Callout>
                            </div>

                            <p className="mt-4 max-w-[58ch] text-[11px] leading-relaxed text-ink-3">
                                Pendaftaran menulis dua baris: satu di tabel users, satu di tabel user_info
                                — yang memicu trigger after_user_info_insert menyalinnya ke
                                user_info_backup.
                            </p>

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
                                    label="Formulir pendaftaran"
                                    readouts={[{ label: 'Tujuan', value: 'POST /register' }]}
                                />

                                <form onSubmit={submit} className="px-4 py-5 sm:px-5">
                                    <LabelledField
                                        label="Nama lengkap *"
                                        hint="Dipakai sebagai nama penerima saat Anda memesan."
                                        error={errors.username}
                                    >
                                        <Field
                                            id="register-username"
                                            name="username"
                                            type="text"
                                            required
                                            maxLength={100}
                                            autoComplete="name"
                                            placeholder="Nama lengkap Anda"
                                            value={data.username}
                                            onChange={(event) => setData('username', event.target.value)}
                                            aria-invalid={errors.username ? true : undefined}
                                        />
                                    </LabelledField>

                                    <div className="mt-4">
                                        <LabelledField label="Alamat email *" error={errors.email}>
                                            <Field
                                                id="register-email"
                                                name="email"
                                                type="email"
                                                required
                                                maxLength={255}
                                                autoComplete="email"
                                                placeholder="nama@email.com"
                                                value={data.email}
                                                onChange={(event) => setData('email', event.target.value)}
                                                aria-invalid={errors.email ? true : undefined}
                                            />
                                        </LabelledField>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <LabelledField
                                            label="Kata sandi *"
                                            hint="Minimal 6 karakter."
                                            error={errors.password_1}
                                        >
                                            <Field
                                                id="register-password-1"
                                                name="password_1"
                                                type="password"
                                                required
                                                autoComplete="new-password"
                                                placeholder="Kata sandi baru"
                                                value={data.password_1}
                                                onChange={(event) =>
                                                    setData('password_1', event.target.value)
                                                }
                                                aria-invalid={errors.password_1 ? true : undefined}
                                            />
                                        </LabelledField>

                                        <LabelledField
                                            label="Ulangi kata sandi *"
                                            hint="Harus sama persis dengan kata sandi yang Anda isi."
                                            error={errors.password_2}
                                        >
                                            <Field
                                                id="register-password-2"
                                                name="password_2"
                                                type="password"
                                                required
                                                autoComplete="new-password"
                                                placeholder="Ulangi kata sandi"
                                                value={data.password_2}
                                                onChange={(event) =>
                                                    setData('password_2', event.target.value)
                                                }
                                                aria-invalid={errors.password_2 ? true : undefined}
                                            />
                                        </LabelledField>
                                    </div>

                                    <div className="mt-4">
                                        <LabelledField
                                            label="Nomor telepon / WhatsApp"
                                            hint="Opsional. Menjadi isi awal nomor penerima saat memesan."
                                            error={errors.phone}
                                        >
                                            <Field
                                                id="register-phone"
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
                                                id="register-address"
                                                name="address"
                                                rows={3}
                                                maxLength={255}
                                                autoComplete="street-address"
                                                placeholder="Nama jalan, nomor rumah, kelurahan, kota, provinsi, kode pos"
                                                value={data.address}
                                                onChange={(event) => setData('address', event.target.value)}
                                                aria-invalid={errors.address ? true : undefined}
                                                className="field leading-relaxed"
                                            />
                                        </LabelledField>
                                    </div>

                                    <Stamp
                                        type="submit"
                                        size="lg"
                                        disabled={processing}
                                        className="mt-5 w-full"
                                    >
                                        {processing ? 'Mendaftarkan' : 'Buat akun'}
                                    </Stamp>
                                </form>

                                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-rule px-4 py-3 sm:px-5">
                                    <span className="text-[12px] text-ink-2">Sudah punya akun?</span>
                                    <Link
                                        href="/login"
                                        className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan underline decoration-dotted"
                                    >
                                        Masuk ke akun
                                    </Link>
                                </div>
                            </ZoneFrame>

                            {/* ── Annotation: what happens after submit ─────── */}
                            <div className="mt-6 border-t-2 border-ink pt-3">
                                <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink">
                                    Setelah dikirim
                                </h2>

                                <div className="mt-1">
                                    <Callout k="Sesi">Anda langsung masuk tanpa mengisi formulir masuk</Callout>
                                    <Callout k="Berikutnya">
                                        Dibawa ke register katalog dengan pesan selamat datang
                                    </Callout>
                                    <Callout k="Ditolak">
                                        Bila email sudah terdaftar: kolom email ditandai — pakai alamat lain
                                        atau masuk lewat halaman masuk
                                    </Callout>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </ShopLayout>
    );
}
