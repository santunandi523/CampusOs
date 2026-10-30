import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../../api/axios";

const uid = () => Math.random().toString(36).slice(2, 9);

const iCls =
  "w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";

const labelCls =
  "block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5";

const makeOption = () => ({ _lid: uid(), optionText: "", isCorrect: false });
const makeQuestion = () => ({
  _lid: uid(),
  questionText: "",
  options: [makeOption(), makeOption()],
  marks: 1,
});

function QuestionRow({ q, idx, onChange, onRemove }) {
  const setCorrect = (oid) =>
    onChange({ options: q.options.map((o) => ({ ...o, isCorrect: o._lid === oid })) });

  const updateOption = (oid, text) =>
    onChange({ options: q.options.map((o) => (o._lid === oid ? { ...o, optionText: text } : o)) });

  const addOption = () => onChange({ options: [...q.options, makeOption()] });

  const removeOption = (oid) => {
    if (q.options.length <= 2) return;
    onChange({ options: q.options.filter((o) => o._lid !== oid) });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Question header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
          Q{idx + 1}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Marks</span>
          <input
            type="number" min="1"
            value={q.marks}
            onChange={(e) => onChange({ marks: Math.max(1, +e.target.value) })}
            className="w-12 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-400 text-center"
          />
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-base leading-none transition-all cursor-pointer"
          >×</button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <textarea
          className={iCls + " resize-none min-h-[64px]"}
          placeholder="Question text…"
          value={q.questionText}
          onChange={(e) => onChange({ questionText: e.target.value })}
        />

        <div className="space-y-2">
          {q.options.map((opt, oi) => (
            <div key={opt._lid} className="flex items-center gap-2">
              <button
                onClick={() => setCorrect(opt._lid)}
                title="Mark as correct"
                className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all cursor-pointer ${
                  opt.isCorrect
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-slate-300 hover:border-emerald-400"
                }`}
              />
              <input
                className={iCls + " flex-1"}
                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                value={opt.optionText}
                onChange={(e) => updateOption(opt._lid, e.target.value)}
              />
              {q.options.length > 2 && (
                <button
                  onClick={() => removeOption(opt._lid)}
                  className="text-slate-300 hover:text-red-400 transition-colors text-sm shrink-0 cursor-pointer bg-transparent border-0"
                >×</button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addOption}
          className="text-[11px] text-blue-500 hover:text-blue-700 font-semibold transition-colors bg-transparent border-0 cursor-pointer p-0"
        >+ add option</button>

        {!q.options.some((o) => o.isCorrect) && (
          <p className="text-[10px] text-amber-500 font-medium">⚠ Mark one option as correct</p>
        )}
      </div>
    </motion.div>
  );
}

export default function CreateAssignment({ courses: coursesProp, onSuccess, onBack }) {
  const courses = Array.isArray(coursesProp) ? coursesProp : [];

  const [form, setForm] = useState({
    title: "", description: "", courseId: "",
    timeLimitMinutes: 30, availableFrom: "", availableUntil: "",
    maxAttempts: 1, status: "draft",
  });
  const [questions, setQuestions] = useState([makeQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (v) => setForm((f) => ({ ...f, ...v }));
  const updateQ = (lid, v) => setQuestions((qs) => qs.map((q) => (q._lid === lid ? { ...q, ...v } : q)));
  const removeQ = (lid) => setQuestions((qs) => qs.filter((q) => q._lid !== lid));

  const issues = [];
  if (!form.title.trim()) issues.push("Title is required");
  if (!form.timeLimitMinutes || form.timeLimitMinutes < 1) issues.push("Time limit must be ≥ 1 minute");
  if (!form.availableFrom) issues.push("Available From is required");
  if (!form.availableUntil) issues.push("Available Until is required");
  if (form.availableFrom && form.availableUntil && form.availableFrom >= form.availableUntil)
    issues.push("Available Until must be after Available From");
  if (questions.length === 0) issues.push("Add at least one question");
  questions.forEach((q, i) => {
    if (!q.questionText.trim()) issues.push(`Q${i + 1}: missing question text`);
    if (!q.options.some((o) => o.isCorrect)) issues.push(`Q${i + 1}: no correct answer marked`);
    if (q.options.some((o) => !o.optionText.trim())) issues.push(`Q${i + 1}: all options need text`);
  });

  const handleSubmit = async () => {
    if (issues.length > 0) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        courseId: form.courseId || null,
        mcqQuestions: questions.map(({ _lid, ...q }) => ({
          ...q,
          options: q.options.map(({ _lid: _o, ...o }) => o),
        })),
        textUploadQuestions: [],
      };
      const { data } = await API.post("/assignments", payload);
      onSuccess?.(data.assignment);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0);

  return (
    <>
      <style>{`
        input[type=datetime-local]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div className="min-h-screen bg-slate-50 flex flex-col">

        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-700 text-sm font-semibold flex items-center gap-1.5 transition-colors group bg-transparent border-0 cursor-pointer p-0"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform inline-block">←</span>
            Assignments
          </button>
          <span className="text-slate-200 select-none">|</span>
          <span className="text-sm font-bold text-slate-700 truncate flex-1">
            {form.title || "New Assignment"}
          </span>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            {questions.length}Q · {totalMarks} marks
          </span>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

            {/* Details card */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Details
              </p>

              <div>
                <label className={labelCls}>Title *</label>
                <input className={iCls} placeholder="e.g. Chapter 3 Quiz"
                  value={form.title} onChange={(e) => set({ title: e.target.value })} />
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea className={iCls + " resize-none min-h-[64px]"}
                  placeholder="Optional instructions…" value={form.description}
                  onChange={(e) => set({ description: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Time Limit (minutes) *</label>
                  <input type="number" min="1" className={iCls} value={form.timeLimitMinutes}
                    onChange={(e) => set({ timeLimitMinutes: +e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Max Attempts</label>
                  <input type="number" min="1" className={iCls} value={form.maxAttempts}
                    onChange={(e) => set({ maxAttempts: +e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Available From *</label>
                  <input type="datetime-local" className={iCls} value={form.availableFrom}
                    onChange={(e) => set({ availableFrom: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Available Until *</label>
                  <input type="datetime-local" className={iCls} value={form.availableUntil}
                    onChange={(e) => set({ availableUntil: e.target.value })} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Link to Course (optional)</label>
                <select className={iCls} value={form.courseId}
                  onChange={(e) => set({ courseId: e.target.value })}>
                  <option value="">— Not linked —</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <div className="flex gap-2">
                  {["draft", "published"].map((s) => (
                    <button key={s} onClick={() => set({ status: s })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        form.status === s
                          ? "bg-slate-800 border-slate-800 text-white"
                          : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300"
                      }`}>
                      {s === "draft" ? "Draft" : "Published"}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Questions */}
            <section>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
                MCQ Questions
              </p>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {questions.map((q, i) => (
                    <QuestionRow key={q._lid} q={q} idx={i}
                      onChange={(v) => updateQ(q._lid, v)}
                      onRemove={() => removeQ(q._lid)} />
                  ))}
                </AnimatePresence>
                <button
                  onClick={() => setQuestions((qs) => [...qs, makeQuestion()])}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 text-sm font-semibold transition-all cursor-pointer bg-transparent"
                >
                  + Add Question
                </button>
              </div>
            </section>

            {/* Validation issues */}
            {issues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-red-500 mb-2">
                  Fix before submitting
                </p>
                {issues.map((msg, i) => (
                  <p key={i} className="text-xs text-red-400">– {msg}</p>
                ))}
              </div>
            )}

            {/* API error */}
            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={issues.length > 0 || saving}
              className={`w-full py-3 rounded-2xl text-sm font-bold transition-all border-0 ${
                issues.length === 0 && !saving
                  ? "bg-slate-800 text-white hover:bg-slate-700 shadow-md cursor-pointer"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }`}
            >
              {saving ? "Creating…" : "Create Assignment"}
            </button>

            <div className="h-4" />
          </div>
        </div>
      </div>
    </>
  );
}