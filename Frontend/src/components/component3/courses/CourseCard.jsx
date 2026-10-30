import { motion } from "framer-motion";
import { FaTag, FaUsers, FaBook } from "react-icons/fa";
import { IoArrowForward } from "react-icons/io5";
import { Link } from "react-router-dom";

export default function CourseCard({ course, index, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -5, transition: { duration: 0.18 } }}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-sky-100/80 flex flex-col cursor-pointer mb-5"
    >
      {/* Coloured header */}
      <div className={`relative h-34 bg-linear-to-br ${course.backgroundColor} p-4 flex flex-col justify-between overflow-hidden`}>
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-8 w-14 h-14 rounded-full bg-white/8" />

        <h3 className="text-white font-black text-xl relative py-2 z-10 leading-tight" style={{ fontFamily: "'Georgia', serif" }}>
          {course.title}
        </h3>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-2.5">
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
          {course.description || "No description provided."}
        </p>
        {course.subjectTag && (
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold self-start px-2.5 py-1 rounded-full`}>
            <FaTag /> {course.subjectTag}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <FaUsers /> {course.students}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <FaBook /> {course.lessons} lessons
          </span>
        </div>
        <Link to={`/teacherDashboard/my-courses/coursePage/${course._id}`}>
        <button className="flex items-center gap-1.5 text-xs font-bold text-sky-500 hover:text-sky-700 transition-colors" onClick={onClick}>
          View <IoArrowForward />
        </button>
        </Link>
      </div>
    </motion.div>
  );
}
