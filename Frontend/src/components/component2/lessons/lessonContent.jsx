import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../../api/axios";
import { FiMenu, FiPlay, FiDownload, FiCheckCircle } from "react-icons/fi";
import { AssignmentBlockPreview } from "./AssignmentBlock";
import toast from "react-hot-toast";

function BlockText({ block }) {
  return (
    <div className="text-gray-600 text-base leading-relaxed">
      {block.value.split("\n").map((line, i) => {
        if (line.startsWith("## "))
          return <h3 key={i} className="text-lg font-bold text-slate-800 mt-5 mb-2">{line.slice(3)}</h3>;
        if (line.startsWith("- "))
          return (
            <div key={i} className="flex gap-2 items-start my-0.5">
              <span className="text-blue-400 mt-1.5 text-[10px] shrink-0">●</span>
              <span dangerouslySetInnerHTML={{
                __html: line.slice(2)
                  .replace(/`([^`]+)`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-blue-700'>$1</code>")
                  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              }} />
            </div>
          );
        if (line === "") return <div key={i} className="h-2" />;
        return (
          <p key={i} className="my-1" dangerouslySetInnerHTML={{
            __html: line
              .replace(/`([^`]+)`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-blue-700'>$1</code>")
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          }} />
        );
      })}
    </div>
  );
}

function BlockCode({ block }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1a1a2e]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        {block.filename && <span className="ml-3 text-slate-400 text-[11px] font-mono">{block.filename}</span>}
      </div>
      <pre className="bg-[#0d0d1a] text-emerald-300 font-mono text-sm px-6 py-5 overflow-x-auto leading-relaxed whitespace-pre-wrap">
        {block.value}
      </pre>
    </div>
  );
}

