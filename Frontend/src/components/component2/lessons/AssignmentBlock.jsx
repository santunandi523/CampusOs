import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiClock, FiAlertCircle, FiAward } from "react-icons/fi";
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
// PreviousResult — permanent score card shown below the assignment
// Matches student dashboard UI: white card, gray borders, blue accents
// ════════════════════════════════════════════════════════════════
function PreviousResult({ submission, questions }) {
  const [open, setOpen] = useState(false);
  const { earned, total, pct, answers, submittedAt, attemptNumber } = submission;
  const grade = pct >= 80 ? "A" : pct >= 60 ? "B" : pct >= 40 ? "C" : "F";
  const gradeColor = grade === "A" ? "text-green-600 bg-green-50 border-green-200"
    : grade === "B" ? "text-blue-600 bg-blue-50 border-blue-200"
    : grade === "C" ? "text-yellow-600 bg-yellow-50 border-yellow-200"
    : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="mt-4 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Result header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <FiAward size={16} className="text-yellow-500" />
          <span className="text-sm font-bold text-gray-700">
            Attempt {attemptNumber} · {new Date(submittedAt).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${gradeColor}`}>
            Grade {grade}
          </span>
          <span className="text-sm font-black text-gray-800">
            {earned}/{total} <span className="text-gray-400 font-medium text-xs">marks</span>
          </span>
          <span className={`text-sm font-bold ${pct >= 60 ? "text-green-600" : "text-red-500"}`}>
            {pct}%
          </span>
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition ml-1"
          >
            {open ? "Hide" : "Review"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div
          className={`h-full transition-all ${pct >= 60 ? "bg-green-400" : "bg-red-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Breakdown — toggleable */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {(answers || []).map((a, i) => {
                const q = questions?.[i];
                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 text-sm ${
                      a.isCorrect
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      {a.isCorrect
                        ? <FiCheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                        : <FiAlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                      }
                      <p className="font-semibold text-gray-700">{a.questionText}</p>
                      <span className="ml-auto text-xs text-gray-400 shrink-0">
                        {a.marksAwarded}/{q?.marks || 1}pt
                      </span>
                    </div>
                    {!a.isCorrect && a.selectedOptionIdx !== null && (
                      <p className="text-red-500 text-xs pl-5">
                        Your answer: {q?.options?.[a.selectedOptionIdx]?.optionText}
                      </p>
                    )}
                    <p className="text-green-600 text-xs font-semibold pl-5">
                      Correct: {q?.options?.[a.correctOptionIdx]?.optionText}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// QuizRunner — timed MCQ quiz, matches student dashboard UI
// ════════════════════════════════════════════════════════════════
function QuizRunner({ assignment, onDone }) {
  const questions = assignment.mcqQuestions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
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
      setScore(data);
      onDone?.(); // tell parent to re-fetch the saved result
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (err.response?.status === 400) {
        setSubmitError(msg);
      } else {
        // fallback client-side score
        const total = questions.reduce((s, q) => s + (q.marks || 1), 0);
        let earned = 0;
        const breakdown = questions.map((q, qi) => {
          const correctIdx = q.options.findIndex((o) => o.isCorrect);
          const isCorrect = answers[qi] === correctIdx;
          if (isCorrect) earned += q.marks || 1;
          return { questionText: q.questionText, selectedOptionIdx: answers[qi] ?? null, correctOptionIdx: correctIdx, isCorrect, marksAwarded: isCorrect ? q.marks || 1 : 0 };
        });
        setScore({ earned, total, pct: Math.round((earned / total) * 100), breakdown });
      }
    } finally {
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  // max attempts
  if (submitted && submitError) {
    return (
      <div className="p-5">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-700 text-sm text-center">
          {submitError}
        </div>
      </div>
    );
  }

  // just-submitted inline score (temporary — PreviousResult below will be permanent)
  if (submitted && score) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 text-center">
        <div className={`text-4xl font-black mb-1 ${score.pct >= 60 ? "text-green-500" : "text-red-400"}`}>
          {score.earned}/{score.total}
        </div>
        <p className="text-sm text-gray-500">
          {score.pct}% · {score.pct >= 80 ? "Excellent!" : score.pct >= 60 ? "Good work!" : "Keep practising"}
        </p>
        <p className="text-xs text-gray-400 mt-2">Results saved below ↓</p>
      </motion.div>
    );
  }

  const answered = Object.keys(answers).length;
  const danger = timeLeft < 60;

  return (
    <div className="p-5">
      {/* quiz header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-base font-bold text-gray-800">{assignment.title}</h3>
        <span className={`flex items-center gap-1.5 font-mono text-sm font-bold px-3 py-1 rounded-lg border ${
          danger
            ? "text-red-500 bg-red-50 border-red-200 animate-pulse"
            : "text-gray-500 bg-gray-50 border-gray-200"
        }`}>
          <FiClock size={12} />
          {fmt(timeLeft)}
        </span>
      </div>

      {/* progress bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${(answered / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 font-medium shrink-0">{answered}/{questions.length} answered</span>
      </div>

      {/* questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700">
                <span className="text-blue-500 font-bold mr-1.5">Q{qi + 1}.</span>
                {q.questionText}
                <span className="text-gray-400 text-xs ml-1.5 font-normal">({q.marks}pt)</span>
              </p>
            </div>
            <div className="p-3 space-y-2 bg-white">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    answers[qi] === oi
                      ? "bg-blue-50 border-blue-400 text-blue-700"
                      : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/40"
                  }`}
                >
                  <span className="font-mono text-xs text-gray-400 mr-2">
                    {String.fromCharCode(65 + oi)}.
                  </span>
                  {opt.optionText}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* submit */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {questions.length - answered > 0
            ? `${questions.length - answered} question${questions.length - answered !== 1 ? "s" : ""} unanswered`
            : <span className="text-green-600 font-medium flex items-center gap-1"><FiCheckCircle size={12} /> All answered</span>
          }
        </p>
        <button
          onClick={() => doSubmit(false)}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Quiz"}
          <FiCheckCircle size={15} />
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AssignmentBlockPreview — student-facing block in LessonContent
// Fetches previous result on load and shows it permanently below
// ════════════════════════════════════════════════════════════════
export function AssignmentBlockPreview({ block }) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [started, setStarted] = useState(false);
  // previous submissions fetched from GET /assignments/:id/my-result
  const [prevSubmissions, setPrevSubmissions] = useState([]);

  const fetchAssignment = () => {
    if (!block.assignmentId) return;
    setLoading(true);
    API.get(`assignments/${block.assignmentId}`)
      .then(({ data }) => setAssignment(data?.assignment || data))
      .catch(() => setError("Could not load assignment."))
      .finally(() => setLoading(false));
  };

  const fetchMyResults = () => {
    if (!block.assignmentId) return;
    API.get(`assignments/${block.assignmentId}/my-result`)
      .then(({ data }) => setPrevSubmissions(data?.submissions || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchAssignment();
    fetchMyResults();
  }, [block.assignmentId]);

  // ── loading / error states ────────────────────────────────────
  if (!block.assignmentId)
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-5 text-center text-gray-400 text-sm">
        No assignment linked.
      </div>
    );

  if (loading)
    return (
      <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 flex items-center gap-3 text-gray-400 text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
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

  // ── status gates ─────────────────────────────────────────────
  if (assignment.status === "draft")
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-700 text-sm">
        📝 <strong>{assignment.title}</strong> — not published yet.
      </div>
    );

  if (now < from)
    return (
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-blue-700 text-sm flex items-center gap-2">
        <FiClock size={14} />
        <span><strong>{assignment.title}</strong> — opens {from.toLocaleString()}</span>
      </div>
    );

  if (assignment.status === "closed" || now > until)
    return (
      <div className="rounded-2xl bg-gray-100 border border-gray-200 p-4 text-gray-500 text-sm">
        🔒 <strong>{assignment.title}</strong> — closed.
      </div>
    );

  const totalMarks  = (assignment.mcqQuestions || []).reduce((s, q) => s + (q.marks || 1), 0);
  const attemptsLeft = assignment.maxAttempts - prevSubmissions.length;
  const exhausted    = attemptsLeft <= 0;

  return (
    <div>
      {/* ── Assignment card ── */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">

        {/* top accent */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />

        <AnimatePresence mode="wait">
          {/* Info / start screen */}
          {!started && !exhausted && (
            <motion.div
              key="info"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">
                    Assignment
                  </p>
                  <h3 className="text-lg font-bold text-gray-800">{assignment.title}</h3>
                  {assignment.description && (
                    <p className="text-sm text-gray-500 mt-1">{assignment.description}</p>
                  )}
                </div>
                {prevSubmissions.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 border border-green-200 text-green-700 shrink-0">
                    Attempted
                  </span>
                )}
              </div>

              {/* stats row — matches CourseStructure card style */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Questions", val: (assignment.mcqQuestions || []).length },
                  { label: "Total Marks", val: totalMarks },
                  { label: "Time Limit", val: `${assignment.timeLimitMinutes} min` },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                    <div className="text-base font-black text-gray-800">{s.val}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
                <span>Closes: {until.toLocaleString()}</span>
                <span>{attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining</span>
              </div>

              <button
                onClick={() => setStarted(true)}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20"
              >
                {prevSubmissions.length > 0 ? "Retake Assignment" : "Start Assignment"}
              </button>
            </motion.div>
          )}

          {/* Exhausted attempts — only show results below */}
          {!started && exhausted && (
            <motion.div key="exhausted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-5 text-center">
              <p className="text-sm text-gray-500 font-medium">
                You've used all {assignment.maxAttempts} attempt{assignment.maxAttempts !== 1 ? "s" : ""}.
              </p>
              <p className="text-xs text-gray-400 mt-1">Your best result is shown below.</p>
            </motion.div>
          )}

          {/* Active quiz */}
          {started && (
            <motion.div key="quiz" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <QuizRunner
                assignment={assignment}
                onDone={() => {
                  fetchMyResults();
                  setStarted(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Permanent results history below the card ── */}
      {prevSubmissions.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">
            Your Results
          </p>
          {/* show best attempt first */}
          {[...prevSubmissions]
            .sort((a, b) => b.pct - a.pct)
            .map((sub, i) => (
              <PreviousResult
                key={sub._id || i}
                submission={sub}
                questions={assignment.mcqQuestions}
              />
            ))}
        </div>
      )}
    </div>
  );
}