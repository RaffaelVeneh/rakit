import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, Cpu, Crosshair } from 'lucide-react';
import { BrandMark } from '@/Components/Brand';
import { PlatePhoto } from '@/Components/PlatePhoto';
import { partNo, position } from '@/lib/catalog';
import { count, rupiah } from '@/lib/format';
import { atWidth, srcSet } from '@/lib/images';
import { useMagnetic, useMotionReduced } from '@/lib/motion';

// Loaded on demand.
//
// three.js is 719 KB. Imported statically it was pulled into the home page's first
// load — a cost paid by every visitor, including the ones whose device cannot run
// WebGL at all, and the ones who never look at the hero. Deferring it means a first
// visit downloads the sheet; the hologram arrives after, once the browser is idle
// enough to ask for it.
//
// Nothing goes blank while it loads: the CSS cube is already rendered underneath and
// stays until `onReady` fires. If the chunk fails, `onFail` leaves the cube in place
// exactly as before.
const HoloScene = React.lazy(() => import('@/Components/HoloScene'));

/**
 * The loud opening.
 *
 * The rest of the shop is a controlled drawing sheet; this is the one surface
 * allowed to shout. It is a holographic display case: a six-faced CSS cube that
 * carries the featured position, orbiting rings, HUD brackets, and floating
 * readouts. No WebGL and no new dependency — it is all `transform-style:
 * preserve-3d`, which means it costs one composited layer instead of a renderer.
 *
 * Two rules are still respected from the rest of the system:
 *
 * 1. Every figure is read from the row. The part number, stock, and price on the
 *    cube are the same values the register prints below it.
 * 2. Motion is the application's own setting. When the reader turns it down the
 *    cube parks, the marquee stops, and the parallax never attaches.
 */

const PARTICLES = [
    { left: '6%', top: '18%', delay: '0s', duration: '11s', scale: 1 },
    { left: '18%', top: '72%', delay: '-3s', duration: '9s', scale: 0.7 },
    { left: '31%', top: '10%', delay: '-6s', duration: '13s', scale: 0.55 },
    { left: '44%', top: '84%', delay: '-1.5s', duration: '10s', scale: 1.2 },
    { left: '58%', top: '24%', delay: '-8s', duration: '14s', scale: 0.65 },
    { left: '69%', top: '66%', delay: '-4s', duration: '12s', scale: 0.8 },
    { left: '78%', top: '12%', delay: '-2s', duration: '9s', scale: 1.1 },
    { left: '88%', top: '52%', delay: '-7s', duration: '15s', scale: 0.6 },
    { left: '94%', top: '80%', delay: '-5s', duration: '11s', scale: 0.9 },
    { left: '12%', top: '45%', delay: '-9s', duration: '16s', scale: 0.5 },
    { left: '52%', top: '58%', delay: '-2.5s', duration: '12s', scale: 0.45 },
    { left: '84%', top: '32%', delay: '-6.5s', duration: '10s', scale: 0.75 },
];

