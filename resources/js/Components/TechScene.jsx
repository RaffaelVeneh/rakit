import React, { useEffect, useRef, useState } from 'react';
import { useMotionReduced } from '@/lib/motion';

/**
 * Small 3D ornaments for the console and the two system sheets.
 *
 * One component, three bodies:
 *   admin    — a wireframe data globe with node field and arc links;
 *   hardware — a machined gear on a stand;
 *   software — four stacked translucent layers with packets between them.
 *
 * The scenes are decorative and stay out of the page's reading order. They share
 * the renderer setup, the visibility/reduced-motion contract and the disposal
 * path, so adding a fourth variant is geometry work rather than a fourth copy of
 * the boilerplate.
 */

const VARIANTS = {
    admin: {
        camera: [0, 0.7, 4.8],
        look: [0, 0, 0],
        accent: 0x7aa2ff,
    },
    hardware: {
        camera: [0, 0.35, 4.7],
        look: [0, 0, 0],
        accent: 0xd8b25a,
    },
    software: {
        camera: [2.25, 1.9, 4.5],
        look: [0, 0, 0],
        accent: 0xa78bfa,
    },
    kms: {
        camera: [0, 0.6, 5.1],
        look: [0, 0, 0],
        accent: 0x7aa2ff,
    },
    iss: {
        camera: [2.1, 1.4, 4.8],
        look: [0, 0, 0],
        accent: 0x7aa2ff,
    },
    component: {
        camera: [2.45, 2.05, 4.4],
        look: [0, 0.1, 0],
        accent: 0x7aa2ff,
    },
};

function makeGlowTexture(THREE) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
}

function addParticles(THREE, rig, glowTexture, count = 120, color = 0xa8c2ff) {
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
        const radius = 2.1 + Math.random() * 2.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[index * 3 + 1] = radius * Math.cos(phi) * 0.66;
        positions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        size: 0.048,
        map: glowTexture,
        color,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    rig.add(points);

    return points;
}

