import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AssignmentBlockPreview } from "../Assignment/AssignmentBlock";

// ════════════════════════════════════════════════════════════════
// Block Preview
// ════════════════════════════════════════════════════════════════
function BlockPreview({ block }) {
  function getEmbedURL(url) {
    if (url.includes("youtu.be")) {
      const id = url.split("youtu.be/")[1].split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }

    if (url.includes("watch?v=")) {
      const id = url.split("v=")[1].split("&")[0];
      return `https://www.youtube.com/embed/${id}`;
    }

    return url;
  }
  if (block.type === "text") return (
    <div className="text-[15px] text-stone-600 leading-relaxed" style={{ fontFamily: "'Lora',Georgia,serif" }}>
      {block.value.split("\n").map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} className="text-base font-black text-stone-800 mt-5 mb-1.5">{line.slice(3)}</h3>;
        if (line.startsWith("- ")) return <div key={i} className="flex gap-2 my-0.5"><span className="text-amber-400 mt-1 text-xs shrink-0">◆</span><span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/`([^`]+)`/g, "<code class='bg-stone-100 px-1 rounded text-xs font-mono text-sky-700'>$1</code>") }} /></div>;
        if (line === "") return <div key={i} className="h-2" />;
        return line;
        // return <p key={i} className="my-1" dangerouslySetInnerHTML={{ __html: line.replace(/`([^`]+)`/g, "<code class='bg-stone-100 px-1 rounded text-xs font-mono text-sky-700'>$1</code>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />;
      })}
    </div>
  );

  if (block.type === "code") return (
    <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm">
      <div className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a2e]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        {block.filename && <span className="ml-2 text-slate-500 text-[11px] font-mono">{block.filename}</span>}
      </div>
      <pre className="bg-[#0d0d1a] text-emerald-300 font-mono text-sm px-5 py-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">{block.value}</pre>
    </div>
  );

  if (block.type === "images") return (
    <figure className="rounded-xl overflow-hidden border border-stone-100">
      {block.imageURL && <img src={block.imageURL} alt={block.caption || ""} className="w-full max-h-72 object-cover" />}
      {block.caption && <figcaption className="text-center text-[11px] text-stone-400 italic py-2 px-4 bg-stone-50">{block.caption}</figcaption>}
    </figure>
  );

  if (block.type === "video") return (
    <div className="rounded-xl overflow-hidden border border-stone-100 shadow-sm">
      <div className="aspect-video relative flex items-center justify-center">
        <div className="absolute opacity-80" />
        <iframe src={getEmbedURL(block.videoURL)} className="w-full h-full" allowFullScreen title={block.caption || "Lesson video"} />
      </div>
      {block.caption && <p className="text-center text-[11px] text-stone-400 italic py-2 px-4 bg-stone-50">{block.caption}</p>}
    </div>
  );

  if (block.type === "assignment") return <AssignmentBlockPreview block={block} />;

  return null;
}

