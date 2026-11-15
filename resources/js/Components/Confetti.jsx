import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMotionReduced } from '@/lib/motion';

/**
 * A receipt being issued deserves a little noise.
 *
 * This is the one deliberately unserious effect in the system: two cannons of
 * paper from the lower corners, in the same cyanotype/violet palette as the rest
 * of the sheet. It is a canvas rather than DOM nodes because a hundred falling
 * rectangles are cheaper to draw than to lay out, and it disposes itself when the
 * last one lands.
 *
 * It is skipped entirely under reduced motion, and it never takes a pointer.
 */

const COLORS = ['#7aa2ff', '#a78bfa', '#ff7ac8', '#dee6ee', '#ffd28a'];

export default function Confetti({ active = true, duration = 3000 }) {
    const canvasRef = useRef(null);
    const still = useMotionReduced();
    const stillRef = useRef(still);
    const clearRef = useRef(null);

    stillRef.current = still;

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas || typeof window === 'undefined') {
            return undefined;
        }

        const context = canvas.getContext('2d');

        if (!context) {
            return undefined;
        }

        let width = 0;
        let height = 0;
        let frame = 0;
        let last = performance.now();
        let burstTimer = 0;
        let endTimer = 0;
        let stopTimer = 0;
        const particles = [];

        const resize = () => {
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.floor(width * ratio);
            canvas.height = Math.floor(height * ratio);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
        };

        const clear = () => {
            particles.length = 0;
            context.clearRect(0, 0, width, height);
        };

        clearRef.current = clear;

        const spawn = (originX, originY, direction) => {
            for (let index = 0; index < 70; index += 1) {
                const angle = direction === 'left' ? -Math.PI / 3 : (-2 * Math.PI) / 3;
                const spread = (Math.random() - 0.5) * 1.1;
                const speed = 5 + Math.random() * 9;
                particles.push({
                    x: originX,
                    y: originY,
                    vx: Math.cos(angle + spread) * speed,
                    vy: Math.sin(angle + spread) * speed,
                    width: 3 + Math.random() * 7,
                    height: 2 + Math.random() * 4,
                    rotation: Math.random() * Math.PI,
                    spin: (Math.random() - 0.5) * 0.35,
                    life: 1.8 + Math.random() * 1.2,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                });
            }
        };

        const paint = (now) => {
            frame = 0;
            const delta = Math.min((now - last) / 1000, 0.05);
            last = now;

            context.clearRect(0, 0, width, height);

            if (stillRef.current) {
                particles.length = 0;

                return;
            }

            for (let index = particles.length - 1; index >= 0; index -= 1) {
                const particle = particles[index];
                particle.life -= delta;

                if (particle.life <= 0 || particle.y > height + 30) {
                    particles.splice(index, 1);
                    continue;
                }

                particle.vy += 20 * delta;
                particle.vx *= 0.994;
                particle.vy *= 0.994;
                particle.x += particle.vx * delta * 60;
                particle.y += particle.vy * delta * 60;
                particle.rotation += particle.spin * delta * 60;

                const alpha = Math.min(1, particle.life * 1.4);
                context.save();
                context.globalAlpha = alpha;
                context.translate(particle.x, particle.y);
                context.rotate(particle.rotation);
                context.fillStyle = particle.color;
                context.fillRect(
                    -particle.width / 2,
                    -particle.height / 2,
                    particle.width,
                    particle.height,
                );
                context.restore();
            }

            if (particles.length > 0) {
                frame = window.requestAnimationFrame(paint);
            }
        };

        const schedule = () => {
            if (!frame) {
                frame = window.requestAnimationFrame(paint);
            }
        };

        const start = () => {
            if (stillRef.current) {
                return;
            }

            resize();
            spawn(-12, height * 0.72, 'right');
            spawn(width + 12, height * 0.72, 'left');
            schedule();

            burstTimer = window.setTimeout(() => {
                if (!stillRef.current) {
                    spawn(width * 0.2, height * 0.55, 'right');
                    spawn(width * 0.8, height * 0.55, 'left');
                    schedule();
                }
            }, 260);
        };

        resize();
        window.addEventListener('resize', resize);

        if (active) {
            endTimer = window.setTimeout(start, 220);
            stopTimer = window.setTimeout(clear, duration);
        }

        return () => {
            window.removeEventListener('resize', resize);
            window.clearTimeout(burstTimer);
            window.clearTimeout(endTimer);
            window.clearTimeout(stopTimer);
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
            clearRef.current = null;
        };
    }, [active, duration]);

    useEffect(() => {
        if (still) {
            clearRef.current?.();
        }
    }, [still]);

    return createPortal(
        <canvas ref={canvasRef} className="rkt-confetti" aria-hidden="true" />,
        document.body,
    );
}