function buildAdmin(THREE, rig, glowTexture, light) {
    const shellColor = light ? 0x2f5fbf : 0x6f8dff;
    const edgeColor = light ? 0x0e3a8f : 0x8fb0ff;
    const nodeColor = light ? 0x0e3a8f : 0xbfd2ff;
    const arcA = light ? 0x2563eb : 0x7aa2ff;
    const arcB = light ? 0x7c3aed : 0xa78bfa;
    const ringColor = light ? 0x0e3a8f : 0x7aa2ff;
    const ringBColor = light ? 0x7c3aed : 0xa78bfa;

    const globe = new THREE.Group();
    rig.add(globe);

    const shellGeometry = new THREE.IcosahedronGeometry(1.38, 1);
    const shell = new THREE.Mesh(
        shellGeometry,
        new THREE.MeshBasicMaterial({
            color: shellColor,
            wireframe: true,
            transparent: true,
            opacity: light ? 0.3 : 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    globe.add(shell);
    globe.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(shellGeometry),
            new THREE.LineBasicMaterial({
                color: edgeColor,
                transparent: true,
                opacity: light ? 0.22 : 0.18,
            }),
        ),
    );

    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.54, 0),
        new THREE.MeshStandardMaterial({
            color: 0x0a1f3d,
            metalness: 0.65,
            roughness: 0.25,
            emissive: 0x2f6bff,
            emissiveIntensity: 1.25,
        }),
    );
    globe.add(core);
    globe.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(core.geometry),
            new THREE.LineBasicMaterial({ color: 0xcfdcff, transparent: true, opacity: 0.7 }),
        ),
    );

    // Nodes on the sphere surface.
    const nodeCount = 110;
    const nodePositions = new Float32Array(nodeCount * 3);
    for (let index = 0; index < nodeCount; index += 1) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        nodePositions[index * 3] = 1.4 * Math.sin(phi) * Math.cos(theta);
        nodePositions[index * 3 + 1] = 1.4 * Math.cos(phi);
        nodePositions[index * 3 + 2] = 1.4 * Math.sin(phi) * Math.sin(theta);
    }
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    globe.add(
        new THREE.Points(
            nodeGeometry,
            new THREE.PointsMaterial({
                size: 0.055,
                map: glowTexture,
                color: nodeColor,
                transparent: true,
                opacity: light ? 0.85 : 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        ),
    );

    // Arc links: a handful of curves lifted off the surface.
    const arcs = new THREE.Group();
    for (let index = 0; index < 9; index += 1) {
        const a = new THREE.Vector3().fromArray(nodePositions.slice(index * 3, index * 3 + 3));
        const b = new THREE.Vector3().fromArray(
            nodePositions.slice((index + 13) * 3, (index + 13) * 3 + 3),
        );
        const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(1.85);
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
        arcs.add(
            new THREE.Line(
                geometry,
                new THREE.LineBasicMaterial({
                    color: index % 2 === 0 ? arcA : arcB,
                    transparent: true,
                    opacity: light ? 0.42 : 0.28,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                }),
            ),
        );
    }
    globe.add(arcs);

    const ringMaterial = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: light ? 0.5 : 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.004, 6, 120), ringMaterial);
    ringA.rotation.x = Math.PI / 2.2;
    globe.add(ringA);

    const ringB = new THREE.Mesh(
        new THREE.TorusGeometry(1.98, 0.003, 6, 120),
        new THREE.MeshBasicMaterial({
            color: ringBColor,
            transparent: true,
            opacity: light ? 0.34 : 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    ringB.rotation.set(Math.PI / 1.8, 0.4, 0.1);
    globe.add(ringB);

    const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glowTexture,
            color: light ? 0x3b82f6 : 0x2f5cff,
            transparent: true,
            opacity: light ? 0.16 : 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    glow.scale.set(5.2, 5.2, 1);
    glow.position.z = -1.4;
    rig.add(glow);

    return (delta, elapsed) => {
        globe.rotation.y = elapsed * 0.18;
        shell.rotation.y = -elapsed * 0.05;
        core.rotation.y = elapsed * 0.35;
        core.scale.setScalar(1 + Math.sin(elapsed * 2.1) * 0.06);
        arcs.rotation.y = elapsed * 0.03;
        ringA.rotation.z = elapsed * 0.24;
        ringB.rotation.z = -elapsed * 0.18;
    };
}

function buildHardware(THREE, rig, glowTexture) {
    const tilt = new THREE.Group();
    tilt.rotation.x = Math.PI / 2;
    tilt.rotation.y = 0.32;
    tilt.rotation.z = -0.08;
    rig.add(tilt);

    const gear = new THREE.Group();
    tilt.add(gear);

    const steel = new THREE.MeshStandardMaterial({
        color: 0x0d203b,
        metalness: 0.95,
        roughness: 0.25,
        emissive: 0x0e2b55,
        emissiveIntensity: 0.55,
    });
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x9db8e8,
        transparent: true,
        opacity: 0.6,
    });

    const hubGeometry = new THREE.CylinderGeometry(0.72, 0.72, 0.3, 36);
    const hub = new THREE.Mesh(hubGeometry, steel);
    gear.add(hub);
    hub.add(new THREE.LineSegments(new THREE.EdgesGeometry(hubGeometry), edgeMaterial));

    const toothGeometry = new THREE.BoxGeometry(0.26, 0.28, 0.38);
    for (let index = 0; index < 12; index += 1) {
        const angle = (index / 12) * Math.PI * 2;
        const tooth = new THREE.Mesh(toothGeometry, steel);
        tooth.position.set(Math.cos(angle) * 1.02, 0, Math.sin(angle) * 1.02);
        tooth.rotation.y = -angle;
        gear.add(tooth);
        tooth.add(new THREE.LineSegments(new THREE.EdgesGeometry(toothGeometry), edgeMaterial));
    }

    // A dark disc reads as the bore; the rim makes the edge intentional.
    const bore = new THREE.Mesh(
        new THREE.CircleGeometry(0.33, 32),
        new THREE.MeshBasicMaterial({ color: 0x02060c }),
    );
    bore.rotation.x = -Math.PI / 2;
    bore.position.y = 0.16;
    bore.position.z = 0.01;
    gear.add(bore);

    const boreRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.018, 8, 40),
        new THREE.MeshBasicMaterial({ color: 0xd8b25a }),
    );
    boreRim.rotation.x = Math.PI / 2;
    boreRim.position.y = 0.16;
    gear.add(boreRim);

    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.23, 0.007, 6, 120),
        new THREE.MeshBasicMaterial({
            color: 0xd8b25a,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    rim.rotation.x = Math.PI / 2;
    gear.add(rim);

    // A few loose nuts around the gear.
    const nutGeometry = new THREE.CylinderGeometry(0.11, 0.11, 0.07, 6);
    const nutMaterial = new THREE.MeshStandardMaterial({
        color: 0x9db8e8,
        metalness: 1,
        roughness: 0.3,
        emissive: 0x1a3562,
        emissiveIntensity: 0.7,
    });
    const nuts = [];
    [[-1.8, 1.1, 0.3], [1.7, -1.1, -0.2], [1.9, 1.2, -0.4]].forEach(([x, y, z]) => {
        const nut = new THREE.Mesh(nutGeometry, nutMaterial);
        nut.position.set(x, y, z);
        nut.rotation.set(Math.random(), Math.random(), Math.random());
        tilt.add(nut);
        nuts.push(nut);
    });

    const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0x2f5cff,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    glow.scale.set(5, 5, 1);
    glow.position.z = -1.2;
    rig.add(glow);

    return (delta, elapsed) => {
        gear.rotation.y = elapsed * 0.42;
        tilt.rotation.y = 0.32 + Math.sin(elapsed * 0.4) * 0.06;
        tilt.rotation.z = -0.08 + Math.sin(elapsed * 0.45) * 0.03;
        rim.rotation.z = -elapsed * 0.42;
        nuts.forEach((nut, index) => {
            nut.rotation.x += delta * (0.4 + index * 0.1);
            nut.rotation.y += delta * 0.5;
            nut.position.y += Math.sin(elapsed * 0.8 + index) * 0.0008;
        });
    };
}

function buildSoftware(THREE, rig, glowTexture) {
    const stack = new THREE.Group();
    rig.add(stack);

    const layers = [
        { color: 0x2f6bff, y: -0.72 },
        { color: 0x7aa2ff, y: -0.34 },
        { color: 0xa78bfa, y: 0.04 },
        { color: 0xff7ac8, y: 0.42 },
    ];
    const panels = [];

    layers.forEach((layer, index) => {
        const width = 2.15 - index * 0.1;
        const depth = 1.35 - index * 0.06;
        const geometry = new THREE.BoxGeometry(width, 0.06, depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0x081a33,
            metalness: 0.55,
            roughness: 0.35,
            emissive: layer.color,
            emissiveIntensity: 0.28,
            transparent: true,
            opacity: 0.92,
        });
        const panel = new THREE.Mesh(geometry, material);
        panel.position.y = layer.y;
        stack.add(panel);
        panel.add(
            new THREE.LineSegments(
                new THREE.EdgesGeometry(geometry),
                new THREE.LineBasicMaterial({
                    color: layer.color,
                    transparent: true,
                    opacity: 0.75,
                }),
            ),
        );

        // A few packets sitting on the layer.
        for (let packet = 0; packet < 4; packet += 1) {
            const packetMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.08, 0.1),
                new THREE.MeshBasicMaterial({ color: layer.color }),
            );
            packetMesh.position.set(
                (Math.random() - 0.5) * (width - 0.5),
                0.07,
                (Math.random() - 0.5) * (depth - 0.4),
            );
            panel.add(packetMesh);
            panels.push({ mesh: packetMesh, baseY: packetMesh.position.y, offset: Math.random() * 6 });
        }

        panels.push({ mesh: panel, baseY: layer.y, offset: index * 0.9 });
    });

    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 2.3, 6),
        new THREE.MeshBasicMaterial({
            color: 0x8fb0ff,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    beam.position.y = -0.15;
    stack.add(beam);

    const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0x6d5efc,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    glow.scale.set(5.4, 5.4, 1);
    glow.position.z = -1.2;
    rig.add(glow);

    return (delta, elapsed) => {
        stack.rotation.y = elapsed * 0.12;
        panels.forEach((panel) => {
            panel.mesh.position.y = panel.baseY + Math.sin(elapsed * 0.75 + panel.offset) * 0.035;
        });
    };
}

function buildKms(THREE, rig, glowTexture) {
    const lattice = new THREE.Group();
    rig.add(lattice);

    const coreGeom = new THREE.OctahedronGeometry(0.68, 0);
    const coreMesh = new THREE.Mesh(
        coreGeom,
        new THREE.MeshStandardMaterial({
            color: 0x1e40af,
            emissive: 0x4f7dff,
            emissiveIntensity: 0.75,
            roughness: 0.25,
            metalness: 0.55,
            transparent: true,
            opacity: 0.88,
        }),
    );
    lattice.add(coreMesh);
    lattice.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(coreGeom),
            new THREE.LineBasicMaterial({ color: 0xa8c2ff, transparent: true, opacity: 0.85 }),
        ),
    );

    const ringSpecs = [
        { radius: 1.38, color: 0x7aa2ff, tilt: [0.6, 0.25, 0], speed: 0.28 },
        { radius: 1.72, color: 0xa78bfa, tilt: [-0.55, 0.4, 0.5], speed: -0.22 },
        { radius: 2.05, color: 0x38bdf8, tilt: [1.1, -0.35, 0.2], speed: 0.15 },
    ];

    const orbitalGroups = ringSpecs.map((spec) => {
        const grp = new THREE.Group();
        grp.rotation.set(...spec.tilt);
        const torus = new THREE.Mesh(
            new THREE.TorusGeometry(spec.radius, 0.012, 8, 96),
            new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.55 }),
        );
        grp.add(torus);

        for (let i = 0; i < 4; i += 1) {
            const angle = (i / 4) * Math.PI * 2;
            const node = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.08, 0),
                new THREE.MeshBasicMaterial({ color: 0xdee6ee }),
            );
            node.position.set(Math.cos(angle) * spec.radius, Math.sin(angle) * spec.radius, 0);
            grp.add(node);

            const lineGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                node.position.clone(),
            ]);
            grp.add(
                new THREE.Line(
                    lineGeom,
                    new THREE.LineBasicMaterial({
                        color: spec.color,
                        transparent: true,
                        opacity: 0.28,
                    }),
                ),
            );
        }

        lattice.add(grp);
        return { grp, speed: spec.speed };
    });

    const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0x7aa2ff,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    glow.scale.set(4.8, 4.8, 1);
    rig.add(glow);

    return (delta, elapsed) => {
        coreMesh.rotation.y = elapsed * 0.45;
        coreMesh.rotation.x = Math.sin(elapsed * 0.4) * 0.2;
        orbitalGroups.forEach((item) => {
            item.grp.rotation.z = elapsed * item.speed;
        });
    };
}

