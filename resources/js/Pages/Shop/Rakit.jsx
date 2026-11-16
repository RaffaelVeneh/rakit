import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    ArrowRight,
    Check,
    Cpu,
    Layers,
    Minus,
    Plus,
    RotateCcw,
    RotateCw,
    Search,
    ShoppingBag,
    Trash2,
    Wrench,
} from 'lucide-react';
import ShopLayout from '@/Layouts/ShopLayout';
import { PageBand, Readout, SectionHead, SheetHead, ZoneFrame } from '@/Components/Sheet';
import { Field, Lamp, Stamp, StatusLamp, Tag } from '@/Components/Controls';
import { PlatePhoto } from '@/Components/PlatePhoto';
import { partNo, stockState } from '@/lib/catalog';
import { amount, count, rupiah } from '@/lib/format';
import { notifyError, notifyInfo, notifySuccess } from '@/lib/notify';
import {
    evaluateBuild,
    evaluateCandidate,
    formatSpecBadges,
    slotLabel,
} from '@/lib/pcCompatibility';

const PcBuilderScene = React.lazy(() => import('@/Components/PcBuilderScene'));

const DRAFT_KEY = 'rakit-pc-builder-draft-v1';

const CAMERA_MODES = [
    { key: 'iso', label: 'Iso' },
    { key: 'front', label: 'Depan' },
    { key: 'side', label: 'Samping' },
    { key: 'top', label: 'Atas' },
];