function BlockImage({ block }) {
  return (
    <figure className="h-fit rounded-2xl overflow-hidden border border-slate-100 flex justify-center items-center flex-col">
      {block.imageURL && (
        <img src={block.imageURL.toString()} alt={block.caption || ""} className="w-fit max-h-100 object-cover"
          onError={(e) => (e.target.style.display = "none")} />
      )}
      {block.caption && (
        <figcaption className="w-full text-center text-xs text-slate-600 italic py-2 px-4 bg-slate-100">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function VideoBlock({ block }) {
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

  if (block?.videoURL) {
    return (
      <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl mb-10 border-4 border-white">
        <iframe src={getEmbedURL(block.videoURL)} className="w-full h-full" allowFullScreen title={block.caption || "Lesson video"} />
      </div>
    );

  }
  return (
    <div className="aspect-video bg-slate-900 rounded-3xl shadow-2xl mb-10 flex items-center justify-center relative overflow-hidden group cursor-pointer border-4 border-white shadow-slate-200">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 transition-all group-hover:scale-110 group-hover:bg-white/20 z-10">
        <FiPlay size={32} className="text-white ml-1" />
      </div>
    </div>
  );
}

export function renderBlock(block, idx) {
  const key = block._id || block._lid || idx;
  const mode = block.mode || block.type;
  if (mode === "text") return <BlockText key={key} block={block} />;
  if (mode === "code") return <BlockCode key={key} block={block} />;
  if (mode === "images") return <BlockImage key={key} block={block} />;
  if (mode === "video") return <VideoBlock key={key} block={block} />;
  if (mode === "assignment") return <AssignmentBlockPreview key={key} block={block} />;

  return null;
}

// ── LessonContent ────────────────────────────────────────────────────────────

const LessonContent = ({ lesson, course, fetchCompletedLessons, setCompletedLessons, allLessons = [], completedLessons = [], onNext, isSidebarOpen, onOpenSidebar }) => {
  const isDone = completedLessons.map(String).includes(String(lesson?._id));
  const statusLabel = isDone ? "Completed" : "In Progress";
  const sortedContent = [...(lesson?.content ?? [])].sort((a, b) => a.order - b.order);
  const lessonIdx = allLessons.findIndex((l) => l._id === lesson?._id);
  const hasNext = lessonIdx >= 0 && lessonIdx < allLessons.length - 1;

  const handleComplete = async () => {
    if (!lesson?._id) return;
    const lessonIdStr = lesson._id.toString();
    const alreadyDone = completedLessons.map(String).includes(lessonIdStr);

    const updatedLessons = alreadyDone
      ? completedLessons.filter((id) => id.toString() !== lessonIdStr)
      : [...completedLessons, lessonIdStr];

    setCompletedLessons(updatedLessons);
    try {
      let res;
      const lessons =
        course.units
          ?.flatMap((u) => u.chapters)
          ?.flatMap((c) => c.lessons) ?? [];

      const progress = lessons.length === 0 ? 0 : Math.round((updatedLessons.length / lessons.length) * 100);

      // ✅ API toggle
      if (alreadyDone) {
        res = await API.post(`/course/remove-lesson`, {
          courseId: course._id,
          lessonId: lesson._id,
          progress: progress
        });
      } else {
        res = await API.post(`/course/complete-lesson`, {
          courseId: course._id,
          lessonId: lesson._id,
          progress: progress
        });
      }

      await fetchCompletedLessons();
      toast.success(res.data.message);
      console.log(progress);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong");
      setCompletedLessons(completedLessons);
    }
  };

  useEffect(() => {
    fetchCompletedLessons();
  }, [lesson]);


  return (
    <main className="flex-1 flex flex-col h-full bg-white relative min-w-0">

      {/* Top bar */}
      <header className="h-16 border-b flex items-center justify-between px-6 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          {!isSidebarOpen && (
            <button onClick={onOpenSidebar} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <FiMenu size={20} />
            </button>
          )}
          <h2 className="hidden md:block font-bold text-sm text-gray-400 truncate max-w-xs">
            {course?.title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition border
              ${hasNext
                ? "text-blue-600 hover:bg-blue-50 border-transparent hover:border-blue-100 cursor-pointer"
                : "text-gray-300 border-transparent cursor-not-allowed"}`}
          >
            Next Lesson <FiCheckCircle size={16} />
          </button>
        </div>
      </header>

      {/* Body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={lesson?._id ?? "empty"}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex-1 overflow-y-auto p-6 md:p-12"
        >
          <div className="max-w-4xl mx-auto">
            {!lesson ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                  <FiPlay size={32} className="text-slate-300 ml-1" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-700 mb-2">Select a lesson to begin</h2>
                <p className="text-gray-400 text-sm max-w-xs">Choose any lesson from the sidebar to start learning.</p>
              </div>
            ) : (
              <>
                {/* 2 — Title + meta */}
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 border-b border-gray-100 pb-8 gap-6">
                  <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{lesson.title}</h1>
                    <div className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase text-[10px] font-bold">
                        {statusLabel}
                      </span>
                      {lesson.duration && <><span>•</span><span>{lesson.duration}</span></>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button title="Download Resources" className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition active:scale-95">
                      <FiDownload size={20} />
                    </button>

                    <button
                      onClick={handleComplete}
                      title="Mark Complete"
                      className={`p-3 rounded-xl transition active:scale-95 ${isDone ?
                        "text-green-600 bg-green-100 hover:text-red-400 hover:bg-red-50" :
                        "text-gray-600 bg-gray-100 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                    >
                      <FiCheckCircle size={20} />
                    </button>
                  </div>
                </div>

                {/* 3 — Content blocks */}
                <div className="space-y-4">
                  {sortedContent.length > 0
                    ? sortedContent.map((block, i) => (
                      <motion.div
                        key={block._id || block._lid || i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        {renderBlock(block, i)}
                      </motion.div>
                    ))
                    : (
                      <>
                        <p className="text-gray-600 text-lg leading-relaxed mb-6">
                          Welcome to <strong>{lesson.title}</strong>. In this session, we dive deep into the
                          implementation details. Ensure you have your development environment ready before
                          proceeding with the code samples provided below the video.
                        </p>
                      </>
                    )
                  }
                </div>
              </>
            )}

          </div>
        </motion.div>
      </AnimatePresence>

    </main>
  );
};

export default LessonContent;