import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMotionReduced } from '@/lib/motion';
import { slotLabel } from '@/lib/pcCompatibility';

const SLOT_ORDER = ['case', 'motherboard', 'cpu', 'ram', 'gpu', 'cooler', 'storage', 'psu', 'fan'];

const CAMERA_PRESETS = {
    iso: { theta: 0.62, phi: 1.2, radius: 5.4 },
    front: { theta: 0.0, phi: 1.46, radius: 5.1 },
    side: { theta: 1.52, phi: 1.44, radius: 4.9 },
    top: { theta: 0.35, phi: 0.34, radius: 5.3 },
};

function readTheme() {
    if (typeof document === 'undefined') {
        return 'sheet';
    }
    return document.documentElement.dataset.theme === 'plot' ? 'plot' : 'sheet';
}

function getPalette(theme) {
    const dark = theme === 'plot';
    return {
        dark,
        bgGrid: dark ? 0x22303d : 0xc9d3dd,
        bgGridCenter: dark ? 0x35485a : 0x9aaab9,
        line: dark ? 0x7aa2ff : 0x0e3a8f,
        lineSoft: dark ? 0x35485a : 0x9aaab9,
        lit: dark ? 0xa8c2ff : 0x0e3a8f,
        red: dark ? 0xff7a5c : 0xc42b14,
        metal: dark ? 0x1b2634 : 0xdde5ee,
        metalDark: dark ? 0x101822 : 0x273545,
        pcb: dark ? 0x0d1520 : 0x142233,
        copper: 0xc87d4b,
        wood: 0x6b442a,
        glass: dark ? 0x7aa2ff : 0x0e3a8f,
    };
}

function getChassisDims(pcCase) {
    const caseClass = String(pcCase?.specs?.case_class || '');
    const slug = String(pcCase?.slug || '');
    const supported = Array.isArray(pcCase?.specs?.supported_form_factors)
        ? pcCase.specs.supported_form_factors
        : ['ATX', 'Micro-ATX', 'Mini-ITX'];

    if (supported.length === 1 && supported[0] === 'Mini-ITX') {
        return { w: 1.65, h: 1.72, d: 2.05, dualChamber: false, woodFront: false, sff: true };
    }
    if (!supported.includes('ATX')) {
        return { w: 1.82, h: 2.1, d: 2.3, dualChamber: false, woodFront: false, sff: false };
    }
    if (caseClass.includes('Dual-Chamber')) {
        return { w: 2.38, h: 2.52, d: 2.56, dualChamber: true, woodFront: false, sff: false };
    }
    return {
        w: 1.98,
        h: 2.58,
        d: 2.55,
        dualChamber: false,
        woodFront: slug.includes('north'),
        sff: false,
    };
}

function tagSlot(object, slot) {
    object.traverse((child) => {
        child.userData.slot = slot;
    });
    return object;
}

function addBoxWithEdges(THREE, parent, size, pos, fillMat, edgeColor, edgeOpacity = 0.8) {
    const geom = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const mesh = new THREE.Mesh(geom, fillMat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    parent.add(mesh);

    const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geom),
        new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: edgeOpacity }),
    );
    edges.position.copy(mesh.position);
    parent.add(edges);

    return { mesh, edges };
}

function createSlotAnchor(dims, slot) {
    const moboZ = dims.dualChamber ? -0.18 : -0.45;
    const moboX = dims.sff ? -0.04 : -0.12;
    const cpuY = dims.sff ? 0.2 : 0.36;
    const cpuX = moboX - 0.04;

    switch (slot) {
        case 'case':
            return {
                base: [0, 0, 0],
                explode: [0, 0, 0],
                mountFrom: [0, 0.7, 0],
            };
        case 'motherboard':
            return {
                base: [moboX, 0.14, moboZ],
                explode: [0, 0, -0.75],
                mountFrom: [0, 0.35, -1.2],
            };
        case 'cpu':
            return {
                base: [cpuX, cpuY, moboZ + 0.06],
                explode: [0, 0.05, 0.52],
                mountFrom: [0, 0.2, 1.3],
            };
        case 'ram':
            return {
                base: [cpuX + 0.38, cpuY, moboZ + 0.11],
                explode: [0.35, 0.05, 0.65],
                mountFrom: [0, 0.35, 1.2],
            };
        case 'cooler':
            return {
                base: [cpuX, cpuY, moboZ + 0.16],
                explode: [0, 0.95, 0.25],
                mountFrom: [0, 1.35, 0.3],
            };
        case 'gpu':
            return {
                base: [moboX + 0.06, dims.sff ? -0.2 : -0.26, moboZ + 0.44],
                explode: [0.42, -0.18, 1.15],
                mountFrom: [0.5, -0.2, 1.5],
            };
        case 'storage':
            return {
                base: [moboX + 0.02, dims.sff ? -0.05 : -0.05, moboZ + 0.06],
                explode: [0.18, -0.32, 0.85],
                mountFrom: [0, -0.3, 1.1],
            };
        case 'psu':
            return {
                base: dims.dualChamber
                    ? [-dims.w * 0.18, -dims.h * 0.26, -dims.d * 0.28]
                    : [-dims.w * 0.24, -dims.h * 0.36, -0.12],
                explode: [-0.95, -0.45, -0.35],
                mountFrom: [-1.4, -0.2, 0],
            };
        case 'fan':
            return {
                base: [dims.w * 0.41, 0.06, 0.12],
                explode: [1.05, 0.1, 0.35],
                mountFrom: [1.4, 0, 0.4],
            };
        default:
            return { base: [0, 0, 0], explode: [0, 0, 0], mountFrom: [0, 0.5, 0] };
    }
}

