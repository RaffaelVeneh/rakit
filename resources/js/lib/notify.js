/**
 * SweetAlert2 is loaded on first notice, not on boot.
 *
 * It is a large library whose only job is a toast, and a static import put it in
 * the shared runtime chunk that every surface pays for on first paint — including
 * the storefront, which shows no notice until someone adds something to the bag.
 * The dynamic import costs one request at that moment and nothing before it.
 */
let swalPromise = null;

function loadSwal() {
    swalPromise ??= import('sweetalert2').then((module) => module.default);

    return swalPromise;
}

/**
 * Notices are drawn in the sheet's language: one rule, one mark, no rounded
 * card. A notice is the one object in this system that genuinely floats, so it
 * is also the only one allowed a shadow.
 *
 * The whole notice is rendered as `html`. SweetAlert2 would otherwise draw its
 * own `title` element above it, which both duplicates the heading and sizes the
 * popup wrong.
 */

const TONES = {
    success: { accent: 'var(--color-cyan)', label: 'Tercatat' },
    error: { accent: 'var(--color-red)', label: 'Ditolak' },
    warning: { accent: 'var(--color-red)', label: 'Perhatian' },
    info: { accent: 'var(--color-ink)', label: 'Catatan' },
};

const BASE = {
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3600,
    timerProgressBar: true,
    customClass: {
        container: 'rkt-toast-container',
        popup: 'rkt-toast',
        timerProgressBar: 'rkt-toast__bar',
    },
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export async function notify(kind, title, text = '') {
    const tone = TONES[kind] || TONES.info;
    const Swal = await loadSwal();

    return Swal.fire({
        ...BASE,
        html: `
            <div class="rkt-notice">
                <span class="rkt-notice__mark" style="background:${tone.accent}"></span>
                <span class="rkt-notice__body">
                    <span class="rkt-notice__label">${escapeHtml(tone.label)}</span>
                    <span class="rkt-notice__title">${escapeHtml(title)}</span>
                    ${text ? `<span class="rkt-notice__text">${escapeHtml(text)}</span>` : ''}
                </span>
            </div>
        `,
    });
}

export const notifySuccess = (title, text) => notify('success', title, text);
export const notifyError = (title, text) => notify('error', title, text);
export const notifyInfo = (title, text) => notify('info', title, text);
