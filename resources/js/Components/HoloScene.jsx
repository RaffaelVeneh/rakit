import React, { useEffect, useRef } from 'react';
import { useMotionReduced } from '@/lib/motion';

/**
 * The WebGL half of the hero.
 *
 * The CSS cube was the poster; this is the instrument. A holographic CPU sits in
 * a containment shell, orbited by three rings, over a projected light floor, with
 * a particle field and drag-to-orbit. It is deliberately built from primitives and
 * additive materials rather than a post-processing stack: bloom on a transparent
 * canvas is a fight, and the same glow is cheaper and sharper as emissive lines,
 * sprite falloffs and additive blends.
 *
 * The component is a thin host. `three` is imported dynamically inside the effect,
 * so the library lands in its own chunk and the CSS cube can hold the stage while
 * it arrives. If WebGL is unavailable, or the chunk fails, `onFail` leaves the CSS
 * cube in place.
 */

const PARTICLE_COUNT = 1300;
const PIN_COUNT = 16;
const RING_SPECS = [
    {
        radius: 2.52,
        tube: 0.006,
        color: 0x7aa2ff,
        opacity: 0.55,
        tilt: [Math.PI / 2.32, 0.16, 0.12],
        speed: 0.18,
    },
    {
        radius: 2.94,
        tube: 0.0045,
        color: 0xa78bfa,
        opacity: 0.4,
        tilt: [Math.PI / 1.8, 0.55, -0.2],
        speed: -0.13,
    },
    {
        radius: 3.36,
        tube: 0.0035,
        color: 0xff7ac8,
        opacity: 0.3,
        tilt: [Math.PI / 2.03, -0.32, 0.5],
        speed: 0.09,
    },
];

/** A tiny deterministic RNG so the scene looks the same on every load. */
function seeded(seed) {
    let value = seed >>> 0;

    return () => {
        value += 0x6d2b79f5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function makeGlowTexture(THREE) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.22, 'rgba(255, 255, 255, 0.72)');
    gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.18)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return texture;
}

/**
 * The die's top face, drawn as a texture.
 *
 * Canvas rather than a texture loaded over the network: the scene must look the
 * same on a blocked CDN as it does on a fast one, and a procedural board can carry
 * the brand mark and the measurement language without shipping an asset.
 */
function makeDieTexture(THREE) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const center = size / 2;

    context.fillStyle = '#07162f';
    context.fillRect(0, 0, size, size);

    const halo = context.createRadialGradient(center, center, 16, center, center, size * 0.72);
    halo.addColorStop(0, 'rgba(54, 112, 255, 0.55)');
    halo.addColorStop(0.52, 'rgba(20, 54, 128, 0.18)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = halo;
    context.fillRect(0, 0, size, size);

    context.strokeStyle = 'rgba(122, 162, 255, 0.16)';
    context.lineWidth = 1;
    for (let index = 0; index <= 16; index += 1) {
        const p = (index / 16) * size;
        context.beginPath();
        context.moveTo(p, 0);
        context.lineTo(p, size);
        context.stroke();
        context.beginPath();
        context.moveTo(0, p);
        context.lineTo(size, p);
        context.stroke();
    }

    const random = seeded(4417);
    context.strokeStyle = 'rgba(122, 162, 255, 0.46)';
    context.lineWidth = 2;
    for (let index = 0; index < 26; index += 1) {
        const startX = Math.round(random() * 16) * (size / 16);
        const startY = Math.round(random() * 16) * (size / 16);
        const midX = Math.round(random() * 16) * (size / 16);
        const midY = Math.round(random() * 16) * (size / 16);
        const endX = Math.round(random() * 16) * (size / 16);
        const endY = Math.round(random() * 16) * (size / 16);

        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(midX, startY);
        context.lineTo(midX, midY);
        context.lineTo(endX, midY);
        context.lineTo(endX, endY);
        context.stroke();
    }

    context.fillStyle = 'rgba(168, 194, 255, 0.55)';
    for (let index = 0; index < 34; index += 1) {
        context.fillRect(random() * size, random() * size, 4, 4);
    }

    context.strokeStyle = 'rgba(168, 194, 255, 0.78)';
    context.lineWidth = 6;
    context.strokeRect(18, 18, size - 36, size - 36);

    // The mark: two locating brackets joined by a diagonal, the same drawn mark
    // the header uses.
    context.strokeStyle = '#dce8ff';
    context.lineWidth = 11;
    context.lineCap = 'square';
    context.beginPath();
    context.moveTo(center - 116, center - 72);
    context.lineTo(center - 116, center - 116);
    context.lineTo(center - 72, center - 116);
    context.stroke();
    context.beginPath();
    context.moveTo(center + 116, center + 72);
    context.lineTo(center + 116, center + 116);
    context.lineTo(center + 72, center + 116);
    context.stroke();
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(center - 30, center + 30);
    context.lineTo(center + 30, center - 30);
    context.stroke();

    context.textAlign = 'center';
    context.fillStyle = '#a8c2ff';
    context.font = '600 24px "Roboto Mono", monospace';
    context.fillText('RAKIT / 01', center, size - 48);

    context.textAlign = 'left';
    context.fillStyle = 'rgba(168, 194, 255, 0.6)';
    context.font = '500 17px "Roboto Mono", monospace';
    context.fillText('HOLO-DIE · GEN5', 42, 55);

    context.textAlign = 'right';
    context.fillStyle = 'rgba(168, 194, 255, 0.45)';
    context.font = '500 15px "Roboto Mono", monospace';
    context.fillText('512 / 1:1', size - 42, 55);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return texture;
}

