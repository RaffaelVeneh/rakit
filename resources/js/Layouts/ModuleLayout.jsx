import React, { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { CheckSquare, Menu, X } from 'lucide-react';
import { BrandMark, BRAND } from '@/Components/Brand';
import { Lamp } from '@/Components/Controls';
import { SheetWipe } from '@/Components/Sheet';
import { MotionToggle, ThemeToggle } from '@/Components/ThemeToggle';
import { useSettle } from '@/lib/motion';
import { notifyError, notifySuccess } from '@/lib/notify';
import { isoDate, stampDate } from '@/lib/format';

/**
 * The reference-module shell: the machine's own documents, printed on the plot
 * ground. Same world as the console, different register — these sheets are read
 * rather than operated, so the index is a sheet list and the foot is a title block.
 */

const SHEETS = [
    { label: 'Piramida', href: '/pyramid', match: '/pyramid' },
    { label: 'TPS', href: '/tps', match: '/tps' },
    { label: 'OAS', href: '/oas', match: '/oas' },
    { label: 'MIS', href: '/mis', match: '/mis' },
    { label: 'ISS', href: '/iss', match: '/iss' },
    { label: 'Matriks', href: '/matrix', match: '/matrix' },
];

function SheetNav({ path, onNavigate, variant }) {
    if (variant === 'grid') {
        return (
            <nav className="grid grid-cols-2 gap-px bg-line" aria-label="Lembar rujukan">
                {SHEETS.map((sheet) => {
                    const active = path === sheet.match;
                    return (
                        <Link
                            key={sheet.href}
                            href={sheet.href}
                            prefetch
                            prefetch
                            onClick={onNavigate}
                            aria-current={active ? 'page' : undefined}
                            className={`bg-plot-2 px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                                active ? 'text-lit' : 'text-chalk'
                            }`}
                        >
                            {sheet.label}
                        </Link>
                    );
                })}
            </nav>
        );
    }

    return (
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Lembar rujukan">
            {SHEETS.map((sheet) => {
                const active = path === sheet.match;
                return (
                    <Link
                        key={sheet.href}
                        href={sheet.href}
                            prefetch
                        aria-current={active ? 'page' : undefined}
                        className={`border-b-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                            active
                                ? 'border-lit text-chalk'
                                : 'border-transparent text-chalk-2 hover:text-chalk'
                        }`}
                    >
                        {sheet.label}
                    </Link>
                );
            })}
        </nav>
    );
}

export default function ModuleLayout({ children, sheet = 'Modul rujukan · Bab II' }) {
    const { props, url = '' } = usePage();
    const { flash } = props || {};
    const [menuOpen, setMenuOpen] = useState(false);
    const rootRef = useRef(null);

    const path = String(url || '').split('?')[0];

    useSettle(rootRef, [path]);

    useEffect(() => {
        if (flash?.success) {
            notifySuccess(flash.success);
        }
        if (flash?.error) {
            notifyError(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        setMenuOpen(false);
    }, [path]);

    return (
        <div ref={rootRef} className="plot flex min-h-screen flex-col overflow-x-clip bg-plot font-sans text-chalk antialiased">
            <div className="border-b border-line bg-plot-2">
                <div className="mx-auto flex h-8 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-chalk">
                            {BRAND.name}
                        </span>
                        <span className="hidden h-3 w-px bg-line-2 sm:block" aria-hidden="true" />
                        <span className="hidden truncate font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2 sm:block">
                            Modul rujukan tipe sistem informasi · Bab II–IV
                        </span>
                    </div>

                    <div className="flex flex-none items-center gap-4">
                        <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2 lg:inline">
                            Lembar dicetak {stampDate()}
                        </span>
                        <Link
                            href="/"
                            className="font-mono text-[9px] uppercase tracking-[0.16em] text-lit transition-colors hover:text-lit-2"
                        >
                            Buka toko
                        </Link>
                    </div>
                </div>
            </div>

            <header className="sticky top-0 z-40 border-b border-line-2 bg-plot-2">
                <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-5">
                        <Link
                            href="/pyramid"
                            className="flex flex-none items-center gap-2.5 text-chalk"
                            aria-label={`${BRAND.name} — hierarki dan piramida`}
                        >
                            <BrandMark className="h-6 w-6 text-lit" />
                            <span className="font-display text-[17px] font-extrabold uppercase leading-none tracking-[0.14em]">
                                {BRAND.name}
                            </span>
                        </Link>

                        <SheetNav path={path} />
                    </div>

                    <div className="flex flex-none items-center gap-2">
                        <ThemeToggle />

                        <MotionToggle />

                        <Link
                            href="/quiz"
                            aria-current={path.startsWith('/quiz') ? 'page' : undefined}
                            className="stamp px-3 py-2 text-[10px] tracking-[0.12em]"
                        >
                            <CheckSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
                            Evaluasi kuis
                        </Link>

                        <button
                            type="button"
                            onClick={() => setMenuOpen((value) => !value)}
                            aria-expanded={menuOpen}
                            aria-label={menuOpen ? 'Tutup daftar lembar' : 'Buka daftar lembar'}
                            className="border border-line-2 p-2 text-chalk transition-colors hover:border-chalk-2 lg:hidden"
                        >
                            {menuOpen ? (
                                <X className="h-4 w-4" strokeWidth={1.5} />
                            ) : (
                                <Menu className="h-4 w-4" strokeWidth={1.5} />
                            )}
                        </button>
                    </div>
                </div>

                {menuOpen && (
                    <div className="border-t border-line px-4 py-3 lg:hidden">
                        <SheetNav path={path} onNavigate={() => setMenuOpen(false)} variant="grid" />
                    </div>
                )}
            </header>

            {(flash?.success || flash?.error) && (
                <div className="border-b border-line bg-plot-2">
                    <div className="mx-auto flex max-w-[1400px] items-start gap-2.5 px-4 py-2.5 text-[12px] leading-relaxed text-chalk sm:px-6 lg:px-8">
                        <Lamp
                            tone={flash?.error ? 'lit-red' : 'lit'}
                            state="lit"
                            className="mt-1"
                        />
                        <span className="min-w-0">
                            <span
                                className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                                    flash?.error ? 'text-lit-red' : 'text-lit'
                                }`}
                            >
                                {flash?.error ? 'Ditolak' : 'Tercatat'}
                            </span>
                            <span className="mx-1.5 text-chalk-2" aria-hidden="true">
                                ·
                            </span>
                            {flash?.error || flash?.success}
                        </span>
                    </div>
                </div>
            )}

            <main className="page-main flex-1">{children}</main>

                {/* A rule drawn across the top as one sheet gives way to the next. */}
                <SheetWipe url={path} />

            <footer className="border-t border-line-2 bg-plot-2">
                <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid gap-px border border-line-2 bg-line sm:grid-cols-3">
                        <div className="bg-plot px-4 py-3">
                            <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                Lembar
                            </span>
                            <span className="mt-1 block font-display text-[12px] font-semibold uppercase tracking-[0.02em] text-chalk">
                                {sheet}
                            </span>
                        </div>
                        <div className="bg-plot px-4 py-3">
                            <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                Isi
                            </span>
                            <span className="mt-1 block font-display text-[12px] font-semibold uppercase tracking-[0.02em] text-chalk">
                                TPS · OAS · MIS · ISS
                            </span>
                        </div>
                        <div className="bg-plot px-4 py-3">
                            <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                Revisi
                            </span>
                            <span className="mt-1 block font-display text-[12px] font-semibold uppercase tracking-[0.02em] text-chalk">
                                {isoDate()}
                            </span>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2 sm:flex-row sm:items-center sm:justify-between">
                        <span>{BRAND.name} · Lembar rujukan akademik, bukan katalog toko</span>
                        <span>Laravel · MySQL — angka dibaca dari basis data saat lembar dicetak</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
