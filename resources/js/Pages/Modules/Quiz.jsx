import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import ModuleLayout from '@/Layouts/ModuleLayout';
import { Callout, Dim, PageBand, Readout, SectionHead, TitleBlock } from '@/Components/Sheet';
import { EmptyState, Lamp, Stamp, StatusLamp } from '@/Components/Controls';
import { count, isoDate, pad } from '@/lib/format';

/**
 * Evaluasi kuis Bab II — the answer sheet.
 *
 * Ten ruled questions, each one a numbered block whose options are drawn as
 * selectable rows: the chosen row carries the cyan rule and a lit lamp, the way
 * the purchase order marks its payment method. Nothing on this page scores
 * anything — `MsiController@quizSubmit` grades the sheet and answers with the
 * marked copy — so the page holds only the answers, states how much of the
 * sheet is filled, and refuses to send it half done.
 *
 * The form contract is unchanged: one radio per question named
 * `answers[<question id>]`, value `<option key>`, `required`, posted to
 * `/quiz/submit`. The post goes through Inertia, so the result arrives as the
 * next page rather than as a document reload.
 */

const WEIGHT = '1 poin';
const PASS_MARK = '70%';

export default function Quiz({
    questions = [],
    chapter = 'bab2',
    chapterMeta = { code: 'Bab II', title: 'Tipe Sistem Informasi (TPS, OAS, MIS, ISS)' },
    chapters = [],
}) {
    const total = questions.length;
    const { data, setData, post, processing, errors } = useForm({
        bab: chapter,
        answers: {},
    });

    const answers = data.answers || {};
    const answered = questions.filter((question) => answers[question.id] !== undefined).length;
    const pending = total - answered;
    const rejected = Object.values(errors || {}).filter(Boolean);

    const choose = (questionId, optionKey) => {
        setData('answers', { ...answers, [questionId]: optionKey });
    };

    const submit = (event) => {
        event.preventDefault();
        if (processing || pending > 0) {
            return;
        }
        post('/quiz/submit', { preserveScroll: true });
    };

    return (
        <ModuleLayout sheet={`Evaluasi kuis · ${chapterMeta.code}`}>
            <Head title={`Evaluasi kuis ${chapterMeta.code} — RAKIT`} />

            {/* ── What is examined, and how it is scored ───────────────────── */}
            <PageBand
                tone="plot"
                path={[
                    { label: 'Piramida', href: '/pyramid' },
                    { label: 'Modul rujukan' },
                    { label: `Lembar evaluasi · ${chapterMeta.code}` },
                ]}
                title={`Uji pemahaman — ${chapterMeta.title}`}
                meta={`${count(total)} pertanyaan pilihan ganda berdasarkan modul ${chapterMeta.code}. Setiap jawaban benar bernilai satu poin; ambang kelulusan ${PASS_MARK}.`}
            >
                {chapters.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5 border-b border-line pb-4">
                        {chapters.map((item) => {
                            const active = item.key === chapter;
                            return (
                                <Link
                                    key={item.key}
                                    href={`/quiz?bab=${item.key}`}
                                    className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                                        active
                                            ? 'border-lit bg-plot-2 text-lit'
                                            : 'border-line-2 text-chalk-2 hover:border-chalk-2 hover:text-chalk'
                                    }`}
                                >
                                    {item.code}
                                </Link>
                            );
                        })}
                    </div>
                )}

                <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
                    <div className="lg:col-span-5">
                        <TitleBlock
                            tone="plot"
                            cells={[
                                { label: 'Lembar', value: `Evaluasi · ${chapterMeta.code}` },
                                { label: 'Revisi', value: isoDate() },
                                { label: 'Penilai', value: 'Pengendali' },
                            ]}
                        />

                        <div className="mt-4 border border-line-2 bg-plot-2 px-4 py-2.5">
                            <Callout k="Wajib">
                                Seluruh {count(total)} soal harus dijawab; lembar ditahan sampai lengkap.
                            </Callout>
                            <Callout k="Kunci">
                                Kunci dan pembahasan terbit pada lembar hasil, bukan pada lembar soal.
                            </Callout>
                            <Callout k="Ulang">Kuis dapat diulang setelah lembar dinilai.</Callout>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                            <Readout tone="plot" label="Jumlah soal" value={count(total)} />
                            <Readout tone="plot" label="Bobot per soal" value={WEIGHT} />
                            <Readout tone="plot" label="Ambang lulus" value={PASS_MARK} />
                        </div>
                    </div>
                </div>
            </PageBand>

            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
                {total === 0 ? (
                    <EmptyState
                        title="Tidak ada soal pada lembar ini"
                        description="Pengendali tidak mengirim daftar soal, jadi tidak ada yang bisa dijawab. Muat ulang lembar ini untuk meminta daftarnya sekali lagi."
                        action={
                            <Stamp as={Link} href="/quiz" variant="secondary">
                                Muat ulang lembar
                            </Stamp>
                        }
                    />
                ) : (
                    <form onSubmit={submit}>
                        <SectionHead
                            drawn
                            title="Lembar jawaban"
                            meta={`${count(answered)} dari ${count(total)} soal terjawab`}
                        />

                        <ol className="register mt-4">
                            {questions.map((question, index) => {
                                const chosenKey = answers[question.id];
                                const isAnswered = chosenKey !== undefined;
                                const questionError = errors?.[`answers.${question.id}`];

                                return (
                                    <li
                                        key={question.id}
                                        className={index > 0 ? 'border-t border-line-2' : undefined}
                                    >
                                        <fieldset className="px-4 py-5 sm:px-5">
                                            <legend className="sr-only">
                                                Soal {index + 1} dari {count(total)}
                                            </legend>

                                            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-2">
                                                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk">
                                                    Soal {pad(index + 1, 2)} / {count(total)}
                                                </span>
                                                <StatusLamp
                                                    state={
                                                        isAnswered
                                                            ? { tone: 'lit', lamp: 'lit', label: 'Terjawab' }
                                                            : {
                                                                  tone: 'chalk',
                                                                  lamp: 'unlit',
                                                                  label: 'Belum dijawab',
                                                              }
                                                    }
                                                />
                                            </div>

                                            <p className="mt-3 max-w-[74ch] text-[13px] leading-relaxed text-chalk">
                                                {question.question}
                                            </p>

                                            <div className="mt-3 border-t border-rule">
                                                {Object.entries(question.options || {}).map(
                                                    ([optionKey, optionText]) => {
                                                        const chosen = chosenKey === optionKey;

                                                        return (
                                                            <label
                                                                key={optionKey}
                                                                className={`relative flex cursor-pointer items-start gap-3 border-b border-rule py-3 pl-4 pr-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-cyan ${
                                                                    chosen ? 'bg-cyan-tint' : 'hover:bg-sheet-2'
                                                                }`}
                                                            >
                                                                {/* The chosen row is marked by the cyan rule, not
                                                                    by a filled control. */}
                                                                <span
                                                                    aria-hidden="true"
                                                                    className={`absolute inset-y-0 left-0 w-[2px] ${
                                                                        chosen ? 'bg-cyan' : 'bg-transparent'
                                                                    }`}
                                                                />
                                                                <input
                                                                    type="radio"
                                                                    name={`answers[${question.id}]`}
                                                                    value={optionKey}
                                                                    required
                                                                    checked={chosen}
                                                                    onChange={() =>
                                                                        choose(question.id, optionKey)
                                                                    }
                                                                    className="sr-only"
                                                                />
                                                                <span
                                                                    className={`mt-0.5 font-mono text-[11px] uppercase ${
                                                                        chosen ? 'text-cyan' : 'text-chalk-2'
                                                                    }`}
                                                                >
                                                                    {optionKey}
                                                                </span>
                                                                <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-chalk">
                                                                    {optionText}
                                                                </span>
                                                                {/* Hidden from assistive tech: the radio already
                                                                    announces its own checked state, so the marked
                                                                    row is drawn here and read there. */}
                                                                <span
                                                                    aria-hidden="true"
                                                                    className="flex flex-none items-center gap-2 pt-0.5"
                                                                >
                                                                    <Lamp
                                                                        tone="cyan"
                                                                        state={chosen ? 'lit' : 'unlit'}
                                                                    />
                                                                    <span
                                                                        className={`font-mono text-[9px] uppercase tracking-[0.14em] ${
                                                                            chosen ? 'text-chalk-2' : 'text-ink-3'
                                                                        }`}
                                                                    >
                                                                        {chosen ? 'Dipilih' : 'Tersedia'}
                                                                    </span>
                                                                </span>
                                                            </label>
                                                        );
                                                    },
                                                )}
                                            </div>

                                            {questionError && (
                                                <p className="mt-2 text-[11px] font-medium text-red">
                                                    {questionError}
                                                </p>
                                            )}
                                        </fieldset>
                                    </li>
                                );
                            })}
                        </ol>

                        {rejected.length > 0 && (
                            <div
                                role="alert"
                                className="mt-4 flex items-start gap-2.5 border border-line-2 bg-plot-2 px-4 py-3 text-[12px] leading-relaxed text-chalk"
                            >
                                <Lamp tone="lit-red" state="lit" className="mt-1" />
                                <span className="min-w-0">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-lit-red">
                                        Ditolak
                                    </span>
                                    <span className="mx-1.5 text-chalk-2" aria-hidden="true">
                                        ·
                                    </span>
                                    {rejected[0]} Perbaiki jawaban yang ditandai, lalu kumpulkan ulang.
                                </span>
                            </div>
                        )}

                        {/* ── The sheet is only collected when it is complete ── */}
                        <div className="mt-4 border border-line-2 bg-plot-2">
                            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-3">
                                <Dim
                                    label="Terjawab"
                                    value={`${count(answered)} / ${count(total)} soal`}
                                    className="min-w-[220px] flex-1"
                                />

                                <div className="flex flex-none flex-wrap items-center gap-x-4 gap-y-2">
                                    <span aria-live="polite">
                                        <StatusLamp
                                            state={
                                                pending > 0
                                                    ? {
                                                          tone: 'chalk',
                                                          lamp: 'unlit',
                                                          label: `${count(pending)} soal belum dijawab`,
                                                      }
                                                    : {
                                                          tone: 'lit',
                                                          lamp: 'lit',
                                                          label: 'Semua soal terjawab',
                                                      }
                                            }
                                        />
                                    </span>

                                    <Stamp
                                        type="submit"
                                        disabled={processing || pending > 0}
                                        aria-describedby="quiz-submit-note"
                                        aria-label={
                                            pending > 0
                                                ? `Kumpulkan jawaban — ${count(pending)} soal belum dijawab`
                                                : undefined
                                        }
                                    >
                                        {processing ? 'Mengirim lembar' : 'Kumpulkan jawaban'}
                                    </Stamp>
                                </div>
                            </div>

                            <p
                                id="quiz-submit-note"
                                className="border-t border-line px-4 py-2.5 text-[11px] leading-relaxed text-chalk-2"
                            >
                                Seluruh {count(total)} soal harus dijawab sebelum lembar dikumpulkan. Soal
                                yang tidak dijawab dihitung salah, dan kuis ini dapat diulang setelahnya.
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </ModuleLayout>
    );
}