export default function Rakit({
    slots = [],
    components = [],
    presets = [],
    initialPartId = null,
    initialSlot = 'case',
}) {
    const { auth } = usePage().props;
    const signedIn = Boolean(auth?.user);

    const componentById = useMemo(() => {
        const map = {};
        components.forEach((item) => {
            map[item.id] = item;
        });
        return map;
    }, [components]);

    // Build state: { [slotKey]: Product | null }
    const [build, setBuild] = useState(() => {
        const initial = {};
        if (initialPartId && componentById[initialPartId]) {
            const p = componentById[initialPartId];
            initial[p.component_type] = p;
            return initial;
        }
        try {
            const raw = window.localStorage.getItem(DRAFT_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    Object.entries(parsed).forEach(([slot, id]) => {
                        if (componentById[id] && componentById[id].component_type === slot) {
                            initial[slot] = componentById[id];
                        }
                    });
                }
            }
        } catch (err) {
            /* Storage unavailable */
        }
        return initial;
    });

    const [activeSlot, setActiveSlot] = useState(initialSlot || 'case');
    const [hoveredSlot, setHoveredSlot] = useState(null);
    const [search, setSearch] = useState('');
    const [hideIncompatible, setHideIncompatible] = useState(false);

    // 3D viewport controls
    const [exploded, setExploded] = useState(false);
    const [autoRotate, setAutoRotate] = useState(true);
    const [cameraPreset, setCameraPreset] = useState('iso');
    const [presetNonce, setPresetNonce] = useState(0);
    const [zoomNonce, setZoomNonce] = useState(0);
    const [zoomDirection, setZoomDirection] = useState(0);

    const [lastConflictNotice, setLastConflictNotice] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Persist build IDs in localStorage
    useEffect(() => {
        try {
            const ids = {};
            Object.entries(build).forEach(([slot, part]) => {
                if (part?.id) {
                    ids[slot] = part.id;
                }
            });
            window.localStorage.setItem(DRAFT_KEY, JSON.stringify(ids));
        } catch (err) {
            /* Ignore storage errors */
        }
    }, [build]);

    const evaluation = useMemo(() => evaluateBuild(build, slots), [build, slots]);

    const slotComponents = useMemo(
        () => components.filter((item) => item.component_type === activeSlot),
        [components, activeSlot],
    );

    const evaluatedSlotItems = useMemo(() => {
        const needle = search.trim().toLowerCase();

        return slotComponents
            .filter((item) => {
                if (!needle) {
                    return true;
                }
                const haystack = `${item.name} ${item.brand?.name || ''} ${item.description || ''}`.toLowerCase();
                return haystack.includes(needle);
            })
            .map((item) => ({
                product: item,
                check: evaluateCandidate(build, activeSlot, item),
                installed: build[activeSlot]?.id === item.id,
            }));
    }, [slotComponents, search, build, activeSlot]);

    const compatibleCount = useMemo(
        () => evaluatedSlotItems.filter((entry) => entry.check.compatible).length,
        [evaluatedSlotItems],
    );

    const visibleItems = useMemo(
        () =>
            hideIncompatible
                ? evaluatedSlotItems.filter((entry) => entry.check.compatible || entry.installed)
                : evaluatedSlotItems,
        [evaluatedSlotItems, hideIncompatible],
    );

    const nextEmptySlot = useMemo(
        () => slots.find((s) => s.key !== activeSlot && !build[s.key]) || null,
        [slots, activeSlot, build],
    );

    const selectCameraPreset = (presetKey) => {
        setCameraPreset(presetKey);
        setPresetNonce((n) => n + 1);
    };

    const triggerZoom = (dir) => {
        setZoomDirection(dir);
        setZoomNonce((n) => n + 1);
    };

    const buildIdPayload = (nextBuild) => {
        const payload = {};
        Object.entries(nextBuild).forEach(([slot, part]) => {
            if (part?.id) {
                payload[slot] = part.id;
            }
        });
        return payload;
    };

    const installComponent = async (product) => {
        const localCheck = evaluateCandidate(build, activeSlot, product);

        if (!localCheck.compatible) {
            setLastConflictNotice(localCheck.headline);
            notifyError('Komponen tidak cocok', localCheck.headline);
            return;
        }

        if (Number(product.stock) <= 0) {
            notifyError('Stok habis', `${product.name} sedang kosong di gudang.`);
            return;
        }

        const previousBuild = build;
        const nextBuild = { ...build, [activeSlot]: product };
        setBuild(nextBuild);
        setLastConflictNotice(null);

        try {
            const { data } = await axios.post('/rakit/validate', {
                build: buildIdPayload(previousBuild),
                candidate_slot: activeSlot,
                candidate_id: product.id,
            });

            if (data?.candidate_check && !data.candidate_check.compatible) {
                setBuild(previousBuild);
                setLastConflictNotice(data.candidate_check.headline);
                notifyError('Komponen ditolak server', data.candidate_check.headline);
            }
        } catch (err) {
            /* Keep local evaluation if network validation is temporarily unavailable */
        }
    };

    const removeComponent = (slotKey) => {
        setBuild((prev) => {
            const next = { ...prev };
            delete next[slotKey];
            return next;
        });
        setLastConflictNotice(null);
    };

    const clearBuild = () => {
        setBuild({});
        setLastConflictNotice(null);
        notifyInfo('Meja rakit dikosongkan', 'Semua komponen dilepas dari chassis 3D.');
    };

    const applyPreset = (preset) => {
        const next = {};
        Object.entries(preset.slots || {}).forEach(([slot, id]) => {
            if (componentById[id]) {
                next[slot] = componentById[id];
            }
        });
        setBuild(next);
        setLastConflictNotice(null);
        notifySuccess(`Preset dimuat: ${preset.name}`, 'Semua komponen terpasang di viewport 3D.');
    };

    const addBuildToCart = () => {
        if (!signedIn) {
            router.visit('/login');
            return;
        }

        const payload = buildIdPayload(build);
        if (Object.keys(payload).length === 0) {
            notifyError('Rakitan kosong', 'Pilih minimal satu komponen terlebih dahulu.');
            return;
        }

        if (!evaluation.compatible) {
            const msg = evaluation.conflicts[0]
                ? `Tidak cocok dengan ${slotLabel(evaluation.conflicts[0].slot_b)} ${evaluation.conflicts[0].name_b} yang Anda pilih — ${evaluation.conflicts[0].reason}`
                : 'Masih ada konflik spesifikasi antar komponen.';
            setLastConflictNotice(msg);
            notifyError('Rakitan ditolak', msg);
            return;
        }

        setSubmitting(true);
        router.post(
            '/rakit/cart',
            { build: payload },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const buildStatusLamp = !evaluation.compatible
        ? { tone: 'red', lamp: 'lit', label: `KONFLIK · ${evaluation.conflicts.length}` }
        : evaluation.complete
          ? { tone: 'cyan', lamp: 'lit', label: 'SIAP DIRAKIT' }
          : { tone: 'ink', lamp: 'half', label: 'BELUM LENGKAP' };

    const inspectedSlot = hoveredSlot || activeSlot;
    const inspectedPart = build[inspectedSlot] || null;
    const wattRatio =
        evaluation.psuWattageW && evaluation.psuWattageW > 0
            ? Math.min(100, Math.round((evaluation.totalWattageW / evaluation.psuWattageW) * 100))
            : 0;
    const wattOverloaded =
        evaluation.psuWattageW !== null && evaluation.psuWattageW < evaluation.recommendedPsuW;

    const hasOutOfStock = Object.values(build).some((p) => p && Number(p.stock) <= 0);

    return (
        <ShopLayout>
            <Head title="Rakit PC 3D Interaktif — RAKIT" />

            <PageBand
                path={[
                    { label: 'Register', href: '/' },
                    { label: 'Rakit PC 3D' },
                ]}
                title="Simulasi Rakit PC 3D"
                meta="Pilih komponen untuk setiap slot. Sistem memvalidasi soket, tipe memori DDR, dimensi fisik casing, dan kapasitas daya PSU secara langsung sebelum ditambahkan ke rakitan."
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {presets.map((preset) => (
                            <Stamp
                                key={preset.id}
                                size="sm"
                                variant="secondary"
                                onClick={() => applyPreset(preset)}
                                title={preset.description}
                            >
                                <Wrench className="h-3 w-3" strokeWidth={1.5} />
                                {preset.name}
                            </Stamp>
                        ))}
                        {evaluation.installedCount > 0 && (
                            <Stamp size="sm" variant="destructive-quiet" onClick={clearBuild}>
                                <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                                Kosongkan
                            </Stamp>
                        )}
                    </div>
                }
            />

            <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                {/* ── Live Readout Ledger ── */}
                <ZoneFrame className="bg-sheet">
                    <div className="grid grid-cols-2 divide-x divide-y divide-rule lg:grid-cols-4 lg:divide-y-0">
                        <div className="p-4">
                            <Readout
                                label="Slot terpasang"
                                value={`${String(evaluation.installedCount).padStart(2, '0')} / ${String(evaluation.requiredCount).padStart(2, '0')}`}
                                sub={
                                    evaluation.missingRequired.length > 0
                                        ? `Kurang: ${evaluation.missingRequired.map((m) => m.label).slice(0, 2).join(', ')}${evaluation.missingRequired.length > 2 ? '…' : ''}`
                                        : 'Semua slot wajib terisi'
                                }
                                className="border-t-0 pt-0"
                            />
                        </div>
                        <div className="p-4">
                            <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                Status kecocokan
                            </span>
                            <div className="mt-2">
                                <StatusLamp state={buildStatusLamp} />
                            </div>
                            <span className="mt-1.5 block text-[11px] text-ink-3">
                                {evaluation.compatible
                                    ? 'Tidak ada konflik spesifikasi terdeteksi'
                                    : evaluation.conflicts[0]?.reason}
                            </span>
                        </div>
                        <div className="p-4">
                            <Readout
                                label="Estimasi daya beban"
                                value={`${count(evaluation.totalWattageW)} W`}
                                sub={
                                    evaluation.psuWattageW
                                        ? `PSU terpasang ${evaluation.psuWattageW} W · rek. ${evaluation.recommendedPsuW} W`
                                        : evaluation.recommendedPsuW > 0
                                          ? `Rekomendasi PSU ≥ ${evaluation.recommendedPsuW} W`
                                          : 'Tambahkan part untuk hitung beban'
                                }
                                className="border-t-0 pt-0"
                            />
                        </div>
                        <div className="p-4">
                            <Readout
                                label="Estimasi total rakitan"
                                value={rupiah(evaluation.totalPrice)}
                                sub={`${count(evaluation.installedCount)} komponen terpilih`}
                                className="border-t-0 pt-0"
                            />
                        </div>
                    </div>
                </ZoneFrame>

                {/* ── Conflict Banner when blocked ── */}
                {lastConflictNotice && (
                    <div
                        role="alert"
                        className="flex flex-wrap items-start justify-between gap-4 border border-red bg-red-tint px-4 py-3 text-ink"
                    >
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-red" strokeWidth={1.75} />
                            <div>
                                <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-red">
                                    Komponen tidak dapat ditambahkan
                                </span>
                                <p className="mt-0.5 text-[13px] font-medium text-ink">{lastConflictNotice}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setLastConflictNotice(null)}
                            className="font-mono text-[10px] uppercase tracking-[0.14em] text-red underline"
                        >
                            Tutup
                        </button>
                    </div>
                )}

                {/* ── Main Interactive Workspace: 3D Stage (Left) + Slot Picker (Right) ── */}
                <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
                    {/* Left: 3D Viewport + Compatibility Matrix */}
                    <div className="space-y-6 lg:col-span-7">
                        <ZoneFrame className="bg-sheet-2">
                            <SheetHead
                                label="Ruang Rakit 3D"
                                readouts={[
                                    { label: 'Fokus', value: slotLabel(inspectedSlot) },
                                    { label: 'Mode', value: exploded ? 'Exploded' : 'Terakit' },
                                ]}
                                action={
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setExploded((v) => !v)}
                                            aria-pressed={exploded}
                                            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                                                exploded
                                                    ? 'border-cyan bg-cyan text-sheet'
                                                    : 'border-rule-2 bg-sheet text-ink-2 hover:border-ink hover:text-ink'
                                            }`}
                                        >
                                            <Layers className="h-3 w-3" strokeWidth={1.5} />
                                            Exploded View
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setAutoRotate((v) => !v)}
                                            aria-pressed={autoRotate}
                                            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                                                autoRotate
                                                    ? 'border-ink bg-ink text-sheet'
                                                    : 'border-rule-2 bg-sheet text-ink-2 hover:border-ink hover:text-ink'
                                            }`}
                                        >
                                            <RotateCw className="h-3 w-3" strokeWidth={1.5} />
                                            Putar
                                        </button>

                                        <div className="hidden items-center border border-rule-2 bg-sheet sm:inline-flex">
                                            {CAMERA_MODES.map((cam) => (
                                                <button
                                                    key={cam.key}
                                                    type="button"
                                                    onClick={() => selectCameraPreset(cam.key)}
                                                    className={`px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                                                        cameraPreset === cam.key
                                                            ? 'bg-cyan-tint text-cyan'
                                                            : 'text-ink-3 hover:text-ink'
                                                    }`}
                                                >
                                                    {cam.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="inline-flex items-center border border-rule-2 bg-sheet">
                                            <button
                                                type="button"
                                                onClick={() => triggerZoom(-1)}
                                                aria-label="Perbesar kamera 3D"
                                                className="px-2 py-1 text-ink-2 hover:bg-sheet-2 hover:text-ink"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => triggerZoom(1)}
                                                aria-label="Perkecil kamera 3D"
                                                className="border-l border-rule-2 px-2 py-1 text-ink-2 hover:bg-sheet-2 hover:text-ink"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => selectCameraPreset('iso')}
                                                aria-label="Reset sudut kamera"
                                                title="Reset kamera"
                                                className="border-l border-rule-2 px-2 py-1 text-ink-2 hover:bg-sheet-2 hover:text-ink"
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                }
                            />

                            {/* 3D Canvas Stage */}
                            <div className="relative h-[400px] w-full overflow-hidden bg-sheet-2 sm:h-[460px] lg:h-[520px]">
                                <Suspense
                                    fallback={
                                        <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                                            Memuat mesin 3D Three.js…
                                        </div>
                                    }
                                >
                                    <PcBuilderScene
                                        build={build}
                                        activeSlot={activeSlot}
                                        exploded={exploded}
                                        autoRotate={autoRotate}
                                        cameraPreset={cameraPreset}
                                        presetNonce={presetNonce}
                                        zoomNonce={zoomNonce}
                                        zoomDirection={zoomDirection}
                                        onSelectSlot={(slot) => setActiveSlot(slot)}
                                        onHoverSlot={(slot) => setHoveredSlot(slot)}
                                    />
                                </Suspense>

                                {/* Top-left HUD callout */}
                                <div className="pointer-events-none absolute left-3 top-3 max-w-[85%] border border-rule-2 bg-sheet/90 px-3 py-2 backdrop-blur-xs">
                                    <div className="flex items-center gap-2">
                                        <Lamp
                                            tone={inspectedPart ? 'cyan' : 'ink'}
                                            state={inspectedPart ? 'lit' : 'half'}
                                        />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                            {hoveredSlot ? `SOROT 3D · ${slotLabel(inspectedSlot)}` : `SLOT AKTIF · ${slotLabel(inspectedSlot)}`}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate text-[12px] font-semibold text-ink">
                                        {inspectedPart ? inspectedPart.name : `Slot ${slotLabel(inspectedSlot)} masih kosong`}
                                    </p>
                                    {inspectedPart && (
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {formatSpecBadges(inspectedSlot, inspectedPart.specs).map((badge) => (
                                                <span
                                                    key={badge}
                                                    className="border border-rule bg-sheet-2 px-1.5 py-0.5 font-mono text-[9px] text-ink-2"
                                                >
                                                    {badge}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Bottom-left hint & quick unmount */}
                                <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                                    <span className="border border-rule bg-sheet/85 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">
                                        Seret putar · Gulir zoom · Klik komponen 3D untuk memilih slot
                                    </span>

                                    {build[activeSlot] && (
                                        <button
                                            type="button"
                                            onClick={() => removeComponent(activeSlot)}
                                            className="pointer-events-auto border border-red bg-sheet px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-red transition-colors hover:bg-red-tint"
                                        >
                                            Copot {slotLabel(activeSlot)}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Wattage Headroom Bar */}
                            <div className="border-t border-rule bg-sheet px-4 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                        Meter Daya Sistem vs Kapasitas PSU
                                    </span>
                                    <span data-measure className="font-mono text-[11px] font-medium text-ink">
                                        {evaluation.totalWattageW} W terpakai
                                        {evaluation.psuWattageW
                                            ? ` / ${evaluation.psuWattageW} W PSU (${wattRatio}%)`
                                            : evaluation.recommendedPsuW > 0
                                              ? ` · Rekomendasi PSU ≥ ${evaluation.recommendedPsuW} W`
                                              : ''}
                                    </span>
                                </div>
                                <div className="mt-2 h-2 w-full border border-rule bg-sheet-2">
                                    <div
                                        className={`h-full transition-all duration-300 ${
                                            wattOverloaded ? 'bg-red' : 'bg-cyan'
                                        }`}
                                        style={{
                                            width: `${
                                                evaluation.psuWattageW
                                                    ? wattRatio
                                                    : evaluation.totalWattageW > 0
                                                      ? Math.min(100, Math.round((evaluation.totalWattageW / 1000) * 100))
                                                      : 0
                                            }%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </ZoneFrame>

                        {/* Compatibility Diagnostic Matrix */}
                        <ZoneFrame className="bg-sheet">
                            <SheetHead
                                label="Matriks Diagnostik Kompatibilitas"
                                readouts={[
                                    {
                                        label: 'Status',
                                        value: evaluation.compatible ? 'Lolos' : `${evaluation.conflicts.length} Konflik`,
                                    },
                                ]}
                            />
                            <div className="divide-y divide-rule">
                                {evaluation.checks.map((check) => {
                                    const state =
                                        check.status === 'error'
                                            ? { tone: 'red', lamp: 'lit', label: 'KONFLIK' }
                                            : check.status === 'ok'
                                              ? { tone: 'cyan', lamp: 'lit', label: 'COCOK' }
                                              : { tone: 'ink', lamp: 'half', label: 'TUNGGU' };

                                    return (
                                        <div
                                            key={check.key}
                                            className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 ${
                                                check.status === 'error' ? 'bg-red-tint/50' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <StatusLamp state={state} />
                                                <span className="text-[12px] font-semibold text-ink">
                                                    {check.label}
                                                </span>
                                            </div>
                                            <span
                                                className={`font-mono text-[11px] ${
                                                    check.status === 'error' ? 'text-red' : 'text-ink-2'
                                                }`}
                                            >
                                                {check.detail}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </ZoneFrame>
                    </div>

                    {/* Right: Slot Register + Candidate Selector + Checkout */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* Slot Matrix */}
                        <ZoneFrame className="bg-sheet">
                            <SheetHead
                                label="Daftar Slot Komponen"
                                readouts={[
                                    { label: 'Terisi', value: `${evaluation.installedCount}/${slots.length}` },
                                ]}
                            />
                            <div className="grid grid-cols-1 divide-y divide-rule sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                                {slots.map((slotDef, index) => {
                                    const part = build[slotDef.key] || null;
                                    const isActive = activeSlot === slotDef.key;
                                    const hasConflict = evaluation.conflicts.some(
                                        (c) => c.slot_a === slotDef.key || c.slot_b === slotDef.key,
                                    );

                                    return (
                                        <div
                                            key={slotDef.key}
                                            className={`flex items-start justify-between gap-2 border-b border-rule p-3 transition-colors ${
                                                isActive
                                                    ? 'bg-cyan-tint/70'
                                                    : hasConflict
                                                      ? 'bg-red-tint/60'
                                                      : 'bg-sheet hover:bg-sheet-2'
                                            } ${index % 2 === 1 ? 'sm:border-l' : ''}`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setActiveSlot(slotDef.key)}
                                                className="min-w-0 flex-1 text-left"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <Lamp
                                                        tone={hasConflict ? 'red' : part ? 'cyan' : 'ink'}
                                                        state={part || hasConflict ? 'lit' : 'unlit'}
                                                    />
                                                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                                                        {slotDef.short} · {slotDef.label}
                                                    </span>
                                                    {!slotDef.required && (
                                                        <span className="font-mono text-[8px] uppercase text-ink-3">
                                                            (Opsional)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 truncate text-[12px] font-semibold text-ink">
                                                    {part ? part.name : '— Pilih komponen'}
                                                </div>
                                                {part && (
                                                    <div data-measure className="mt-0.5 font-mono text-[10px] text-ink-2">
                                                        {rupiah(part.price)}
                                                    </div>
                                                )}
                                            </button>

                                            {part && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeComponent(slotDef.key)}
                                                    aria-label={`Copot ${slotDef.label}`}
                                                    title={`Copot ${slotDef.label}`}
                                                    className="mt-0.5 border border-rule-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-3 transition-colors hover:border-red hover:text-red"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </ZoneFrame>

                        {/* Candidate Picker for Active Slot */}
                        <ZoneFrame className="bg-sheet">
                            <SheetHead
                                label={`Pilihan ${slotLabel(activeSlot)}`}
                                readouts={[
                                    { label: 'Cocok', value: `${compatibleCount}/${evaluatedSlotItems.length}` },
                                ]}
                                action={
                                    nextEmptySlot && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveSlot(nextEmptySlot.key)}
                                            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan hover:underline"
                                        >
                                            Slot kosong: {nextEmptySlot.label}
                                            <ArrowRight className="h-3 w-3" />
                                        </button>
                                    )
                                }
                            />

                            {/* Search & Filter Bar */}
                            <div className="space-y-2 border-b border-rule bg-sheet-2 px-3 py-3">
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3"
                                        strokeWidth={1.5}
                                    />
                                    <Field
                                        type="search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={`Cari ${slotLabel(activeSlot).toLowerCase()} atau merk…`}
                                        className="py-1.5 pl-8 text-[12px]"
                                    />
                                </div>

                                <label className="flex cursor-pointer items-center justify-between gap-2 text-[11px] text-ink-2">
                                    <span>Sembunyikan yang tidak kompatibel</span>
                                    <input
                                        type="checkbox"
                                        checked={hideIncompatible}
                                        onChange={(e) => setHideIncompatible(e.target.checked)}
                                        className="h-3.5 w-3.5 accent-cyan"
                                    />
                                </label>
                            </div>

                            {/* Component Rows */}
                            <div className="max-h-[520px] divide-y divide-rule overflow-y-auto">
                                {visibleItems.length === 0 ? (
                                    <div className="p-6 text-center text-[12px] text-ink-3">
                                        Tidak ada komponen {slotLabel(activeSlot)} yang sesuai saringan ini.
                                    </div>
                                ) : (
                                    visibleItems.map(({ product, check, installed }) => {
                                        const stock = stockState(product.stock);
                                        const outOfStock = Number(product.stock) <= 0;
                                        const badges = formatSpecBadges(activeSlot, product.specs);

                                        return (
                                            <div
                                                key={product.id}
                                                className={`p-3.5 transition-colors ${
                                                    installed
                                                        ? 'bg-cyan-tint/50'
                                                        : !check.compatible
                                                          ? 'bg-red-tint/35'
                                                          : 'bg-sheet hover:bg-sheet-2'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="h-14 w-14 flex-none overflow-hidden border border-rule bg-sheet-2">
                                                        <PlatePhoto
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="h-full w-full object-cover"
                                                            fallbackClassName="h-full w-full hatch"
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-3">
                                                                {partNo(product)}
                                                            </span>
                                                            {product.brand?.name && (
                                                                <Tag tone="sheet">{product.brand.name}</Tag>
                                                            )}
                                                            {installed && <Tag tone="cyan">Terpasang</Tag>}
                                                            {!check.compatible && <Tag tone="red">Tidak Cocok</Tag>}
                                                        </div>

                                                        <Link
                                                            href={`/product/${product.slug}`}
                                                            className="mt-1 block text-[13px] font-semibold leading-snug text-ink hover:text-cyan"
                                                        >
                                                            {product.name}
                                                        </Link>

                                                        {badges.length > 0 && (
                                                            <div className="mt-1.5 flex flex-wrap gap-1">
                                                                {badges.map((badge) => (
                                                                    <span
                                                                        key={badge}
                                                                        className="border border-rule bg-sheet-2 px-1.5 py-0.5 font-mono text-[9px] text-ink-2"
                                                                    >
                                                                        {badge}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {!check.compatible && check.headline && (
                                                            <div
                                                                role="status"
                                                                className="mt-2 border-l-2 border-red bg-sheet/80 px-2.5 py-1.5 text-[11px] leading-relaxed text-red"
                                                            >
                                                                <span className="font-semibold">{check.headline}</span>
                                                                {check.conflicts.length > 1 && (
                                                                    <ul className="mt-1 list-disc pl-4 text-[10px]">
                                                                        {check.conflicts.slice(1).map((extra, idx) => (
                                                                            <li key={idx}>{extra.message}</li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <span
                                                                    data-measure
                                                                    className="font-mono text-[13px] font-semibold text-ink"
                                                                >
                                                                    {rupiah(product.price)}
                                                                </span>
                                                                <StatusLamp state={stock} />
                                                            </div>

                                                            {installed ? (
                                                                <Stamp
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    onClick={() => removeComponent(activeSlot)}
                                                                >
                                                                    <Check className="h-3 w-3" />
                                                                    Copot
                                                                </Stamp>
                                                            ) : !check.compatible ? (
                                                                <button
                                                                    type="button"
                                                                    disabled
                                                                    aria-disabled="true"
                                                                    title={check.headline || 'Tidak kompatibel'}
                                                                    className="inline-flex cursor-not-allowed items-center gap-1.5 border border-red/50 bg-red-tint px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-red opacity-85"
                                                                >
                                                                    Tidak Cocok
                                                                </button>
                                                            ) : (
                                                                <Stamp
                                                                    size="sm"
                                                                    disabled={outOfStock}
                                                                    onClick={() => installComponent(product)}
                                                                >
                                                                    {outOfStock ? 'Habis' : 'Pasang'}
                                                                </Stamp>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ZoneFrame>

                        {/* Checkout Action Frame */}
                        <ZoneFrame className="bg-sheet-2 p-4">
                            <SectionHead
                                title="Ringkasan Pembelian Rakitan"
                                meta={`${count(evaluation.installedCount)} part`}
                                className="mb-3"
                            />
                            <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-3">
                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                                    Total Harga Komponen
                                </span>
                                <span data-measure className="font-mono text-[18px] font-semibold text-ink">
                                    Rp {amount(evaluation.totalPrice)}
                                </span>
                            </div>

                            {hasOutOfStock && (
                                <p className="mt-2.5 text-[11px] text-red">
                                    Salah satu komponen yang dipilih sedang habis stoknya. Ganti dengan part yang tersedia sebelum checkout.
                                </p>
                            )}

                            <div className="mt-4 flex flex-col gap-2">
                                {signedIn ? (
                                    <Stamp
                                        size="lg"
                                        magnetic
                                        disabled={
                                            submitting ||
                                            evaluation.installedCount === 0 ||
                                            !evaluation.compatible ||
                                            hasOutOfStock
                                        }
                                        onClick={addBuildToCart}
                                        className="w-full"
                                    >
                                        <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                                        {submitting
                                            ? 'Menyimpan ke tas…'
                                            : 'Masukkan Rakitan ke Tas Belanja'}
                                    </Stamp>
                                ) : (
                                    <Stamp
                                        as={Link}
                                        href="/login"
                                        size="lg"
                                        className="w-full"
                                    >
                                        <Cpu className="h-4 w-4" strokeWidth={1.75} />
                                        Masuk untuk Checkout Rakitan
                                    </Stamp>
                                )}

                                <p className="text-center font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">
                                    Draf rakitan tersimpan otomatis di peramban ini
                                </p>
                            </div>
                        </ZoneFrame>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
