import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { BookOpen, Bot, Database, Plus, Send, Sparkles, Trash2 } from 'lucide-react';
import ModuleLayout from '@/Layouts/ModuleLayout';
import { PageBand, SheetHead, ZoneFrame } from '@/Components/Sheet';
import { LabelledField } from '@/Components/Controls';
import TechScene from '@/Components/TechScene';
import { notifyError } from '@/lib/notify';

const KNOWLEDGE_TYPES = [
    { value: 'all', label: 'Semua tipe' },
    { value: 'explicit', label: 'Explicit (SOP & Dokumen)' },
    { value: 'implicit', label: 'Implicit (Pola Praktik)' },
    { value: 'tacit', label: 'Tacit (Kearifan Pakar)' },
];

const TYPE_BADGE = {
    explicit: 'border-lit text-lit',
    implicit: 'border-chalk-2 text-chalk',
    tacit: 'border-lit-red text-lit-red',
};

const VALUE_CHAIN_STEPS = [
    {
        step: '01',
        title: 'Acquisition (Pengumpulan)',
        detail: 'Menyerap data katalog produk, riwayat transaksi, SOP rakitan, dan pengalaman teknisi senior menjadi butir pengetahuan.',
    },
    {
        step: '02',
        title: 'Refinement (Penyaringan)',
        detail: 'Mengklasifikasikan pengetahuan ke dalam kategori Explicit, Implicit, atau Tacit serta memetakan kata kunci kueri chatbot (`queries`).',
    },
    {
        step: '03',
        title: 'Storage & Retrieval (Basis Data)',
        detail: 'Menyimpan artikel pada tabel `knowledge_articles` dan pasangan pola tanya-jawab terstruktur pada tabel `chatbot`.',
    },
    {
        step: '04',
        title: 'Dissemination & AI Synthesis',
        detail: 'Menyalurkan jawaban ke pelanggan melalui Chatbot Etalase, dengan konteks langsung MySQL + sintesis bahasa alami DeepSeek API.',
    },
];

