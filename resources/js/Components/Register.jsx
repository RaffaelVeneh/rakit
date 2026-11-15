import React from 'react';
import { Link } from '@inertiajs/react';
import { Lamp, StatusLamp, Stamp } from './Controls';
import { partNo, position, stockState } from '../lib/catalog';
import { amount } from '../lib/format';
import { atWidth, srcSet, SIZES } from '../lib/images';
import { PlatePhoto } from './PlatePhoto';

/**
 * The register: the catalogue as a bill of materials. Columns are numbered so a
 * figure can be quoted by column the way a drawing quotes by zone.
 */

const COLUMNS = [
    { key: 'pos', label: 'Pos', align: 'left' },
    { key: 'part', label: 'Part No', align: 'left' },
    { key: 'designation', label: 'Designation', align: 'left' },
    { key: 'brand', label: 'Merk', align: 'left' },
    { key: 'stock', label: 'On Hand', align: 'left' },
    { key: 'price', label: 'Unit Price', align: 'right' },
    { key: 'action', label: 'Action', align: 'right' },
];

function AddAction({ product, onAdd, busy }) {
    const out = Number(product.stock) <= 0;

    if (out) {
        return (
            <span
                className="hatch inline-flex cursor-not-allowed items-center border border-rule px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.12em] text-ink-3"
                title="Stok habis"
            >
                Habis
            </span>
        );
    }

    return (
        <Stamp size="sm" onClick={() => onAdd(product)} disabled={busy} aria-label={`Tambah ${product.name} ke tas`}>
            {busy ? 'Kirim' : 'Tambah'}
        </Stamp>
    );
}

