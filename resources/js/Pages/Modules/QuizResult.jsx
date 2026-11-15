import React from 'react';
import { Head, Link } from '@inertiajs/react';
import ModuleLayout from '@/Layouts/ModuleLayout';
import Confetti from '@/Components/Confetti';
import { Callout, Dim, PageBand, Readout, SectionHead, TitleBlock } from '@/Components/Sheet';
import { EmptyState, Stamp, StatusLamp } from '@/Components/Controls';
import { count, isoDate, pad } from '@/lib/format';

/**
 * The marked answer sheet — one page for all three quizzes.
 *
 * `MsiController@quizSubmit`, `HardwareController@submitQuiz`, and
 * `SoftwareController@submitQuiz` all answer with the same five props and name
 * the sheet they graded in `subject`, so this page reads the subject, resolves
 * the band, the title, and the two ways back, and prints the marking it was
 * handed. The score is one reading among several in the measurement voice — it
 * is not the page's subject; the marking is.
 *
 * Every figure comes from the controller. Nothing here recomputes a verdict:
 * `is_correct` decides the lamp, `user_answer` decides the "Tidak dijawab" note.
 */

const PASS_MARK = 70;

const SUBJECTS = {
    'Evaluasi kuis Bab II': {
        sheet: 'Evaluasi · Bab II',
        title: 'Hasil evaluasi tipe sistem informasi',
        crumbs: [
            { label: 'Piramida', href: '/pyramid' },
            { label: 'Lembar evaluasi' },
            { label: 'Hasil · Bab II' },
        ],
        module: { href: '/pyramid', action: 'Kembali ke ringkasan' },
        quiz: { href: '/quiz', action: 'Ulangi kuis' },
        retry: 'lalu ulangi kuis untuk memperbaiki skor.',
    },
    'Latihan Bab III — Perangkat Keras': {
        sheet: 'Evaluasi · Bab III',
        title: 'Hasil evaluasi perangkat keras',
        crumbs: [
            { label: 'Toko', href: '/' },
            { label: 'Lembar evaluasi' },
            { label: 'Hasil · Bab III perangkat keras' },
        ],
        module: { href: '/hardware', action: 'Kembali ke lembar perangkat keras' },
        quiz: { href: '/hardware#latihan', action: 'Ulangi kuis' },
        retry: 'lalu ulangi kuis Bab III untuk memperbaiki skor.',
    },
    'Latihan Bab IV — Perangkat Lunak': {
        sheet: 'Evaluasi · Bab IV',
        title: 'Hasil evaluasi perangkat lunak',
        crumbs: [
            { label: 'Toko', href: '/' },
            { label: 'Lembar evaluasi' },
            { label: 'Hasil · Bab IV perangkat lunak' },
        ],
        module: { href: '/software', action: 'Kembali ke lembar perangkat lunak' },
        quiz: { href: '/software#latihan', action: 'Ulangi kuis Bab IV' },
        retry: 'lalu ulangi kuis Bab IV untuk memperbaiki skor.',
    },
    'Evaluasi kuis Bab VII': {
        sheet: 'Evaluasi · Bab VII',
        title: 'Hasil evaluasi people dalam sistem informasi',
        crumbs: [
            { label: 'Piramida', href: '/pyramid' },
            { label: 'Lembar evaluasi' },
            { label: 'Hasil · Bab VII' },
        ],
        module: { href: '/pyramid', action: 'Kembali ke ringkasan' },
        quiz: { href: '/quiz?bab=bab7', action: 'Ulangi kuis Bab VII' },
        retry: 'lalu ulangi kuis Bab VII untuk memperbaiki skor.',
    },
    'Evaluasi kuis Bab VIII': {
        sheet: 'Evaluasi · Bab VIII',
        title: 'Hasil evaluasi transaction processing systems',
        crumbs: [
            { label: 'TPS', href: '/tps' },
            { label: 'Lembar evaluasi' },
            { label: 'Hasil · Bab VIII' },
        ],
        module: { href: '/tps', action: 'Kembali ke simulator TPS' },
        quiz: { href: '/quiz?bab=bab8', action: 'Ulangi kuis Bab VIII' },
        retry: 'lalu ulangi kuis Bab VIII untuk memperbaiki skor.',
    },
    'Evaluasi kuis Bab IX': {
        sheet: 'Evaluasi · Bab IX',
        title: 'Hasil evaluasi office automation system',
        crumbs: [
            { label: 'OAS', href: '/oas' },
            { label: 'Lembar evaluasi' },
            { label: 'Hasil · Bab IX' },
        ],
        module: { href: '/oas', action: 'Kembali ke modul OAS' },
        quiz: { href: '/quiz?bab=bab9', action: 'Ulangi kuis Bab IX' },
        retry: 'lalu ulangi kuis Bab IX untuk memperbaiki skor.',
    },
    'Evaluasi kuis Bab X': {
        sheet: 'Evaluasi · Bab X',
        title: 'Hasil evaluasi knowledge management system',
        crumbs: [
            { label: 'KMS', href: '/kms' },
            { label: 'Lembar evaluasi' },
            { label: 'Hasil · Bab X' },
        ],
        module: { href: '/kms', action: 'Kembali ke modul KMS' },
        quiz: { href: '/quiz?bab=bab10', action: 'Ulangi kuis Bab X' },
        retry: 'lalu ulangi kuis Bab X untuk memperbaiki skor.',
    },
    'Evaluasi kuis Bab XII': {
        sheet: 'Evaluasi · Bab XII',
        title: 'Hasil evaluasi executive information system',
        crumbs: [
            { label: 'ISS', href: '/iss' },
            { label: 'Lembar evaluasi' },
            { label: 'Hasil · Bab XII' },
        ],
        module: { href: '/iss', action: 'Kembali ke modul ISS/EIS' },
        quiz: { href: '/quiz?bab=bab12', action: 'Ulangi kuis Bab XII' },
        retry: 'lalu ulangi kuis Bab XII untuk memperbaiki skor.',
    },
    'Evaluasi kuis Bab XIII': {
        sheet: 'Evaluasi · Bab XIII',
        title: 'Hasil evaluasi expert system',
        crumbs: [
            { label: 'ISS', href: '/iss' },
            { label: 'Lembar evaluasi' },
            { label: 'Hasil · Bab XIII' },
        ],
        module: { href: '/iss', action: 'Kembali ke modul ISS/ES' },
        quiz: { href: '/quiz?bab=bab13', action: 'Ulangi kuis Bab XIII' },
        retry: 'lalu ulangi kuis Bab XIII untuk memperbaiki skor.',
    },
};