/** The package's top face: a quiet PCB with the die sitting on it. */
function makePackageTexture(THREE) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const random = seeded(1904);

    context.fillStyle = '#061428';
    context.fillRect(0, 0, size, size);

    context.strokeStyle = 'rgba(122, 162, 255, 0.13)';
    context.lineWidth = 1;
    for (let index = 0; index <= 20; index += 1) {
        const p = (index / 20) * size;
        context.beginPath();
        context.moveTo(p, 0);
        context.lineTo(p, size);
        context.stroke();
        context.beginPath();
        context.moveTo(0, p);
        context.lineTo(size, p);
        context.stroke();
    }

    context.strokeStyle = 'rgba(93, 139, 255, 0.38)';
    context.lineWidth = 2;
    for (let index = 0; index < 38; index += 1) {
        const side = index % 4;
        const along = random() * size;
        const reach = random() * 0.32 + 0.2;

        context.beginPath();
        if (side === 0) {
            context.moveTo(along, size * 0.5);
            context.lineTo(along, size * (0.5 - reach));
            context.lineTo(along + 30, size * (0.5 - reach));
        } else if (side === 1) {
            context.moveTo(size * 0.5, along);
            context.lineTo(size * (0.5 + reach), along);
            context.lineTo(size * (0.5 + reach), along + 30);
        } else if (side === 2) {
            context.moveTo(along, size * 0.5);
            context.lineTo(along, size * (0.5 + reach));
            context.lineTo(along + 30, size * (0.5 + reach));
        } else {
            context.moveTo(size * 0.5, along);
            context.lineTo(size * (0.5 - reach), along);
            context.lineTo(size * (0.5 - reach), along + 30);
        }
        context.stroke();
    }

    context.fillStyle = 'rgba(168, 194, 255, 0.5)';
    for (let index = 0; index < 58; index += 1) {
        context.fillRect(random() * size, random() * size, 3, 3);
    }

    context.strokeStyle = 'rgba(122, 162, 255, 0.65)';
    context.lineWidth = 5;
    context.strokeRect(16, 16, size - 32, size - 32);

    context.fillStyle = 'rgba(168, 194, 255, 0.7)';
    context.font = '500 17px "Roboto Mono", monospace';
    context.textAlign = 'left';
    context.fillText('RKT · HOLO-RIG', 34, 48);
    context.textAlign = 'right';
    context.fillStyle = 'rgba(168, 194, 255, 0.42)';
    context.fillText('IDR / 2026', size - 34, size - 36);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return texture;
}

