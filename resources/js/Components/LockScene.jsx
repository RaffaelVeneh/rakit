import React, { useEffect, useRef, useState } from 'react';
import { useMotionReduced } from '@/lib/motion';

/**
 * The account key, as an object.
 *
 * The login sheet already states what an account holds; this is the same promise
 * with a body: a padlock floating in a plot-field inset, lit from the keyhole. It
 * is a second, independent WebGL context only on this page, and it follows the
 * same contract as the hero: imported on demand, paused offscreen, parked under
 * reduced motion, disposed on unmount.
 */

function makeGlowTexture(THREE) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.26, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
}

function buildScene(THREE, host, { reducedRef, readyRef, failRef }) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    camera.position.set(0.35, 0.4, 4.8);
    camera.lookAt(0, 0.2, 0);

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
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const canvas = renderer.domElement;
    canvas.className = 'lock-scene__canvas';
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

    scene.add(new THREE.AmbientLight(0x2f487a, 1.5));

    const keyLight = new THREE.PointLight(0x7aa2ff, 32, 20, 2);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xa78bfa, 22, 20, 2);
    fillLight.position.set(-3.5, -1, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xff7ac8, 14, 18, 2);
    rimLight.position.set(1, -2, -2.5);
    scene.add(rimLight);

    const rig = new THREE.Group();
    rig.position.y = 0.05;
    scene.add(rig);

    const lock = new THREE.Group();
    rig.add(lock);

    const bodyGeometry = new THREE.BoxGeometry(1.3, 0.96, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a1d39,
        metalness: 0.9,
        roughness: 0.24,
        emissive: 0x0c2449,
        emissiveIntensity: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    lock.add(track(body));

    const bodyEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(bodyGeometry),
        new THREE.LineBasicMaterial({ color: 0x7aa2ff, transparent: true, opacity: 0.8 }),
    );
    body.add(track(bodyEdges));

    const face = new THREE.Mesh(
        new THREE.PlaneGeometry(1.18, 0.84),
        new THREE.MeshStandardMaterial({
            color: 0x0e2b52,
            metalness: 0.45,
            roughness: 0.5,
            emissive: 0x0e2b52,
            emissiveIntensity: 0.5,
        }),
    );
    face.position.z = 0.205;
    lock.add(track(face));

    // Shackle: half a torus standing on the body's top edge.
    const shackleGeometry = new THREE.TorusGeometry(0.47, 0.075, 12, 48, Math.PI);
    const shackle = new THREE.Mesh(
        shackleGeometry,
        new THREE.MeshStandardMaterial({
            color: 0x9db8e8,
            metalness: 1,
            roughness: 0.22,
            emissive: 0x1a3562,
            emissiveIntensity: 0.6,
        }),
    );
    shackle.position.y = 0.48;
    shackle.position.z = 0;
    lock.add(track(shackle));

    const shackleEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(shackleGeometry),
        new THREE.LineBasicMaterial({ color: 0xc4d6ff, transparent: true, opacity: 0.35 }),
    );
    shackleEdges.position.copy(shackle.position);
    lock.add(track(shackleEdges));

    // Keyhole: a drawn cylinder and a slot, both emissive.
    const keyholeMaterial = new THREE.MeshBasicMaterial({ color: 0x9fc0ff });
    const keyhole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.025, 20), keyholeMaterial);
    keyhole.rotation.x = Math.PI / 2;
    keyhole.position.set(0, 0.06, 0.22);
    lock.add(track(keyhole));

    const keySlot = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.025), keyholeMaterial);
    keySlot.position.set(0, -0.06, 0.22);
    lock.add(track(keySlot));

    const keyholeGlow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0x7aa2ff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    keyholeGlow.scale.set(0.7, 0.7, 1);
    keyholeGlow.position.set(0, 0.01, 0.24);
    lock.add(track(keyholeGlow));

    // Bolts on the face.
    const boltGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12);
    const boltMaterial = new THREE.MeshStandardMaterial({
        color: 0xb8cfff,
        metalness: 1,
        roughness: 0.3,
        emissive: 0x1a3562,
        emissiveIntensity: 0.8,
    });
    [[-0.5, 0.34], [0.5, 0.34], [-0.5, -0.34], [0.5, -0.34]].forEach(([x, y]) => {
        const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(x, y, 0.22);
        lock.add(track(bolt));
    });

    // The floor and its light pool.
    const floor = new THREE.Mesh(
        new THREE.CylinderGeometry(1.16, 1.2, 0.055, 48),
        new THREE.MeshStandardMaterial({
            color: 0x08172d,
            metalness: 0.85,
            roughness: 0.32,
            emissive: 0x081a36,
            emissiveIntensity: 0.7,
        }),
    );
    floor.position.y = -0.92;
    rig.add(track(floor));

    const floorRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.02, 0.006, 6, 120),
        new THREE.MeshBasicMaterial({
            color: 0x7aa2ff,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    floorRing.rotation.x = Math.PI / 2;
    floorRing.position.y = -0.88;
    rig.add(track(floorRing));

    const floorGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(5.2, 5.2),
        new THREE.MeshBasicMaterial({
            map: glowTexture,
            color: 0x2458d8,
            transparent: true,
            opacity: 0.44,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = -0.94;
    rig.add(track(floorGlow));

    // A few points so the inset has air.
    const positions = new Float32Array(150 * 3);
    for (let index = 0; index < 150; index += 1) {
        const radius = 1.8 + Math.random() * 2.2;
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
            size: 0.04,
            map: glowTexture,
            color: 0xa8c2ff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    rig.add(track(particles));

    const state = {
        visible: true,
        needsRender: true,
        auto: -0.45,
        targetX: 0,
        targetY: 0,
        x: 0,
        y: 0,
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
            state.auto += delta * 0.24;
            state.x += (state.targetX - state.x) * 0.06;
            state.y += (state.targetY - state.y) * 0.06;
            lock.position.y = Math.sin(elapsed * 0.8) * 0.06;
            lock.rotation.z = Math.sin(elapsed * 0.5) * 0.02;
            keyholeGlow.material.opacity = 0.58 + (Math.sin(elapsed * 2.4) + 1) * 0.1;
            particles.rotation.y = elapsed * 0.02;
        }

        const px = still ? 0 : state.x;
        const py = still ? 0 : state.y;
        rig.rotation.y = state.auto + px * 0.18;
        rig.rotation.x = py * 0.12;
        camera.position.x = 0.35 + px * 0.12;
        camera.position.y = 0.4 + py * 0.1;
        camera.lookAt(0, 0.2, 0);

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

    const onPointerMove = (event) => {
        const rect = host.getBoundingClientRect();
        state.targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        state.targetY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };

    const onPointerLeave = () => {
        state.targetX = 0;
        state.targetY = 0;
    };

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

    resize();
    host.addEventListener('pointermove', onPointerMove, { passive: true });
    host.addEventListener('pointerleave', onPointerLeave);
    loop();

    return () => {
        window.cancelAnimationFrame(frame);
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerleave', onPointerLeave);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();
        disposables.forEach((resource) => resource.dispose?.());
        glowTexture.dispose();
        renderer.dispose();
        renderer.forceContextLoss?.();
        canvas.remove();
    };
}

export default function LockScene() {
    const hostRef = useRef(null);
    const reduced = useMotionReduced();
    const reducedRef = useRef(reduced);
    const [ready, setReady] = useState(false);
    const readyRef = useRef(() => {});
    const failRef = useRef(() => {});

    reducedRef.current = reduced;
    readyRef.current = () => setReady(true);

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

                cleanup = buildScene(THREE, host, { reducedRef, readyRef, failRef });
            } catch (error) {
                failRef.current?.();
            }
        })();

        return () => {
            alive = false;
            cleanup();
        };
    }, []);

    return <div ref={hostRef} className={`lock-scene ${ready ? 'is-ready' : ''}`} aria-hidden="true" />;
}