/** A subject the page has not been taught still gets a band and a way back. */
const FALLBACK = {
    sheet: 'Evaluasi',
    title: 'Hasil evaluasi',
    crumbs: [{ label: 'Modul rujukan' }, { label: 'Lembar evaluasi' }, { label: 'Hasil' }],
    module: { href: '/pyramid', action: 'Kembali ke ringkasan' },
    quiz: { href: '/quiz', action: 'Ulangi kuis' },
    retry: 'lalu ulangi kuis untuk memperbaiki skor.',
};

const COLUMNS = [
    { key: 'soal', label: 'Soal & pembahasan' },
    { key: 'jawaban', label: 'Jawaban anda' },
    { key: 'kunci', label: 'Kunci jawaban' },
    { key: 'verdict', label: 'Verdict' },
];

const option = (detail, key) => (detail.options || {})[key];

export default function QuizResult({
    score = 0,
    total = 0,
    percentage = 0,
    details = [],
    subject = '',
}) {
    const model = SUBJECTS[subject] || FALLBACK;
    const passed = Number(percentage) >= PASS_MARK;
    const rows = Array.isArray(details) ? details : [];

    return (
        <ModuleLayout sheet={subject || 'Hasil evaluasi kuis'}>
            <Head title={`${model.title} — RAKIT`} />
            <Confetti active={passed} />

            {/* ── The sheet's identity, and its verdict ────────────────────── */}
            <PageBand
                tone="plot"
                path={model.crumbs}
                title={model.title}
                meta="Lembar ini menandai setiap soal yang dikirim: pertanyaannya, pembahasannya, jawaban yang anda pilih, kunci jawabannya, dan verdict tiap baris."
                actions={
                    <>
                        <Stamp as={Link} href={model.quiz.href} variant="secondary">
                            {model.quiz.action}
                        </Stamp>
                        <Stamp as={Link} href={model.module.href}>
                            {model.module.action}
                        </Stamp>
                    </>
                }
            >
                <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
                    <div className="lg:col-span-5">
                        <TitleBlock
                            tone="plot"
                            cells={[
                                { label: 'Lembar', value: model.sheet },
                                { label: 'Revisi', value: isoDate() },
                                { label: 'Penilai', value: 'Pengendali' },
                            ]}
                        />

                        <div className="mt-4 border border-line-2 bg-plot-2 px-4 py-2.5">
                            <Callout k="Dinilai">
                                Dihitung pengendali saat lembar dikumpulkan, bukan di peramban.
                            </Callout>
                            <Callout k="Kunci">
                                Dibaca dari bank soal modul, bukan dari jawaban yang dikirim.
                            </Callout>
                            <Callout k="Skor">
                                Jawaban benar dibagi {count(total)} soal, dibulatkan ke persen terdekat.
                            </Callout>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                            <Readout tone="plot" label="Jumlah soal" value={count(total)} />
                            <Readout
                                tone="plot"
                                label="Jawaban benar"
                                value={`${count(score)} / ${count(total)}`}
                            />
                            <Readout
                                tone="plot"
                                label="Skor"
                                count={{
                                    to: Number(percentage) || 0,
                                    format: (value) => `${Math.round(value)}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border border-line-2 bg-plot-2 px-4 py-3">
                    <StatusLamp
                        state={
                            passed
                                ? { tone: 'lit', lamp: 'lit', label: 'Kompeten' }
                                : { tone: 'lit-red', lamp: 'lit', label: 'Perlu tinjauan' }
                        }
                    />

                    <Dim
                        label={`Ambang lulus ${PASS_MARK}% · tercapai`}
                        value={`${count(percentage)}%`}
                        className="flex-1 sm:min-w-[280px]"
                    />

                    <p className="max-w-[52ch] text-[12px] leading-relaxed text-chalk-2">
                        {passed
                            ? 'Skor berada pada atau di atas ambang. Tinjau pembahasan di bawah untuk memastikan setiap jawaban yang salah sudah dipahami.'
                            : `Skor berada di bawah ambang ${PASS_MARK}%. Baca pembahasan tiap soal di bawah, ${model.retry}`}
                    </p>
                </div>
            </PageBand>

            {/* ── The marking: one ruled row per question ──────────────────── */}
            <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                <SectionHead
                    drawn
                    title="Lembar jawaban & pembahasan"
                    meta={`${count(score)} benar dari ${count(total)} soal`}
                />

                {rows.length === 0 ? (
                    <div className="mt-4">
                        <EmptyState
                            title="Tidak ada baris yang bisa ditandai"
                            description="Pengendali tidak mengirim rincian per soal, jadi lembar ini tidak memuat jawaban, kunci, maupun pembahasan. Ulangi kuis untuk menerbitkan lembar hasil yang lengkap."
                            action={
                                <Stamp as={Link} href={model.quiz.href}>
                                    {model.quiz.action}
                                </Stamp>
                            }
                        />
                    </div>
                ) : (
                    <div className="register mt-4 overflow-x-auto">
                        <table className="data-table min-w-[880px]">
                            <caption className="sr-only">
                                Lembar jawaban: soal dan pembahasan, jawaban anda, kunci jawaban, dan
                                verdict tiap soal.
                            </caption>
                            <thead>
                                <tr>
                                    {COLUMNS.map((column, index) => (
                                        <th key={column.key} scope="col">
                                            <span
                                                className="block font-mono text-[8px] font-normal text-ink-3"
                                                aria-hidden="true"
                                            >
                                                {index + 1}
                                            </span>
                                            {column.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((detail, index) => (
                                    <tr key={detail.id ?? index}>
                                        <td className="align-top">
                                            <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-2">
                                                Soal {pad(index + 1, 2)}
                                            </span>
                                            <span className="mt-1 block max-w-[62ch] text-[13px] leading-relaxed text-chalk">
                                                {detail.question}
                                            </span>
                                            <span className="mt-2 block max-w-[62ch] border-t border-line pt-2 text-[11px] leading-relaxed text-chalk-2">
                                                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-2">
                                                    Pembahasan
                                                </span>{' '}
                                                {detail.explanation}
                                            </span>
                                        </td>

                                        <td className="align-top">
                                            <span className="block font-mono text-[11px] uppercase tracking-[0.1em] text-chalk">
                                                {String(detail.user_answer ?? '—').toUpperCase()}
                                            </span>
                                            <span className="mt-1 block max-w-[34ch] text-[12px] leading-relaxed text-chalk-2">
                                                {option(detail, detail.user_answer) ?? 'Tidak dijawab'}
                                            </span>
                                        </td>

                                        <td className="align-top">
                                            <span className="block font-mono text-[11px] uppercase tracking-[0.1em] text-chalk">
                                                {String(detail.correct_answer ?? '—').toUpperCase()}
                                            </span>
                                            <span className="mt-1 block max-w-[34ch] text-[12px] leading-relaxed text-chalk-2">
                                                {option(detail, detail.correct_answer) ?? '—'}
                                            </span>
                                        </td>

                                        <td className="align-top">
                                            <StatusLamp
                                                state={
                                                    detail.is_correct
                                                        ? { tone: 'lit', lamp: 'lit', label: 'Benar' }
                                                        : { tone: 'lit-red', lamp: 'lit', label: 'Salah' }
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </ModuleLayout>
    );
}
