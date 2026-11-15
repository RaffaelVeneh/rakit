import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    BookOpen,
    CalendarClock,
    CheckCircle2,
    Circle,
    FileText,
    Layers,
    Mail,
    Mic,
    MicOff,
    Monitor,
    Phone,
    Printer,
    Radio,
    Scan,
    Tv,
    User,
    Video,
    Volume2,
} from 'lucide-react';
import ModuleLayout from '@/Layouts/ModuleLayout';
import { PageBand, Plate, SectionHead, SheetHead, ZoneFrame } from '@/Components/Sheet';
import { EmptyState, Field, LabelledField, Select, Stamp, StatusLamp, Tag } from '@/Components/Controls';
import { count, eventStamp } from '@/lib/format';
import { notifyError } from '@/lib/notify';

/**
 * OAS — the office automation layer drawn as a document-control sheet. The twelve
 * components the layer covers are the sheet's index; below it the operator issues
 * a memo and reads the archive back, then the two remaining parts of the layer:
 * the virtual meeting channel and the imaging desk. Every figure here is either a
 * row the controller passed or a constant this chapter defines.
 */

/** The twelve components of the office automation layer, each with its Indonesian gloss. */
const OAS_COMPONENTS = [
    { icon: FileText, name: 'Word processing', gloss: 'Pengolahan kata' },
    { icon: Mail, name: 'Electronic mail', gloss: 'Surat elektronik' },
    { icon: Phone, name: 'Voice mail', gloss: 'Pesan suara' },
    { icon: Volume2, name: 'Audio conference', gloss: 'Rapat audio' },
    { icon: Video, name: 'Video conference', gloss: 'Rapat video' },
    { icon: Monitor, name: 'Computer conference', gloss: 'Rapat berbantuan komputer' },
    { icon: Radio, name: 'Teleconferencing', gloss: 'Telekonferensi' },
    { icon: Printer, name: 'Facsimile', gloss: 'Faksimile' },
    { icon: BookOpen, name: 'Desktop publishing', gloss: 'Tata letak dokumen' },
    { icon: Tv, name: 'Video task', gloss: 'Tugas berbasis video' },
    { icon: Scan, name: 'Imaging / OCR', gloss: 'Pencitraan dokumen' },
    { icon: Layers, name: 'Multimedia', gloss: 'Berkas multimedia' },
];

const TABS = [
    { key: 'memos', label: 'Memo & dokumen' },
    { key: 'tasks', label: 'Tugas & tenggat' },
    { key: 'conferencing', label: 'Telekonferensi' },
    { key: 'imaging', label: 'Pencitraan / OCR' },
];

/** The three roles present on a virtual meeting channel. */
const PARTICIPANTS = [
    { role: 'CEO (top management)', mic: 'Aktif', on: true },
    { role: 'Manajer regional (tactical)', mic: 'Aktif', on: true },
    { role: 'Supervisor lapangan', mic: 'Mati', on: false },
];

/** Priority is a lamp plus a word, never a coloured pill. */
const PRIORITY_STATES = {
    urgent: { tone: 'lit-red', lamp: 'lit', label: 'Mendesak' },
    confidential: { tone: 'chalk', lamp: 'half', label: 'Rahasia' },
    normal: { tone: 'chalk', lamp: 'unlit', label: 'Normal' },
};

const priorityState = (priority) => PRIORITY_STATES[priority] || PRIORITY_STATES.normal;

/**
 * The consignment note the imaging desk opens with. Kept verbatim: this is the
 * text the OCR reading is demonstrated on, figures and all.
 */
const OCR_SAMPLE =
    'SURAT JALAN / FAKTUR PENGIRIMAN LOGISTIK NO: SJ-2026/088\nITEM: 12x SERVER RACK WORKSTATION\nTOTAL NILAI: $18,400.00\nTANGGAL: 31 AGUSTUS 2026';

const OCR_OPENING = 'Hasil pindaian akan tampil di sini setelah proses dijalankan.';

