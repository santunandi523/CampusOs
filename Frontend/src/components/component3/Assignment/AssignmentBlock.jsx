import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../../api/axios"; // adjust path if needed

// ════════════════════════════════════════════════════════════════
// AssignmentBlockEditor — drop into CourseEditor's BlockEditor
// ════════════════════════════════════════════════════════════════
export function AssignmentBlockEditor({ block, onChange }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("assignments/my")
      .then(({ data }) => setAssignments(data?.assignments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (e) => {
    const id = e.target.value;
    const found = assignments.find((a) => a._id === id);
    onChange({ assignmentId: id, assignmentTitle: found?.title || "" });
  };

  const selected = assignments.find((a) => a._id === block.assignmentId);

  return (
    <div className="p-4 space-y-3 bg-white">
      <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-2">
        Link Assignment
      </p>

      {loading ? (
        <p className="text-xs text-stone-400">Loading…</p>
      ) : assignments.length === 0 ? (
        <p className="text-xs text-stone-400">
          No assignments found. Create one from the Assignments page first.
        </p>
      ) : (
        <select
          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-700 outline-none focus:border-violet-400 transition-all"
          value={block.assignmentId || ""}
          onChange={handleSelect}
        >
          <option value="">— Select an assignment —</option>
          {assignments.map((a) => (
            <option key={a._id} value={a._id}>
              {a.title} · {(a.mcqQuestions || []).length}Q · {a.status}
            </option>
          ))}
        </select>
      )}

      {selected && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs space-y-1">
          <p className="font-bold text-violet-700">{selected.title}</p>
          <p className="text-violet-500/70">
            {(selected.mcqQuestions || []).length} questions ·{" "}
            {(selected.mcqQuestions || []).reduce((s, q) => s + (q.marks || 1), 0)} marks ·{" "}
            {selected.timeLimitMinutes} min
          </p>
          {selected.status !== "published" && (
            <p className="text-amber-600 text-[11px]">
              ⚠ Status is "{selected.status}" — publish it so students can attempt it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// QuizRunner — timed MCQ quiz, uses server score + saves result
// ════════════════════════════════════════════════════════════════
function QuizRunner({ assignment }) {
  const questions = assignment.mcqQuestions || [];
  const [answers, setAnswers] = useState({});       // { qi: optionIndex }
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);         // server response
  const [timeLeft, setTimeLeft] = useState(assignment.timeLimitMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(t); doSubmit(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [submitted]);

  const fmt = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const doSubmit = async (auto = false) => {
    if (submitted || submitting) return;
    if (!auto && !window.confirm("Submit your answers?")) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const { data } = await API.post(`assignments/${assignment._id}/submit`, {
        answers: questions.map((q, qi) => ({
          questionId: q._id,
          selectedOptionIdx: answers[qi] ?? null,
        })),
      });
      // data = { earned, total, pct, breakdown }
      setScore(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      // Max attempts reached — show the message, don't crash
      if (err.response?.status === 400) {
        setSubmitError(msg);
      } else {
        // Network/server error — fall back to client-side score so student isn't left hanging
        const total = questions.reduce((s, q) => s + (q.marks || 1), 0);
        let earned = 0;
        const breakdown = questions.map((q, qi) => {
          const correctIdx = q.options.findIndex((o) => o.isCorrect);
          const isCorrect  = answers[qi] === correctIdx;
          if (isCorrect) earned += q.marks || 1;
          return {
            questionText:      q.questionText,
            selectedOptionIdx: answers[qi] ?? null,
            correctOptionIdx:  correctIdx,
            isCorrect,
            marksAwarded:      isCorrect ? q.marks || 1 : 0,
          };
        });
        setScore({ earned, total, pct: Math.round((earned / total) * 100), breakdown });
      }
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  // ── Max attempts error ───────────────────────────────────────
  if (submitted && submitError) {
    return (
      <div className="p-5">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-700 text-sm text-center">
          {submitError}
        </div>
      </div>
    );
  }

  // ── Score screen ─────────────────────────────────────────────
  if (submitted && score) {
    const { earned, total, pct, breakdown } = score;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5">
        <div className="text-center mb-5">
          <div className={`text-4xl font-black mb-1 ${pct >= 60 ? "text-emerald-500" : "text-rose-400"}`}>
            {earned}/{total}
          </div>
          <p className="text-sm text-stone-500">
            {pct}% · {pct >= 80 ? "Excellent!" : pct >= 60 ? "Good work" : "Keep practising"}
          </p>
        </div>

        {/* Per-question breakdown from server */}
        {breakdown && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {breakdown.map((b, i) => (
              <div key={i} className={`rounded-xl p-3 border text-xs ${b.isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                <p className="font-semibold text-stone-700 mb-1">
                  {b.isCorrect ? "✓" : "✗"} {b.questionText}
                </p>
                {!b.isCorrect && b.selectedOptionIdx !== null && (
                  <p className="text-red-500">
                    Your answer: {questions[i]?.options[b.selectedOptionIdx]?.optionText}
                  </p>
                )}
                <p className="text-emerald-600 font-bold">
                  Correct: {questions[i]?.options[b.correctOptionIdx]?.optionText}
                </p>
                <p className="text-stone-400 mt-0.5">{b.marksAwarded}/{questions[i]?.marks || 1} marks</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // ── Quiz UI ──────────────────────────────────────────────────
  const answered = Object.keys(answers).length;
  const danger = timeLeft < 60;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-100">
        <h3 className="text-base font-black text-stone-800" style={{ fontFamily: "Georgia,serif" }}>
          {assignment.title}
        </h3>
        <span className={`font-mono text-sm font-bold px-3 py-1 rounded-xl border ${danger ? "text-red-500 bg-red-50 border-red-200 animate-pulse" : "text-stone-500 bg-stone-50 border-stone-200"}`}>
          {fmt(timeLeft)}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-violet-400 transition-all"
            style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
        <span className="text-xs text-stone-400 shrink-0">{answered}/{questions.length}</span>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-stone-50 border border-stone-100 rounded-2xl p-4">
            <p className="text-sm font-semibold text-stone-700 mb-3">
              <span className="text-stone-400 text-xs mr-1.5">Q{qi + 1}.</span>
              {q.questionText}
              <span className="text-stone-400 text-xs ml-1.5">({q.marks}pt)</span>
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <button key={oi}
                  onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    answers[qi] === oi
                      ? "bg-violet-50 border-violet-300 text-violet-700 font-semibold"
                      : "bg-white border-stone-200 text-stone-600 hover:border-violet-200"
                  }`}
                >
                  <span className="text-stone-400 font-mono text-xs mr-2">
                    {String.fromCharCode(65 + oi)}.
                  </span>
                  {opt.optionText}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={() => doSubmit(false)}
          disabled={submitting}
          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-500 text-white hover:bg-violet-400 transition-all shadow-md shadow-violet-500/20 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit →"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AssignmentBlockPreview — drop into CoursePreview's BlockPreview
// ════════════════════════════════════════════════════════════════
export function AssignmentBlockPreview({ block }) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!block.assignmentId) return;
    setLoading(true);
    API.get(`assignments/${block.assignmentId}`)
      .then(({ data }) => setAssignment(data?.assignment || data))
      .catch(() => setError("Could not load assignment."))
      .finally(() => setLoading(false));
  }, [block.assignmentId]);

  if (!block.assignmentId)
    return (
      <div className="rounded-2xl border-2 border-dashed border-stone-200 p-5 text-center text-stone-400 text-sm">
        No assignment linked.
      </div>
    );

  if (loading)
    return (
      <div className="rounded-2xl bg-stone-50 border border-stone-200 p-5 flex items-center gap-3 text-stone-400 text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
        Loading assignment…
      </div>
    );

  if (error || !assignment)
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-500 text-sm">
        {error || "Assignment not found."}
      </div>
    );

  const now   = new Date();
  const from  = new Date(assignment.availableFrom);
  const until = new Date(assignment.availableUntil);

  if (assignment.status === "draft")
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-700 text-sm">
        📝 <strong>{assignment.title}</strong> — not published yet.
      </div>
    );

  if (now < from)
    return (
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-blue-700 text-sm">
        🕐 <strong>{assignment.title}</strong> — opens {from.toLocaleString()}
      </div>
    );

  if (assignment.status === "closed" || now > until)
    return (
      <div className="rounded-2xl bg-stone-100 border border-stone-200 p-4 text-stone-500 text-sm">
        🔒 <strong>{assignment.title}</strong> — closed.
      </div>
    );

  const totalMarks = (assignment.mcqQuestions || []).reduce((s, q) => s + (q.marks || 1), 0);

  return (
    <div className="rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
      <div className="h-0.5 bg-gradient-to-r from-violet-500 to-purple-400" />
      <AnimatePresence mode="wait">
        {!started ? (
          <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-5 bg-gradient-to-br from-violet-50/40 to-white">
            <h3 className="text-lg font-black text-stone-800 mb-1" style={{ fontFamily: "Georgia,serif" }}>
              {assignment.title}
            </h3>
            {assignment.description && (
              <p className="text-sm text-stone-500 mb-3">{assignment.description}</p>
            )}
            <div className="flex gap-4 text-xs text-stone-500 mb-3">
              <span>◆ {(assignment.mcqQuestions || []).length} questions</span>
              <span>★ {totalMarks} marks</span>
              <span>⏱ {assignment.timeLimitMinutes} min</span>
            </div>
            <p className="text-xs text-stone-400 mb-4">Closes: {until.toLocaleString()}</p>
            <button
              onClick={() => setStarted(true)}
              className="w-full py-2.5 rounded-xl text-sm font-bold bg-violet-500 text-white hover:bg-violet-400 transition-all shadow-md shadow-violet-500/20"
            >
              Start →
            </button>
          </motion.div>
        ) : (
          <motion.div key="quiz" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <QuizRunner assignment={assignment} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}