export default function Kms({
    articles = [],
    chatbotRules = [],
    stats = {},
    deepseekConfigured = false,
    deepseekModel = 'deepseek-chat',
}) {
    const [activeTab, setActiveTab] = useState('repository');
    const [typeFilter, setTypeFilter] = useState('all');

    // Interactive Chatbot Test Console state
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [chatLogs, setChatLogs] = useState([
        {
            role: 'assistant',
            content:
                'Konsol uji rakitGPT aktif. Uji pencocokan tabel `chatbot` (Bab X 10.6), katalog produk, atau respons AI rakitGPT.',
            source: 'chatbot_db',
        },
    ]);

    const articleForm = useForm({
        title: '',
        knowledge_type: 'explicit',
        domain: 'Perakitan & QA',
        summary: '',
        content: '',
        author_role: 'System Analyst',
    });

    const chatbotForm = useForm({
        queries: '',
        replies: '',
        category: 'Teknis Rakitan',
    });

    const filteredArticles =
        typeFilter === 'all'
            ? articles
            : articles.filter((a) => a.knowledge_type === typeFilter);

    const submitArticle = (e) => {
        e.preventDefault();
        articleForm.post('/kms/articles', {
            preserveScroll: true,
            onSuccess: () => articleForm.reset('title', 'summary', 'content'),
            onError: () =>
                notifyError('Artikel ditolak', 'Lengkapi seluruh kolom repositori pengetahuan.'),
        });
    };

    const submitChatbotRule = (e) => {
        e.preventDefault();
        chatbotForm.post('/kms/chatbot', {
            preserveScroll: true,
            onSuccess: () => chatbotForm.reset('queries', 'replies'),
            onError: () =>
                notifyError('Aturan chatbot ditolak', 'Isi pola queries dan replies dengan benar.'),
        });
    };

    const deleteRule = (ruleId) => {
        router.delete(`/kms/chatbot/${ruleId}`, {
            preserveScroll: true,
        });
    };

    const sendTestChat = async (e) => {
        e.preventDefault();
        const message = chatInput.trim();
        if (!message || chatLoading) {
            return;
        }

        const nextHistory = chatLogs.slice(-6).map((m) => ({ role: m.role, content: m.content }));
        setChatLogs((prev) => [...prev, { role: 'user', content: message }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await window.axios.post('/chatbot/message', {
                message,
                history: nextHistory,
            });
            const data = res.data || {};
            setChatLogs((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content:
                        data.reply || 'Maaf sistem tidak mengerti jawaban yang harus diberikan',
                    source: data.source || 'fallback',
                    model: data.model || null,
                    matchedRuleId: data.matched_rule_id || null,
                },
            ]);
        } catch {
            setChatLogs((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Gagal menghubungi endpoint /chatbot/message.',
                    source: 'fallback',
                },
            ]);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <ModuleLayout sheet="KMS · Bab X">
            <Head title="Knowledge Management System (KMS) & Chatbot — RAKIT" />

            <PageBand
                tone="plot"
                path={[
                    { label: 'Piramida', href: '/pyramid' },
                    { label: 'Modul rujukan' },
                    { label: 'KMS & rakitGPT (Bab X)' },
                ]}
                title="Knowledge management system (KMS)"
                meta="Pengelolaan pengetahuan Explicit, Implicit, dan Tacit beserta mesin percakapan berbasis tabel `chatbot` (Bab X bagian 10.6) dan asisten cerdas rakitGPT."
            >
                <div className="mt-5 grid items-stretch gap-5 lg:grid-cols-12">
                    <div className="grid gap-px border border-line-2 bg-line sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
                        <div className="bg-plot px-4 py-3">
                            <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-2">
                                Explicit
                            </span>
                            <span className="mt-1 block font-mono text-lg font-medium text-chalk">
                                {stats.explicit ?? 0}
                            </span>
                        </div>
                        <div className="bg-plot px-4 py-3">
                            <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-2">
                                Implicit
                            </span>
                            <span className="mt-1 block font-mono text-lg font-medium text-chalk">
                                {stats.implicit ?? 0}
                            </span>
                        </div>
                        <div className="bg-plot px-4 py-3">
                            <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-2">
                                Tacit
                            </span>
                            <span className="mt-1 block font-mono text-lg font-medium text-chalk">
                                {stats.tacit ?? 0}
                            </span>
                        </div>
                        <div className="bg-plot px-4 py-3">
                            <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-2">
                                Aturan Chatbot
                            </span>
                            <span className="mt-1 block font-mono text-lg font-medium text-lit">
                                {stats.chatbot_rules ?? chatbotRules.length}
                            </span>
                        </div>
                        <div className="bg-plot px-4 py-3 sm:col-span-2">
                            <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-2">
                                Mesin Asisten
                            </span>
                            <span
                                className={`mt-1 block font-mono text-[11px] font-medium uppercase ${
                                    deepseekConfigured ? 'text-lit' : 'text-chalk-2'
                                }`}
                            >
                                {deepseekConfigured
                                    ? 'AKTIF · rakitGPT Engine'
                                    : 'STANDBY · BASIS DATA CHATBOT (rakitGPT)'}
                            </span>
                        </div>
                    </div>

                    <div className="border border-line-2 bg-plot lg:col-span-4">
                        <div className="flex items-center justify-between border-b border-line px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-chalk-2">
                            <span>Kisi Graf Pengetahuan 3D</span>
                            <span className="text-lit">WebGL · CAD</span>
                        </div>
                        <TechScene variant="kms" className="!h-[168px]" />
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-1 border-b border-line">
                    {[
                        { key: 'repository', label: 'Repositori Pengetahuan' },
                        { key: 'chatbot', label: 'Basis Data & Konsol Chatbot' },
                        { key: 'value-chain', label: 'Rantai Nilai KM' },
                    ].map((tab) => {
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`border-b-2 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                                    active
                                        ? 'border-lit text-lit'
                                        : 'border-transparent text-chalk-2 hover:text-chalk'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </PageBand>

            <section className="bg-plot py-10 text-chalk">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
                    {activeTab === 'repository' && (
                        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
                            <ZoneFrame className="border-line-2 bg-plot-2">
                                <SheetHead
                                    tone="plot"
                                    label="Katalog Pengetahuan Organisasi"
                                    readouts={[{ label: 'Jumlah', value: filteredArticles.length }]}
                                    action={
                                        <div className="flex flex-wrap gap-1">
                                            {KNOWLEDGE_TYPES.map((t) => (
                                                <button
                                                    key={t.value}
                                                    type="button"
                                                    onClick={() => setTypeFilter(t.value)}
                                                    className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
                                                        typeFilter === t.value
                                                            ? 'border-lit bg-plot text-lit'
                                                            : 'border-line-2 text-chalk-2 hover:text-chalk'
                                                    }`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    }
                                />

                                <div className="divide-y divide-line">
                                    {filteredArticles.map((article) => (
                                        <article key={article.id} className="p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span
                                                    className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${
                                                        TYPE_BADGE[article.knowledge_type] ||
                                                        'border-line-2 text-chalk-2'
                                                    }`}
                                                >
                                                    {article.knowledge_type}
                                                </span>
                                                <span className="font-mono text-[10px] text-chalk-2">
                                                    {article.domain} · {article.author_role}
                                                </span>
                                            </div>
                                            <h3 className="mt-2 font-display text-[15px] font-semibold text-chalk">
                                                {article.title}
                                            </h3>
                                            <p className="mt-1 text-[12.5px] text-chalk-2">
                                                {article.summary}
                                            </p>
                                            <pre className="mt-3 whitespace-pre-wrap border-l-2 border-line-2 pl-3 font-sans text-[12px] leading-relaxed text-chalk">
                                                {article.content}
                                            </pre>
                                        </article>
                                    ))}
                                </div>
                            </ZoneFrame>

                            <ZoneFrame className="border-line-2 bg-plot-2 self-start">
                                <SheetHead tone="plot" label="Kodifikasi Pengetahuan Baru" />
                                <form onSubmit={submitArticle} className="space-y-4 p-4">
                                    <LabelledField
                                        label="Judul Pengetahuan"
                                        tone="plot"
                                        error={articleForm.errors.title}
                                    >
                                        <input
                                            type="text"
                                            value={articleForm.data.title}
                                            onChange={(e) =>
                                                articleForm.setData('title', e.target.value)
                                            }
                                            placeholder="Mis. Checklist Flash BIOS AM5"
                                            className="w-full border border-line-2 bg-plot px-3 py-2 text-[13px] text-chalk focus:border-lit focus:outline-none"
                                        />
                                    </LabelledField>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <LabelledField label="Tipe Pengetahuan" tone="plot">
                                            <select
                                                value={articleForm.data.knowledge_type}
                                                onChange={(e) =>
                                                    articleForm.setData(
                                                        'knowledge_type',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full border border-line-2 bg-plot px-3 py-2 text-[13px] text-chalk focus:border-lit focus:outline-none"
                                            >
                                                <option value="explicit">Explicit (SOP)</option>
                                                <option value="implicit">Implicit (Praktik)</option>
                                                <option value="tacit">Tacit (Pakar)</option>
                                            </select>
                                        </LabelledField>

                                        <LabelledField label="Domain" tone="plot">
                                            <input
                                                type="text"
                                                value={articleForm.data.domain}
                                                onChange={(e) =>
                                                    articleForm.setData('domain', e.target.value)
                                                }
                                                className="w-full border border-line-2 bg-plot px-3 py-2 text-[13px] text-chalk focus:border-lit focus:outline-none"
                                            />
                                        </LabelledField>
                                    </div>

                                    <LabelledField label="Peran Penulis" tone="plot">
                                        <input
                                            type="text"
                                            value={articleForm.data.author_role}
                                            onChange={(e) =>
                                                articleForm.setData('author_role', e.target.value)
                                            }
                                            className="w-full border border-line-2 bg-plot px-3 py-2 text-[13px] text-chalk focus:border-lit focus:outline-none"
                                        />
                                    </LabelledField>

                                    <LabelledField
                                        label="Ringkasan"
                                        tone="plot"
                                        error={articleForm.errors.summary}
                                    >
                                        <textarea
                                            rows={2}
                                            value={articleForm.data.summary}
                                            onChange={(e) =>
                                                articleForm.setData('summary', e.target.value)
                                            }
                                            className="w-full border border-line-2 bg-plot px-3 py-2 text-[13px] text-chalk focus:border-lit focus:outline-none"
                                        />
                                    </LabelledField>

                                    <LabelledField
                                        label="Isi Pengetahuan Lengkap"
                                        tone="plot"
                                        error={articleForm.errors.content}
                                    >
                                        <textarea
                                            rows={4}
                                            value={articleForm.data.content}
                                            onChange={(e) =>
                                                articleForm.setData('content', e.target.value)
                                            }
                                            className="w-full border border-line-2 bg-plot px-3 py-2 text-[13px] text-chalk focus:border-lit focus:outline-none"
                                        />
                                    </LabelledField>

                                    <button
                                        type="submit"
                                        disabled={articleForm.processing}
                                        className="inline-flex w-full items-center justify-center gap-2 border border-lit bg-lit px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-plot transition-colors hover:bg-lit-2 disabled:opacity-50"
                                    >
                                        <BookOpen className="h-3.5 w-3.5" />
                                        Simpan ke Repositori KMS
                                    </button>
                                </form>
                            </ZoneFrame>
                        </div>
                    )}

                    {activeTab === 'chatbot' && (
                        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                            <div className="space-y-6">
                                <ZoneFrame className="border-line-2 bg-plot-2">
                                    <SheetHead
                                        tone="plot"
                                        label="Tabel `chatbot` (Bab X bagian 10.6)"
                                        readouts={[{ label: 'Baris', value: chatbotRules.length }]}
                                    />
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-left text-[12px]">
                                            <thead>
                                                <tr className="border-b border-line bg-plot font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-2">
                                                    <th className="px-3 py-2">ID</th>
                                                    <th className="px-3 py-2">Kategori</th>
                                                    <th className="px-3 py-2">Pola `queries` (|)</th>
                                                    <th className="px-3 py-2">Balasan `replies`</th>
                                                    <th className="px-3 py-2 text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-line">
                                                {chatbotRules.map((rule) => (
                                                    <tr key={rule.id} className="align-top">
                                                        <td className="px-3 py-2.5 font-mono text-chalk-2">
                                                            #{rule.id}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono text-[10px] uppercase text-lit">
                                                            {rule.category}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono text-[11px] text-chalk">
                                                            {rule.queries}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-chalk-2">
                                                            {rule.replies}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteRule(rule.id)}
                                                                title="Hapus aturan"
                                                                className="border border-line-2 p-1 text-chalk-2 hover:border-lit-red hover:text-lit-red"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </ZoneFrame>

                                <ZoneFrame className="border-line-2 bg-plot-2">
                                    <SheetHead tone="plot" label="Tambah Pola `chatbot` Baru" />
                                    <form onSubmit={submitChatbotRule} className="space-y-3 p-4">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <LabelledField
                                                label="Pola Queries (pisahkan dengan |)"
                                                tone="plot"
                                                error={chatbotForm.errors.queries}
                                            >
                                                <input
                                                    type="text"
                                                    value={chatbotForm.data.queries}
                                                    onChange={(e) =>
                                                        chatbotForm.setData(
                                                            'queries',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="ongkir|pengiriman|kurir"
                                                    className="w-full border border-line-2 bg-plot px-3 py-2 text-[13px] text-chalk focus:border-lit focus:outline-none"
                                                />
                                            </LabelledField>
                                            <LabelledField label="Kategori" tone="plot">
                                                <input
                                                    type="text"
                                                    value={chatbotForm.data.category}
                                                    onChange={(e) =>
                                                        chatbotForm.setData(
                                                            'category',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full border border-line-2 bg-plot px-3 py-2 text-[13px] text-chalk focus:border-lit focus:outline-none"
                                                />
                                            </LabelledField>
                                        </div>

                                        <LabelledField
                                            label="Balasan Sistem (`replies`)"
                                            tone="plot"
                                            error={chatbotForm.errors.replies}
                                        >
                                            <textarea
                                                rows={2}
                                                value={chatbotForm.data.replies}
                                                onChange={(e) =>
                                                    chatbotForm.setData('replies', e.target.value)
                                                }
                                                placeholder="Pengiriman komponen diproses H+1 dengan asuransi penuh..."
                                                className="w-full border border-line-2 bg-plot px-3 py-2 text-[13px] text-chalk focus:border-lit focus:outline-none"
                                            />
                                        </LabelledField>

                                        <button
                                            type="submit"
                                            disabled={chatbotForm.processing}
                                            className="inline-flex items-center gap-2 border border-lit bg-lit px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-plot hover:bg-lit-2"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Simpan Baris Chatbot
                                        </button>
                                    </form>
                                </ZoneFrame>
                            </div>

                            <ZoneFrame className="flex h-[560px] flex-col border-line-2 bg-plot-2">
                                <SheetHead
                                    tone="plot"
                                    label="Laboratorium Uji Chatbot · rakitGPT"
                                    readouts={[
                                        {
                                            label: 'Engine',
                                            value: deepseekConfigured
                                                ? 'rakitGPT AI'
                                                : 'rakitGPT (DB Fallback)',
                                        },
                                    ]}
                                />

                                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                                    {chatLogs.map((entry, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex flex-col ${
                                                entry.role === 'user' ? 'items-end' : 'items-start'
                                            }`}
                                        >
                                            <div
                                                className={`max-w-[90%] border px-3 py-2 text-[12.5px] leading-relaxed ${
                                                    entry.role === 'user'
                                                        ? 'border-lit bg-lit text-plot'
                                                        : 'border-line-2 bg-plot text-chalk'
                                                }`}
                                            >
                                                <p className="whitespace-pre-line">
                                                    {entry.content}
                                                </p>
                                            </div>
                                            {entry.role === 'assistant' && entry.source && (
                                                <span className="mt-1 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-chalk-2">
                                                    {entry.source === 'rakitgpt' ? (
                                                        <Sparkles className="h-2.5 w-2.5 text-lit" />
                                                    ) : (
                                                        <Database className="h-2.5 w-2.5 text-lit" />
                                                    )}
                                                    {entry.source === 'rakitgpt'
                                                        ? 'rakitGPT'
                                                        : entry.source}
                                                    {entry.matchedRuleId
                                                        ? ` · Rule #${entry.matchedRuleId}`
                                                        : ''}
                                                </span>
                                            )}
                                        </div>
                                    ))}

                                    {chatLoading && (
                                        <div className="border border-line-2 bg-plot px-3 py-2 font-mono text-[10px] uppercase text-lit">
                                            Menanyakan ke basis data & rakitGPT…
                                        </div>
                                    )}
                                </div>

                                <form
                                    onSubmit={sendTestChat}
                                    className="flex gap-2 border-t border-line p-3"
                                >
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Uji kueri: mis. 'halo', 'rtx', atau kalimat tak dikenal..."
                                        className="min-w-0 flex-1 border border-line-2 bg-plot px-3 py-2 text-[12.5px] text-chalk placeholder:text-chalk-3 focus:border-lit focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={chatLoading || !chatInput.trim()}
                                        className="inline-flex items-center gap-1.5 border border-lit bg-lit px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-plot hover:bg-lit-2 disabled:opacity-40"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        Kirim
                                    </button>
                                </form>
                            </ZoneFrame>
                        </div>
                    )}

                    {activeTab === 'value-chain' && (
                        <ZoneFrame className="border-line-2 bg-plot-2">
                            <SheetHead
                                tone="plot"
                                label="Arsitektur Knowledge Management Value Chain (Bab X)"
                            />
                            <div className="grid gap-px bg-line md:grid-cols-2 lg:grid-cols-4">
                                {VALUE_CHAIN_STEPS.map((item) => (
                                    <div key={item.step} className="bg-plot p-5">
                                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-lit">
                                            Tahap {item.step}
                                        </span>
                                        <h3 className="mt-2 font-display text-[16px] font-semibold text-chalk">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-[13px] leading-relaxed text-chalk-2">
                                            {item.detail}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </ZoneFrame>
                    )}
                </div>
            </section>
        </ModuleLayout>
    );
}
