{{--
    The error sheet.

    Error pages are the one place Blade legitimately remains in this application:
    the framework renders them outside Inertia, and a 500 is exactly the moment the
    bundle may not be available at all. So this carries its own styles — the same
    token values as app.css, written out — and the same head script, so a refusal
    arrives in the reader's own temperature rather than as a white page with
    "Forbidden" in the browser's default serif.

    A refusal is part of the system, so it is drawn by the system: a ruled frame, the
    code set as the one display figure on the sheet, registration marks, and a way
    onward that is actually available to the person reading it.
--}}
<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <title>@yield('code') — RAKIT</title>

    <script>
        (function () {
            var theme = 'sheet';
            try {
                var stored = window.localStorage.getItem('rakit-theme');
                if (stored === 'plot' || stored === 'sheet') {
                    theme = stored;
                } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    theme = 'plot';
                }
            } catch (error) {}
            document.documentElement.dataset.theme = theme;

            var motion = 'full';
            try {
                if (window.localStorage.getItem('rakit-motion') === 'reduced') {
                    motion = 'reduced';
                }
            } catch (error) {}
            document.documentElement.dataset.motion = motion;
        })();
    </script>

    <style>
        :root {
            --sheet: #ffffff;
            --sheet-2: #eff3f7;
            --ink: #0c1622;
            --ink-2: #46586b;
            --ink-3: #5f7082;
            --rule: #c9d3dd;
            --cyan: #0e3a8f;
            --plot: #080d13;
            color-scheme: light;
        }

        :root[data-theme='plot'] {
            --sheet: #0f1821;
            --sheet-2: #16212c;
            --ink: #dee6ee;
            --ink-2: #98a9ba;
            --ink-3: #7c8ea1;
            --rule: #22303d;
            --cyan: #7aa2ff;
            color-scheme: dark;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            min-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: var(--sheet);
            color: var(--ink);
            font-family: 'Archivo', ui-sans-serif, system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
        }

        .slip {
            position: relative;
            width: min(560px, 100%);
            border: 1px solid var(--ink);
            background: var(--sheet);
            padding: 22px;
            animation: slip-in 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        :root[data-motion='reduced'] .slip { animation: none; }

        @keyframes slip-in {
            from { opacity: 0; transform: translate3d(0, 14px, 0); }
            to { opacity: 1; transform: none; }
        }

        .slip__head {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 16px;
            border-bottom: 1px solid var(--ink);
            padding-bottom: 10px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 10px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--ink-3);
        }

        .slip__mark {
            display: flex;
            align-items: center;
            gap: 9px;
            margin: 20px 0 14px;
            font-family: 'Saira', ui-sans-serif, system-ui, sans-serif;
            font-weight: 800;
            font-size: 1.5rem;
            line-height: 1;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }

        .slip__code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            /* The Display step from the documented ramp. A refusal is the one figure
               on this sheet, so it takes the largest documented size rather than one
               invented for an error page. */
            font-size: 2.75rem;
            font-weight: 500;
            line-height: 1;
            letter-spacing: -0.02em;
            color: var(--cyan);
            font-variant-numeric: tabular-nums;
        }

        .slip__title {
            margin-top: 12px;
            font-family: 'Saira', ui-sans-serif, system-ui, sans-serif;
            font-weight: 700;
            font-size: 1.25rem;
            line-height: 1.1;
            letter-spacing: -0.01em;
            text-transform: uppercase;
        }

        .slip__body {
            margin-top: 10px;
            max-width: 58ch;
            font-size: 13px;
            line-height: 1.6;
            color: var(--ink-2);
        }

        .slip__rule {
            height: 1px;
            background: var(--rule);
            margin: 20px 0 16px;
        }

        .slip__actions { display: flex; flex-wrap: wrap; gap: 10px; }

        .stamp {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid var(--cyan);
            background: var(--cyan);
            color: var(--sheet);
            padding: 11px 22px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 11px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            text-decoration: none;
            transition: background 160ms, border-color 160ms;
        }

        .stamp:hover { background: var(--ink); border-color: var(--ink); }

        .stamp--quiet {
            background: transparent;
            color: var(--ink-2);
            border-color: var(--rule);
        }

        .stamp--quiet:hover { background: transparent; color: var(--ink); border-color: var(--ink); }

        .slip__foot {
            margin-top: 18px;
            border-top: 1px solid var(--rule);
            padding-top: 10px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 10px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--ink-3);
        }
    </style>
</head>
<body>
    <main class="slip">
        <div class="slip__head">
            <span>Lembar ditolak</span>
            <span>RAKIT</span>
        </div>

        <div class="slip__mark">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M3 3h11v11" stroke="currentColor" stroke-width="2.4" />
                <path d="M29 29H18V18" stroke="currentColor" stroke-width="2.4" />
                <path d="M29 3 18 14" stroke="var(--cyan)" stroke-width="1.6" />
                <path d="M3 29 14 18" stroke="var(--cyan)" stroke-width="1.6" />
            </svg>
            <span>Rakit</span>
        </div>

        <p class="slip__code" aria-hidden="true">@yield('code')</p>

        <h1 class="slip__title">@yield('title')</h1>

        <p class="slip__body">@yield('body')</p>

        <div class="slip__rule"></div>

        <div class="slip__actions">
            @yield('actions')
            <a class="stamp stamp--quiet" href="/">Kembali ke register</a>
        </div>

        <p class="slip__foot">RAKIT · Lembar kendali · @yield('code')</p>
    </main>
</body>
</html>
