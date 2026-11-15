import React, { useEffect, useRef, useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { ExternalLink, LogOut, Menu, X } from 'lucide-react';
import { BrandMark, BRAND } from '@/Components/Brand';
import { Lamp } from '@/Components/Controls';
import { SheetWipe } from '@/Components/Sheet';
import TechScene from '@/Components/TechScene';
import { MotionToggle, ThemeToggle } from '@/Components/ThemeToggle';
import { useSettle } from '@/lib/motion';
import { notifyError, notifySuccess } from '@/lib/notify';
import { isoDate } from '@/lib/format';

/**
 * The operator console: the same document language on the plotter ground. The
 * left rail is the sheet index; the strip above the work is the record of what
 * the machine actually is, printed from measured values rather than asserted.
 */

const SHEETS = [
    { href: '/admin', sheet: '01', label: 'Antrean & posisi' },
    { href: '/admin/products', sheet: '02', label: 'Katalog produk' },
    { href: '/admin/categories', sheet: '03', label: 'Kelompok produk' },
    { href: '/admin/orders', sheet: '04', label: 'Pesanan' },
    { href: '/admin/users', sheet: '05', label: 'Pelanggan' },
];

function RecordStrip({ system, user }) {
    return (
        <div className="flex h-12 items-center justify-between gap-4 border-b border-line-2 bg-plot-2 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                <span className="flex items-center gap-2 text-chalk">
                    <Lamp tone="lit" state="lit" />
                    MySQL {system?.database ? String(system.database).split('-')[0] : '—'}
                </span>
                <span className="hidden h-3 w-px bg-line-2 sm:block" aria-hidden="true" />
                <span className="hidden sm:block">PHP {system?.php || '—'}</span>
                <span className="hidden h-3 w-px bg-line-2 md:block" aria-hidden="true" />
                <span className="hidden md:block">Laravel {system?.laravel || '—'}</span>
                <span className="hidden h-3 w-px bg-line-2 lg:block" aria-hidden="true" />
                <span className="hidden lg:block">{system?.environment || '—'}</span>
            </div>

            <div className="flex flex-none items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                <span className="hidden sm:block">{isoDate()}</span>
                <span className="hidden h-3 w-px bg-line-2 sm:block" aria-hidden="true" />
                <span className="text-chalk">{user?.name || 'Operator'}</span>
            </div>
        </div>
    );
}

export default function AdminLayout({ children, sheet = null }) {
    const { props, url = '' } = usePage();
    const { auth, system, flash } = props || {};
    const [railOpen, setRailOpen] = useState(false);
    const [desktop, setDesktop] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
    );
    const rootRef = useRef(null);

    const path = String(url || '').split('?')[0];

    useEffect(() => {
        const media = window.matchMedia('(min-width: 1024px)');
        const update = () => setDesktop(media.matches);

        update();
        media.addEventListener('change', update);

        return () => media.removeEventListener('change', update);
    }, []);

    useSettle(rootRef, [path]);
    const isActive = (href) => (href === '/admin' ? path === '/admin' : path.startsWith(href));

    useEffect(() => {
        if (flash?.success) {
            notifySuccess(flash.success);
        }
        if (flash?.error) {
            notifyError(flash.error);
        }
        // Keyed on the flash object so a repeated identical message still reports.
    }, [flash]);

    const rail = (
        <div className="flex h-full flex-col">
            <div className="flex h-14 flex-none items-center justify-between border-b border-line-2 px-4">
                <Link href="/admin" className="flex items-center gap-2.5 text-chalk">
                    <BrandMark className="h-5 w-5 text-lit" />
                    <span className="leading-none">
                        <span className="block font-display text-[15px] font-extrabold uppercase tracking-[0.16em]">
                            {BRAND.name}
                        </span>
                        <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-chalk-2">
                            {BRAND.console}
                        </span>
                    </span>
                </Link>
                <button
                    type="button"
                    onClick={() => setRailOpen(false)}
                    className="p-1 text-chalk-2 transition-colors hover:text-chalk lg:hidden"
                    aria-label="Tutup indeks"
                >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
            </div>

            {/* The console's own ornament: a data globe at the top of the rail.
                Mounted only on the desktop rail so a phone does not run a hidden
                WebGL scene. */}
            {desktop && (
                <div className="flex-none border-b border-line-2 px-2 py-2">
                    <div className="flex items-center justify-between gap-2 px-1 pb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                        <span className="text-chalk">Konsol / 3D</span>
                        <span className="flex items-center gap-1.5 text-lit">
                            <span className="h-1 w-1 bg-lit" />
                            LIVE
                        </span>
                    </div>
                    <TechScene variant="admin" className="tech-scene--rail" />
                </div>
            )}

            <nav className="flex-1 overflow-y-auto p-3" aria-label="Indeks lembar konsol">
                <span className="block px-2 pb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-chalk-2">
                    Indeks lembar
                </span>

                <ul className="space-y-px">
                    {SHEETS.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    prefetch
                                    onClick={() => setRailOpen(false)}
                                    aria-current={active ? 'page' : undefined}
                                    className={`flex items-center gap-3 px-2 py-2 transition-colors ${
                                        active
                                            ? 'bg-plot-3 text-chalk'
                                            : 'text-chalk-2 hover:bg-plot-2 hover:text-chalk'
                                    }`}
                                >
                                    <span
                                        className={`w-5 flex-none font-mono text-[10px] tracking-[0.1em] ${
                                            active ? 'text-lit' : 'text-chalk-3'
                                        }`}
                                    >
                                        {item.sheet}
                                    </span>
                                    <span className="font-mono text-[11px] uppercase tracking-[0.1em]">
                                        {item.label}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {sheet && (
                    <p className="mt-4 border-t border-line px-2 pt-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-chalk-2">
                        Lembar aktif
                        <span className="mt-1 block text-chalk">{sheet}</span>
                    </p>
                )}
            </nav>

            <div className="flex-none border-t border-line-2 p-3">
                <div className="mb-1 flex items-center justify-between gap-3 px-2 py-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-3">
                        Temperatur
                    </span>
                    <ThemeToggle />
                    <MotionToggle />
                </div>

                <Link
                    href="/"
                    className="flex items-center gap-2.5 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-chalk-2 transition-colors hover:text-chalk"
                >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Buka toko
                </Link>
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="flex w-full items-center gap-2.5 px-2 py-2 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-chalk-2 transition-colors hover:text-chalk"
                >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Keluar konsol
                </button>
            </div>
        </div>
    );

    return (
        /* overflow-x-clip, not hidden: the rail parks off-canvas at phone width
           with a transform, and a fixed element sitting outside the viewport
           still widens the document's scrollable area, so the console could be
           panned sideways into empty ground. `clip` truncates that overflow
           without creating a scroll container, which keeps the sticky header
           above the work area working. */
        <div ref={rootRef} className="plot flex min-h-screen overflow-x-clip font-sans">
            {railOpen && (
                <button
                    type="button"
                    aria-label="Tutup indeks"
                    onClick={() => setRailOpen(false)}
                    className="fixed inset-0 z-40 cursor-default bg-plot/80 lg:hidden"
                />
            )}

            {/* The rail is hidden, not parked off-canvas.
                A `position: fixed` element that sits outside the viewport is not
                clipped by an ancestor's overflow, and Chrome folds it into the
                document's scrollable area — which on a phone expands the layout
                viewport to the rail plus the page, so the console could be panned
                sideways into empty ground. `hidden` takes it out of layout
                entirely; the desktop rail is unaffected. */}
            <aside
                className={`flex-none border-r border-line-2 bg-plot lg:static lg:flex lg:w-64 ${
                    railOpen ? 'fixed inset-y-0 left-0 z-50 flex w-64' : 'hidden'
                }`}
            >
                {rail}
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="sticky top-0 z-30 border-b border-line-2 bg-plot">
                    <div className="flex items-center gap-3 border-b border-line px-4 py-2 lg:hidden">
                        <button
                            type="button"
                            onClick={() => setRailOpen(true)}
                            className="flex items-center gap-2 border border-line-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2"
                            aria-label="Buka indeks"
                        >
                            <Menu className="h-3.5 w-3.5" strokeWidth={1.5} />
                            Indeks
                        </button>
                    </div>
                    <RecordStrip system={system} user={auth?.user} />
                </div>

                <main className="page-main flex-1">{children}</main>

                {/* A rule drawn across the top as one sheet gives way to the next. */}
                <SheetWipe url={path} />

                <footer className="border-t border-line px-4 py-4 sm:px-6 lg:px-8">
                    <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                        <span>
                            {BRAND.name} {BRAND.console} · diterbitkan {isoDate()}
                        </span>
                        <span className="text-chalk-3">
                            Perubahan status pesanan dicatat trigger after_orders_status_update
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