// ════════════════════════════════════════════════════════════════
// Sidebar Tree — Preview Only
// ════════════════════════════════════════════════════════════════
function PreviewSidebar({ course, activeLesson, onSelectLesson }) {
  const [openUnits, setOpenUnits] = useState(() => ({ [course.units[0]?._id]: true }));
  const [openChapters, setOpenChapters] = useState(() => ({ [course.units[0]?.chapters[0]?._id]: true }));

  const BLOCK_TYPES = [
    { type: "text",  icon: "¶",   color: "#3b82f6" },
    { type: "code",  icon: "</>", color: "#10b981" },
    { type: "image", icon: "⊞",   color: "#ec4899" },
    { type: "video", icon: "▶",   color: "#f59e0b" },
  ];

  const totalLessons = course.units.flatMap(u => u.chapters.flatMap(c => c.lessons)).length;

  return (
    <div className="h-screen flex flex-col overflow-scroll">
      {/* Stats bar */}
      <div className="flex gap-4 px-5 py-3 border-b border-stone-100 shrink-0">
        {[
          { n: course.units.length, l: "Units" },
          { n: course.units.reduce((a, u) => a + u.chapters.length, 0), l: "Chapters" },
          { n: totalLessons, l: "Lessons" },
        ].map(s => (
          <div key={s.l} className="text-center">
            <div className="text-base font-black text-stone-800">{s.n}</div>
            <div className="text-[10px] text-stone-400 uppercase tracking-wider">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {course.units.map((unit, ui) => (
          <div key={unit._id}>
            {/* Unit row */}
            <div
              className={`flex items-center gap-1 px-4 py-2.5 hover:bg-stone-50 transition-colors cursor-pointer ${openUnits[unit._id] ? "bg-stone-50/60" : ""}`}
              onClick={() => setOpenUnits(s => ({ ...s, [unit._id]: !s[unit._id] }))}
            >
              <span className="text-sm text-black w-3 shrink-0 transition-transform duration-150 inline-block" style={{ transform: openUnits[unit._id] ? "rotate(90deg)" : "none" }}>▸</span>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest shrink-0">U{ui + 1}</span>
              <span className="text-xs font-bold text-stone-700 truncate">{unit.title || <em className="text-stone-300 font-normal">Untitled</em>}</span>
            </div>

            <AnimatePresence>
              {openUnits[unit._id] && unit.chapters.map((ch, ci) => (
                <motion.div key={ch._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
                  {/* Chapter row */}
                  <div
                    className="flex items-center gap-1 pl-9 pr-4 py-2 hover:bg-stone-50 transition-colors cursor-pointer"
                    onClick={() => setOpenChapters(s => ({ ...s, [ch._id]: !s[ch._id] }))}
                  >
                    <span className="text-[10px] text-black w-3 shrink-0 inline-block transition-transform duration-150" style={{ transform: openChapters[ch._id] ? "rotate(90deg)" : "none" }}>▸</span>
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest shrink-0">C{ci + 1}</span>
                    <span className="text-xs text-stone-500 font-semibold truncate">{ch.title || <em className="text-stone-300 font-normal">Untitled</em>}</span>
                  </div>

                  <AnimatePresence>
                    {openChapters[ch._id] && ch.lessons.map((lesson, li) => {
                      const isActive = activeLesson?.unitId === unit._id && activeLesson?.chapterId === ch._id && activeLesson?.lessonIdx === li;
                      const blockSummary = BLOCK_TYPES.map(bt => ({ ...bt, cnt: (lesson.blocks || []).filter(b => b.type === bt.type).length })).filter(bt => bt.cnt > 0);

                      return (
                        <motion.div key={lesson._id || li} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
                          <div
                            onClick={() => onSelectLesson({ unitId: unit._id, chapterId: ch._id, lessonIdx: li })}
                            className={`flex items-center gap-2 pl-16 pr-4 py-2.5 cursor-pointer transition-all border-r-2 ${isActive ? "bg-amber-50 border-amber-400" : "hover:bg-stone-50/80 border-transparent"}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs truncate ${isActive ? "font-bold text-amber-700" : "text-stone-500 font-medium"}`}>
                                {lesson.title || <em className="text-stone-300 font-normal">Untitled Lesson</em>}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {blockSummary.map(bt => (
                                  <span key={bt.type} className="text-[9px] font-bold px-1.5 py-px rounded" style={{ background: bt.color + "15", color: bt.color }}>{bt.icon}{bt.cnt}</span>
                                ))}
                                {lesson.duration && <span className="text-[9px] text-stone-300">{lesson.duration}</span>}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CoursePreview — default export
//
// Props:
//   course   — the course object from your API
//   onEdit   — callback to switch to edit mode (optional)
//   onBack   — callback to go back to course list (optional)
// ════════════════════════════════════════════════════════════════
export default function CoursePreview({ course, onEdit, onBack }) {
  const [activeLesson, setActiveLesson] = useState(null);

  const activeLessonObj = activeLesson
    ? course.units.find(u => u._id === activeLesson.unitId)
        ?.chapters.find(c => c._id === activeLesson.chapterId)
        ?.lessons[activeLesson.lessonIdx]
    : null;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap');*{box-sizing:border-box;}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}`}</style>

      <div className="min-h-screen bg-stone-50 flex flex-col">

        {/* ── Top bar ── */}
        <header className="bg-white border-b border-stone-100 px-6 py-3 flex items-center gap-4 shrink-0 z-10 sticky top-0">
          {onBack && (
            <>
              <button onClick={onBack} className="flex items-center gap-2 text-stone-400 hover:text-stone-700 transition-colors text-sm font-semibold group">
                <span className="group-hover:-translate-x-0.5 transition-transform">←</span> My Courses
              </button>
              <span className="text-stone-200">|</span>
            </>
          )}
          <span className="text-sm font-bold text-stone-700 truncate flex-1">{course.title}</span>

          {/* 👁 Preview badge */}
          <span className="px-3 py-1 rounded-lg bg-stone-100 text-stone-400 text-xs font-bold">👁 Preview</span>

          {onEdit && (
            <button
              onClick={onEdit}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-400 text-stone-900 hover:bg-amber-300 shadow-sm transition-all"
            >
              ✏️ Edit Course
            </button>
          )}
        </header>

        {/* ── Hero banner ── */}
        <div className={`relative bg-gradient-to-br ${course.backgroundColor} px-8 pt-8 pb-7 shrink-0 overflow-hidden`}>
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10" />
          <div className="absolute bottom-0 right-24 w-24 h-24 rounded-full bg-white/8" />
          <div className="absolute top-5 right-8 w-12 h-12 rounded-full bg-white/10" />
          <div className="max-w-4xl">
            {course.subjectTag && <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest mb-1.5">{course.subjectTag}</p>}
            <h1 className="text-white font-black text-3xl leading-tight mb-2" style={{ fontFamily: "Georgia,serif" }}>{course.title}</h1>
            <p className="text-white/75 text-sm max-w-2xl line-clamp-2">{course.description}</p>
            <div className="flex gap-5 mt-4 text-white/80 text-xs font-semibold">
              <span>📦 {course.units.length} units</span>
              <span>◆ {course.units.reduce((a, u) => a + u.chapters.length, 0)} chapters</span>
              <span>· {course.units.flatMap(u => u.chapters.flatMap(c => c.lessons)).length} lessons</span>
              <span>👥 {(course.totalStudents || 0).toLocaleString()} students</span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>

          {/* Sidebar */}
          <aside className="w-72 shrink-0 bg-white border-r border-stone-100 overflow-hidden flex flex-col">
            <PreviewSidebar
              course={course}
              activeLesson={activeLesson}
              onSelectLesson={setActiveLesson}
            />
          </aside>

          {/* Main content */}
          <main className="flex-1 h-screen overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeLesson?.unitId}-${activeLesson?.chapterId}-${activeLesson?.lessonIdx}`}
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: .18 }} className="h-full"
              >
                {!activeLesson ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${course.backgroundColor} mb-5 flex items-center justify-center shadow-lg`}>
                      <span className="text-white text-2xl">◈</span>
                    </div>
                    <h2 className="text-xl font-black text-stone-700 mb-2" style={{ fontFamily: "Georgia,serif" }}>Select a lesson to view</h2>
                    <p className="text-stone-400 text-sm max-w-xs leading-relaxed">Browse the course structure on the left and click any lesson.</p>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto px-8 py-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-5 flex-wrap">
                      <span>{course.units.find(u => u._id === activeLesson.unitId)?.title}</span>
                      <span className="text-stone-200">›</span>
                      <span>{course.units.find(u => u._id === activeLesson.unitId)?.chapters.find(c => c._id === activeLesson.chapterId)?.title}</span>
                    </div>

                    {activeLessonObj && (
                      <>
                        <div className="mb-6">
                          {activeLessonObj.duration && (
                            <span className="text-xs text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full mb-3 inline-block">⏱ {activeLessonObj.duration}</span>
                          )}
                          <h2 className="text-3xl font-black text-stone-800 leading-tight" style={{ fontFamily: "Georgia,serif" }}>{activeLessonObj.title}</h2>
                        </div>

                        <div className="space-y-4">
                          {(activeLessonObj.content || []).map((block, bi) => (
                            <motion.div key={block._lid || bi} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: bi * .05 }}>
                              <BlockPreview block={block} />
                            </motion.div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}