function Hologram({ product }) {
    const name = product?.name || 'Register katalog';
    const number = product ? partNo(product) : 'RKT-———-————';
    const stock = product ? count(product.stock) : '—';
    const price = product ? rupiah(product.price) : '—';
    const [sceneReady, setSceneReady] = useState(false);

    return (
        <div className="holo-stage" aria-hidden="true">
            <span className="holo-stage__glow" />
            <span className="holo-stage__floor" />

            <span className="holo-bracket holo-bracket--tl" />
            <span className="holo-bracket holo-bracket--tr" />
            <span className="holo-bracket holo-bracket--bl" />
            <span className="holo-bracket holo-bracket--br" />

            <span className="holo-hud holo-hud--tl">HOLO-RIG / MK.II</span>
            <span className="holo-hud holo-hud--tr">
                <span className="holo-live" /> LIVE
            </span>
            <span className="holo-hud holo-hud--bl">{number}</span>
            <span className="holo-hud holo-hud--br">GESER / PUTAR</span>

            {/* The WebGL scene, once its chunk arrives, fades in over the CSS
                cube. If WebGL or the chunk fails, the cube simply stays. */}
            <div className={`holo-webgl ${sceneReady ? 'is-ready' : ''}`}>
                <Suspense fallback={null}>
                    <HoloScene
                        onReady={() => setSceneReady(true)}
                        onFail={() => setSceneReady(false)}
                    />
                </Suspense>
            </div>

            <div className={`holo-legacy ${sceneReady ? 'is-replaced' : ''}`}>
                <div className="holo-tilt">
                    <span className="holo-ring holo-ring--a" />
                    <span className="holo-ring holo-ring--b" />

                    <div className="holo-cube">
                        <div className="holo-face holo-face--front">
                            {product?.image ? (
                                <PlatePhoto
                                    src={atWidth(product.image, 600) || product.image}
                                    srcSet={srcSet(product.image, [300, 450, 600])}
                                    sizes="280px"
                                    alt=""
                                    loading="eager"
                                    className="holo-face__photo"
                                    fallbackClassName="holo-face__photo hatch"
                                />
                            ) : (
                                <span className="holo-face__photo hatch" />
                            )}
                            <span className="holo-face__shade" />
                            <span className="holo-face__grid" />
                            <span className="holo-face__scan" />
                            <span className="holo-face__corner holo-face__corner--a" />
                            <span className="holo-face__corner holo-face__corner--b" />
                            <div className="holo-face__id">
                                <span className="holo-face__k">POSISI</span>
                                <span className="holo-face__v">{product ? position(product) : '—'}</span>
                            </div>
                            <div className="holo-face__caption">
                                <span className="holo-face__name">{name}</span>
                                <span className="holo-face__price">{price}</span>
                            </div>
                        </div>

                        <div className="holo-face holo-face--back">
                            <span className="holo-face__circuit" />
                            <BrandMark className="holo-face__mark" strokeWidth={1.5} />
                            <span className="holo-face__word">RAKIT</span>
                            <span className="holo-face__sub">SYSTEM / 01</span>
                        </div>

                        <div className="holo-face holo-face--right">
                            <span className="holo-face__circuit" />
                            <span className="holo-face__serial">RKT · 2026</span>
                        </div>

                        <div className="holo-face holo-face--left">
                            <span className="holo-face__circuit" />
                            <span className="holo-face__serial">IDR · RP</span>
                        </div>

                        <div className="holo-face holo-face--top">
                            <span className="holo-face__cross" />
                            <span className="holo-face__serial">HOLO-RIG</span>
                        </div>

                        <div className="holo-face holo-face--bottom">
                            <span className="holo-face__circuit" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="holo-tag holo-tag--a">
                <span className="holo-tag__k">DI GUDANG</span>
                <span className="holo-tag__v">{stock} UNIT</span>
            </div>

            <div className="holo-tag holo-tag--b">
                <span className="holo-tag__k">HARGA SATUAN</span>
                <span className="holo-tag__v">{price}</span>
            </div>

            <span className="holo-hint">Geser untuk memutar</span>
        </div>
    );
}

