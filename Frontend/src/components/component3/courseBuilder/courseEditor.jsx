import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AssignmentBlockEditor } from "../Assignment/AssignmentBlock";

// ════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════
const BLOCK_TYPES = [
  { type: "text", label: "Text", icon: "¶", color: "#3b82f6" },
  { type: "code", label: "Code", icon: "</>", color: "#10b981" },
  { type: "images", label: "Image", icon: "⊞", color: "#ec4899" },
  { type: "video", label: "Video", icon: "▶", color: "#f59e0b" },
  { type: "assignment", label: "Assignment", icon: "◈", color: "#8b5cf6" },
];

const GRADIENTS = [
  "from-sky-500 to-cyan-400",
  "from-teal-500 to-emerald-400",
  "from-blue-500 to-sky-400",
  "from-indigo-500 to-blue-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-yellow-400",
  "from-slate-600 to-slate-400",
  "from-orange-500 to-rose-400"
];

// ════════════════════════════════════════════════════════════════
// Factories — match MongoDB schema exactly
// ════════════════════════════════════════════════════════════════
const uid = () => Math.random().toString(36).slice(2, 9);

const makeContent = (type, order) => ({
  _lid: uid(),
  order,
  type,
  title: "",
  value: "",
  filename: "",
  videoURL: "",
  imageURL: "",
  caption: "",
  assignmentId: null,
});

const makeLesson = (order) => ({
  _lid: uid(),
  order,
  title: "",
  type: "text",
  isCompleted: false,
  duration: "",
  content: [],
});

const makeChapter = (order) => ({
  _lid: uid(),
  order,
  title: "",
  lessons: [],
});

const makeUnit = (order) => ({
  _lid: uid(),
  order,
  title: "",
  description: "",
  chapters: [],
});

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════
const iCls =
  "w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 placeholder-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all";

function Tag({ children, color }) {
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: color + "18", color }}
    >
      {children}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════
