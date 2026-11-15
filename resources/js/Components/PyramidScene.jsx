import React, { useEffect, useRef, useState } from 'react';
import { useMotionReduced } from '@/lib/motion';

/**
 * The pyramid, as an object rather than a diagram.
 *
 * The four bar controls below it remain the accessible index; this is the same
 * hierarchy given volume. Each tier is a four-sided frustum, the active tier is
 * lit, hovering picks it out, and clicking a tier calls the same `setSelectedLevel`
 * the bars call. A label sprite rides beside each tier so the object still names
 * T1–T4 without the canvas having to host text geometry.
 *
 * Like the hero, `three` is imported inside the effect: the module is already
 * cached from the storefront, and a reader who never opens this page never pays
 * for it.
 */

const TIERS = [
    { key: 'operational', code: 'T4', bottom: 1.66, top: 1.38, height: 0.38, y: -0.78 },
    { key: 'knowledge', code: 'T3', bottom: 1.38, top: 1.1, height: 0.38, y: -0.34 },
    { key: 'middle', code: 'T2', bottom: 1.1, top: 0.82, height: 0.38, y: 0.1 },
    { key: 'top', code: 'T1', bottom: 0.82, top: 0.48, height: 0.38, y: 0.54 },
];

function makeGlowTexture(THREE) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.28, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
}

function makeLabelTexture(THREE, code) {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 90;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, 180, 90);
    context.fillStyle = '#ffffff';
    context.font = '600 44px "Roboto Mono", monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(code, 90, 44);
    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(52, 72);
    context.lineTo(128, 72);
    context.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
}