function buildIss(THREE, rig, glowTexture) {
    const unit = new THREE.Group();
    rig.add(unit);

    const outerCube = new THREE.BoxGeometry(2.1, 2.1, 2.1);
    unit.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(outerCube),
            new THREE.LineBasicMaterial({ color: 0x7aa2ff, transparent: true, opacity: 0.45 }),
        ),
    );

    const innerCube = new THREE.BoxGeometry(1.32, 1.32, 1.32);
    const innerWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(innerCube),
        new THREE.LineBasicMaterial({ color: 0xa8c2ff, transparent: true, opacity: 0.72 }),
    );
    unit.add(innerWire);

    const gimbalA = new THREE.Mesh(
        new THREE.TorusGeometry(1.55, 0.012, 8, 84),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.52 }),
    );
    const gimbalB = new THREE.Mesh(
        new THREE.TorusGeometry(1.22, 0.01, 8, 84),
        new THREE.MeshBasicMaterial({ color: 0xff7a5c, transparent: true, opacity: 0.48 }),
    );
    gimbalB.rotation.x = Math.PI / 2;
    unit.add(gimbalA, gimbalB);

    const crystal = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.46, 0),
        new THREE.MeshStandardMaterial({
            color: 0x0e3a8f,
            emissive: 0x5c85ff,
            emissiveIntensity: 0.85,
            roughness: 0.2,
            metalness: 0.65,
        }),
    );
    unit.add(crystal);

    const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0x7aa2ff,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    glow.scale.set(4.5, 4.5, 1);
    rig.add(glow);

    return (delta, elapsed) => {
        unit.rotation.y = elapsed * 0.2;
        innerWire.rotation.x = elapsed * 0.35;
        gimbalA.rotation.x = elapsed * 0.42;
        gimbalB.rotation.y = -elapsed * 0.36;
        crystal.rotation.y = -elapsed * 0.6;
    };
}