function buildGhostMesh(THREE, slot, dims, pal, isActive) {
    const group = new THREE.Group();
    const sizeBySlot = {
        case: [dims.w, dims.h, dims.d],
        motherboard: [1.22, 1.48, 0.08],
        cpu: [0.3, 0.3, 0.06],
        ram: [0.14, 0.5, 0.22],
        gpu: [1.2, 0.22, 0.52],
        cooler: [0.55, 0.55, 0.45],
        storage: [0.42, 0.12, 0.06],
        psu: [0.68, 0.42, 0.62],
        fan: [0.12, 1.25, 0.48],
    };

    const s = sizeBySlot[slot] || [0.5, 0.5, 0.5];
    const geom = new THREE.BoxGeometry(s[0], s[1], s[2]);
    const color = isActive ? pal.lit : pal.lineSoft;

    const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(geom),
        new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: isActive ? 0.92 : 0.32,
        }),
    );
    group.add(wire);

    const fill = new THREE.Mesh(
        geom,
        new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: isActive ? 0.14 : 0.03,
            depthWrite: false,
        }),
    );
    group.add(fill);

    return tagSlot(group, slot);
}

function buildPartGeometry(THREE, slot, part, dims, pal, isHighlighted, explodeValue) {
    const group = new THREE.Group();
    const animatedFans = [];

    const edgeColor = isHighlighted ? pal.lit : pal.line;
    const metalMat = new THREE.MeshStandardMaterial({
        color: pal.metal,
        metalness: 0.45,
        roughness: 0.42,
    });
    const darkMetalMat = new THREE.MeshStandardMaterial({
        color: pal.metalDark,
        metalness: 0.58,
        roughness: 0.35,
    });
    const pcbMat = new THREE.MeshStandardMaterial({
        color: pal.pcb,
        metalness: 0.25,
        roughness: 0.55,
    });
    const accentMat = new THREE.MeshStandardMaterial({
        color: isHighlighted ? pal.lit : pal.line,
        emissive: isHighlighted ? pal.lit : pal.line,
        emissiveIntensity: pal.dark ? 0.72 : 0.32,
        metalness: 0.5,
        roughness: 0.28,
    });

    if (slot === 'case') {
        const { w, h, d, dualChamber, woodFront } = dims;
        const railT = 0.055;

        // Outer structural wireframe box
        const shellGeom = new THREE.BoxGeometry(w, h, d);
        group.add(
            new THREE.LineSegments(
                new THREE.EdgesGeometry(shellGeom),
                new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.9 }),
            ),
        );

        // Top & bottom machined deck plates
        addBoxWithEdges(THREE, group, [w, railT, d], [0, -h / 2 + railT / 2, 0], darkMetalMat, edgeColor, 0.75);
        addBoxWithEdges(THREE, group, [w, railT, d], [0, h / 2 - railT / 2, 0], darkMetalMat, edgeColor, 0.75);

        // 4 machined corner feet
        const footPos = [
            [-w / 2 + 0.16, -h / 2 - 0.04, -d / 2 + 0.16],
            [w / 2 - 0.16, -h / 2 - 0.04, -d / 2 + 0.16],
            [-w / 2 + 0.16, -h / 2 - 0.04, d / 2 - 0.16],
            [w / 2 - 0.16, -h / 2 - 0.04, d / 2 - 0.16],
        ];
        footPos.forEach((p) => {
            addBoxWithEdges(THREE, group, [0.16, 0.08, 0.16], p, darkMetalMat, edgeColor, 0.65);
        });

        // Rear backplate & motherboard tray
        const trayZ = dualChamber ? -0.22 : -0.48;
        addBoxWithEdges(
            THREE,
            group,
            [w - 0.12, h - 0.16, 0.03],
            [0, 0, trayZ],
            metalMat,
            pal.lineSoft,
            0.45,
        );

        // Front panel slats (walnut wood accent for Fractal North or mesh bezel)
        if (woodFront) {
            const woodMat = new THREE.MeshStandardMaterial({ color: pal.wood, roughness: 0.7, metalness: 0.08 });
            for (let i = -4; i <= 4; i += 1) {
                addBoxWithEdges(
                    THREE,
                    group,
                    [0.045, h - 0.22, 0.07],
                    [w / 2 - 0.03, 0, i * 0.19],
                    woodMat,
                    edgeColor,
                    0.35,
                );
            }
        } else {
            addBoxWithEdges(
                THREE,
                group,
                [0.04, h - 0.16, d - 0.14],
                [w / 2 - 0.02, 0, 0],
                new THREE.MeshBasicMaterial({ color: pal.glass, transparent: true, opacity: 0.06, depthWrite: false }),
                edgeColor,
                0.55,
            );
        }

        // Tempered glass front/side panel (slides out in Exploded View)
        const glassGroup = new THREE.Group();
        const glassGeom = new THREE.BoxGeometry(w - 0.06, h - 0.12, 0.025);
        const glassMesh = new THREE.Mesh(
            glassGeom,
            new THREE.MeshBasicMaterial({
                color: pal.glass,
                transparent: true,
                opacity: pal.dark ? 0.08 : 0.06,
                depthWrite: false,
            }),
        );
        const glassEdge = new THREE.LineSegments(
            new THREE.EdgesGeometry(glassGeom),
            new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.65 }),
        );
        glassGroup.add(glassMesh, glassEdge);
        glassGroup.position.set(0, 0, d / 2 + explodeValue * 0.95);
        glassGroup.userData.isGlassPanel = true;
        group.add(glassGroup);
    } else if (slot === 'motherboard') {
        const ff = String(part.specs?.form_factor || 'ATX');
        const bw = ff === 'Mini-ITX' ? 1.0 : ff === 'Micro-ATX' ? 1.24 : 1.38;
        const bh = ff === 'Mini-ITX' ? 1.0 : ff === 'Micro-ATX' ? 1.32 : 1.66;

        // PCB Substrate
        addBoxWithEdges(THREE, group, [bw, bh, 0.05], [0, 0, 0], pcbMat, edgeColor, 0.95);

        // Rear I/O Armor & Top VRM Heatsink
        addBoxWithEdges(THREE, group, [0.22, bh * 0.45, 0.14], [-bw / 2 + 0.14, bh * 0.22, 0.08], darkMetalMat, edgeColor, 0.85);
        addBoxWithEdges(THREE, group, [bw * 0.45, 0.16, 0.12], [-0.04, bh / 2 - 0.14, 0.07], darkMetalMat, edgeColor, 0.85);

        // CPU Socket outline
        const sockGeom = new THREE.BoxGeometry(0.36, 0.36, 0.03);
        const sockEdges = new THREE.LineSegments(
            new THREE.EdgesGeometry(sockGeom),
            new THREE.LineBasicMaterial({ color: pal.lit }),
        );
        sockEdges.position.set(-0.04, 0.22, 0.035);
        group.add(sockEdges);

        // DIMM Slots (2 or 4)
        const dimmCount = Number(part.specs?.memory_slots) === 2 ? 2 : 4;
        for (let i = 0; i < dimmCount; i += 1) {
            addBoxWithEdges(
                THREE,
                group,
                [0.028, 0.46, 0.04],
                [0.24 + i * 0.055, 0.22, 0.04],
                darkMetalMat,
                pal.lineSoft,
                0.7,
            );
        }

        // Armored PCIe x16 Slot
        addBoxWithEdges(THREE, group, [0.56, 0.055, 0.05], [-0.02, -0.34, 0.045], accentMat, edgeColor, 0.9);

        // Chipset heatsink
        addBoxWithEdges(THREE, group, [0.34, 0.32, 0.08], [0.28, -0.48, 0.06], darkMetalMat, edgeColor, 0.75);
    } else if (slot === 'cpu') {
        // Substrate PCB + Silver IHS
        addBoxWithEdges(THREE, group, [0.3, 0.3, 0.025], [0, 0, 0], pcbMat, edgeColor, 0.9);
        addBoxWithEdges(THREE, group, [0.23, 0.23, 0.03], [0, 0, 0.028], metalMat, pal.lit, 0.95);
        addBoxWithEdges(THREE, group, [0.11, 0.11, 0.01], [0, 0, 0.048], accentMat, pal.lit, 0.9);
    } else if (slot === 'ram') {
        const isDdr5 = part.specs?.memory_type === 'DDR5';
        const stickCount = Number(part.specs?.modules) || 2;
        const stickH = isDdr5 ? 0.52 : 0.46;

        for (let i = 0; i < stickCount; i += 1) {
            const xOff = (i - (stickCount - 1) / 2) * 0.095;
            addBoxWithEdges(THREE, group, [0.042, stickH, 0.16], [xOff, 0, 0], darkMetalMat, edgeColor, 0.85);
            // Top RGB / Cyanotype light bar
            addBoxWithEdges(THREE, group, [0.036, stickH - 0.04, 0.032], [xOff, 0, 0.095], accentMat, pal.lit, 0.95);
        }
    } else if (slot === 'cooler') {
        const isAio = part.specs?.cooler_type === 'AIO';
        const radMm = Number(part.specs?.radiator_mm) || 360;

        // CPU Pump Block or Air Base
        addBoxWithEdges(THREE, group, [0.34, 0.34, 0.14], [0, 0, 0.04], darkMetalMat, edgeColor, 0.95);
        addBoxWithEdges(THREE, group, [0.22, 0.22, 0.03], [0, 0, 0.12], accentMat, pal.lit, 0.95);

        if (isAio) {
            // Top-mounted Radiator + Fans inside case ceiling
            const radWidth = radMm >= 360 ? 1.56 : 1.06;
            const radY = dims.h * 0.5 - 0.36;
            const radGroup = new THREE.Group();
            radGroup.position.set(0.18, radY, 0.12);

            addBoxWithEdges(THREE, radGroup, [radWidth, 0.12, 0.5], [0, 0, 0], darkMetalMat, edgeColor, 0.9);

            const fanCount = radMm >= 360 ? 3 : 2;
            const spacing = radWidth / fanCount;
            for (let i = 0; i < fanCount; i += 1) {
                const fx = -radWidth / 2 + spacing * (i + 0.5);
                const fanHub = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16),
                    accentMat,
                );
                fanHub.position.set(fx, -0.09, 0);
                radGroup.add(fanHub);

                const blades = new THREE.Mesh(
                    new THREE.BoxGeometry(0.28, 0.02, 0.05),
                    metalMat,
                );
                blades.position.set(fx, -0.09, 0);
                radGroup.add(blades);
                animatedFans.push({ mesh: blades, axis: 'y' });
            }

            group.add(radGroup);

            // Coolant hoses from pump to radiator
            const curve1 = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0.12, 0.06, 0.12),
                new THREE.Vector3(0.45, radY * 0.45, 0.38),
                new THREE.Vector3(0.55, radY - 0.04, 0.22),
            ]);
            const curve2 = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0.12, -0.06, 0.12),
                new THREE.Vector3(0.52, radY * 0.38, 0.42),
                new THREE.Vector3(0.65, radY - 0.04, 0.12),
            ]);
            [curve1, curve2].forEach((curve) => {
                const tube = new THREE.Mesh(
                    new THREE.TubeGeometry(curve, 18, 0.026, 8, false),
                    darkMetalMat,
                );
                group.add(tube);
            });
        } else {
            // Dual-tower Air Cooler fin stacks + copper heatpipes
            const heightScale = Math.min(1.15, Math.max(0.85, (Number(part.specs?.height_mm) || 155) / 158));
            const depth = 0.46 * heightScale;
            for (let i = -3; i <= 3; i += 1) {
                addBoxWithEdges(
                    THREE,
                    group,
                    [0.48, 0.024, depth],
                    [0, i * 0.068, 0.24 + depth * 0.3],
                    metalMat,
                    edgeColor,
                    0.65,
                );
            }
            const fanMesh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.12), accentMat);
            fanMesh.position.set(0.27, 0, 0.28);
            group.add(fanMesh);
            animatedFans.push({ mesh: fanMesh, axis: 'x' });
        }
    } else if (slot === 'gpu') {
        const lenMm = Number(part.specs?.length_mm) || 300;
        const gpuLen = Math.min(1.56, Math.max(0.88, (lenMm / 360) * 1.48));
        const slots = Number(part.specs?.slots) || 3;
        const gpuHeight = Math.min(0.28, Math.max(0.16, slots * 0.072));
        const gpuDepth = 0.56;

        // Main GPU heatsink & shroud body
        addBoxWithEdges(THREE, group, [gpuLen, gpuHeight, gpuDepth], [0, 0, 0], darkMetalMat, edgeColor, 0.95);
        // Brushed backplate on top
        addBoxWithEdges(THREE, group, [gpuLen - 0.02, 0.02, gpuDepth - 0.02], [0, gpuHeight / 2 + 0.01, 0], metalMat, edgeColor, 0.75);
        // Side luminous brand strip
        addBoxWithEdges(THREE, group, [gpuLen * 0.58, 0.038, 0.025], [0, 0.02, gpuDepth / 2 + 0.01], accentMat, pal.lit, 0.95);

        // Axial fans along bottom face
        const fanCount = lenMm >= 290 ? 3 : 2;
        for (let i = 0; i < fanCount; i += 1) {
            const fx = -gpuLen / 2 + (gpuLen / fanCount) * (i + 0.5);
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.11, 0.14, 18),
                new THREE.MeshBasicMaterial({ color: edgeColor, side: THREE.DoubleSide }),
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.set(fx, -gpuHeight / 2 - 0.008, 0);
            group.add(ring);

            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.04), accentMat);
            blade.position.set(fx, -gpuHeight / 2 - 0.012, 0);
            group.add(blade);
            animatedFans.push({ mesh: blade, axis: 'y' });
        }
    } else if (slot === 'storage') {
        const isHdd = String(part.specs?.interface || '').includes('SATA');
        if (isHdd) {
            addBoxWithEdges(THREE, group, [0.45, 0.14, 0.62], [0.45, -0.78, -0.25], metalMat, edgeColor, 0.9);
            addBoxWithEdges(THREE, group, [0.32, 0.02, 0.42], [0.45, -0.7, -0.25], accentMat, pal.lit, 0.8);
        } else {
            // M.2 NVMe stick + finned heatsink right onto motherboard M.2 bay
            addBoxWithEdges(THREE, group, [0.42, 0.11, 0.05], [0, 0, 0], darkMetalMat, edgeColor, 0.95);
            addBoxWithEdges(THREE, group, [0.34, 0.06, 0.02], [0, 0, 0.032], accentMat, pal.lit, 0.9);
        }
    } else if (slot === 'psu') {
        const isSfx = part.specs?.form_factor === 'SFX';
        const pw = isSfx ? 0.56 : 0.72;
        const ph = isSfx ? 0.32 : 0.42;
        const pd = isSfx ? 0.5 : 0.66;

        addBoxWithEdges(THREE, group, [pw, ph, pd], [0, 0, 0], darkMetalMat, edgeColor, 0.95);
        addBoxWithEdges(THREE, group, [0.02, ph * 0.5, pd * 0.65], [pw / 2 + 0.01, 0, 0], accentMat, pal.lit, 0.9);
        // PSU intake fan grille
        const grille = new THREE.Mesh(
            new THREE.RingGeometry(0.08, 0.16, 16),
            new THREE.MeshBasicMaterial({ color: edgeColor, side: THREE.DoubleSide }),
        );
        grille.rotation.x = Math.PI / 2;
        grille.position.set(0, ph / 2 + 0.01, 0);
        group.add(grille);
    } else if (slot === 'fan') {
        const packQty = Number(part.specs?.pack_qty) || 3;
        for (let i = 0; i < packQty; i += 1) {
            const fy = (i - (packQty - 1) / 2) * 0.44;
            addBoxWithEdges(THREE, group, [0.1, 0.4, 0.4], [0, fy, 0], darkMetalMat, edgeColor, 0.85);
            const hub = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.06), accentMat);
            hub.position.set(-0.02, fy, 0);
            group.add(hub);
            animatedFans.push({ mesh: hub, axis: 'x' });
        }
    }

    return {
        group: tagSlot(group, slot),
        animatedFans,
    };
}