function buildScene(THREE, host, { selectedRef, selectRef, reducedRef, readyRef, failRef }) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(0, 2.5, 5.2);
    camera.lookAt(0, 0.05, 0);

    let renderer;

    try {
        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
        });
    } catch (error) {
        failRef.current?.();

        return () => {};
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const canvas = renderer.domElement;
    canvas.className = 'pyr-scene__canvas';
    host.appendChild(canvas);

    const glowTexture = makeGlowTexture(THREE);
    const disposables = new Set();

    const track = (object) => {
        if (object?.geometry) {
            disposables.add(object.geometry);
        }
        if (object?.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => {
                disposables.add(material);
                if (material.map) {
                    disposables.add(material.map);
                }
            });
        }

        return object;
    };

    scene.add(new THREE.AmbientLight(0x334a78, 1.5));

    const keyLight = new THREE.PointLight(0x7aa2ff, 42, 30, 2);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xa78bfa, 26, 26, 2);
    fillLight.position.set(-4.5, -1.5, 4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xff7ac8, 16, 24, 2);
    rimLight.position.set(1, -3, -3);
    scene.add(rimLight);

    const rig = new THREE.Group();
    rig.position.y = 0.04;
    scene.add(rig);

    // The table the pyramid sits on.
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(2.02, 2.08, 0.08, 64),
        new THREE.MeshStandardMaterial({
            color: 0x08172c,
            metalness: 0.85,
            roughness: 0.32,
            emissive: 0x081a36,
            emissiveIntensity: 0.7,
        }),
    );
    platform.position.y = -1.02;
    rig.add(track(platform));

    const platformRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.82, 0.007, 6, 160),
        new THREE.MeshBasicMaterial({
            color: 0x7aa2ff,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    platformRing.rotation.x = Math.PI / 2;
    platformRing.position.y = -0.97;
    rig.add(track(platformRing));

    const floorGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshBasicMaterial({
            map: glowTexture,
            color: 0x2458d8,
            transparent: true,
            opacity: 0.42,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = -1.05;
    rig.add(track(floorGlow));

    const pyramid = new THREE.Group();
    rig.add(pyramid);

    const tiers = TIERS.map((spec) => {
        const geometry = new THREE.CylinderGeometry(spec.top, spec.bottom, spec.height, 4, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x0e2749,
            metalness: 0.72,
            roughness: 0.3,
            emissive: 0x1e4a8a,
            emissiveIntensity: 0.45,
            transparent: true,
            opacity: 0.92,
            flatShading: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.y = Math.PI / 4;
        mesh.position.y = spec.y;
        pyramid.add(track(mesh));

        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({
                color: 0x8fb0ff,
                transparent: true,
                opacity: 0.65,
            }),
        );
        edges.rotation.y = Math.PI / 4;
        edges.position.y = spec.y;
        pyramid.add(track(edges));

        const labelTexture = makeLabelTexture(THREE, spec.code);
        const label = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: labelTexture,
                color: 0x7c8ea1,
                transparent: true,
                depthWrite: false,
            }),
        );
        label.scale.set(0.66, 0.33, 1);
        label.position.set(2.12, spec.y, 0);
        rig.add(track(label));

        const leader = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(1.5, spec.y, 0),
                new THREE.Vector3(1.98, spec.y, 0),
            ]),
            new THREE.LineBasicMaterial({
                color: 0x7aa2ff,
                transparent: true,
                opacity: 0.35,
            }),
        );
        rig.add(track(leader));

        return { ...spec, mesh, material, edges, label, labelTexture, leader };
    });

    // Atmosphere: a small field of points that never competes with the tiers.
    const positions = new Float32Array(170 * 3);
    for (let index = 0; index < 170; index += 1) {
        const radius = 2.8 + Math.random() * 2.6;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[index * 3 + 1] = radius * Math.cos(phi) * 0.6;
        positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
            size: 0.045,
            map: glowTexture,
            color: 0xa8c2ff,
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    rig.add(track(particles));

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(0, 0);
    const state = {
        hovered: null,
        visible: true,
        needsRender: true,
        auto: 0,
        parallaxX: 0,
        parallaxY: 0,
        targetX: 0,
        targetY: 0,
    };
    let frame = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let ready = false;

    const resize = () => {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        state.needsRender = true;
    };

    const paint = () => {
        const still = Boolean(reducedRef.current);
        const now = performance.now();
        const delta = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        if (!state.visible || document.hidden) {
            return;
        }

        if (still) {
            if (!state.needsRender) {
                return;
            }
        } else {
            elapsed += delta;
            state.auto += delta * 0.16;
            state.parallaxX += (state.targetX - state.parallaxX) * 0.06;
            state.parallaxY += (state.targetY - state.parallaxY) * 0.06;
            particles.rotation.y = elapsed * 0.02;
            pyramid.position.y = Math.sin(elapsed * 0.7) * 0.025;
        }

        const px = still ? 0 : state.parallaxX;
        const py = still ? 0 : state.parallaxY;
        pyramid.rotation.y = state.auto + px * 0.12;
        pyramid.rotation.x = -0.05 + py * 0.06;

        const light = document.documentElement.dataset.theme !== 'plot';
        const inactiveEdge = light ? 0x2f5fbf : 0x8fb0ff;
        const activeEdge = light ? 0x0c1622 : 0xdee6ee;
        const inactiveLabel = light ? 0x46586b : 0xa8b8cc;
        const activeLabel = light ? 0x0e3a8f : 0x7aa2ff;
        const hoveredLabel = light ? 0x0c1622 : 0xdee6ee;

        tiers.forEach((tier) => {
            const active = selectedRef.current === tier.key;
            const hovered = state.hovered === tier.key;

            tier.material.emissive.setHex(active ? 0x2f6bff : hovered ? 0x6d5efc : 0x1e4a8a);
            tier.material.emissiveIntensity = active
                ? 1.5 + (still ? 0 : Math.sin(elapsed * 2.2) * 0.18)
                : hovered
                  ? 0.9
                  : 0.45;
            tier.material.opacity = active ? 1 : 0.92;
            tier.edges.material.color.setHex(active ? activeEdge : inactiveEdge);
            tier.edges.material.opacity = active ? 0.95 : hovered ? 0.85 : 0.6;
            tier.leader.material.color.setHex(light ? 0x2f5fbf : 0x7aa2ff);
            tier.leader.material.opacity = light ? 0.45 : 0.35;
            tier.label.material.color.setHex(active ? activeLabel : hovered ? hoveredLabel : inactiveLabel);
            tier.label.material.opacity = active ? 1 : 0.8;
        });

        renderer.render(scene, camera);
        state.needsRender = false;

        if (!ready) {
            ready = true;
            window.requestAnimationFrame(() => readyRef.current?.());
        }
    };

    const loop = () => {
        frame = window.requestAnimationFrame(loop);
        paint();
    };

    const pick = (event) => {
        const rect = host.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        state.targetX = pointer.x;
        state.targetY = pointer.y;
        raycaster.setFromCamera(pointer, camera);

        const meshes = tiers.map((tier) => tier.mesh);
        const hit = raycaster.intersectObjects(meshes, false)[0];
        const next = hit ? hit.object.userData.key : null;

        if (next !== state.hovered) {
            state.hovered = next;
            state.needsRender = true;
        }
    };

    const onPointerMove = (event) => {
        pick(event);
    };

    const onPointerLeave = () => {
        state.hovered = null;
        state.targetX = 0;
        state.targetY = 0;
        state.needsRender = true;
    };

    const onClick = (event) => {
        pick(event);
        if (state.hovered) {
            selectRef.current?.(state.hovered);
        }
    };

    tiers.forEach((tier) => {
        tier.mesh.userData.key = tier.key;
    });

    const resizeObserver =
        typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => resize());
    resizeObserver?.observe(host);

    const intersectionObserver =
        typeof IntersectionObserver === 'undefined'
            ? null
            : new IntersectionObserver(
                  (entries) => {
                      entries.forEach((entry) => {
                          state.visible = entry.isIntersecting;
                          if (state.visible) {
                              state.needsRender = true;
                          }
                      });
                  },
                  { threshold: 0.04 },
              );
    intersectionObserver?.observe(host);

    // A reduced-motion scene paints only on demand; changing the temperature
    // changes the label/edge colours, so it needs one repaint.
    const themeObserver = new MutationObserver(() => {
        state.needsRender = true;
    });
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
    });

    resize();
    host.addEventListener('pointermove', onPointerMove, { passive: true });
    host.addEventListener('pointerleave', onPointerLeave);
    host.addEventListener('click', onClick);
    loop();

    return () => {
        window.cancelAnimationFrame(frame);
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerleave', onPointerLeave);
        host.removeEventListener('click', onClick);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        themeObserver.disconnect();

        tiers.forEach((tier) => tier.labelTexture.dispose());
        disposables.forEach((resource) => resource.dispose?.());
        glowTexture.dispose();
        renderer.dispose();
        renderer.forceContextLoss?.();
        canvas.remove();
    };
}

export default function PyramidScene({ selected = null, onSelect = () => {} }) {
    const hostRef = useRef(null);
    const selectedRef = useRef(selected);
    const selectRef = useRef(onSelect);
    const reduced = useMotionReduced();
    const reducedRef = useRef(reduced);
    const [ready, setReady] = useState(false);
    const readyRef = useRef(() => {});
    const failRef = useRef(() => {});

    readyRef.current = () => setReady(true);

    selectedRef.current = selected;
    selectRef.current = onSelect;
    reducedRef.current = reduced;

    useEffect(() => {
        const host = hostRef.current;

        if (!host) {
            return undefined;
        }

        let alive = true;
        let cleanup = () => {};

        (async () => {
            try {
                const THREE = await import('three');

                if (!alive) {
                    return;
                }

                cleanup = buildScene(THREE, host, {
                    selectedRef,
                    selectRef,
                    reducedRef,
                    readyRef,
                    failRef,
                });
            } catch (error) {
                failRef.current?.();
            }
        })();

        return () => {
            alive = false;
            cleanup();
        };
    }, []);

    return <div ref={hostRef} className={`pyr-scene ${ready ? 'is-ready' : ''}`} aria-hidden="true" />;
}