function buildComponent(THREE, rig, glowTexture, light) {
    const lineColor = light ? 0x0e3a8f : 0x7aa2ff;
    const secondaryLine = light ? 0x0a2a69 : 0xa8c2ff;
    const plateColor = light ? 0xdce5f6 : 0x0f1821;
    const dieColor = light ? 0x0e3a8f : 0x1d4ed8;

    const module = new THREE.Group();
    rig.add(module);

    // Base PCB substrate plate
    const pcbGeom = new THREE.BoxGeometry(2.6, 0.14, 1.9);
    const pcb = new THREE.Mesh(
        pcbGeom,
        new THREE.MeshStandardMaterial({
            color: plateColor,
            metalness: 0.35,
            roughness: 0.45,
            transparent: true,
            opacity: light ? 0.92 : 0.96,
        }),
    );
    pcb.position.y = -0.45;
    module.add(pcb);
    const pcbEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(pcbGeom),
        new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.85 }),
    );
    pcbEdges.position.copy(pcb.position);
    module.add(pcbEdges);

    // Silicon package interposer & die
    const dieGeom = new THREE.BoxGeometry(1.15, 0.22, 1.15);
    const die = new THREE.Mesh(
        dieGeom,
        new THREE.MeshStandardMaterial({
            color: dieColor,
            emissive: lineColor,
            emissiveIntensity: light ? 0.22 : 0.65,
            metalness: 0.7,
            roughness: 0.22,
        }),
    );
    die.position.y = -0.24;
    module.add(die);
    const dieEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(dieGeom),
        new THREE.LineBasicMaterial({ color: secondaryLine, transparent: true, opacity: 0.95 }),
    );
    dieEdges.position.copy(die.position);
    module.add(dieEdges);

    // Floating CAD heatsink fin array above the silicon die
    const heatsink = new THREE.Group();
    heatsink.position.y = 0.42;
    const finGeom = new THREE.BoxGeometry(0.05, 0.48, 1.38);
    for (let i = -4; i <= 4; i += 1) {
        const finEdge = new THREE.LineSegments(
            new THREE.EdgesGeometry(finGeom),
            new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.75 }),
        );
        finEdge.position.x = i * 0.22;
        heatsink.add(finEdge);
    }
    module.add(heatsink);

    // Orbiting CAD calibration reticle ring
    const reticle = new THREE.Mesh(
        new THREE.TorusGeometry(1.95, 0.01, 8, 96),
        new THREE.MeshBasicMaterial({ color: lineColor, transparent: true, opacity: 0.45 }),
    );
    reticle.rotation.x = Math.PI / 2;
    reticle.position.y = -0.45;
    module.add(reticle);

    const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glowTexture,
            color: lineColor,
            transparent: true,
            opacity: light ? 0.2 : 0.42,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    glow.scale.set(4.5, 4.5, 1);
    rig.add(glow);

    return (delta, elapsed) => {
        module.rotation.y = elapsed * 0.28;
        heatsink.position.y = 0.42 + Math.sin(elapsed * 1.1) * 0.06;
        reticle.rotation.z = -elapsed * 0.18;
    };
}