/** The rules the controller actually holds each field to, stated in the sheet's language. */
const FIELD_RULES = {
    title: 'Judul dokumen wajib diisi, maksimal 200 karakter. Perbaiki judulnya, lalu kirim lagi.',
    sender: 'Pengirim wajib diisi, maksimal 100 karakter. Perbaiki namanya, lalu kirim lagi.',
    recipient: 'Penerima wajib diisi, maksimal 100 karakter. Perbaiki tujuannya, lalu kirim lagi.',
    department: 'Departemen wajib diisi, maksimal 100 karakter. Perbaiki namanya, lalu kirim lagi.',
    priority: 'Prioritas hanya menerima normal, mendesak, atau rahasia. Pilih salah satunya, lalu kirim lagi.',
    document_type: 'Klasifikasi surat wajib diisi, maksimal 100 karakter. Perbaiki isinya, lalu kirim lagi.',
    content: 'Isi dokumen tidak boleh kosong. Tuliskan isi memo, lalu kirim lagi.',
};

export default function Oas({ memos = [], tasks = [] }) {
    const [activeTab, setActiveTab] = useState('memos');
    const [ocrInput, setOcrInput] = useState(OCR_SAMPLE);
    const [ocrResult, setOcrResult] = useState('');

    const rows = memos || [];
    const taskRows = tasks || [];

    const taskForm = useForm({
        title: '',
        assignee: '',
        department: 'Operasional',
        due_date: new Date().toISOString().slice(0, 10),
        priority: 'normal',
        notes: '',
    });

    const submitTask = (event) => {
        event.preventDefault();
        taskForm.post('/oas/tasks', {
            preserveScroll: true,
            onSuccess: () => taskForm.reset('title', 'assignee', 'notes'),
            onError: () =>
                notifyError('Tugas ditolak', 'Lengkapi judul, penanggung jawab, dan tenggat.'),
        });
    };

    const toggleTask = (taskId) => {
        router.patch(`/oas/tasks/${taskId}/toggle`, {}, { preserveScroll: true });
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        sender: '',
        recipient: '',
        department: '',
        priority: 'normal',
        document_type: 'Memo Internal',
        content: '',
    });

    const setField = (key) => (event) => setData(key, event.target.value);

    const fieldError = (key) =>
        errors[key] ? FIELD_RULES[key] || 'Isian ini ditolak. Perbaiki nilainya, lalu kirim lagi.' : null;

    const submit = (event) => {
        event.preventDefault();
        if (processing) {
            return;
        }

        post('/oas/store', {
            preserveScroll: true,
            // Success is reported once, by the layout, from the controller's own
            // flash message: the redirect back to /oas carries it.
            onSuccess: () => reset(),
            onError: () =>
                notifyError(
                    'Memo ditolak',
                    'Kolom bertanda merah belum benar. Perbaiki kolom itu, lalu kirim lagi.',
                ),
        });
    };

    const runOcr = () => {
        setOcrResult(
            '[OCR DIGITALISASI BERHASIL]\n' + ocrInput + '\n\nData tersimpan ke format digital OAS repository.',
        );
    };

    // The tab strip is a real tablist: the arrow keys walk it, the way the
    // operator expects a ruled index to behave.
    const moveTab = (event, offset) => {
        const index = TABS.findIndex((item) => item.key === activeTab);
        const next = TABS[(index + offset + TABS.length) % TABS.length];
        setActiveTab(next.key);
        event.currentTarget.parentElement?.querySelector(`#oas-tab-${next.key}`)?.focus();
    };

    return (
        <ModuleLayout sheet="OAS · Tingkat pengetahuan">
            <Head title="Office Automation System (OAS) — RAKIT" />

            {/* ── Sheet band: what the office automation layer covers ─────── */}
            <PageBand
                tone="plot"
                path={[
                    { label: 'Piramida', href: '/pyramid' },
                    { label: 'Modul rujukan' },
                    { label: 'OAS · Tingkat pengetahuan' },
                ]}
                title="Office automation system (OAS)"
                meta="Otomatisasi perkantoran untuk komunikasi, koordinasi, dan pengelolaan dokumen pekerja pengetahuan. Lembar ini memuat tiga hal: penyusunan memo beserta arsipnya, susunan rapat virtual, dan digitalisasi dokumen fisik."
            >
                <div
                    role="tablist"
                    aria-label="Isi lembar OAS"
                    className="mt-5 flex flex-wrap items-center gap-1 border-b border-line"
                >
                    {TABS.map((item) => {
                        const current = activeTab === item.key;
                        return (
                            <button
                                key={item.key}
                                id={`oas-tab-${item.key}`}
                                type="button"
                                role="tab"
                                aria-selected={current}
                                aria-controls={`oas-panel-${item.key}`}
                                tabIndex={current ? 0 : -1}
                                onClick={() => setActiveTab(item.key)}
                                onKeyDown={(event) => {
                                    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                                        event.preventDefault();
                                        moveTab(event, event.key === 'ArrowRight' ? 1 : -1);
                                    }
                                }}
                                className={`border-b-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                                    current
                                        ? 'border-lit text-chalk'
                                        : 'border-transparent text-chalk-2 hover:text-chalk'
                                }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </PageBand>

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                {/* ── The twelve components, as an index ──────────────────── */}
                <section>
                    <SectionHead title="Dua belas komponen & cakupan OAS" meta="Indeks komponen" />

                    <ul className="mt-4 grid gap-px border border-line-2 bg-line sm:grid-cols-2 lg:grid-cols-4">
                        {OAS_COMPONENTS.map((component) => {
                            const Icon = component.icon;
                            return (
                                <li
                                    key={component.name}
                                    className="flex items-center gap-2.5 bg-plot-2 px-3 py-2.5"
                                >
                                    <Icon
                                        className="h-3.5 w-3.5 flex-none text-chalk-2"
                                        strokeWidth={1.5}
                                        aria-hidden="true"
                                    />
                                    <span className="min-w-0">
                                        <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-chalk">
                                            {component.name}
                                        </span>
                                        <span className="mt-0.5 block font-mono text-[9px] tracking-[0.06em] text-chalk-2">
                                            {component.gloss}
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                {/* ── Tab 1: the memo composer and its archive ─────────────── */}
                {activeTab === 'memos' && (
                    <div
                        id="oas-panel-memos"
                        role="tabpanel"
                        aria-labelledby="oas-tab-memos"
                        className="mt-8 grid items-start gap-8 lg:grid-cols-12"
                    >
                        <div className="lg:col-span-5">
                            <SectionHead title="Susun dokumen" meta="Word processing" />

                            <ZoneFrame className="mt-4 border-line-2 bg-plot-2">
                                <SheetHead
                                    tone="plot"
                                    label="Formulir memo"
                                    readouts={[{ label: 'Tujuan', value: 'POST /oas/store' }]}
                                />

                                <form onSubmit={submit} className="px-4 py-4">
                                    <LabelledField label="Judul dokumen" error={fieldError('title')}>
                                        <Field
                                            name="title"
                                            type="text"
                                            required
                                            value={data.title}
                                            onChange={setField('title')}
                                            placeholder="Contoh: Evaluasi prosedur operasional Q3"
                                            className="text-[12px]"
                                            aria-invalid={errors.title ? true : undefined}
                                        />
                                    </LabelledField>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <LabelledField label="Pengirim" error={fieldError('sender')}>
                                            <Field
                                                name="sender"
                                                type="text"
                                                required
                                                value={data.sender}
                                                onChange={setField('sender')}
                                                placeholder="CEO / manajer"
                                                className="text-[12px]"
                                                aria-invalid={errors.sender ? true : undefined}
                                            />
                                        </LabelledField>

                                        <LabelledField label="Penerima" error={fieldError('recipient')}>
                                            <Field
                                                name="recipient"
                                                type="text"
                                                required
                                                value={data.recipient}
                                                onChange={setField('recipient')}
                                                placeholder="Seluruh manajer cabang"
                                                className="text-[12px]"
                                                aria-invalid={errors.recipient ? true : undefined}
                                            />
                                        </LabelledField>

                                        <LabelledField label="Departemen" error={fieldError('department')}>
                                            <Field
                                                name="department"
                                                type="text"
                                                required
                                                value={data.department}
                                                onChange={setField('department')}
                                                placeholder="Divisi operasional"
                                                className="text-[12px]"
                                                aria-invalid={errors.department ? true : undefined}
                                            />
                                        </LabelledField>

                                        <LabelledField label="Prioritas" error={fieldError('priority')}>
                                            <Select
                                                name="priority"
                                                value={data.priority}
                                                onChange={setField('priority')}
                                                className="text-[12px]"
                                                aria-invalid={errors.priority ? true : undefined}
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="urgent">Mendesak (urgent)</option>
                                                <option value="confidential">Rahasia (confidential)</option>
                                            </Select>
                                        </LabelledField>
                                    </div>

                                    <div className="mt-4">
                                        <LabelledField
                                            label="Klasifikasi surat"
                                            error={fieldError('document_type')}
                                        >
                                            <Field
                                                name="document_type"
                                                type="text"
                                                value={data.document_type}
                                                onChange={setField('document_type')}
                                                className="text-[12px]"
                                                aria-invalid={errors.document_type ? true : undefined}
                                            />
                                        </LabelledField>
                                    </div>

                                    <div className="mt-4">
                                        <LabelledField label="Isi dokumen" error={fieldError('content')}>
                                            <textarea
                                                name="content"
                                                rows={6}
                                                required
                                                value={data.content}
                                                onChange={setField('content')}
                                                placeholder="Tuliskan isi memo manajerial"
                                                className="field text-[12px] leading-relaxed"
                                                aria-invalid={errors.content ? true : undefined}
                                            />
                                        </LabelledField>
                                    </div>

                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                                        <p className="max-w-[34ch] text-[11px] leading-relaxed text-chalk-2">
                                            Dokumen tersimpan ke arsip OAS dan langsung terdistribusi ke
                                            penerima yang tercatat.
                                        </p>
                                        <Stamp type="submit" disabled={processing}>
                                            {processing ? 'Mengirim…' : 'Kirim & distribusikan'}
                                        </Stamp>
                                    </div>
                                </form>
                            </ZoneFrame>
                        </div>

                        <div className="lg:col-span-7">
                            <SectionHead
                                title="Arsip memo & komunikasi"
                                meta={`${count(rows.length)} dokumen`}
                            />

                            {rows.length === 0 ? (
                                <div className="mt-4">
                                    <EmptyState
                                        title="Arsip masih kosong"
                                        description="Belum ada memo yang diterbitkan. Isi formulir Susun dokumen, lalu kirim untuk menambah dokumen pertama ke arsip ini."
                                    />
                                </div>
                            ) : (
                                <ul className="register mt-4">
                                    {rows.map((memo, index) => (
                                        <li
                                            key={memo.id}
                                            className={`px-4 py-4 ${
                                                index > 0 ? 'border-t border-line-2' : ''
                                            }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                                                <span className="inline-flex flex-wrap items-center gap-2">
                                                    <StatusLamp state={priorityState(memo.priority)} />
                                                    <Tag tone="plot">{memo.document_type}</Tag>
                                                </span>
                                                <span className="font-mono text-[10px] text-chalk-2">
                                                    {eventStamp(memo.created_at)}
                                                </span>
                                            </div>

                                            <h3 className="mt-2 break-words font-display text-[15px] font-semibold uppercase leading-tight tracking-[0.02em] text-chalk">
                                                {memo.title}
                                            </h3>

                                            <p className="mt-2 whitespace-pre-line break-words border-t border-line pt-3 text-[12px] leading-relaxed text-chalk-2">
                                                {memo.content}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-1 break-words font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-2">
                                                <span>
                                                    Pengirim{' '}
                                                    <span className="text-chalk">{memo.sender}</span>
                                                </span>
                                                <span>
                                                    Penerima{' '}
                                                    <span className="text-chalk">{memo.recipient}</span>
                                                </span>
                                                <span>
                                                    Departemen{' '}
                                                    <span className="text-chalk">{memo.department}</span>
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Tab 2: the roles present in a virtual meeting ────────── */}
                {activeTab === 'conferencing' && (
                    <div
                        id="oas-panel-conferencing"
                        role="tabpanel"
                        aria-labelledby="oas-tab-conferencing"
                        className="mt-8"
                    >
                        <SectionHead title="Telekonferensi & rapat virtual" meta="Tiga peran terhubung" />

                        <p className="mt-3 max-w-[74ch] text-[12px] leading-relaxed text-chalk-2">
                            Saluran suara dan tatap muka antar personel manajemen yang terpisah secara
                            geografis. Kanal video tidak tersedia pada lembar ini; kolom bergaris berarti
                            tidak ada gambar yang dikirim.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                            {PARTICIPANTS.map((participant) => (
                                <Plate
                                    key={participant.role}
                                    tab={participant.on ? 'Tersambung' : 'Pendengar'}
                                    className="px-3 pb-3 pt-7"
                                >
                                    <div className="hatch flex h-24 items-center justify-center border border-line">
                                        <User
                                            className="h-6 w-6 text-chalk-2"
                                            strokeWidth={1.5}
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                                        <span className="min-w-0 font-display text-[12px] font-semibold uppercase leading-tight tracking-[0.02em] text-chalk">
                                            {participant.role}
                                        </span>
                                        <span className="flex flex-none items-center gap-2">
                                            {participant.on ? (
                                                <Mic
                                                    className="h-3.5 w-3.5 text-lit"
                                                    strokeWidth={1.5}
                                                    aria-hidden="true"
                                                />
                                            ) : (
                                                <MicOff
                                                    className="h-3.5 w-3.5 text-chalk-2"
                                                    strokeWidth={1.5}
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <span
                                                className={`font-mono text-[10px] uppercase tracking-[0.1em] ${
                                                    participant.on ? 'text-chalk' : 'text-chalk-2'
                                                }`}
                                            >
                                                Mikrofon {participant.mic}
                                            </span>
                                        </span>
                                    </div>
                                </Plate>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Tab 2: task & deadline scheduler (Bab IX) ────────────── */}
                {activeTab === 'tasks' && (
                    <div
                        id="oas-panel-tasks"
                        role="tabpanel"
                        aria-labelledby="oas-tab-tasks"
                        className="mt-8 grid items-start gap-8 lg:grid-cols-12"
                    >
                        <div className="lg:col-span-5">
                            <SectionHead title="Jadwalkan tugas baru" meta="Task & deadline (Bab IX)" />
                            <ZoneFrame className="mt-4 border-line-2 bg-plot-2">
                                <SheetHead
                                    tone="plot"
                                    label="Formulir agenda operasional"
                                    readouts={[{ label: 'Tujuan', value: 'POST /oas/tasks' }]}
                                />
                                <form onSubmit={submitTask} className="space-y-3 px-4 py-4">
                                    <LabelledField
                                        label="Nama tugas"
                                        error={taskForm.errors.title}
                                    >
                                        <input
                                            type="text"
                                            value={taskForm.data.title}
                                            onChange={(e) =>
                                                taskForm.setData('title', e.target.value)
                                            }
                                            placeholder="Mis. Verifikasi stok motherboard B650"
                                            className="field text-[13px]"
                                        />
                                    </LabelledField>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <LabelledField
                                            label="Penanggung jawab"
                                            error={taskForm.errors.assignee}
                                        >
                                            <input
                                                type="text"
                                                value={taskForm.data.assignee}
                                                onChange={(e) =>
                                                    taskForm.setData('assignee', e.target.value)
                                                }
                                                placeholder="Staf Gudang"
                                                className="field text-[13px]"
                                            />
                                        </LabelledField>

                                        <LabelledField label="Departemen">
                                            <input
                                                type="text"
                                                value={taskForm.data.department}
                                                onChange={(e) =>
                                                    taskForm.setData('department', e.target.value)
                                                }
                                                className="field text-[13px]"
                                            />
                                        </LabelledField>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <LabelledField
                                            label="Tenggat waktu"
                                            error={taskForm.errors.due_date}
                                        >
                                            <input
                                                type="date"
                                                value={taskForm.data.due_date}
                                                onChange={(e) =>
                                                    taskForm.setData('due_date', e.target.value)
                                                }
                                                className="field text-[13px]"
                                            />
                                        </LabelledField>

                                        <LabelledField label="Prioritas">
                                            <Select
                                                value={taskForm.data.priority}
                                                onChange={(e) =>
                                                    taskForm.setData('priority', e.target.value)
                                                }
                                            >
                                                <option value="normal">Normal</option>
                                                <option value="urgent">Mendesak</option>
                                            </Select>
                                        </LabelledField>
                                    </div>

                                    <LabelledField label="Catatan koordinasi">
                                        <textarea
                                            rows={2}
                                            value={taskForm.data.notes}
                                            onChange={(e) =>
                                                taskForm.setData('notes', e.target.value)
                                            }
                                            className="field text-[13px]"
                                        />
                                    </LabelledField>

                                    <Stamp type="submit" disabled={taskForm.processing}>
                                        <CalendarClock className="h-3.5 w-3.5" />
                                        Simpan jadwal tugas
                                    </Stamp>
                                </form>
                            </ZoneFrame>
                        </div>

                        <div className="lg:col-span-7">
                            <SectionHead
                                title="Daftar tugas & tenggat OAS"
                                meta={`${count(taskRows.length)} agenda tercatat`}
                            />
                            <div className="register mt-4 divide-y divide-line">
                                {taskRows.map((task) => {
                                    const done = task.status === 'done';
                                    return (
                                        <div
                                            key={task.id}
                                            className="flex flex-wrap items-start justify-between gap-4 px-4 py-3.5"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <StatusLamp
                                                        state={
                                                            done
                                                                ? {
                                                                      tone: 'chalk',
                                                                      lamp: 'unlit',
                                                                      label: 'Selesai',
                                                                  }
                                                                : task.priority === 'urgent'
                                                                  ? {
                                                                        tone: 'lit-red',
                                                                        lamp: 'lit',
                                                                        label: 'Mendesak',
                                                                    }
                                                                  : {
                                                                        tone: 'lit',
                                                                        lamp: 'half',
                                                                        label: 'Aktif',
                                                                    }
                                                        }
                                                    />
                                                    <span className="font-mono text-[10px] text-chalk-2">
                                                        Tenggat: {String(task.due_date || '').slice(0, 10)} ·{' '}
                                                        {task.department}
                                                    </span>
                                                </div>
                                                <h3
                                                    className={`mt-1.5 text-[13.5px] font-medium ${
                                                        done
                                                            ? 'line-through text-chalk-3'
                                                            : 'text-chalk'
                                                    }`}
                                                >
                                                    {task.title}
                                                </h3>
                                                <p className="mt-0.5 text-[12px] text-chalk-2">
                                                    PIC: {task.assignee}
                                                    {task.notes ? ` — ${task.notes}` : ''}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => toggleTask(task.id)}
                                                className="inline-flex items-center gap-1.5 border border-line-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk hover:border-lit hover:text-lit"
                                            >
                                                {done ? (
                                                    <>
                                                        <Circle className="h-3 w-3" />
                                                        Buka kembali
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="h-3 w-3 text-lit" />
                                                        Tandai selesai
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tab 3: document imaging ──────────────────────────────── */}
                {activeTab === 'imaging' && (
                    <div
                        id="oas-panel-imaging"
                        role="tabpanel"
                        aria-labelledby="oas-tab-imaging"
                        className="mt-8"
                    >
                        <SectionHead title="Pencitraan dokumen & OCR" meta="Arsip digital" />

                        <p className="mt-3 max-w-[74ch] text-[12px] leading-relaxed text-chalk-2">
                            Konversi catatan kertas menjadi teks digital untuk penyimpanan arsip sekunder.
                            Tempel atau sunting teks hasil pindaian di kolom kiri, lalu jalankan pembacaan.
                        </p>

                        <div className="mt-5 grid gap-6 lg:grid-cols-2">
                            <div>
                                <LabelledField label="Teks dokumen fisik">
                                    <textarea
                                        id="ocr-input"
                                        rows={8}
                                        value={ocrInput}
                                        onChange={(event) => setOcrInput(event.target.value)}
                                        className="field font-mono text-[12px] leading-relaxed"
                                    />
                                </LabelledField>

                                <Stamp onClick={runOcr} className="mt-3">
                                    <Scan className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                                    Proses pindaian OCR
                                </Stamp>
                            </div>

                            <div>
                                <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                    Hasil konversi digital
                                </span>
                                <div
                                    aria-live="polite"
                                    className="register min-h-[200px] whitespace-pre-line break-words px-4 py-3 font-mono text-[12px] leading-relaxed text-chalk"
                                >
                                    {ocrResult || OCR_OPENING}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ModuleLayout>
    );
}
