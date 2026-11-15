import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { InstrumentCursor } from '@/Components/InstrumentCursor';
import { RouteLoader } from '@/Components/RouteLoader';
import { ScrollProgress } from '@/Components/ScrollProgress';

// Built once, at module scope. Inside `resolve` the glob was re-evaluated on every
// navigation — thirty lookups per visit for a table that never changes.
const PAGES = import.meta.glob('./Pages/**/*.jsx');

// 03 — the entry itself executed. Named here rather than in a listener because
// "the engine loaded" is exactly this line running.
window.rakitBoot?.advance(3);

createInertiaApp({
    title: (title) => (title ? `${title}` : 'RAKIT — Register komponen & gear'),
    // Resolved lazily: `import.meta.glob` without `eager` gives Vite one chunk per
    // page, so a visitor to the storefront never downloads the console's registers
    // or the module sheets. Inertia awaits the returned promise and holds the
    // previous page on screen until the next one is ready.
    resolve: (name) => {
        const page = PAGES[`./Pages/${name}.jsx`];

        if (!page) {
            throw new Error(`Page ${name} not found in ./Pages/${name}.jsx`);
        }

        return page();
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <>
                <App {...props} />
                <InstrumentCursor />
                <RouteLoader />
                <ScrollProgress />
            </>,
        );

        // 04 — React has mounted. The boot sheet waits one more frame so the
        // first paint is genuinely on screen before the cover is pulled away;
        // dismissing on mount would lift it over an empty document and the
        // reveal would show nothing.
        window.rakitBoot?.advance(4);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => window.rakitBoot?.dismiss());
        });
    },
    progress: {
        color: '#0E3A8F',
        showSpinner: false,
        delay: 120,
    },
});