// Block / Content Editor
// ════════════════════════════════════════════════════════════════
function BlockEditor({ block, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const meta = BLOCK_TYPES.find((b) => b.type === block.type) || BLOCK_TYPES[0];

  return (
    <div
      className="group rounded-xl border overflow-hidden hover:shadow-sm transition-shadow"
      style={{ borderColor: meta.color + "44" }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ background: meta.color + "0d" }}
      >
        <Tag color={meta.color}>
          {meta.icon} {meta.label}
        </Tag>
        {/* Order badge */}
        <span className="text-[10px] text-stone-400 font-mono ml-1">#{block.order}</span>
        <div className="flex items-center gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="w-5 h-5 rounded bg-white/80 text-stone-400 hover:text-stone-700 disabled:opacity-20 flex items-center justify-center text-[11px] border border-stone-100"
          >↑</button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="w-5 h-5 rounded bg-white/80 text-stone-400 hover:text-stone-700 disabled:opacity-20 flex items-center justify-center text-[11px] border border-stone-100"
          >↓</button>
          <button
            onClick={onRemove}
            className="w-5 h-5 rounded bg-white/80 text-red-300 hover:text-red-500 flex items-center justify-center text-sm border border-red-100"
          >×</button>
        </div>
      </div>

      <div className="bg-white">
        {/* Title field for all blocks */}
        <div className="px-3 pt-2.5">
          <input
            className={iCls + " text-xs"}
            placeholder="Block title (optional)"
            value={block.title || ""}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>

        {block.type === "text" && (
          <textarea
            className="w-full text-stone-700 text-sm px-4 py-3 outline-none resize-none min-h-40 placeholder-stone-300 leading-relaxed"
            style={{ fontFamily: "'Lora',Georgia,serif" }}
            placeholder="Write content…"
            value={block.value || ""}
            onChange={(e) => onChange({ value: e.target.value })}
          />
        )}

        {block.type === "code" && (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a2e]">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400/70" />
                <div className="w-2 h-2 rounded-full bg-yellow-400/70" />
                <div className="w-2 h-2 rounded-full bg-green-400/70" />
              </div>
              <input
                className="flex-1 bg-transparent text-slate-500 text-[11px] font-mono outline-none placeholder-slate-700 ml-1"
                placeholder="filename.js"
                value={block.filename || ""}
                onChange={(e) => onChange({ filename: e.target.value })}
              />
            </div>
            <textarea
              className="w-full bg-[#0d0d1a] text-emerald-300 font-mono text-sm px-4 py-3 outline-none resize-none min-h-[120px] leading-relaxed placeholder-slate-700"
              placeholder="// code here…"
              value={block.value || ""}
              onChange={(e) => onChange({ value: e.target.value })}
            />
          </>
        )}

        {block.type === "images" && (
          <div className="p-3 space-y-2">
            <input
              className={iCls}
              placeholder="Image URL  https://…"
              value={block.imageURL || ""}
              onChange={(e) => onChange({ imageURL: e.target.value })}
            />
            <input
              className={iCls}
              placeholder="Caption (optional)"
              value={block.caption || ""}
              onChange={(e) => onChange({ caption: e.target.value })}
            />
            {block.imageURL && (
              <img
                src={block.imageURL}
                alt=""
                className="w-full max-h-40 object-cover rounded-lg border border-stone-100"
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
          </div>
        )}

        {block.type === "video" && (
          <div className="p-3 space-y-2">
            <input
              className={iCls}
              placeholder="Video URL  https://…"
              value={block.videoURL || ""}
              onChange={(e) => onChange({ videoURL: e.target.value })}
            />
            <input
              className={iCls}
              placeholder="Caption (optional)"
              value={block.caption || ""}
              onChange={(e) => onChange({ caption: e.target.value })}
            />
          </div>
        )}

        {block.type === "assignment" && (
          <AssignmentBlockEditor block={block} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Lesson Editor
// ════════════════════════════════════════════════════════════════
function LessonEditor({ lesson, onChange }) {
  const content = lesson?.content || [];

  const addBlock = (type) => {
    const newBlock = makeContent(type, content.length + 1);
    onChange({ content: [...content, newBlock] });
  };

  const updateBlock = (bi, v) =>
    onChange({ content: content.map((b, j) => (j === bi ? { ...b, ...v } : b)) });

  const removeBlock = (bi) => {
    onChange({
      content: content
        .filter((_, j) => j !== bi)
        .map((b, j) => ({ ...b, order: j + 1 })),
    });
  };

  const moveBlock = (bi, d) => {
    const arr = [...content];
    const to = bi + d;
    if (to < 0 || to >= arr.length) return;
    [arr[bi], arr[to]] = [arr[to], arr[bi]];
    onChange({ content: arr.map((b, j) => ({ ...b, order: j + 1 })) });
  };

  return (
    <div className="h-[80vh] relative overflow-scroll pr-16">
      
      {/* Lesson meta */}
      <div className="grid grid-cols-3 gap-3 mb-5 pb-5 border-b border-stone-100">
        <input
          className={iCls + " col-span-2"}
          placeholder="Lesson title *"
          value={lesson.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <input
          className={iCls}
          placeholder="Duration  e.g. 8 min"
          value={lesson.duration || ""}
          onChange={(e) => onChange({ duration: e.target.value })}
        />
      </div>
      <div className="bg-purple-100 border border-purple-300 rounded-xl p-4 text-sm text-stone-700 my-4">
        <h3 className="font-semibold text-stone-800">Add Content by Selecting Add Blocks</h3>
      </div>
      {/* Content blocks */}
      <div className="space-y-4">
        {content.length === 0 && (
          <div className="border-2 border-dashed border-stone-100 rounded-2xl py-12 text-center">
            <p className="text-stone-300 text-xs">No blocks yet — add one below.</p>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {content.map((block, bi) => (
            <motion.div
              key={block._lid || bi}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
            >
              <BlockEditor
                block={block}
                onChange={(v) => updateBlock(bi, v)}
                onRemove={() => removeBlock(bi)}
                onMoveUp={() => moveBlock(bi, -1)}
                onMoveDown={() => moveBlock(bi, 1)}
                isFirst={bi === 0}
                isLast={bi === content.length - 1}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add block toolbar */}
      <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-stone-100 mt-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-300 mr-1 shrink-0">
          Add block
        </span>
        {BLOCK_TYPES.map((bt) => (
          <button
            key={bt.type}
            onClick={() => addBlock(bt.type)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all hover:scale-105 active:scale-95"
            style={{
              borderColor: bt.color + "33",
              color: bt.color,
              background: bt.color + "0d",
            }}
          >
            {bt.icon} {bt.label}
          </button>
        ))}
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-stone-700 my-4">
        <h3 className="font-semibold text-stone-800">You can create only one assignment per Lesson</h3>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-stone-700 my-4">
        <h3 className="font-bold text-stone-800 mb-2">How to Write in TEXT block</h3>

        <p className="mb-2">
          Use simple symbols to format your notes.
        </p>

        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>##</strong> at the beginning of a line creates a <strong>heading</strong>.
          </li>
          <li>
            <strong>-</strong> at the beginning of a line creates a <strong>bullet point</strong>.
          </li>
        </ul>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Sidebar Tree
// ════════════════════════════════════════════════════════════════
function EditorSidebar({ course, activeLesson, onSelectLesson, onCourseChange }) {
  const [openUnits, setOpenUnits] = useState(
    () => ({ [course.units[0]?._lid]: true })
  );
  const [openChapters, setOpenChapters] = useState(
    () => ({ [course.units[0]?.chapters[0]?._lid]: true })
  );

  // ── Unit ops ──
  const editUnit = (ulid, v) =>
    onCourseChange({
      units: course.units.map((u) => (u._lid === ulid ? { ...u, ...v } : u)),
    });

  const deleteUnit = (ulid) => {
    onCourseChange({ units: course.units.filter((u) => u._lid !== ulid) });
    if (activeLesson?.unitLid === ulid) onSelectLesson(null);
  };

  const addUnit = () => {
    const u = makeUnit(course.units.length + 1);
    onCourseChange({ units: [...course.units, u] });
    setOpenUnits((s) => ({ ...s, [u._lid]: true }));
  };

  // ── Chapter ops ──
  const editChapter = (ulid, clid, v) =>
    onCourseChange({
      units: course.units.map((u) =>
        u._lid === ulid
          ? {
            ...u,
            chapters: u.chapters.map((c) =>
              c._lid === clid ? { ...c, ...v } : c
            ),
          }
          : u
      ),
    });

  const deleteChapter = (ulid, clid) => {
    onCourseChange({
      units: course.units.map((u) =>
        u._lid === ulid
          ? { ...u, chapters: u.chapters.filter((c) => c._lid !== clid) }
          : u
      ),
    });
    if (activeLesson?.chapterLid === clid) onSelectLesson(null);
  };

  const addChapter = (ulid) => {
    const unit = course.units.find((u) => u._lid === ulid);
    const ch = makeChapter(unit.chapters.length + 1);
    onCourseChange({
      units: course.units.map((u) =>
        u._lid === ulid ? { ...u, chapters: [...u.chapters, ch] } : u
      ),
    });
    setOpenChapters((s) => ({ ...s, [ch._lid]: true }));
  };

  // ── Lesson ops ──
  const addLesson = (ulid, clid) => {
    const unit = course.units.find((u) => u._lid === ulid);
    const chapter = unit?.chapters.find((c) => c._lid === clid);
    const l = makeLesson((chapter?.lessons?.length ?? 0) + 1);
    const newLessonIdx = chapter?.lessons?.length ?? 0;

    onCourseChange({
      units: course.units.map((u) =>
        u._lid === ulid
          ? {
            ...u,
            chapters: u.chapters.map((c) =>
              c._lid === clid
                ? { ...c, lessons: [...c.lessons, l] }
                : c
            ),
          }
          : u
      ),
    });
    onSelectLesson({ unitLid: ulid, chapterLid: clid, lessonIdx: newLessonIdx });
  };

  const deleteLesson = (ulid, clid, li) => {
    onCourseChange({
      units: course.units.map((u) =>
        u._lid === ulid
          ? {
            ...u,
            chapters: u.chapters.map((c) =>
              c._lid === clid
                ? {
                  ...c,
                  lessons: c.lessons
                    .filter((_, j) => j !== li)
                    .map((l, j) => ({ ...l, order: j + 1 })),
                }
                : c
            ),
          }
          : u
      ),
    });
    if (
      activeLesson?.unitLid === ulid &&
      activeLesson?.chapterLid === clid &&
      activeLesson?.lessonIdx === li
    )
      onSelectLesson(null);
  };

  return (
    <div className="flex flex-col h-[94vh] overflow-scroll">
      <div className="px-4 py-3 border-b border-stone-100">
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
          Course Structure
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <AnimatePresence>
          {course.units.map((unit, ui) => (
            <motion.div
              key={unit._lid}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
            >
              {/* Unit header */}
              <div
                className={`flex items-center gap-1 px-4 py-2.5 group hover:bg-stone-50 transition-colors ${openUnits[unit._lid] ? "bg-stone-50/60" : ""
                  }`}
              >
                <button
                  onClick={() =>
                    setOpenUnits((s) => ({ ...s, [unit._lid]: !s[unit._lid] }))
                  }
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <span
                    className="text-2xs text-black w-3 shrink-0 inline-block transition-transform duration-150"
                    style={{ transform: openUnits[unit._lid] ? "rotate(90deg)" : "none" }}
                  >▸</span>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest shrink-0">
                    U{ui + 1}
                  </span>
                  <span className="text-xs font-bold text-stone-700 truncate">
                    {unit.title || <em className="text-stone-300 font-normal">Untitled</em>}
                  </span>
                </button>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    title="Add chapter"
                    onClick={() => addChapter(unit._lid)}
                    className="w-5 h-5 rounded text-stone-800 hover:text-violet-600 hover:bg-violet-50 flex items-center justify-center text-xs transition-all"
                  >+</button>
                  <button
                    title="Delete unit"
                    onClick={() => deleteUnit(unit._lid)}
                    className="w-5 h-5 rounded text-stone-800 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-sm transition-all"
                  >×</button>
                </div>
              </div>

              {openUnits[unit._lid] && (
                <div className="px-4 pb-2 space-y-1.5 bg-amber-50/30">
                  <input
                    className={iCls + " text-[12px]"}
                    placeholder="Unit title *"
                    value={unit.title}
                    onChange={(e) => editUnit(unit._lid, { title: e.target.value })}
                  />
                  <textarea
                    className={iCls + " text-[12px] resize-none min-h-[40px]"}
                    placeholder="Description (optional)"
                    value={unit.description || ""}
                    onChange={(e) => editUnit(unit._lid, { description: e.target.value })}
                  />
                </div>
              )}

              <AnimatePresence>
                {openUnits[unit._lid] &&
                  unit.chapters.map((ch, ci) => (
                    <motion.div
                      key={ch._lid}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {/* Chapter header */}
                      <div className="flex items-center gap-1 pl-9 pr-4 py-2 group/ch hover:bg-stone-50 transition-colors">
                        <button
                          onClick={() =>
                            setOpenChapters((s) => ({ ...s, [ch._lid]: !s[ch._lid] }))
                          }
                          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                        >
                          <span
                            className="text-2xs text-black w-3 shrink-0 inline-block transition-transform duration-150"
                            style={{ transform: openChapters[ch._lid] ? "rotate(90deg)" : "none" }}
                          >▸</span>
                          <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest shrink-0">
                            C{ci + 1}
                          </span>
                          <span className="text-xs text-stone-500 font-semibold truncate">
                            {ch.title || <em className="text-stone-300 font-normal">Untitled</em>}
                          </span>
                        </button>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/ch:opacity-100 transition-opacity shrink-0">
                          <button
                            title="Add lesson"
                            onClick={() => addLesson(unit._lid, ch._lid)}
                            className="w-5 h-5 rounded text-stone-400 hover:text-amber-600 hover:bg-amber-50 flex items-center justify-center text-xs transition-all"
                          >+</button>
                          <button
                            title="Delete chapter"
                            onClick={() => deleteChapter(unit._lid, ch._lid)}
                            className="w-5 h-5 rounded text-stone-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-sm transition-all"
                          >×</button>
                        </div>
                      </div>

                      {openChapters[ch._lid] && (
                        <div className="pl-12 pr-4 pb-1.5">
                          <input
                            className={iCls + " text-[12px]"}
                            placeholder="Chapter title *"
                            value={ch.title}
                            onChange={(e) => editChapter(unit._lid, ch._lid, { title: e.target.value })}
                          />
                        </div>
                      )}

                      <AnimatePresence>
                        {openChapters[ch._lid] &&
                          ch.lessons.map((lesson, li) => {
                            const isActive =
                              activeLesson?.unitLid === unit._lid &&
                              activeLesson?.chapterLid === ch._lid &&
                              activeLesson?.lessonIdx === li;

                            const contentSummary = BLOCK_TYPES.map((bt) => ({
                              ...bt,
                              cnt: (lesson.content || []).filter(
                                (b) => b.type === bt.type
                              ).length,
                            })).filter((bt) => bt.cnt > 0);

                            return (
                              <motion.div
                                key={lesson._lid || li}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <div
                                  onClick={() =>
                                    onSelectLesson({
                                      unitLid: unit._lid,
                                      chapterLid: ch._lid,
                                      lessonIdx: li,
                                    })
                                  }
                                  className={`flex items-center gap-2 pl-16 pr-4 py-2.5 cursor-pointer transition-all border-r-2 group/l ${isActive
                                      ? "bg-amber-50 border-amber-400"
                                      : "hover:bg-stone-50/80 border-transparent"
                                    }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`text-xs truncate ${isActive
                                          ? "font-bold text-amber-700"
                                          : "text-stone-500 font-medium"
                                        }`}
                                    >
                                      {lesson.title || (
                                        <em className="text-stone-300 font-normal">
                                          Untitled Lesson
                                        </em>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {contentSummary.map((bt) => (
                                        <span
                                          key={bt.type}
                                          className="text-[9px] font-bold px-1.5 py-px rounded"
                                          style={{
                                            background: bt.color + "15",
                                            color: bt.color,
                                          }}
                                        >
                                          {bt.icon}
                                          {bt.cnt}
                                        </span>
                                      ))}
                                      {lesson.duration && (
                                        <span className="text-[9px] text-stone-300">
                                          {lesson.duration}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteLesson(unit._lid, ch._lid, li);
                                    }}
                                    className="opacity-0 group-hover/l:opacity-100 text-red-300 hover:text-red-500 text-base leading-none shrink-0"
                                  >
                                    ×
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                      </AnimatePresence>

                      {openChapters[ch._lid] && (
                        <button
                          onClick={() => addLesson(unit._lid, ch._lid)}
                          className="w-full text-left pl-16 pr-4 py-1.5 text-[11px] text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          + Add lesson
                        </button>
                      )}
                    </motion.div>
                  ))}
              </AnimatePresence>

              {openUnits[unit._lid] && (
                <button
                  onClick={() => addChapter(unit._lid)}
                  className="w-full text-left pl-10 pr-4 py-1.5 text-[11px] text-stone-400 hover:text-violet-600 hover:bg-violet-50 transition-colors mb-1"
                >
                  + Add chapter
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={addUnit}
          className="w-full text-left px-4 py-3 text-xs font-bold text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors border-t border-stone-100 mt-1"
        >
          + Add unit
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CourseEditor — default export
//
// Props:
//   course    — MongoDB course object
//   onSave    — async (updatedCourse) => void
//   onPreview — () => void  (optional)
//   onBack    — () => void  (optional)
// ════════════════════════════════════════════════════════════════
export default function CourseEditor({ course: initialCourse, onSave, onPreview, onBack }) {
  const [course, setCourse] = useState(() => {
    // Inject _lid keys for local tracking (not saved to DB)
    const c = JSON.parse(JSON.stringify(initialCourse));
    c.units = (c.units || []).map((u) => ({
      ...u,
      _lid: u._lid || uid(),
      chapters: (u.chapters || []).map((ch) => ({
        ...ch,
        _lid: ch._lid || uid(),
        lessons: (ch.lessons || []).map((l) => ({
          ...l,
          _lid: l._lid || uid(),
          content: (l.content || []).map((b) => ({ ...b, _lid: b._lid || uid() })),
        })),
      })),
    }));
    return c;
  });

  const [activeLesson, setActiveLesson] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCourseChange = useCallback(
    (v) => setCourse((c) => ({ ...c, ...v })),
    []
  );

  const activeLessonObj = activeLesson
    ? course.units
      .find((u) => u._lid === activeLesson.unitLid)
      ?.chapters.find((c) => c._lid === activeLesson.chapterLid)
      ?.lessons[activeLesson.lessonIdx]
    : null;

  const handleLessonChange = (v) => {
    if (!activeLesson) return;
    setCourse((c) => ({
      ...c,
      units: c.units.map((u) =>
        u._lid !== activeLesson.unitLid
          ? u
          : {
            ...u,
            chapters: u.chapters.map((ch) =>
              ch._lid !== activeLesson.chapterLid
                ? ch
                : {
                  ...ch,
                  lessons: ch.lessons.map((l, j) =>
                    j === activeLesson.lessonIdx ? { ...l, ...v } : l
                  ),
                }
            ),
          }
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Strip _lid keys before sending to API
      const toSave = JSON.parse(JSON.stringify(course));
      const strip = (obj) => {
        delete obj._lid;
        return obj;
      };
      toSave.units = toSave.units.map((u) => {
        strip(u);
        u.chapters = u.chapters.map((ch) => {
          strip(ch);
          ch.lessons = ch.lessons.map((l) => {
            strip(l);
            l.content = l.content.map(strip);
            return l;
          });
          return ch;
        });
        return u;
      });

      await onSave?.(toSave);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Save failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const activeUnit = course.units.find((u) => u._lid === activeLesson?.unitLid);
  const activeChapter = activeUnit?.chapters.find(
    (c) => c._lid === activeLesson?.chapterLid
  );

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
          <span className="text-sm font-bold text-stone-700 truncate flex-1">{course.title || "Untitled Course"}</span>

          <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-500 text-xs font-bold border border-amber-100">✏️ Editing</span>

          {onPreview && (
            <button onClick={onPreview} className="px-4 py-2 rounded-xl text-sm font-bold bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all">
              👁 Preview
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${saved ? "bg-emerald-400 text-white" : saving ? "bg-stone-200 text-stone-400" : "bg-amber-400 text-stone-900 hover:bg-amber-300 shadow-sm"}`}
          >
            {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Changes"}
          </button>
        </header>


        <div className={`relative bg-linear-to-br ${course.backgroundColor} px-8 pt-8 pb-7 shrink-0 overflow-hidden`}>
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10" />
          <div className="absolute bottom-0 right-24 w-24 h-24 rounded-full bg-white/8" />
          <div className="absolute top-5 right-8 w-12 h-12 rounded-full bg-white/10" />
          <div className="max-w-4xl">
            <h1 className="text-white font-black text-3xl leading-tight mb-2" style={{ fontFamily: "Georgia,serif" }}>{course.title}</h1>
            <p className="text-white/75 text-sm max-w-2xl line-clamp-2">{course.description}</p>

            <span className="text-white/90 text-sm mt-4">SubjectTag:</span> {"  "}
            <input
              className="w-40 bg-black/20 backdrop-blur border border-white/20 rounded-lg px-3 py-1.5 text-white/80 placeholder-white/40 text-xs font-bold outline-none focus:bg-black/30 transition-all mt-4"
              placeholder="Tag e.g. Engineering"
              value={course.subjectTag || ""}
              onChange={(e) => handleCourseChange({ subjectTag: e.target.value })}
            />

            <div className="flex gap-3 items-center mt-4">
              <span className="text-white text-xs font-semibold">Theme:</span>
              {GRADIENTS.map((g) => (
                <button
                  key={g}
                  onClick={() => handleCourseChange({ backgroundColor: g })}
                  className={`w-6 h-6 rounded-full bg-linear-to-br ${g} border-2 transition-all`}
                  style={{
                    borderColor:
                      course.backgroundColor === g ? "white" : "rgba(255,255,255,0.25)",
                    transform: course.backgroundColor === g ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>



        {/* ── Body ── */}
        <div
          className="flex flex-1 overflow-hidden"
          style={{ height: "calc(100vh - 180px)" }}
        >
          {/* Sidebar */}
          <aside className="w-72 shrink-0 bg-white border-r border-stone-100 overflow-hidden flex flex-col">
            <EditorSidebar
              course={course}
              activeLesson={activeLesson}
              onSelectLesson={setActiveLesson}
              onCourseChange={handleCourseChange}
            />
          </aside>

          {/* Main */}
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeLesson?.unitLid}-${activeLesson?.chapterLid}-${activeLesson?.lessonIdx}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                {!activeLesson ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${course.backgroundColor || "from-stone-400 to-stone-500"} mb-5 flex items-center justify-center shadow-lg`}>
                      <span className="text-white text-2xl">✏️</span>
                    </div>
                    <h2 className="text-xl font-black text-stone-700 mb-2" style={{ fontFamily: "Georgia,serif" }}>Select a lesson to edit</h2>
                    <p className="text-stone-400 text-sm max-w-xs leading-relaxed">
                      Choose a lesson from the sidebar, or use the + buttons to add new content.
                    </p>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto px-8 py-8">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-5 flex-wrap">
                      <span>{activeUnit?.title}</span>
                      <span className="text-stone-200">›</span>
                      <span>{activeChapter?.title}</span>
                    </div>

                    {activeLessonObj && (
                      <LessonEditor
                        lesson={activeLessonObj}
                        onChange={handleLessonChange}
                      />
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