import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Sparkles, BookOpen, RotateCcw, ChevronDown } from "lucide-react";
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const QUICK_PROMPTS = [
    { icon: "📐", text: "Explain Pythagorean theorem" },
    { icon: "🧬", text: "How does Artifical Neural Network work?" },
    { icon: "⚡", text: "Simplify Newton's laws of motion" },
    { icon: "📖", text: "Summarise the things you have to learn in Full Stack Developement" },
];

// change api key every month
// Initialize the SDK outside the function so it doesn't rebuild on every call.
// Adjust the environment variable based on your setup (e.g., import.meta.env.VITE_GEMINI_API_KEY)

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function callStudyAI(messages) {
    try {
        // 1. Initialize the model with your system instructions and config
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are Student Desk AI — a friendly, encouraging academic tutor for students.
            Be concise yet thorough. Use:
            - Clear numbered steps for processes
            - Emojis sparingly: ✅ for key points, 💡 for tips, ⚠️ for common mistakes
            - Short paragraphs, never walls of text
            - Real-world analogies for abstract ideas
            - Minimise the use of latex
            - End every answer with a "Quick Check:" self-test question`,
            generationConfig: {
                maxOutputTokens: 1000,
            }
        });

        // 2. Format the messages array to match Gemini's requirements
        const formattedMessages = messages.map((msg) => ({
            role: msg.role === "assistant" ? "model" : msg.role,
            parts: [{ text: msg.content }],
        }));

        // 3. Send the entire conversation history to generate a response
        const result = await model.generateContent({
            contents: formattedMessages
        });

        // 4. Return the text response
        return result.response.text();

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Sorry, something went wrong. Please try again.";
    }
}

function TypingDots() {
    return (
        <span className="inline-flex items-center gap-1 ml-1">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"
                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
            ))}
        </span>
    );
}

function MessageBubble({ msg }) {
    const isUser = msg.role === "user";
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-blue-100">
                    <Bot className="w-4 h-4 text-white" />
                </div>
            )}
            <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
          ${isUser
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-white text-slate-700 rounded-tl-sm border border-slate-100"
                    }`}
            >
                {msg.content === "__typing__" ? (
                    <span className="text-slate-400 italic flex items-center gap-1">
                        Thinking <TypingDots />
                    </span>
                ) : (
                    <div className="whitespace-pre-wrap">
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                        >
                            {msg.content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
            {isUser && (
                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold text-slate-600">
                    U
                </div>
            )}
        </motion.div>
    );
}

export default function QueryChat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showScroll, setShowScroll] = useState(false);
    const bottomRef = useRef(null);
    const listRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
        }
    }, [input]);

    const handleScroll = () => {
        if (!listRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        setShowScroll(scrollHeight - scrollTop - clientHeight > 120);
    };

    const sendMessage = async (text) => {
        const content = (text ?? input).trim();
        if (!content || loading) return;
        setInput("");

        const userMsg = { role: "user", content, _id: Date.now() };
        const typingMsg = { role: "assistant", content: "__typing__", _id: "typing" };
        setMessages((prev) => [...prev, userMsg, typingMsg]);
        setLoading(true);

        const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

        try {
            const reply = await callStudyAI(history);
            setMessages((prev) =>
                prev.filter((m) => m._id !== "typing").concat({ role: "assistant", content: reply, _id: Date.now() + 1 })
            );
        } catch {
            setMessages((prev) =>
                prev.filter((m) => m._id !== "typing").concat({ role: "assistant", content: "⚠️ Something went wrong. Please try again.", _id: Date.now() + 1 })
            );
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    return (
        <>
            <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: .5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

            <div className="flex flex-col flex-1 h-screen bg-slate-50 overflow-hidden">

                {/* Header */}
                <div className="shrink-0 bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-100">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-800 leading-tight">Student Desk AI</h1>
                            <p className="text-xs text-slate-400">Your personal academic tutor</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                        </span>
                        {messages.length > 0 && (
                            <button
                                onClick={() => setMessages([])}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-all"
                            >
                                <RotateCcw className="w-3 h-3" /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-8 py-6 relative">
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center h-full gap-8"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-sky-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-100">
                                    <BookOpen className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-1">Ask anything academic</h2>
                                <p className="text-slate-400 text-sm max-w-xs mx-auto">Get instant explanations, summaries, and study help.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                                {QUICK_PROMPTS.map((qp) => (
                                    <button
                                        key={qp.text}
                                        onClick={() => sendMessage(qp.text)}
                                        className="flex items-start gap-2.5 p-3.5 bg-white border border-slate-100 rounded-2xl text-left text-sm text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm"
                                    >
                                        <span className="text-lg">{qp.icon}</span>
                                        <span className="font-medium leading-snug">{qp.text}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col gap-5 max-w-3xl mx-auto">
                            {messages.map((msg) => <MessageBubble key={msg._id} msg={msg} />)}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                {/* Scroll to bottom */}
                <AnimatePresence>
                    {showScroll && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                            className="absolute bottom-24 right-8 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-blue-600 z-10"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Input */}
                <div className="shrink-0 bg-white border-t border-slate-100 px-8 py-4">
                    <div className="max-w-3xl mx-auto flex gap-3 items-end">
                        <div className="w-full h-12 flex items-center bg-slate-50 border border-slate-200 rounded-3xl px-4 py-2 focus-within:border-blue-400 focus-within:bg-white transition-all shadow-sm">
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="Ask a question about any subject…"
                                disabled={loading}
                                className="w-full resize-none bg-transparent text-sm text-blue-900 placeholder-slate-500 outline-none leading-relaxed max-h-[140px]"
                            />
                        </div>
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            className={`w-14 h-12 rounded-3xl flex items-center justify-center shrink-0 transition-all shadow-md
                ${input.trim() && !loading
                                    ? "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95 shadow-blue-200"
                                    : "bg-slate-200 text-slate-600 cursor-not-allowed shadow-none"
                                }`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-center text-xs text-slate-300 mt-2">
                        <kbd className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">Enter</kbd> to send ·{" "}
                        <kbd className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">Shift+Enter</kbd> for new line
                    </p>
                </div>
            </div>
        </>
    );
}