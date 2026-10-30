import { motion, AnimatePresence } from "framer-motion";
import { useContext, useState } from "react";
import { FaTimes } from "react-icons/fa";
import API from "../../../api/axios";
import AuthContext from "../../../context/authContext";


// Tailwind gradient + accent classes per palette index — cool blue/cyan/teal theme
const PALETTES = [
  { grad: "from-sky-500 to-cyan-400", ring: "ring-sky-400", badge: "bg-sky-100 text-sky-700", bar: "bg-sky-500", btn: "from-sky-500 to-cyan-400" },
  { grad: "from-teal-500 to-emerald-400", ring: "ring-teal-400", badge: "bg-teal-100 text-teal-700", bar: "bg-teal-500", btn: "from-teal-500 to-emerald-400" },
  { grad: "from-blue-500 to-sky-400", ring: "ring-blue-400", badge: "bg-blue-100 text-blue-700", bar: "bg-blue-500", btn: "from-blue-500 to-sky-400" },
  { grad: "from-indigo-500 to-blue-400", ring: "ring-indigo-400", badge: "bg-indigo-100 text-indigo-700", bar: "bg-indigo-500", btn: "from-indigo-500 to-blue-400" },
  { grad: "from-emerald-500 to-teal-400", ring: "ring-emerald-400", badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500", btn: "from-emerald-500 to-teal-400" },
  { grad: "from-amber-500 to-yellow-400", ring: "ring-amber-400", badge: "bg-amber-100 text-amber-700", bar: "bg-amber-500", btn: "from-amber-500 to-yellow-400" },
  { grad: "from-slate-600 to-slate-400", ring: "ring-slate-400", badge: "bg-slate-100 text-slate-700", bar: "bg-slate-500", btn: "from-slate-500 to-slate-400" },
  { grad: "from-orange-500 to-rose-400", ring: "ring-orange-400", badge: "bg-orange-100 text-orange-700", bar: "bg-orange-500", btn: "from-orange-500 to-rose-400" },
];

// Swatch colours for the colour picker dots (visual only)
const SWATCH_COLORS = [
  "bg-sky-500", "bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-slate-500", "bg-rose-500"
];

function AddCourseModal({ isOpen, onClose, onAdd }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [palIdx, setPalIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { fetchCourse } = useContext(AuthContext);

  function reset() {
    setStep(1); setTitle(""); setDescription("");
    setSubject(""); setPalIdx(0);
    setLoading(false); setDone(false);
  }
  function handleClose() { reset(); onClose(); }

  async function handleCreate() {
    if (!title.trim()) return;
    setLoading(true);
    const course = await API.post("/course", {
      title: title, 
      description: description,
      subjectTag: subject,
      backgroundColor: pal.grad,
    })
    setLoading(false); 
    setDone(true);
    fetchCourse();
    setTimeout(handleClose, 1100);
  }

  const pal = PALETTES[palIdx];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.85, y: 48 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-200 rounded-2xl overflow-hidden shadow-2xl bg-[#061a2e] ring-1 ring-white/10 flex flex-col md:flex-row min-h-[600px]">

              {/* LEFT — visual panel */}
              <div className={`relative hidden md:flex flex-col justify-between w-70 shrink-0 bg-linear-to-br ${pal.grad} p-7 overflow-hidden transition-all duration-500`}>
                {/* Deco circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-black/15" />
                <div className="absolute top-1/2 left-1/2 w-20 h-20 rounded-full bg-white/5" />

                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center mb-5 text-2xl">📚</div>
                  <p className="text-white/60 text-xs font-bold tracking-widest uppercase mb-2">
                    {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
                  </p>
                  <h2 className="text-white text-xl font-black leading-snug mb-3" style={{ fontFamily: "'Georgia', serif" }}>
                    {step === 1 ? "Course Details" : "Preferences"}
                  </h2>
                  <p className="text-white/55 text-sm leading-relaxed">
                    {step === 1
                      ? "Name your course, add a description and subject tag."
                      : "Set a difficulty level and pick a card colour."}
                  </p>
                </div>
              </div>

              {/* RIGHT — form panel */}
              <div className="flex-1 flex flex-col p-7">

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-white text-lg font-black" style={{ fontFamily: "'Georgia', serif" }}>
                      {step === 1 ? "New Course" : "Almost there!"}
                    </h3>
                    <p className="text-white/35 text-xs mt-1">Fill in the details below</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Step progress bar */}
                <div className="flex gap-2 mb-7">
                  {[1, 2].map(s => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= s ? pal.bar : "bg-white/10"}`}
                    />
                  ))}
                </div>

                {/* Step content */}
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="s1"
                        initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-5"
                      >
                        <div className="flex flex-col gap-1.5">
                          <label className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Course Name *</label>
                          <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Advanced Mathematics"
                            className="w-full rounded-xl px-4 py-3 bg-white/6 border border-white/10 focus:border-sky-400 text-white text-sm outline-none placeholder-white/25 transition-colors"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Description</label>
                          <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="What will students learn? Topics covered…"
                            rows={4}
                            className="w-full rounded-xl px-4 py-3 bg-white/6 border border-white/10 focus:border-sky-400 text-white text-sm outline-none placeholder-white/25 resize-none leading-relaxed transition-colors"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Subject Tag</label>
                          <input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="e.g. Algebra, Thermodynamics, Genetics…"
                            className="w-full rounded-xl px-4 py-3 bg-white/6 border border-white/10 focus:border-sky-400 text-white text-sm outline-none placeholder-white/25 transition-colors"
                          />
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="s2"
                        initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-6"
                      >

                        {/* Colour picker */}
                        <div className="flex flex-col gap-2">
                          <label className="text-white/40 text-[10px] font-bold tracking-widest uppercase">Card Colour</label>
                          <div className="flex gap-3 flex-wrap">
                            {SWATCH_COLORS.map((sw, i) => (
                              <button
                                key={i}
                                onClick={() => setPalIdx(i)}
                                className={`w-10 h-10 rounded-xl ${sw} transition-all ring-offset-2 ring-offset-[#061a2e] ${palIdx === i ? `ring-2 ${PALETTES[i].ring} scale-110` : "opacity-60 hover:opacity-90"
                                  }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Summary preview */}
                        <div className={`flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5`}>
                          <div className={`w-14 h-14 rounded-xl shrink-0 bg-linear-to-br ${pal.grad}`} />
                          <div>
                            <p className="text-white text-sm font-bold">{title}</p>
                            <p className="text-white/60 text-sm font-semibold">{description}</p>
                            <p className="text-white/40 text-xs mt-0.5">{subject || "No subject tag"}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-7">
                  {step === 2 && (
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/8 text-sm font-bold transition-all"
                    >
                      ← Back
                    </button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={step === 1 ? () => { if (title.trim()) setStep(2); } : handleCreate}
                    disabled={(step === 1 && !title.trim()) || loading || done}
                    className={`py-3 rounded-xl text-sm font-black text-white transition-all ${step === 2 ? "flex-[2]" : "flex-1"} ${done
                        ? "bg-linear-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30"
                        : title.trim()
                          ? `bg-linear-to-r ${pal.btn} shadow-lg`
                          : "bg-white/8 text-white/25 cursor-not-allowed"
                      }`}
                  >
                    {done ? "✓ Course Created!" : loading ? "Creating…" : step === 1 ? "Continue →" : "Create Course"}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AddCourseModal;
