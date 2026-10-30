import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../../api/axios";
import CreateAssignment from "./CreateAssignment";

const STATUS_CONFIG = {
  draft:     { label: "Draft",     dot: "bg-slate-400",   badge: "bg-slate-50 text-slate-500 border-slate-200" },
  published: { label: "Published", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed:    { label: "Closed",    dot: "bg-slate-300",   badge: "bg-slate-50 text-slate-400 border-slate-200" },
};

function AssignmentCard({ a, onDelete, onStatusChange }) {
  const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.draft;
  const totalMarks = (a.mcqQuestions || []).reduce((s, q) => s + (q.marks || 1), 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-bold text-slate-800 leading-snug">{a.title}</h3>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${st.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      {a.description && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-1">{a.description}</p>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {[
          `${(a.mcqQuestions || []).length} questions`,
          `${totalMarks} marks`,
          `${a.timeLimitMinutes} min`,
          `${a.maxAttempts} attempt${a.maxAttempts !== 1 ? "s" : ""}`,
        ].map((stat, i) => (
          <span key={i} className="text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5">
            {stat}
          </span>
        ))}
      </div>

      {/* Dates */}
      <div className="text-[11px] text-slate-400 mb-4 space-y-0.5">
        <div className="flex gap-1.5 items-baseline">
          <span className="text-slate-300 font-bold uppercase tracking-wider text-[9px]">From</span>
          {new Date(a.availableFrom).toLocaleString()}
        </div>
        <div className="flex gap-1.5 items-baseline">
          <span className="text-slate-300 font-bold uppercase tracking-wider text-[9px]">Until</span>
          {new Date(a.availableUntil).toLocaleString()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {a.status === "draft" && (
          <button
            onClick={() => onStatusChange(a._id, "published")}
            className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            Publish
          </button>
        )}
        {a.status === "published" && (
          <button
            onClick={() => onStatusChange(a._id, "closed")}
            className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        )}
        {a.status === "closed" && (
          <button
            onClick={() => onStatusChange(a._id, "published")}
            className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            Reopen
          </button>
        )}
        <button
          onClick={() => onDelete(a._id)}
          className="py-1.5 px-3 rounded-xl text-xs font-bold bg-red-50 border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </motion.div>
  );
}

export default function Assignments() {
  const [view, setView] = useState("list");
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [aRes, cRes] = await Promise.all([
          API.get("/assignments/my"),
          API.get("/course"),
        ]);
        setAssignments(aRes.data?.assignments || []);
        const rawCourses = cRes.data?.courses ?? cRes.data ?? [];
        setCourses(Array.isArray(rawCourses) ? rawCourses : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await API.delete(`assignments/${id}`);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const { data } = await API.patch(`assignments/${id}/status`, { status });
      setAssignments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: data.assignment?.status || status } : a))
      );
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  if (view === "create") {
    return (
      <CreateAssignment
        courses={courses}
        onSuccess={(a) => { setAssignments((prev) => [a, ...prev]); setView("list"); }}
        onBack={() => setView("list")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-7 py-4 flex items-center gap-4 sticky top-0 z-10">
        <div className="flex-1">
          <h1 className="text-[17px] font-extrabold text-slate-800 tracking-tight leading-none">
            Assignments
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {assignments.length} total
          </p>
        </div>
        <button
          onClick={() => setView("create")}
          className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer border-0"
        >
          + New Assignment
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-7">
        {loading ? (
          <div className="flex items-center justify-center pt-20">
            <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <span className="text-4xl mb-3">📋</span>
            <p className="text-slate-400 text-sm font-medium">No assignments yet.</p>
            <button
              onClick={() => setView("create")}
              className="mt-2.5 text-[13px] text-blue-500 hover:text-blue-600 font-semibold bg-transparent border-0 cursor-pointer transition-colors"
            >
              Create your first one →
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {assignments.map((a) => (
                <AssignmentCard
                  key={a._id}
                  a={a}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}