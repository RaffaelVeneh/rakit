import React, { useEffect, useRef, useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { BrandMark, BRAND } from '@/Components/Brand';
import ChatbotWidget from '@/Components/ChatbotWidget';
import { Field } from '@/Components/Controls';
import { SheetWipe } from '@/Components/Sheet';
import { MotionToggle, ThemeToggle } from '@/Components/ThemeToggle';
import { useSettle } from '@/lib/motion';
import { notifyError, notifySuccess } from '@/lib/notify';
import { stampDate } from '@/lib/format';

/**
 * The storefront shell: an issuer strip, the sheet's own header, then the
 * drawing. Navigation is the sheet index; every figure in the strip is read from
 * the register rather than asserted.
 */

function IssuerStrip({ categories = [], auth }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="bg-plot text-chalk">
            <div className="mx-auto flex h-8 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.22em]">
                        {BRAND.name}
                    </span>
                    <span className="hidden h-3 w-px bg-chalk-2/40 sm:block" aria-hidden="true" />
                    <span className="hidden truncate font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2 sm:block">
                        {BRAND.kind}
                    </span>
                </div>

                <div className="hidden items-center gap-4 lg:flex">
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                        Register {stampDate()}
                    </span>
                    <span className="h-3 w-px bg-chalk-2/40" aria-hidden="true" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                        {categories.length} kelompok · IDR (Rp)
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {auth?.user ? (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setOpen((value) => !value)}
                                className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk transition-colors hover:text-chalk-2"
                                aria-expanded={open}
                                aria-haspopup="menu"
                            >
                                {auth.user.name}
                                <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
                            </button>

                            {open && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="Tutup menu"
                                        className="fixed inset-0 z-40 cursor-default"
                                        onClick={() => setOpen(false)}
                                    />
                                    <div
                                        role="menu"
                                        className="absolute right-0 top-full z-50 mt-2 w-56 border border-ink bg-sheet py-1"
                                    >
                                        {auth.user.is_admin && (
                                            <Link
                                                href="/admin"
                                                role="menuitem"
                                                onClick={() => setOpen(false)}
                                                className="block border-b border-rule px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cyan hover:bg-sheet-2"
                                            >
                                                Kendali · Konsol
                                            </Link>
                                        )}
                                        <Link
                                            href="/user"
                                            role="menuitem"
                                            onClick={() => setOpen(false)}
                                            className="block px-3 py-2 text-[12px] text-ink hover:bg-sheet-2"
                                        >
                                            Portal pengguna
                                        </Link>
                                        <Link
                                            href="/cart?tab=orders"
                                            role="menuitem"
                                            onClick={() => setOpen(false)}
                                            className="block px-3 py-2 text-[12px] text-ink hover:bg-sheet-2"
                                        >
                                            Riwayat pesanan
                                        </Link>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={() => {
                                                setOpen(false);
                                                router.post('/logout');
                                            }}
                                            className="block w-full border-t border-rule px-3 py-2 text-left text-[12px] text-red hover:bg-red-tint"
                                        >
                                            Keluar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk transition-colors hover:text-chalk-2"
                            >
                                Masuk
                            </Link>
                            <span className="h-3 w-px bg-chalk-2/40" aria-hidden="true" />
                            <Link
                                href="/register"
                                className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk transition-colors hover:text-chalk-2"
                            >
                                Daftar
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SheetHeader({ categories = [], cartCount = 0, url = '', onSearch }) {
    const [query, setQuery] = useState('');
    const [drawer, setDrawer] = useState(false);
    const path = String(url || '').split('?')[0];
    const params = new URLSearchParams(String(url || '').split('?')[1] || '');
    const activeCategory = params.get('category');

    const submit = (event) => {
        event.preventDefault();
        onSearch(query);
        setDrawer(false);
    };

    return (
        <header className="site-header sticky top-0 z-40 border-b border-ink bg-sheet">
            <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-16 lg:px-8">
                <div className="flex min-w-0 items-center gap-6 lg:gap-8">
                    <Link href="/" className="flex flex-none items-center gap-2.5 text-ink" aria-label={`${BRAND.name} — beranda`}>
                        <BrandMark className="h-6 w-6 text-cyan" />
                        <span className="font-display text-[19px] font-extrabold uppercase leading-none tracking-[0.14em]">
                            {BRAND.name}
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-1 xl:flex" aria-label="Kelompok produk">
                        <Link
                            href="/"
                            className={`border-b-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                                path === '/' && !activeCategory
                                    ? 'border-cyan text-ink'
                                    : 'border-transparent text-ink-3 hover:text-ink'
                            }`}
                        >
                            Semua
                        </Link>
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/?category=${category.id}`}
                                prefetch
                                className={`border-b-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                                    String(activeCategory) === String(category.id)
                                        ? 'border-cyan text-ink'
                                        : 'border-transparent text-ink-3 hover:text-ink'
                                }`}
                            >
                                {category.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex flex-none items-center gap-2 sm:gap-3">
                    <form onSubmit={submit} className="hidden w-52 md:block lg:w-64" role="search">
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3"
                                strokeWidth={1.5}
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Cari nomor bagian atau nama"
                                aria-label="Cari di register"
                                className="field py-2 pl-8 text-[12px]"
                            />
                        </div>
                    </form>

                    <ThemeToggle />

                        <MotionToggle />

                    <Link
                        href="/cart"
                        className="relative flex items-center gap-2 border border-rule-2 px-2.5 py-2 text-ink transition-colors hover:border-ink"
                        aria-label={`Tas belanja dan pesanan, ${cartCount} item di tas`}
                    >
                        <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                        <span data-measure className="font-mono text-[11px] font-medium">
                            {String(cartCount).padStart(2, '0')}
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setDrawer((value) => !value)}
                        className="border border-rule-2 p-2 text-ink transition-colors hover:border-ink xl:hidden"
                        aria-label={drawer ? 'Tutup menu' : 'Buka menu'}
                        aria-expanded={drawer}
                    >
                        {drawer ? <X className="h-4 w-4" strokeWidth={1.5} /> : <Menu className="h-4 w-4" strokeWidth={1.5} />}
                    </button>
                </div>
            </div>

            {drawer && (
                <div className="border-t border-rule bg-sheet px-4 py-3 xl:hidden">
                    <form onSubmit={submit} role="search" className="mb-3">
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Cari nomor bagian atau nama"
                            aria-label="Cari di register"
                            className="field text-[12px]"
                        />
                    </form>
                    <nav className="grid grid-cols-2 gap-px bg-rule" aria-label="Kelompok produk">
                        <Link
                            href="/"
                            onClick={() => setDrawer(false)}
                            className="bg-sheet px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink"
                        >
                            Semua
                        </Link>
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/?category=${category.id}`}
                                prefetch
                                onClick={() => setDrawer(false)}
                                className="bg-sheet px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink"
                            >
                                {category.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}

function SubscriptionStrip() {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);

    const submit = (event) => {
        event.preventDefault();
        setSending(true);
        router.post(
            '/newsletter/subscribe',
            { email },
            {
                preserveScroll: true,
                // The controller flashes its own confirmation; reporting success
                // here as well would raise two notices for one action.
                onSuccess: () => setEmail(''),
                onError: () => notifyError('Alamat ditolak', 'Periksa kembali format email Anda.'),
                onFinish: () => setSending(false),
            },
        );
    };

    return (
        <section className="border-t border-ink bg-sheet-2">
            <div className="mx-auto grid max-w-[1400px] gap-4 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8">
                <div className="lg:col-span-5">
                    <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.02em] text-ink">
                        Pemberitahuan rilis
                    </h2>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
                        Satu email saat ada posisi baru masuk register. Tidak ada surat lain.
                    </p>
                </div>
                <form onSubmit={submit} className="flex gap-2 lg:col-span-7 lg:justify-end">
                    <label className="sr-only" htmlFor="newsletter-email">
                        Alamat email
                    </label>
                    <Field
                        id="newsletter-email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="nama@email.com"
                        className="max-w-sm"
                    />
                    <button type="submit" className="stamp flex-none" disabled={sending}>
                        {sending ? 'Kirim' : 'Daftar'}
                    </button>
                </form>
            </div>
        </section>
    );
}

function Colophon({ categories = [], registerCount = null }) {
    return (
        <footer className="bg-plot text-chalk-2">
            <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-10 border-b border-line-2 pb-10 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <div className="flex items-center gap-2.5 text-chalk">
                            <BrandMark className="h-6 w-6 text-lit" />
                            <span className="font-display text-[19px] font-extrabold uppercase leading-none tracking-[0.14em]">
                                {BRAND.name}
                            </span>
                        </div>
                        <p className="mt-3 max-w-xs text-[12px] leading-relaxed">
                            {BRAND.kind}. Setiap posisi, harga, dan jumlah stok di lembar ini dibaca
                            langsung dari basis data toko.
                        </p>
                        {registerCount > 0 && (
                            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-chalk-2">
                                Register · {registerCount} posisi terdaftar
                            </p>
                        )}
                    </div>

                    <nav className="lg:col-span-3" aria-labelledby="colophon-groups">
                        <h3
                            id="colophon-groups"
                            className="font-mono text-[9px] uppercase tracking-[0.18em] text-chalk"
                        >
                            Kelompok produk
                        </h3>
                        <ul className="mt-3 space-y-2">
                            {categories.map((category) => (
                                <li key={category.id}>
                                    <Link
                                        href={`/?category=${category.id}`}
                                prefetch
                                        className="text-[12px] transition-colors hover:text-chalk"
                                    >
                                        {category.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav className="lg:col-span-3" aria-labelledby="colophon-account">
                        <h3
                            id="colophon-account"
                            className="font-mono text-[9px] uppercase tracking-[0.18em] text-chalk"
                        >
                            Akun & pesanan
                        </h3>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <Link href="/cart?tab=orders" className="text-[12px] transition-colors hover:text-chalk">
                                    Riwayat pesanan
                                </Link>
                            </li>
                            <li>
                                <Link href="/cart" className="text-[12px] transition-colors hover:text-chalk">
                                    Tas belanja
                                </Link>
                            </li>
                            <li>
                                <Link href="/user" className="text-[12px] transition-colors hover:text-chalk">
                                    Portal pengguna
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-[12px] transition-colors hover:text-chalk">
                                    Masuk
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    <nav className="lg:col-span-2" aria-labelledby="colophon-system">
                        <h3
                            id="colophon-system"
                            className="font-mono text-[9px] uppercase tracking-[0.18em] text-chalk"
                        >
                            Berkas sistem
                        </h3>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <Link href="/pyramid" className="text-[12px] transition-colors hover:text-chalk">
                                    Modul rujukan
                                </Link>
                            </li>
                            <li>
                                <Link href="/hardware" className="text-[12px] transition-colors hover:text-chalk">
                                    Perangkat keras
                                </Link>
                            </li>
                            <li>
                                <Link href="/software" className="text-[12px] transition-colors hover:text-chalk">
                                    Perangkat lunak
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin" className="text-[12px] transition-colors hover:text-lit">
                                    Konsol kendali
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>

                <div className="flex flex-col gap-3 pt-6 font-mono text-[10px] uppercase tracking-[0.14em] sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        © {new Date().getFullYear()} {BRAND.name} · Indonesia
                    </span>
                    <span className="text-chalk-3">
                        Laravel · Inertia · MySQL — Lembar diterbitkan {stampDate()}
                    </span>
                </div>
            </div>
        </footer>
    );
}

export default function ShopLayout({ children, newsletter = true, registerCount = null }) {
    const { props, url = '' } = usePage();
    const { auth, categories, cartCount, flash, registerPositions } = props || {};

    // The register total is shared on every request, so a page that does not fetch
    // the catalogue still prints the real figure rather than a zero.
    const registerTotal = registerCount ?? registerPositions ?? null;

    useEffect(() => {
        window.__flashLog = (window.__flashLog || []).concat([
            { t: Date.now(), success: flash?.success ?? null, error: flash?.error ?? null },
        ]);
        if (flash?.success) {
            notifySuccess(flash.success);
        }
        if (flash?.error) {
            notifyError(flash.error);
        }
        // Keyed on the flash object, not on the message text: Inertia hands back a
        // fresh object per response, so repeating the same action still reports.
        // Depend on the strings alone and the second identical notice never fires.
    }, [flash]);

    const handleSearch = (query) => {
        const params = {};
        if (String(query || '').trim()) {
            params.search = String(query).trim();
        }
        router.get('/', params, { preserveState: false });
    };

    const rootRef = useRef(null);
    useSettle(rootRef, [url]);

    return (
        <div ref={rootRef} className="sheet flex min-h-screen flex-col font-sans">
            <IssuerStrip categories={categories || []} auth={auth} />
            <SheetHeader
                categories={categories || []}
                cartCount={cartCount || 0}
                url={url}
                onSearch={handleSearch}
            />

            <main className="page-main flex-1">{children}</main>

                {/* A rule drawn across the top as one sheet gives way to the next. */}
                <SheetWipe url={url} />

            {newsletter && <SubscriptionStrip />}
            <Colophon categories={categories || []} registerCount={registerTotal} />
            <ChatbotWidget />
        </div>
    );
}
