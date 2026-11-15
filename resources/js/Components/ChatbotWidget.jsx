import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowUpRight, Send, X } from 'lucide-react';
import { BrandMark } from '@/Components/Brand';
import { Lamp } from '@/Components/Controls';
import { rupiah } from '@/lib/format';

const QUICK_PROMPTS = [
    'Kategori komponen apa saja di RAKIT?',
    'Bagaimana cara order & checkout?',
    'Tips kompatibilitas CPU, RAM & PSU',
    'Bagaimana prosedur garansi RMA?',
];

const SOURCE_LABELS = {
    rakitgpt: 'rakitGPT · Mesin AI',
    chatbot_db: 'Basis Data Chatbot',
    catalogue_db: 'Register Katalog',
    fallback: 'Fallback Sistem',
};

export default function ChatbotWidget() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 'init-1',
            role: 'assistant',
            content:
                'Selamat datang di meja konsultasi rakitGPT. Tanyakan stok komponen, kompatibilitas rakitan PC, alur checkout, atau arsip KMS.',
            source: 'chatbot_db',
            products: [],
        },
    ]);

    const scrollRef = useRef(null);

    useEffect(() => {
        if (open && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, open, loading]);

    const sendMessage = async (text) => {
        const clean = String(text || '').trim();
        if (!clean || loading) {
            return;
        }

        const userMsg = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: clean,
        };

        const historyPayload = messages
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content }));

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await window.axios.post('/chatbot/message', {
                message: clean,
                history: historyPayload,
            });

            const data = response.data || {};
            setMessages((prev) => [
                ...prev,
                {
                    id: `a-${Date.now()}`,
                    role: 'assistant',
                    content:
                        data.reply || 'Maaf sistem tidak mengerti jawaban yang harus diberikan',
                    source: data.source || 'fallback',
                    products: Array.isArray(data.suggested_products)
                        ? data.suggested_products
                        : [],
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `e-${Date.now()}`,
                    role: 'assistant',
                    content:
                        'Koneksi ke layanan rakitGPT terganggu. Silakan coba lagi atau buka lembar /kms.',
                    source: 'fallback',
                    products: [],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <aside
            aria-label="Asisten Pengetahuan rakitGPT"
            className="fixed right-5 bottom-5 z-50 max-w-[calc(100vw-2.5rem)]"
        >
            {!open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="group relative flex items-center gap-3 border border-ink border-b-2 border-b-cyan bg-sheet px-3.5 py-2 text-ink transition-colors hover:border-cyan hover:bg-sheet-2"
                >
                    <BrandMark className="h-4 w-4 text-cyan transition-transform group-hover:scale-105" />
                    <div className="border-l border-rule pl-3 text-left">
                        <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                            <Lamp tone="cyan" state="lit" />
                            <span>Instrumen · KMS</span>
                        </div>
                        <div className="mt-0.5 flex items-baseline gap-2">
                            <span className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-ink">
                                rakitGPT
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-cyan">
                                Tanya ↗
                            </span>
                        </div>
                    </div>
                </button>
            ) : (
                <div className="flex h-[510px] w-[390px] max-w-[calc(100vw-2.5rem)] flex-col border border-ink bg-sheet text-ink">
                    <div className="flex items-center justify-between border-b border-ink bg-sheet-2 px-3.5 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <BrandMark className="h-4 w-4 shrink-0 text-cyan" />
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink">
                                    <Lamp tone="cyan" state="lit" />
                                    <span className="font-semibold">rakitGPT</span>
                                </div>
                                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-3">
                                    Asisten KMS & Katalog
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href="/kms"
                                className="inline-flex items-center gap-1 border border-rule-2 bg-sheet px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink hover:border-cyan hover:text-cyan"
                            >
                                Lembar KMS
                                <ArrowUpRight className="h-3 w-3" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Tutup panel rakitGPT"
                                className="border border-rule-2 bg-sheet p-1 text-ink-2 hover:border-ink hover:text-ink"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    <div
                        ref={scrollRef}
                        className="flex-1 space-y-3 overflow-y-auto bg-sheet p-3.5"
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${
                                    msg.role === 'user' ? 'items-end' : 'items-start'
                                }`}
                            >
                                <div
                                    className={`max-w-[90%] border px-3 py-2 text-[12.5px] leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'border-ink bg-ink text-sheet'
                                            : 'border-rule-2 border-l-2 border-l-cyan bg-sheet-2 text-ink'
                                    }`}
                                >
                                    <p className="whitespace-pre-line">{msg.content}</p>

                                    {msg.products && msg.products.length > 0 && (
                                        <div className="mt-2.5 space-y-1 border-t border-rule pt-2">
                                            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">
                                                Posisi katalog terkait
                                            </div>
                                            {msg.products.map((prod) => (
                                                <Link
                                                    key={prod.id}
                                                    href={`/product/${prod.slug}`}
                                                    className="flex items-center justify-between gap-2 border border-rule bg-sheet px-2 py-1 text-[11px] hover:border-cyan"
                                                >
                                                    <span className="truncate font-medium text-ink">
                                                        {prod.title}
                                                    </span>
                                                    <span className="shrink-0 font-mono text-[10px] text-cyan">
                                                        {rupiah(prod.price)}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {msg.role === 'assistant' && msg.source && (
                                    <span className="mt-1 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-3">
                                        <Lamp
                                            tone={msg.source === 'rakitgpt' ? 'cyan' : 'ink'}
                                            state={msg.source === 'fallback' ? 'unlit' : 'lit'}
                                        />
                                        {SOURCE_LABELS[msg.source] || msg.source}
                                    </span>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="border border-rule-2 border-l-2 border-l-cyan bg-sheet-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
                                rakitGPT sedang menyusun jawaban…
                            </div>
                        )}
                    </div>

                    <div className="border-t border-ink bg-sheet-2 px-3.5 py-2.5">
                        <div className="mb-2 flex flex-wrap gap-1">
                            {QUICK_PROMPTS.map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => sendMessage(q)}
                                    disabled={loading}
                                    className="border border-rule bg-sheet px-2 py-0.5 font-mono text-[9px] text-ink-2 transition-colors hover:border-cyan hover:text-cyan disabled:opacity-50"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="flex gap-1.5">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ketik pertanyaan untuk rakitGPT…"
                                className="field min-w-0 flex-1 py-1.5 text-[12px]"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                aria-label="Kirim pertanyaan ke rakitGPT"
                                className="stamp px-3 py-1.5 text-[10px] disabled:opacity-40"
                            >
                                <Send className="h-3 w-3" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </aside>
    );
}