function buildScene(THREE, host, { reducedRef, readyRef, failRef }) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080d13, 0.038);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
    camera.position.set(0.45, 2.45, 9.3);
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
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

    const canvas = renderer.domElement;
    canvas.className = 'holo-webgl__canvas';
    host.appendChild(canvas);

    const glowTexture = makeGlowTexture(THREE);
    const dieTexture = makeDieTexture(THREE);
    const packageTexture = makePackageTexture(THREE);
    dieTexture.anisotropy = 4;
    packageTexture.anisotropy = 4;
    const disposables = new Set();
    disposables.add(dieTexture);
    disposables.add(packageTexture);
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

    // --- Light -----------------------------------------------------------
    scene.add(new THREE.AmbientLight(0x334d80, 1.4));

    const keyLight = new THREE.PointLight(0x7aa2ff, 44, 34, 2);
    keyLight.position.set(4.2, 4.8, 6);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xa78bfa, 34, 32, 2);
    fillLight.position.set(-5, -2.2, 4.5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xff7ac8, 11, 26, 2);
    rimLight.position.set(1.5, -4, -3.5);
    scene.add(rimLight);

    // --- The rig ---------------------------------------------------------
    const rig = new THREE.Group();
    rig.position.y = 0.06;
    scene.add(rig);

    // A pooled glow under the object, plus a projected cone from the floor.
    const floorGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(9, 9),
        new THREE.MeshBasicMaterial({
            map: glowTexture,
            color: 0x2458d8,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.y = -1.95;
    rig.add(track(floorGlow));

    const floorRing = new THREE.Mesh(
        new THREE.RingGeometry(1.92, 1.94, 96),
        new THREE.MeshBasicMaterial({
            color: 0x7aa2ff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = -1.9;
    rig.add(track(floorRing));

    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 1.32, 3.7, 36, 1, true),
        new THREE.MeshBasicMaterial({
            color: 0x4f7bff,
            transparent: true,
            opacity: 0.045,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    beam.position.y = -0.12;
    rig.add(track(beam));

    // Soft sprites do the job a bloom pass would otherwise: they follow the
    // camera, so they read as light in the air rather than as flat discs.
    const makeSprite = (color, scale, position, opacity) => {
        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: glowTexture,
                color,
                transparent: true,
                opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        );
        sprite.scale.set(scale, scale, 1);
        sprite.position.set(...position);
        rig.add(track(sprite));

        return sprite;
    };

    makeSprite(0x2f5cff, 7.4, [0, 0.15, -1.6], 0.62);
    makeSprite(0xa78bfa, 4.8, [-2.3, 1.35, -1.1], 0.3);
    makeSprite(0xff7ac8, 3.8, [2.5, -1.5, -1.2], 0.22);

    // --- The CPU ---------------------------------------------------------
    const chip = new THREE.Group();
    chip.rotation.x = 0.62;
    chip.scale.setScalar(1.12);
    rig.add(chip);

    const baseGeometry = new THREE.BoxGeometry(2.35, 0.17, 2.35);
    const baseSideMaterial = new THREE.MeshStandardMaterial({
        color: 0x08182d,
        metalness: 0.92,
        roughness: 0.26,
        emissive: 0x07142c,
        emissiveIntensity: 0.8,
    });
    const baseTopMaterial = new THREE.MeshStandardMaterial({
        map: packageTexture,
        emissiveMap: packageTexture,
        emissive: 0x2a5bff,
        emissiveIntensity: 0.5,
        metalness: 0.5,
        roughness: 0.44,
    });
    const base = new THREE.Mesh(baseGeometry, [
        baseSideMaterial,
        baseSideMaterial,
        baseTopMaterial,
        baseSideMaterial,
        baseSideMaterial,
        baseSideMaterial,
    ]);
    chip.add(track(base));

    const baseEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(baseGeometry),
        new THREE.LineBasicMaterial({ color: 0x7aa2ff, transparent: true, opacity: 0.85 }),
    );
    base.add(track(baseEdges));

    const dieGeometry = new THREE.BoxGeometry(1.18, 0.06, 1.18);
    const dieSideMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a1b33,
        metalness: 0.9,
        roughness: 0.28,
        emissive: 0x0a1f44,
        emissiveIntensity: 0.7,
    });
    const dieTopMaterial = new THREE.MeshStandardMaterial({
        map: dieTexture,
        emissiveMap: dieTexture,
        emissive: 0xffffff,
        emissiveIntensity: 0.9,
        metalness: 0.2,
        roughness: 0.36,
    });
    const die = new THREE.Mesh(dieGeometry, [
        dieSideMaterial,
        dieSideMaterial,
        dieTopMaterial,
        dieSideMaterial,
        dieSideMaterial,
        dieSideMaterial,
    ]);
    die.position.y = 0.118;
    chip.add(track(die));

    const dieLight = new THREE.PointLight(0xa8c2ff, 18, 7, 2);
    dieLight.position.set(1.1, 2.1, 2.2);
    chip.add(dieLight);

    const dieEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(dieGeometry),
        new THREE.LineBasicMaterial({ color: 0xc4d6ff, transparent: true, opacity: 0.95 }),
    );
    dieEdges.position.copy(die.position);
    chip.add(track(dieEdges));

    // Circuit traces: right-angled paths running from the die to the package edge.
    const random = seeded(20261019);
    const tracePositions = [];
    const traceEnds = [];
    const pushTrace = (ax, az, bx, bz) => {
        tracePositions.push(ax, 0.091, az, bx, 0.091, bz);
    };

    for (let index = 0; index < 20; index += 1) {
        const side = index % 4;
        const along = (random() * 2 - 1) * 0.8;
        const spread = along + (random() * 2 - 1) * 0.35;
        const reach = 1.09;

        if (side === 0) {
            pushTrace(along, -0.62, along, -0.95);
            pushTrace(along, -0.95, spread, -reach);
            traceEnds.push(spread, 0.095, -reach);
        } else if (side === 1) {
            pushTrace(reach, along, 0.95, along);
            pushTrace(0.95, along, reach, spread);
            traceEnds.push(reach, 0.095, spread);
        } else if (side === 2) {
            pushTrace(along, 0.62, along, 0.95);
            pushTrace(along, 0.95, spread, reach);
            traceEnds.push(spread, 0.095, reach);
        } else {
            pushTrace(-reach, along, -0.95, along);
            pushTrace(-0.95, along, -reach, spread);
            traceEnds.push(-reach, 0.095, spread);
        }
    }

    const traceGeometry = new THREE.BufferGeometry();
    traceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tracePositions, 3));
    const traces = new THREE.LineSegments(
        traceGeometry,
        new THREE.LineBasicMaterial({ color: 0x3d78ff, transparent: true, opacity: 0.56 }),
    );
    chip.add(track(traces));

    const endGeometry = new THREE.BufferGeometry();
    endGeometry.setAttribute('position', new THREE.Float32BufferAttribute(traceEnds, 3));
    const endPoints = new THREE.Points(
        endGeometry,
        new THREE.PointsMaterial({
            color: 0xa8c2ff,
            size: 0.045,
            map: glowTexture,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    chip.add(track(endPoints));

    // Pins: one instanced mesh, four sides.
    const pinGeometry = new THREE.BoxGeometry(0.045, 0.04, 0.16);
    const pinMaterial = new THREE.MeshStandardMaterial({
        color: 0xd8b25a,
        metalness: 1,
        roughness: 0.26,
        emissive: 0x3a2a08,
        emissiveIntensity: 0.6,
    });
    const pins = new THREE.InstancedMesh(pinGeometry, pinMaterial, PIN_COUNT * 4);
    const pinDummy = new THREE.Object3D();
    let pinIndex = 0;
    for (let index = 0; index < PIN_COUNT; index += 1) {
        const along = -1.02 + (index / (PIN_COUNT - 1)) * 2.04;

        pinDummy.position.set(along, 0, -1.16);
        pinDummy.rotation.set(0, 0, 0);
        pinDummy.updateMatrix();
        pins.setMatrixAt(pinIndex++, pinDummy.matrix);

        pinDummy.position.set(along, 0, 1.16);
        pinDummy.updateMatrix();
        pins.setMatrixAt(pinIndex++, pinDummy.matrix);

        pinDummy.position.set(1.16, 0, along);
        pinDummy.rotation.set(0, Math.PI / 2, 0);
        pinDummy.updateMatrix();
        pins.setMatrixAt(pinIndex++, pinDummy.matrix);

        pinDummy.position.set(-1.16, 0, along);
        pinDummy.updateMatrix();
        pins.setMatrixAt(pinIndex++, pinDummy.matrix);
    }
    pins.instanceMatrix.needsUpdate = true;
    chip.add(track(pins));

    // Small passives around the die: enough detail that the package reads as a
    // board rather than a black tile at a glance.
    const capacitorGeometry = new THREE.BoxGeometry(0.075, 0.06, 0.13);
    const capacitorMaterial = new THREE.MeshStandardMaterial({
        color: 0x93add8,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0x173665,
        emissiveIntensity: 0.8,
    });
    const capacitors = new THREE.InstancedMesh(capacitorGeometry, capacitorMaterial, 20);
    const capacitorDummy = new THREE.Object3D();
    let capacitorIndex = 0;

    for (let index = 0; index < 5; index += 1) {
        const along = -0.8 + (index / 4) * 1.6;

        [-0.79, 0.79].forEach((z) => {
            capacitorDummy.position.set(along, 0.12, z);
            capacitorDummy.rotation.set(0, 0, 0);
            capacitorDummy.updateMatrix();
            capacitors.setMatrixAt(capacitorIndex++, capacitorDummy.matrix);
        });

        [-0.79, 0.79].forEach((x) => {
            capacitorDummy.position.set(x, 0.12, along);
            capacitorDummy.rotation.set(0, Math.PI / 2, 0);
            capacitorDummy.updateMatrix();
            capacitors.setMatrixAt(capacitorIndex++, capacitorDummy.matrix);
        });
    }

    capacitors.instanceMatrix.needsUpdate = true;
    chip.add(track(capacitors));

    // A ring hugging the package, and a fainter one outside it.
    const packageRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.7, 0.006, 6, 120),
        new THREE.MeshBasicMaterial({
            color: 0x7aa2ff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    packageRing.rotation.x = Math.PI / 2;
    packageRing.position.y = -0.04;
    chip.add(track(packageRing));

    const packageRingOuter = new THREE.Mesh(
        new THREE.TorusGeometry(1.9, 0.0035, 6, 120),
        new THREE.MeshBasicMaterial({
            color: 0xa78bfa,
            transparent: true,
            opacity: 0.32,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    packageRingOuter.rotation.x = Math.PI / 2;
    packageRingOuter.position.y = -0.08;
    chip.add(track(packageRingOuter));

    // --- Containment shell & orbits --------------------------------------
    const shellGeometry = new THREE.IcosahedronGeometry(2.02, 1);
    const shell = new THREE.Mesh(
        shellGeometry,
        new THREE.MeshBasicMaterial({
            color: 0x6f8dff,
            wireframe: true,
            transparent: true,
            opacity: 0.055,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    rig.add(track(shell));

    const outerShell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(2.72, 1),
        new THREE.MeshBasicMaterial({
            color: 0xa78bfa,
            wireframe: true,
            transparent: true,
            opacity: 0.022,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    outerShell.rotation.set(0.4, 0.2, -0.3);
    rig.add(track(outerShell));

    const rings = RING_SPECS.map((spec) => {
        const group = new THREE.Group();
        group.rotation.set(...spec.tilt);

        const line = new THREE.Mesh(
            new THREE.TorusGeometry(spec.radius, spec.tube, 6, 180),
            new THREE.MeshBasicMaterial({
                color: spec.color,
                transparent: true,
                opacity: spec.opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        );
        group.add(track(line));

        const bead = new THREE.Mesh(
            new THREE.SphereGeometry(0.032, 10, 10),
            new THREE.MeshBasicMaterial({ color: spec.color }),
        );
        bead.position.set(spec.radius, 0, 0);
        group.add(track(bead));

        const halo = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: glowTexture,
                color: spec.color,
                transparent: true,
                opacity: 0.65,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        );
        halo.scale.set(0.46, 0.46, 1);
        halo.position.copy(bead.position);
        group.add(track(halo));

        rig.add(group);

        return { group, speed: spec.speed, bead };
    });

    // --- The star field --------------------------------------------------
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const colorA = new THREE.Color(0x7aa2ff);
    const colorB = new THREE.Color(0xa78bfa);
    const colorC = new THREE.Color(0xff7ac8);
    const particleRandom = seeded(9861);

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
        const radius = 3.1 + Math.pow(particleRandom(), 0.62) * 5.2;
        const theta = particleRandom() * Math.PI * 2;
        const phi = Math.acos(2 * particleRandom() - 1);
        const sinPhi = Math.sin(phi);

        positions[index * 3] = radius * sinPhi * Math.cos(theta);
        positions[index * 3 + 1] = radius * Math.cos(phi) * 0.72;
        positions[index * 3 + 2] = radius * sinPhi * Math.sin(theta);

        const mix = particleRandom();
        const color = mix < 0.62 ? colorA : mix < 0.9 ? colorB : colorC;
        colors[index * 3] = color.r;
        colors[index * 3 + 1] = color.g;
        colors[index * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.055,
        map: glowTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    rig.add(track(particles));

    // --- Orbiting shards -------------------------------------------------
    // A handful of small solids at the edge of the field. They give the eye a
    // second scale to read depth against, the way a scale figure does on a
    // drawing.
    const shardGroup = new THREE.Group();
    rig.add(shardGroup);
    const shards = [];
    const shardRandom = seeded(5521);

    for (let index = 0; index < 7; index += 1) {
        const angle = (index / 7) * Math.PI * 2;
        const radius = 3.15 + (shardRandom() - 0.5) * 0.42;
        const shard = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.085 + shardRandom() * 0.06, 0),
            new THREE.MeshBasicMaterial({
                color: index % 2 === 0 ? 0x7aa2ff : 0xa78bfa,
                wireframe: true,
                transparent: true,
                opacity: 0.55,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        );
        shard.position.set(
            Math.cos(angle) * radius,
            (shardRandom() - 0.5) * 1.9,
            Math.sin(angle) * radius,
        );
        shard.rotation.set(shardRandom() * Math.PI, shardRandom() * Math.PI, shardRandom() * Math.PI);
        shardGroup.add(track(shard));
        shards.push(shard);
    }

    // --- Layout & state --------------------------------------------------
    const state = {
        visible: true,
        dragging: false,
        lastX: 0,
        lastY: 0,
        pointerX: 0,
        pointerY: 0,
        parallaxX: 0,
        parallaxY: 0,
        userYaw: 0,
        userPitch: 0,
        velocityYaw: 0,
        velocityPitch: 0,
        auto: 0,
        needsRender: true,
        ready: false,
    };

    let frame = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    const resize = () => {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        state.needsRender = true;
    };

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
            state.auto += delta * 0.2;
            state.parallaxX += (state.pointerX - state.parallaxX) * 0.055;
            state.parallaxY += (state.pointerY - state.parallaxY) * 0.055;

            if (!state.dragging) {
                state.userYaw += state.velocityYaw;
                state.userPitch = clamp(state.userPitch + state.velocityPitch, -0.62, 0.62);
                state.velocityYaw *= 0.93;
                state.velocityPitch *= 0.93;
            }

            chip.position.y = Math.sin(elapsed * 0.8) * 0.075;
            chip.rotation.z = Math.sin(elapsed * 0.45) * 0.025;
            chip.rotation.y = Math.sin(elapsed * 0.28) * 0.12;

            rings.forEach((ring, index) => {
                ring.group.rotation.z += delta * ring.speed;
                ring.bead.scale.setScalar(1 + Math.sin(elapsed * 2.4 + index) * 0.18);
            });

            shell.rotation.y = -elapsed * 0.055;
            shell.rotation.x = Math.sin(elapsed * 0.22) * 0.12;
            outerShell.rotation.y = elapsed * 0.035;
            outerShell.rotation.z = -0.3 + Math.cos(elapsed * 0.18) * 0.06;

            particles.rotation.y = elapsed * 0.012;
            particles.rotation.z = Math.sin(elapsed * 0.1) * 0.04;
            beam.rotation.y = elapsed * 0.06;
            floorRing.rotation.z = elapsed * 0.08;
            shardGroup.rotation.y = elapsed * 0.055;
            shards.forEach((shard, index) => {
                shard.rotation.x += delta * (0.34 + index * 0.035);
                shard.rotation.y += delta * (0.22 + index * 0.025);
            });
            dieTopMaterial.emissiveIntensity = 0.82 + (Math.sin(elapsed * 2.1) + 1) * 0.08;
        }

        const parallaxX = still ? 0 : state.parallaxX;
        const parallaxY = still ? 0 : state.parallaxY;

        rig.rotation.y = state.auto + state.userYaw + parallaxX * 0.12;
        rig.rotation.x = state.userPitch + parallaxY * 0.16;
        camera.position.x = parallaxX * 0.22;
        camera.position.y = 0.45 + parallaxY * 0.16;
        camera.lookAt(0, 0.05, 0);

        renderer.render(scene, camera);
        state.needsRender = false;

        if (!state.ready) {
            state.ready = true;
            window.requestAnimationFrame(() => readyRef.current?.());
        }
    };

    const loop = () => {
        frame = window.requestAnimationFrame(loop);
        paint();
    };

    const onPointerMove = (event) => {
        const rect = host.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;

        state.pointerX = clamp(nx, -1, 1);
        state.pointerY = clamp(ny, -1, 1);

        if (!state.dragging) {
            return;
        }

        const dx = event.clientX - state.lastX;
        const dy = event.clientY - state.lastY;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        state.userYaw += dx * 0.0062;
        state.userPitch = clamp(state.userPitch + dy * 0.0042, -0.62, 0.62);
        state.velocityYaw = dx * 0.0008;
        state.velocityPitch = dy * 0.0005;
        state.needsRender = true;
    };

    const onPointerDown = (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }

        state.dragging = true;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        host.classList.add('is-dragging');
        host.setPointerCapture?.(event.pointerId);
    };

    const onPointerUp = (event) => {
        if (!state.dragging) {
            return;
        }

        state.dragging = false;
        host.classList.remove('is-dragging');
        host.releasePointerCapture?.(event.pointerId);
    };

    const onPointerLeave = () => {
        state.pointerX = 0;
        state.pointerY = 0;
    };

    const onDoubleClick = () => {
        state.userYaw = 0;
        state.userPitch = 0;
        state.velocityYaw = 0;
        state.velocityPitch = 0;
        state.needsRender = true;
    };

    const onVisibility = () => {
        if (!document.hidden) {
            state.needsRender = true;
        }
    };

    const resizeObserver =
        typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => resize());
    if (resizeObserver) {
        resizeObserver.observe(host);
    }

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
    if (intersectionObserver) {
        intersectionObserver.observe(host);
    }

    resize();
    renderer.render(scene, camera);

    host.addEventListener('pointermove', onPointerMove, { passive: true });
    host.addEventListener('pointerdown', onPointerDown, { passive: true });
    host.addEventListener('pointerup', onPointerUp);
    host.addEventListener('pointercancel', onPointerUp);
    host.addEventListener('pointerleave', onPointerLeave);
    host.addEventListener('dblclick', onDoubleClick);
    document.addEventListener('visibilitychange', onVisibility);

    loop();

    return () => {
        window.cancelAnimationFrame(frame);
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerdown', onPointerDown);
        host.removeEventListener('pointerup', onPointerUp);
        host.removeEventListener('pointercancel', onPointerUp);
        host.removeEventListener('pointerleave', onPointerLeave);
        host.removeEventListener('dblclick', onDoubleClick);
        document.removeEventListener('visibilitychange', onVisibility);
        resizeObserver?.disconnect();
        intersectionObserver?.disconnect();

        disposables.forEach((resource) => resource.dispose?.());
        glowTexture.dispose();
        renderer.dispose();
        renderer.forceContextLoss?.();
        canvas.remove();
    };
}

export default function HoloScene({ onReady, onFail }) {
    const hostRef = useRef(null);
    const reduced = useMotionReduced();
    const reducedRef = useRef(reduced);
    const readyRef = useRef(onReady);
    const failRef = useRef(onFail);

    reducedRef.current = reduced;
    readyRef.current = onReady;
    failRef.current = onFail;

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
                if (alive) {
                    failRef.current?.();
                }
            }
        })();

        return () => {
            alive = false;
            cleanup();
        };
    }, []);

    return <div ref={hostRef} className="holo-webgl__host" data-cursor="drag" aria-hidden="true" />;
}