function disposeObject(object) {
    object.traverse((child) => {
        if (child.geometry) {
            child.geometry.dispose();
        }
        if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m) => m.dispose());
        }
    });
}

function FallbackSchematic({ build, activeSlot, onSelectSlot }) {
    return (
        <div className="flex h-full flex-col justify-between p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                Skema 2D Pengganti (WebGL tidak aktif)
            </div>
            <div className="my-auto grid grid-cols-3 gap-2 py-4">
                {SLOT_ORDER.map((slot) => {
                    const part = build[slot];
                    const active = activeSlot === slot;
                    return (
                        <button
                            key={slot}
                            type="button"
                            onClick={() => onSelectSlot?.(slot)}
                            className={`border p-2.5 text-left transition-colors ${
                                active
                                    ? 'border-cyan bg-cyan-tint text-ink'
                                    : part
                                      ? 'border-ink bg-sheet text-ink'
                                      : 'border-dashed border-rule-2 bg-sheet-2 text-ink-3'
                            }`}
                        >
                            <span className="block font-mono text-[9px] uppercase tracking-[0.14em]">
                                {slotLabel(slot)}
                            </span>
                            <span className="mt-1 block truncate text-[11px] font-medium">
                                {part ? part.name : 'Kosong — klik pilih'}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function PcBuilderScene({
    build = {},
    activeSlot = 'case',
    exploded = false,
    autoRotate = true,
    cameraPreset = 'iso',
    presetNonce = 0,
    zoomNonce = 0,
    zoomDirection = 0,
    onSelectSlot,
    onHoverSlot,
    className = '',
}) {
    const hostRef = useRef(null);
    const reduced = useMotionReduced();
    const [theme, setTheme] = useState(readTheme);
    const [failed, setFailed] = useState(false);

    // Refs synced with React props so the WebGL loop reads latest state without recreating renderer
    const buildRef = useRef(build);
    buildRef.current = build;
    const activeSlotRef = useRef(activeSlot);
    activeSlotRef.current = activeSlot;
    const explodedRef = useRef(exploded);
    explodedRef.current = exploded;
    const autoRotateRef = useRef(autoRotate);
    autoRotateRef.current = autoRotate;
    const reducedRef = useRef(reduced);
    reducedRef.current = reduced;
    const themeRef = useRef(theme);
    themeRef.current = theme;
    const onSelectRef = useRef(onSelectSlot);
    onSelectRef.current = onSelectSlot;
    const onHoverRef = useRef(onHoverSlot);
    onHoverRef.current = onHoverSlot;

    const cameraStateRef = useRef({
        theta: CAMERA_PRESETS.iso.theta,
        phi: CAMERA_PRESETS.iso.phi,
        radius: CAMERA_PRESETS.iso.radius,
        targetTheta: CAMERA_PRESETS.iso.theta,
        targetPhi: CAMERA_PRESETS.iso.phi,
        targetRadius: CAMERA_PRESETS.iso.radius,
    });

    const rebuildSignalRef = useRef(null);

    // Watch document theme attribute
    useEffect(() => {
        if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
            return undefined;
        }
        const observer = new MutationObserver(() => {
            setTheme(readTheme());
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        return () => observer.disconnect();
    }, []);

    // Trigger camera preset smoothly
    useEffect(() => {
        const preset = CAMERA_PRESETS[cameraPreset] || CAMERA_PRESETS.iso;
        cameraStateRef.current.targetTheta = preset.theta;
        cameraStateRef.current.targetPhi = preset.phi;
        cameraStateRef.current.targetRadius = preset.radius;
    }, [cameraPreset, presetNonce]);

    // Trigger external zoom buttons (+/-)
    useEffect(() => {
        if (zoomNonce === 0) {
            return;
        }
        const nextRadius = Math.max(3.1, Math.min(8.2, cameraStateRef.current.targetRadius + zoomDirection * 0.65));
        cameraStateRef.current.targetRadius = nextRadius;
    }, [zoomNonce, zoomDirection]);

    // Initialize Three.js WebGL renderer once
    useEffect(() => {
        const host = hostRef.current;
        if (!host) {
            return undefined;
        }

        let cancelled = false;
        let cleanup = () => {};

        import('three')
            .then((THREE) => {
                if (cancelled) {
                    return;
                }

                let renderer;
                try {
                    renderer = new THREE.WebGLRenderer({
                        alpha: true,
                        antialias: true,
                        powerPreference: 'high-performance',
                    });
                } catch (err) {
                    setFailed(true);
                    return;
                }

                renderer.setClearColor(0x000000, 0);
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.15;
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

                const canvas = renderer.domElement;
                canvas.className = 'h-full w-full block cursor-grab active:cursor-grabbing';
                host.appendChild(canvas);

                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);

                scene.add(new THREE.AmbientLight(0x8aa2c8, 1.45));
                const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
                keyLight.position.set(4.5, 6.2, 5.4);
                scene.add(keyLight);

                const rimLight = new THREE.DirectionalLight(0x7aa2ff, 1.25);
                rimLight.position.set(-4.5, 2.5, -4.0);
                scene.add(rimLight);

                const fillLight = new THREE.PointLight(0x7aa2ff, 8, 16, 2);
                fillLight.position.set(0, -2.5, 4);
                scene.add(fillLight);

                const rig = new THREE.Group();
                scene.add(rig);

                // Ground CAD grid
                let gridHelper = null;
                const buildGrid = (pal) => {
                    if (gridHelper) {
                        scene.remove(gridHelper);
                        gridHelper.geometry?.dispose();
                        gridHelper.material?.dispose();
                    }
                    gridHelper = new THREE.GridHelper(6.6, 18, pal.bgGridCenter, pal.bgGrid);
                    gridHelper.position.y = -1.42;
                    gridHelper.material.transparent = true;
                    gridHelper.material.opacity = pal.dark ? 0.34 : 0.48;
                    scene.add(gridHelper);
                };

                // Exploded View CAD guide lines
                const explodeLineGeom = new THREE.BufferGeometry();
                const explodeLineMat = new THREE.LineBasicMaterial({
                    color: 0x7aa2ff,
                    transparent: true,
                    opacity: 0.5,
                });
                const explodeLines = new THREE.LineSegments(explodeLineGeom, explodeLineMat);
                rig.add(explodeLines);

                // Per-slot state
                const slotNodes = {};
                const prevIds = {};
                const mountProgress = {};
                let animatedFans = [];
                let explodeFactor = explodedRef.current ? 1 : 0;
                let hoveredSlot = null;

                SLOT_ORDER.forEach((slot) => {
                    const node = new THREE.Group();
                    rig.add(node);
                    slotNodes[slot] = node;
                    prevIds[slot] = null;
                    mountProgress[slot] = 1;
                });

                const rebuildAssembly = (resetMountForChanged = true) => {
                    const currentBuild = buildRef.current || {};
                    const pal = getPalette(themeRef.current);
                    const dims = getChassisDims(currentBuild.case);

                    buildGrid(pal);
                    explodeLineMat.color.setHex(pal.line);
                    animatedFans = [];

                    SLOT_ORDER.forEach((slot) => {
                        const container = slotNodes[slot];
                        while (container.children.length > 0) {
                            const child = container.children[0];
                            container.remove(child);
                            disposeObject(child);
                        }

                        const part = currentBuild[slot] || null;
                        const partId = part?.id || null;

                        if (resetMountForChanged && partId !== prevIds[slot] && partId !== null) {
                            mountProgress[slot] = reducedRef.current ? 1 : 0;
                        }
                        if (partId === null) {
                            mountProgress[slot] = 1;
                        }
                        prevIds[slot] = partId;

                        const isHighlighted = activeSlotRef.current === slot || hoveredSlot === slot;

                        if (part) {
                            const built = buildPartGeometry(THREE, slot, part, dims, pal, isHighlighted, explodeFactor);
                            container.add(built.group);
                            animatedFans.push(...built.animatedFans);
                        } else {
                            container.add(buildGhostMesh(THREE, slot, dims, pal, isHighlighted));
                        }
                    });
                };

                rebuildSignalRef.current = rebuildAssembly;
                rebuildAssembly(false);

                // Resize handling
                const resize = () => {
                    const width = Math.max(240, host.clientWidth);
                    const height = Math.max(240, host.clientHeight);
                    renderer.setSize(width, height, false);
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                };
                resize();
                const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
                resizeObserver?.observe(host);

                // Pointer orbit, zoom, hover & click raycasting
                const raycaster = new THREE.Raycaster();
                const pointerNdc = new THREE.Vector2();
                let dragging = false;
                let downX = 0;
                let downY = 0;
                let lastX = 0;
                let lastY = 0;
                let dragDistance = 0;

                const pickSlotAt = (clientX, clientY) => {
                    const rect = canvas.getBoundingClientRect();
                    if (!rect.width || !rect.height) {
                        return null;
                    }
                    pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
                    pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
                    raycaster.setFromCamera(pointerNdc, camera);

                    const hits = raycaster.intersectObjects(rig.children, true);
                    for (let i = 0; i < hits.length; i += 1) {
                        const slot = hits[i].object?.userData?.slot;
                        if (slot && SLOT_ORDER.includes(slot)) {
                            return slot;
                        }
                    }
                    return null;
                };

                const onPointerDown = (event) => {
                    if (event.button !== 0) {
                        return;
                    }
                    dragging = true;
                    downX = event.clientX;
                    downY = event.clientY;
                    lastX = event.clientX;
                    lastY = event.clientY;
                    dragDistance = 0;
                    canvas.setPointerCapture?.(event.pointerId);
                };

                const onPointerMove = (event) => {
                    if (dragging) {
                        const dx = event.clientX - lastX;
                        const dy = event.clientY - lastY;
                        dragDistance += Math.hypot(dx, dy);
                        lastX = event.clientX;
                        lastY = event.clientY;

                        cameraStateRef.current.targetTheta -= dx * 0.009;
                        cameraStateRef.current.targetPhi = Math.max(
                            0.28,
                            Math.min(Math.PI - 0.3, cameraStateRef.current.targetPhi - dy * 0.008),
                        );
                        return;
                    }

                    const hit = pickSlotAt(event.clientX, event.clientY);
                    if (hit !== hoveredSlot) {
                        hoveredSlot = hit;
                        canvas.style.cursor = hit ? 'pointer' : 'grab';
                        onHoverRef.current?.(hit);
                        rebuildAssembly(false);
                    }
                };

                const onPointerUp = (event) => {
                    if (!dragging) {
                        return;
                    }
                    dragging = false;
                    canvas.releasePointerCapture?.(event.pointerId);

                    if (dragDistance <= 5) {
                        const clicked = pickSlotAt(event.clientX, event.clientY);
                        if (clicked) {
                            onSelectRef.current?.(clicked);
                        }
                    }
                };

                const onPointerLeave = () => {
                    dragging = false;
                    if (hoveredSlot !== null) {
                        hoveredSlot = null;
                        canvas.style.cursor = 'grab';
                        onHoverRef.current?.(null);
                        rebuildAssembly(false);
                    }
                };

                const onWheel = (event) => {
                    event.preventDefault();
                    const delta = Math.sign(event.deltaY) * 0.38;
                    cameraStateRef.current.targetRadius = Math.max(
                        3.1,
                        Math.min(8.2, cameraStateRef.current.targetRadius + delta),
                    );
                };

                canvas.addEventListener('pointerdown', onPointerDown);
                canvas.addEventListener('pointermove', onPointerMove);
                canvas.addEventListener('pointerup', onPointerUp);
                canvas.addEventListener('pointerleave', onPointerLeave);
                canvas.addEventListener('wheel', onWheel, { passive: false });

                // Animation loop
                let frameId = 0;
                let lastTime = performance.now();

                const tick = (now) => {
                    frameId = window.requestAnimationFrame(tick);
                    const delta = Math.min(0.05, (now - lastTime) / 1000);
                    lastTime = now;

                    const camState = cameraStateRef.current;
                    if (autoRotateRef.current && !dragging && !reducedRef.current) {
                        camState.targetTheta += delta * 0.16;
                    }

                    const lerpRate = reducedRef.current ? 1 : Math.min(1, delta * 8.5);
                    camState.theta += (camState.targetTheta - camState.theta) * lerpRate;
                    camState.phi += (camState.targetPhi - camState.phi) * lerpRate;
                    camState.radius += (camState.targetRadius - camState.radius) * lerpRate;

                    camera.position.set(
                        camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta),
                        camState.radius * Math.cos(camState.phi) + 0.08,
                        camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta),
                    );
                    camera.lookAt(0, -0.05, 0);

                    const targetExplode = explodedRef.current ? 1 : 0;
                    explodeFactor += (targetExplode - explodeFactor) * (reducedRef.current ? 1 : Math.min(1, delta * 7.5));

                    const dims = getChassisDims(buildRef.current?.case);
                    const guideVertices = [];

                    SLOT_ORDER.forEach((slot) => {
                        const container = slotNodes[slot];
                        const anchor = createSlotAnchor(dims, slot);

                        if (mountProgress[slot] < 1) {
                            mountProgress[slot] = reducedRef.current
                                ? 1
                                : Math.min(1, mountProgress[slot] + delta * 1.9);
                        }

                        const easedMount = 1 - Math.pow(1 - mountProgress[slot], 3);
                        const mountRemain = 1 - easedMount;

                        const px =
                            anchor.base[0] +
                            anchor.explode[0] * explodeFactor +
                            anchor.mountFrom[0] * mountRemain;
                        const py =
                            anchor.base[1] +
                            anchor.explode[1] * explodeFactor +
                            anchor.mountFrom[1] * mountRemain;
                        const pz =
                            anchor.base[2] +
                            anchor.explode[2] * explodeFactor +
                            anchor.mountFrom[2] * mountRemain;

                        container.position.set(px, py, pz);

                        // Slide tempered glass panel on case if installed
                        if (slot === 'case') {
                            container.traverse((child) => {
                                if (child.userData?.isGlassPanel) {
                                    child.position.z = dims.d / 2 + explodeFactor * 0.95;
                                }
                            });
                        }

                        if (explodeFactor > 0.02 && slot !== 'case' && buildRef.current?.[slot]) {
                            guideVertices.push(
                                anchor.base[0], anchor.base[1], anchor.base[2],
                                px, py, pz,
                            );
                        }
                    });

                    explodeLineGeom.setAttribute(
                        'position',
                        new THREE.Float32BufferAttribute(guideVertices, 3),
                    );
                    explodeLines.visible = guideVertices.length > 0;

                    if (!reducedRef.current) {
                        animatedFans.forEach((fan) => {
                            if (fan.axis === 'y') {
                                fan.mesh.rotation.y += delta * 11;
                            } else {
                                fan.mesh.rotation.x += delta * 11;
                            }
                        });
                    }

                    renderer.render(scene, camera);
                };

                frameId = window.requestAnimationFrame(tick);

                cleanup = () => {
                    rebuildSignalRef.current = null;
                    window.cancelAnimationFrame(frameId);
                    resizeObserver?.disconnect();
                    canvas.removeEventListener('pointerdown', onPointerDown);
                    canvas.removeEventListener('pointermove', onPointerMove);
                    canvas.removeEventListener('pointerup', onPointerUp);
                    canvas.removeEventListener('pointerleave', onPointerLeave);
                    canvas.removeEventListener('wheel', onWheel);

                    SLOT_ORDER.forEach((slot) => disposeObject(slotNodes[slot]));
                    if (gridHelper) {
                        gridHelper.geometry?.dispose();
                        gridHelper.material?.dispose();
                    }
                    explodeLineGeom.dispose();
                    explodeLineMat.dispose();
                    renderer.dispose();
                    canvas.remove();
                };
            })
            .catch(() => {
                if (!cancelled) {
                    setFailed(true);
                }
            });

        return () => {
            cancelled = true;
            cleanup();
        };
    }, []);

    // Trigger geometry rebuild whenever build, active slot, or theme changes
    const buildFingerprint = useMemo(
        () => SLOT_ORDER.map((s) => `${s}:${build[s]?.id || 0}`).join('|'),
        [build],
    );

    useEffect(() => {
        rebuildSignalRef.current?.(true);
    }, [buildFingerprint]);

    useEffect(() => {
        rebuildSignalRef.current?.(false);
    }, [activeSlot, theme]);

    if (failed) {
        return (
            <div className={`h-full w-full ${className}`}>
                <FallbackSchematic build={build} activeSlot={activeSlot} onSelectSlot={onSelectSlot} />
            </div>
        );
    }

    return (
        <div
            ref={hostRef}
            className={`relative h-full w-full select-none ${className}`}
            aria-label="Viewport 3D interaktif rakitan komputer"
        />
    );
}