export function RegisterTable({ products = [], onAdd = () => {}, busyId = null, className = '' }) {
    return (
        <div className={`register overflow-x-auto ${className}`}>
            <table className="data-table min-w-[720px]">
                <caption className="sr-only">
                    Register katalog: posisi, nomor bagian, nama, merek, stok, harga satuan, dan aksi.
                </caption>
                <thead>
                    <tr>
                        {COLUMNS.map((column, index) => (
                            <th
                                key={column.key}
                                scope="col"
                                className={column.align === 'right' ? 'text-right' : undefined}
                            >
                                <span className="block font-mono text-[8px] font-normal text-ink-3" aria-hidden="true">
                                    {index + 1}
                                </span>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, index) => (
                        // Each line is written in turn: the row carries the snap rule
                        // (a hairline drawn under it on hover, the sheet's own device
                        // for marking which line is being read), and it rises in on a
                        // short stagger, so a filtered register reads as a page being
                        // ruled rather than a table being swapped.
                        //
                        // The stagger is capped: past the twelfth row every line
                        // arrives together, because a long register that took two
                        // seconds to finish writing would be a register nobody waits
                        // for.
                        <tr
                            key={product.id}
                            className="snap-rule rise-in"
                            style={{ animationDelay: `${Math.min(index, 12) * 26}ms` }}
                        >
                            <td>
                                <span className="part-no text-ink-2">{position(product)}</span>
                            </td>
                            <td>
                                <span className="part-no">{partNo(product)}</span>
                            </td>
                            <td>
                                <Link
                                    href={`/product/${product.slug}`}
                                    className="text-[13px] font-medium text-ink transition-colors hover:text-cyan hover:underline"
                                >
                                    {product.name}
                                </Link>
                                <span className="mt-0.5 block text-[11px] text-ink-3">
                                    {product.category?.name || '—'}
                                </span>
                            </td>
                            <td>
                                <span className="text-[12px] text-ink-2">{product.brand?.name || '—'}</span>
                            </td>
                            <td>
                                <StatusLamp state={stockState(product.stock)} />
                            </td>
                            <td className="num text-ink">
                                <span className="text-[11px] text-ink-3">Rp</span> {amount(product.price)}
                            </td>
                            <td className="text-right">
                                <AddAction product={product} onAdd={onAdd} busy={busyId === product.id} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/**
 * The catalogue as specimen plates.
 *
 * The register is the right device for *comparing* a hundred and eighty-four
 * positions — that is what columns are for — but a poor one for *browsing* them,
 * and browsing is what both surfaces are mostly for. Every part in this catalogue
 * is a physical object with a photograph and a group, and a sheet that never shows
 * either makes the collection read as a spreadsheet rather than as stock.
 *
 * A plate is still a register entry, not a marketing tile. It carries the same
 * fields in the same order — position, part number, designation, group and brand,
 * stock as a lamp and a word, unit price — plus the action its surface needs, and it
 * is measured with the same rules. What changes is the shape: one part per plate, so
 * the eye can find a thing by what it looks like.
 *
 * **It is written against the re-tintable tokens** — `--color-sheet`, `--color-ink`,
 * `--color-rule`, `--color-cyan` — rather than against the plot palette. That is what
 * lets one component serve the operator console (inside a `.plot` surface) and the
 * storefront (on the issued sheet, in either theme) without a tone prop, a variant,
 * or a second copy that drifts. Nothing here knows which temperature it is in.
 *
 * `action` and `confirm` are slots: what you can *do* to a part differs by who is
 * looking — an operator edits and deletes, a customer puts it in the bag — while the
 * plate itself does not.
 */
export function RegisterPlates({
    products = [],
    action = null,
    confirmingId = null,
    confirm = null,
    onCancelConfirm = () => {},
    className = '',
}) {
    return (
        <ul className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${className}`}>
            {products.map((product, index) => {
                const confirming = confirmingId !== null && confirmingId === product.id;

                if (confirming && confirm) {
                    return (
                        <li key={product.id} className="flex">
                            <div
                                onKeyDown={(event) => {
                                    if (event.key === 'Escape') {
                                        onCancelConfirm();
                                    }
                                }}
                                className="flex w-full flex-col border border-red bg-sheet p-3"
                            >
                                {confirm(product, onCancelConfirm)}
                            </div>
                        </li>
                    );
                }

                return (
                    <li
                        key={product.id}
                        style={{ animationDelay: `${Math.min(index, 12) * 26}ms` }}
                        className="rkt-plate rise-in group flex flex-col border border-rule-2 bg-sheet transition-colors hover:bg-sheet-2"
                    >
                        <div className="flex items-center justify-between gap-2 border-b border-rule px-3 py-2">
                            <span className="part-no text-ink-3">{position(product)}</span>
                            {Boolean(product.is_featured) && (
                                <span className="flex items-center gap-1.5">
                                    <Lamp tone="lit" state="lit" />
                                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">
                                        Unggulan
                                    </span>
                                </span>
                            )}
                        </div>

                        <Link
                            href={`/product/${product.slug}`}
                            className="relative block aspect-[4/3] overflow-hidden border-b border-rule bg-sheet-3"
                            aria-label={`Buka ${product.name}`}
                        >
                            <PlatePhoto
                                src={atWidth(product.image, 600) || product.image}
                                srcSet={srcSet(product.image, [300, 450, 600])}
                                sizes={SIZES.card}
                                width="600"
                                height="450"
                                className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                            />
                        </Link>

                        <div className="px-3 py-3">
                            <span className="part-no block text-ink-3">{partNo(product)}</span>
                            <h3 className="mt-1 font-display text-[13px] font-bold uppercase leading-tight tracking-[-0.01em] text-ink">
                                <Link href={`/product/${product.slug}`} className="transition-colors hover:text-cyan">
                                    {product.name}
                                </Link>
                            </h3>
                            <p className="mt-1.5 truncate font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">
                                {product.brand?.name || 'Tanpa merk'}
                                <span aria-hidden="true"> · </span>
                                {product.category?.name || 'Tanpa kelompok'}
                            </p>
                        </div>

                        <div className="mt-auto flex items-end justify-between gap-3 border-t border-rule px-3 py-2">
                            <StatusLamp state={stockState(product.stock)} />
                            <span data-measure className="font-mono text-[13px] font-medium text-ink">
                                <span className="text-[10px] text-ink-3">Rp</span> {amount(product.price)}
                            </span>
                        </div>

                        {action && <div className="border-t border-rule px-3 py-2">{action(product)}</div>}
                    </li>
                );
            })}
        </ul>
    );
}

/**
 * The register at narrow widths, and for short related sets: one block per part,
 * same fields, same order as the table.
 *
 * This survives the move to plates because its job is different from theirs. A
 * plate grid is for browsing a catalogue; this is for the four positions under a
 * product, where a grid would be four lonely cards and a table would be too wide.
 */
export function RegisterList({ products = [], onAdd = () => {}, busyId = null, className = '' }) {
    return (
        <ul className={`border border-rule-2 bg-sheet ${className}`}>
            {products.map((product, index) => {
                const out = Number(product.stock) <= 0;

                return (
                    <li
                        key={product.id}
                        style={{ animationDelay: `${Math.min(index, 12) * 26}ms` }}
                        className={`rise-in px-3 py-3 ${index > 0 ? 'border-t border-rule' : ''}`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span className="part-no text-ink-3">{position(product)}</span>
                            <span className="part-no">{partNo(product)}</span>
                        </div>

                        <h3 className="mt-1.5 text-[13px] font-medium leading-tight text-ink">
                            <Link href={`/product/${product.slug}`} className="transition-colors hover:text-cyan">
                                {product.name}
                            </Link>
                        </h3>

                        <div className="mt-2 flex items-end justify-between gap-3">
                            <StatusLamp state={stockState(product.stock)} />
                            <span data-measure className="font-mono text-[13px] font-medium text-ink">
                                <span className="text-[10px] text-ink-3">Rp</span> {amount(product.price)}
                            </span>
                        </div>

                        {onAdd && (
                            <Stamp
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => onAdd(product)}
                                disabled={out || busyId === product.id}
                            >
                                {out ? 'Stok habis' : busyId === product.id ? 'Mengirim…' : 'Tambah ke tas'}
                            </Stamp>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}