function buildScene(THREE, host, variant, { reducedRef, readyRef, failRef, theme }) {
    const spec = VARIANTS[variant] || VARIANTS.admin;
    const light = theme === 'sheet';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(...spec.camera);
    camera.lookAt(...spec.look);

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
    canvas.className = 'tech-scene__canvas';
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

    scene.add(new THREE.AmbientLight(0x334d80, 1.4));

    const key = new THREE.PointLight(variant === 'hardware' ? 0xffe0a8 : 0x7aa2ff, 34, 24, 2);
    key.position.set(3.5, 4, 4.5);
    scene.add(key);

    const fill = new THREE.PointLight(0xa78bfa, 22, 22, 2);
    fill.position.set(-4, -1.5, 3);
    scene.add(fill);

    const rim = new THREE.PointLight(0xff7ac8, 12, 20, 2);
    rim.position.set(1, -2.5, -2.5);
    scene.add(rim);

    const rig = new THREE.Group();
    scene.add(rig);

    const update =
        variant === 'hardware'
            ? buildHardware(THREE, rig, glowTexture)
            : variant === 'software'
              ? buildSoftware(THREE, rig, glowTexture)
              : variant === 'kms'
                ? buildKms(THREE, rig, glowTexture)
                : variant === 'iss'
                  ? buildIss(THREE, rig, glowTexture)
                  : variant === 'component'
                    ? buildComponent(THREE, rig, glowTexture, light)
                    : buildAdmin(THREE, rig, glowTexture, light);

    const particles = addParticles(
        THREE,
        rig,
        glowTexture,
        120,
        (variant === 'admin' || variant === 'component') && light ? 0x0e3a8f : spec.accent,
    );
    track(particles);

    const state = {
        visible: true,
        needsRender: true,
        auto: variant === 'software' ? -0.35 : 0,
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
            state.auto += delta * 0.14;
            state.x += (state.targetX - state.x) * 0.06;
            state.y += (state.targetY - state.y) * 0.06;
            particles.rotation.y = elapsed * 0.02;
            update(delta, elapsed);
        }

        const px = still ? 0 : state.x;
        const py = still ? 0 : state.y;
        rig.rotation.y = state.auto + px * 0.14;
        rig.rotation.x = py * 0.08;
        camera.position.x = spec.camera[0] + px * 0.16;
        camera.position.y = spec.camera[1] + py * 0.12;
        camera.lookAt(...spec.look);

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

        // The variant builders own most of the scene's resources, so dispose by
        // traversal rather than relying on the tracked set alone.
        scene.traverse((object) => {
            object.geometry?.dispose?.();
            const materials = Array.isArray(object.material)
                ? object.material
                : object.material
                  ? [object.material]
                  : [];
            materials.forEach((material) => {
                material.map?.dispose?.();
                material.dispose?.();
            });
        });
        disposables.forEach((resource) => resource.dispose?.());
        glowTexture.dispose();
        renderer.dispose();
        renderer.forceContextLoss?.();
        canvas.remove();
    };
}

export default function TechScene({ variant = 'admin', className = '' }) {
    const hostRef = useRef(null);
    const reduced = useMotionReduced();
    const reducedRef = useRef(reduced);
    const [theme, setTheme] = useState(
        () => (typeof document !== 'undefined' && document.documentElement.dataset.theme) || 'sheet',
    );
    const [ready, setReady] = useState(false);
    const readyRef = useRef(() => {});
    const failRef = useRef(() => {});

    reducedRef.current = reduced;
    readyRef.current = () => setReady(true);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setTheme(document.documentElement.dataset.theme || 'sheet');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        return () => observer.disconnect();
    }, []);

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

                cleanup = buildScene(THREE, host, variant, {
                    reducedRef,
                    readyRef,
                    failRef,
                    theme,
                });
            } catch (error) {
                failRef.current?.();
            }
        })();

        return () => {
            alive = false;
            cleanup();
        };
    }, [variant, theme]);

    return <div ref={hostRef} className={`tech-scene ${ready ? 'is-ready' : ''} ${className}`} aria-hidden="true" />;
}
