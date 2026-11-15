import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            // One entry. The second entry (`app.js`: Alpine, the vanilla lucide icon
            // pass and the global Chart.js defaults) existed for the Blade module
            // sheets; those are React pages now, so nothing loads it. Leaving it in
            // the list still built and shipped it on every deploy.
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
            fonts: [
                // Display voice: machined lettering, uppercase, heavy weights.
                bunny('Saira', {
                    weights: [600, 700, 800, 900],
                    subsets: ['latin'],
                    preload: [{ weight: 700 }],
                }),
                // Text voice: the sheet's body copy and control labels.
                bunny('Archivo', {
                    weights: [400, 500, 600, 700],
                    subsets: ['latin'],
                    preload: [{ weight: 400 }],
                }),
                // Measurement voice: money, quantities, part numbers, coordinates.
                bunny('Roboto Mono', {
                    weights: [400, 500, 700],
                    subsets: ['latin'],
                    preload: false,
                }),
            ],
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    build: {
        rollupOptions: {
            output: {
                /**
                 * Keep third-party code in its own long-lived files.
                 *
                 * Without this the bundler is free to fold React into the
                 * application entry, which it did as soon as the dependency graph
                 * changed: one 402 KB pp-*.js whose hash changes whenever any
                 * line of our own code does, so every deploy re-downloads React as
                 * well. Split out, React and the charting library keep their hashes
                 * across application changes and stay in the browser cache.
                 */
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return undefined;
                    }

                    if (id.includes('chart.js')) {
                        return 'vendor-chart';
                    }

                    if (id.includes('sweetalert2')) {
                        return 'vendor-notice';
                    }

                    // Three is only fetched by the hero's WebGL scene, and the
                    // scene imports it dynamically. Keeping the library in its
                    // own long-lived chunk means the rest of the shop never pays
                    // for it and its hash survives application changes.
                    if (id.includes('node_modules/three/')) {
                        return 'vendor-three';
                    }

                    return 'vendor';
                },
            },
        },
    },
});