export default function NeonHero({ product = null, register = {} }) {
    const still = useMotionReduced();
    const sceneRef = useRef(null);
    const primaryRef = useMagnetic(6);

    const positions = count(register.positions || 0);
    const groups = count(register.groups || 0);
    const onHand = count(register.onHand || 0);

    const marqueeWords = [
        `${positions} POSISI`,
        'STOK NYATA',
        'HARGA NYATA',
        'RAKIT SISTEM',
        'TANPA KOMPROMI',
    ];

    // The cube leans toward the pointer, and the glow behind it follows the same
    // vector. Style is written straight to the node rather than through state: a
    // pointermove that re-rendered this tree would run React sixty times a second
    // to move one transform.
    useEffect(() => {
        const node = sceneRef.current;

        if (!node || still || typeof window === 'undefined') {
            return undefined;
        }

        if (window.matchMedia?.('(pointer: coarse)').matches) {
            return undefined;
        }

        let frame = 0;
        const target = { x: 0, y: 0 };
        const current = { x: 0, y: 0 };

        const paint = () => {
            frame = 0;
            current.x += (target.x - current.x) * 0.09;
            current.y += (target.y - current.y) * 0.09;

            node.style.setProperty('--tilt-x', `${(-current.y * 7).toFixed(2)}deg`);
            node.style.setProperty('--tilt-y', `${(current.x * 11).toFixed(2)}deg`);
            node.style.setProperty('--glow-x', `${(50 + current.x * 16).toFixed(1)}%`);
            node.style.setProperty('--glow-y', `${(50 + current.y * 16).toFixed(1)}%`);

            if (Math.abs(target.x - current.x) > 0.002 || Math.abs(target.y - current.y) > 0.002) {
                frame = window.requestAnimationFrame(paint);
            }
        };

        const schedule = () => {
            if (!frame) {
                frame = window.requestAnimationFrame(paint);
            }
        };

        const onMove = (event) => {
            const rect = node.getBoundingClientRect();
            target.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
            target.y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
            schedule();
        };

        const onLeave = () => {
            target.x = 0;
            target.y = 0;
            schedule();
        };

        node.addEventListener('pointermove', onMove, { passive: true });
        node.addEventListener('pointerleave', onLeave, { passive: true });

        return () => {
            node.removeEventListener('pointermove', onMove);
            node.removeEventListener('pointerleave', onLeave);
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, [still]);

    return (
        <section className="kilau-hero" aria-labelledby="hero-title">
            <div className="kilau-hero__bg" aria-hidden="true">
                <span className="kilau-blob kilau-blob--a" />
                <span className="kilau-blob kilau-blob--b" />
                <span className="kilau-blob kilau-blob--c" />
                <span className="kilau-grid" />
                <span className="kilau-scan" />
                {PARTICLES.map((particle, index) => (
                    <span
                        key={index}
                        className="kilau-particle"
                        style={{
                            left: particle.left,
                            top: particle.top,
                            animationDelay: particle.delay,
                            animationDuration: particle.duration,
                            transform: `scale(${particle.scale})`,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 mx-auto grid max-w-[1400px] gap-12 px-4 pb-14 pt-14 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-4 lg:px-8 lg:pb-16 lg:pt-20">
                <div className="lg:col-span-6 xl:col-span-6">
                    <div className="kilau-rise kilau-rise--1">
                        <span className="kilau-kicker">
                            <span className="kilau-kicker__dot" />
                            REGISTER KOMPONEN · EDISI 2026
                        </span>
                    </div>

                    <h1 id="hero-title" className="kilau-title kilau-rise kilau-rise--2">
                        <span className="kilau-title__line">RAKIT</span>
                        <span
                            className="kilau-title__line kilau-title__line--glow kilau-glitch"
                            data-text="SISTEM"
                        >
                            SISTEM
                        </span>
                        <span className="kilau-title__line kilau-title__line--outline">TANPA KOMPROMI.</span>
                    </h1>

                    <p className="kilau-lede kilau-rise kilau-rise--3">
                        Register komponen yang angkanya hidup. Stok, harga, dan posisi dibaca langsung
                        dari basis data — bukan dari brosur. Pilih part, ukur bedanya, lalu rakit mesin
                        yang nggak mau kalah.
                    </p>

                    <div className="kilau-actions kilau-rise kilau-rise--4">
                        <Link ref={primaryRef} href="/rakit" prefetch className="kilau-cta">
                            <Cpu className="h-4 w-4" strokeWidth={1.75} />
                            Rakit PC 3D
                            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                        </Link>
                        <a href="#register" className="kilau-cta-2">
                            Masuk ke register
                        </a>
                        <a href="#meja-gambar" className="kilau-cta-2">
                            <Crosshair className="h-4 w-4" strokeWidth={1.5} />
                            Buka meja gambar
                        </a>
                    </div>

                    <div className="kilau-status kilau-rise kilau-rise--5">
                        <span className="kilau-status__item">
                            <span className="kilau-status__dot" />
                            Basis data terhubung
                        </span>
                        <span className="kilau-status__item">
                            {positions} posisi · {groups} kelompok
                        </span>
                        <span className="kilau-status__item">{onHand} unit siap</span>
                    </div>
                </div>

                <div className="kilau-scene-wrap kilau-rise kilau-rise--3 lg:col-span-6 xl:col-span-6">
                    <div ref={sceneRef} className="kilau-scene">
                        <Hologram product={product} />
                    </div>
                </div>
            </div>

            <div className="kilau-cue" aria-hidden="true">
                <span className="kilau-cue__line" />
                <span className="kilau-cue__label">SCROLL / 001</span>
            </div>

            <div className="kilau-marquee" aria-hidden="true">
                <div className="kilau-marquee__track">
                    {[0, 1].map((copy) => (
                        <div className="kilau-marquee__group" key={copy}>
                            {marqueeWords.map((word, index) => (
                                <React.Fragment key={`${copy}-${word}`}>
                                    {index > 0 && <span className="kilau-marquee__star">✦</span>}
                                    <span className={index % 2 === 0 ? 'is-fill' : undefined}>{word}</span>
                                </React.Fragment>
                            ))}
                            <span className="kilau-marquee__star">✦</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
