<!DOCTYPE html>
<html lang="id" class="h-full bg-sheet text-ink antialiased">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">

    {{--
        The theme is resolved before anything is painted.

        This has to be a blocking inline script in the head: if the attribute were
        set from React, the browser would paint the light sheet first and then
        repaint it dark, which is the flash every themed site is judged on. It is
        four lines and it reads storage once.
    --}}
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
            } catch (error) {
                /* Private mode, storage disabled: the sheet temperature is the default. */
            }
            document.documentElement.dataset.theme = theme;

            /* Motion is this application's own setting, not a hint from the
               operating system. It is 'full' unless the reader has turned it down
               here, and the switch lives in the header of every layout. Defaulting
               from the OS flag would let a preference set for some other reason
               silently strip the sheet of the thing it is made of. */
            var motion = 'full';
            try {
                if (window.localStorage.getItem('rakit-motion') === 'reduced') {
                    motion = 'reduced';
                }
            } catch (error) {
                /* Storage unavailable: full motion. */
            }
            document.documentElement.dataset.motion = motion;
        })();
    </script>

    {{--
        The boot sheet.

        Written out in full, with its own styles inline, because it is the one
        surface that has to be correct before a single byte of the stylesheet or
        the bundle has arrived. It is a sheet being drawn: a ruled frame, the
        mark, a title block, and four stages that light as they actually happen.

        The four stages are real milestones, not a timed animation pretending to
        be one:

          01 Struktur   the document parsed            (this script)
          02 Huruf      the stylesheets and fonts settled
          03 Mesin      the application entry executed
          04 Meja       React has mounted and drawn

        `window.rakitBoot.advance(n)` is called at each of them. Nothing here
        reports progress it cannot measure, and nothing counts a percentage it
        invented.
    --}}
    <style>
        .boot {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #080d13;
            color: #dee6ee;
            /* The system stack, deliberately. The self-hosted measurement face arrives
               with the stylesheet; naming it here would swap the boot text mid-draw.
               A system monospace is present before anything is downloaded. */
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            /* Fail-safe. If the bundle never arrives, the sheet is still readable
               underneath rather than sealed behind a boot screen for ever. */
            animation: boot-failsafe 0s linear 9s forwards;
        }

        /* Registration marks, not a background grid.
        
           A full-bleed grid behind a panel is the default texture of a generated
           interface; a printer's registration mark is what a drawing sheet
           actually carries, and it says the same thing with four marks instead of
           nine hundred lines. */
        .boot__reg {
            position: absolute;
            width: 13px;
            height: 13px;
            opacity: 0;
            animation: boot-reg 500ms cubic-bezier(0.16, 1, 0.3, 1) 700ms both;
        }

        .boot__reg::before,
        .boot__reg::after {
            content: '';
            position: absolute;
            background: #35485a;
        }

        .boot__reg::before {
            left: 50%;
            top: 0;
            bottom: 0;
            width: 1px;
            transform: translateX(-0.5px);
        }

        .boot__reg::after {
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            transform: translateY(-0.5px);
        }

        .boot__reg--tl { top: 26px; left: 26px; }
        .boot__reg--tr { top: 26px; right: 26px; }
        .boot__reg--bl { bottom: 26px; left: 26px; }
        .boot__reg--br { bottom: 26px; right: 26px; }

        .boot__frame {
            position: relative;
            width: min(560px, calc(100vw - 40px));
            border: 1px solid #35485a;
            padding: 20px;
            background: rgba(8, 13, 19, 0.86);
        }

        /* Each edge is drawn from its own corner, in order, like a plotter. */
        .boot__edge {
            position: absolute;
            background: #7aa2ff;
            transform-origin: left center;
            animation: boot-draw 420ms cubic-bezier(0.7, 0, 0.84, 0) both;
        }

        .boot__edge--t { top: 0; left: 0; right: 0; height: 1px; }
        .boot__edge--r { top: 0; right: 0; bottom: 0; width: 1px; transform-origin: top center; animation-delay: 120ms; }
        .boot__edge--b { bottom: 0; left: 0; right: 0; height: 1px; transform-origin: right center; animation-delay: 240ms; }
        .boot__edge--l { top: 0; left: 0; bottom: 0; width: 1px; transform-origin: bottom center; animation-delay: 360ms; }

        .boot__head {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 16px;
            border-bottom: 1px solid #22303d;
            padding-bottom: 10px;
            font-size: 10px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #7c8ea1;
        }

        .boot__mark {
            display: flex;
            align-items: center;
            gap: 9px;
            margin: 22px 0 4px;
        }

        .boot__mark svg { display: block; }

        .boot__word {
            font-family: 'Saira', ui-sans-serif, system-ui, sans-serif;
            font-weight: 800;
            /* headline-xs from the documented ramp. A boot panel is a label on a
               cover sheet, not the page thesis — it takes the smallest documented
               headline step rather than a size invented for this one screen. */
            font-size: 1.5rem;
            line-height: 1;
            letter-spacing: -0.01em;
            text-transform: uppercase;
            color: #dee6ee;
        }

        .boot__claim {
            margin: 8px 0 22px;
            font-family: 'Saira', ui-sans-serif, system-ui, sans-serif;
            font-size: 15px;
            font-weight: 700;
            line-height: 1.2;
            letter-spacing: -0.01em;
            text-transform: uppercase;
            color: #dee6ee;
        }

        .boot__steps {
            display: grid;
            gap: 1px;
            background: #22303d;
            border: 1px solid #22303d;
        }

        .boot__step {
            display: grid;
            grid-template-columns: 18px 1fr auto;
            align-items: center;
            gap: 10px;
            background: #0f1821;
            padding: 7px 10px;
            font-size: 10px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            /* A stage that has not lit yet is still text the reader is reading, so
               it holds the floor. The state is carried by the lamp — hollow, then
               filled — which is this world's device for it, not by dimming the
               words below the point of legibility. */
            color: #7c8ea1;
            transition: color 220ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .boot__lamp {
            width: 9px;
            height: 9px;
            border: 1px solid #35485a;
            background: transparent;
            transition: background 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 220ms;
        }

        .boot__step[data-done='true'] {
            color: #dee6ee;
        }

        .boot__step[data-done='true'] .boot__lamp {
            background: #7aa2ff;
            border-color: #7aa2ff;
        }

        .boot__step[data-active='true'] .boot__lamp {
            animation: boot-pulse 900ms steps(2, end) infinite;
        }

        .boot__progress {
            position: relative;
            height: 2px;
            margin-top: 18px;
            background: #22303d;
        }

        .boot__bar {
            position: absolute;
            inset: 0;
            background: #7aa2ff;
            transform: scaleX(0);
            transform-origin: left center;
            transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .boot__foot {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 16px;
            margin-top: 14px;
            font-size: 10px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #7c8ea1;
        }

        .boot__pct { color: #dee6ee; font-variant-numeric: tabular-nums; }

        /* The exit: the sheet is drawn, so the boot frame is pulled away upward
           like a cover sheet off a drawing board. */
        .boot[data-ready='true'] {
            animation: none;
            transform: translateY(-101%);
            transition: transform 620ms cubic-bezier(0.7, 0, 0.84, 0);
            pointer-events: none;
        }


        .boot[data-gone='true'] { display: none; }

        @keyframes boot-draw {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
        }

        @keyframes boot-reg {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes boot-pulse {
            0%, 100% { background: transparent; }
            50% { background: #35485a; }
        }

        @keyframes boot-failsafe {
            to { opacity: 0; visibility: hidden; }
        }

        /* Only when the reader has turned motion down in this application — never
           because the operating system suggested it. */
        :root[data-motion='reduced'] .boot__reg,
        :root[data-motion='reduced'] .boot__edge,
        :root[data-motion='reduced'] .boot__step[data-active='true'] .boot__lamp {
            animation: none;
        }

        :root[data-motion='reduced'] .boot__bar {
            transition: none;
        }

        :root[data-motion='reduced'] .boot[data-ready='true'] {
            transition-duration: 1ms;
        }

        /* The boot cover is a sheet too. When the reader keeps the light
           temperature, the cover must not flash the plotter field before the
           document arrives. */
        html[data-theme='sheet'] .boot {
            background: #ffffff;
            color: #0c1622;
        }

        html[data-theme='sheet'] .boot__reg::before,
        html[data-theme='sheet'] .boot__reg::after {
            background: #9aaab9;
        }

        html[data-theme='sheet'] .boot__frame {
            background: rgba(255, 255, 255, 0.92);
            border-color: #9aaab9;
        }

        html[data-theme='sheet'] .boot__edge {
            background: #0e3a8f;
        }

        html[data-theme='sheet'] .boot__head {
            border-bottom-color: #c9d3dd;
            color: #5f7082;
        }

        html[data-theme='sheet'] .boot__word,
        html[data-theme='sheet'] .boot__claim,
        html[data-theme='sheet'] .boot__step[data-done='true'],
        html[data-theme='sheet'] .boot__pct {
            color: #0c1622;
        }

        html[data-theme='sheet'] .boot__steps {
            background: #c9d3dd;
            border-color: #c9d3dd;
        }

        html[data-theme='sheet'] .boot__step {
            background: #eff3f7;
            color: #5f7082;
        }

        html[data-theme='sheet'] .boot__lamp {
            border-color: #9aaab9;
        }

        html[data-theme='sheet'] .boot__step[data-done='true'] .boot__lamp {
            background: #0e3a8f;
            border-color: #0e3a8f;
        }

        html[data-theme='sheet'] .boot__step[data-active='true'] .boot__lamp {
            animation-name: boot-pulse-light;
        }

        html[data-theme='sheet'] .boot__progress {
            background: #c9d3dd;
        }

        html[data-theme='sheet'] .boot__bar {
            background: #0e3a8f;
        }

        html[data-theme='sheet'] .boot__foot {
            color: #5f7082;
        }

        html[data-theme='sheet'] .boot__mark path:nth-child(-n + 2) {
            stroke: #0e3a8f;
        }

        html[data-theme='sheet'] .boot__mark path:nth-child(n + 3) {
            stroke: #0c1622;
        }

        @keyframes boot-pulse-light {
            0%,
            100% {
                background: transparent;
            }
            50% {
                background: #9aaab9;
            }
        }
    </style>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>
<body class="h-full bg-sheet font-sans text-ink">
    <div class="boot" id="rakit-boot" role="status" aria-live="polite" aria-label="Menyiapkan lembar">
        <span class="boot__reg boot__reg--tl" aria-hidden="true"></span>
        <span class="boot__reg boot__reg--tr" aria-hidden="true"></span>
        <span class="boot__reg boot__reg--bl" aria-hidden="true"></span>
        <span class="boot__reg boot__reg--br" aria-hidden="true"></span>

        <div class="boot__frame">
            <span class="boot__edge boot__edge--t" aria-hidden="true"></span>
            <span class="boot__edge boot__edge--r" aria-hidden="true"></span>
            <span class="boot__edge boot__edge--b" aria-hidden="true"></span>
            <span class="boot__edge boot__edge--l" aria-hidden="true"></span>

            <div class="boot__head">
                <span>Lembar disiapkan</span>
                <span id="rakit-boot-date">&mdash;</span>
            </div>

            <div class="boot__mark">
                <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M3 3h11v11" stroke="#7aa2ff" stroke-width="2.4" />
                    <path d="M29 29H18V18" stroke="#7aa2ff" stroke-width="2.4" />
                    <path d="M29 3 18 14" stroke="#dee6ee" stroke-width="1.6" />
                    <path d="M3 29 14 18" stroke="#dee6ee" stroke-width="1.6" />
                </svg>
                <span class="boot__word">Rakit</span>
            </div>

            <p class="boot__claim">
                Beli dengan angka,<br />bukan gambar.
            </p>

            <div class="boot__steps">
                <div class="boot__step" id="rakit-step-1">
                    <span class="boot__lamp" aria-hidden="true"></span>
                    <span>01 &middot; Struktur</span>
                    <span>Dokumen</span>
                </div>
                <div class="boot__step" id="rakit-step-2">
                    <span class="boot__lamp" aria-hidden="true"></span>
                    <span>02 &middot; Huruf &amp; garis</span>
                    <span>Gaya</span>
                </div>
                <div class="boot__step" id="rakit-step-3">
                    <span class="boot__lamp" aria-hidden="true"></span>
                    <span>03 &middot; Mesin gambar</span>
                    <span>Skrip</span>
                </div>
                <div class="boot__step" id="rakit-step-4">
                    <span class="boot__lamp" aria-hidden="true"></span>
                    <span>04 &middot; Meja siap</span>
                    <span>Tampil</span>
                </div>
            </div>

            <div class="boot__progress">
                <span class="boot__bar" id="rakit-boot-bar" aria-hidden="true"></span>
            </div>

            <div class="boot__foot">
                <span id="rakit-boot-note">Menyiapkan</span>
                <span class="boot__pct" id="rakit-boot-pct">0%</span>
            </div>
        </div>
    </div>

    <noscript>
        <style>
            .boot { display: none; }
        </style>
    </noscript>

    <script>
        /**
         * The boot sheet's own controller.
         *
         * It is defined here, before the bundle, so that the very first milestone
         * can be recorded without waiting for anything to download. The stages
         * advance only when the thing they name has actually happened.
         */
        (function () {
            var root = document.getElementById('rakit-boot');
            var bar = document.getElementById('rakit-boot-bar');
            var pct = document.getElementById('rakit-boot-pct');
            var note = document.getElementById('rakit-boot-note');
            var date = document.getElementById('rakit-boot-date');

            var STAGES = 4;
            var NOTES = ['Menyiapkan', 'Menyusun lembar', 'Memuat mesin gambar', 'Menggambar meja'];
            var step = 0;

            if (date) {
                try {
                    date.textContent = new Intl.DateTimeFormat('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })
                        .format(new Date())
                        .toUpperCase();
                } catch (error) {
                    date.textContent = '';
                }
            }

            function paint() {
                if (bar) {
                    bar.style.transform = 'scaleX(' + step / STAGES + ')';
                }
                if (pct) {
                    pct.textContent = Math.round((step / STAGES) * 100) + '%';
                }
                if (note) {
                    note.textContent = NOTES[Math.min(step, STAGES - 1)];
                }
            }

            function advance(to) {
                step = Math.max(step, to);
                paint();

                for (var i = 1; i <= STAGES; i += 1) {
                    var el = document.getElementById('rakit-step-' + i);
                    if (!el) {
                        continue;
                    }
                    el.dataset.done = i <= step ? 'true' : 'false';
                    el.dataset.active = i === step + 1 ? 'true' : 'false';
                }
            }

            function dismiss() {
                advance(STAGES);
                if (!root) {
                    return;
                }
                root.dataset.ready = 'true';
                window.setTimeout(function () {
                    root.dataset.gone = 'true';
                }, 700);
            }

            window.rakitBoot = { advance: advance, dismiss: dismiss };

            // 01 — this script running at all means the document has parsed.
            advance(1);

            // 02 — the stylesheet and the self-hosted faces have settled.
            var settle = function () {
                advance(2);
            };
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(settle);
            } else if (document.readyState === 'complete') {
                settle();
            } else {
                window.addEventListener('load', settle, { once: true });
            }
        })();
    </script>

    @inertia
</body>
</html>
