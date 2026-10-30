import { useState, useMemo, useContext, useEffect } from "react";
import AuthContext from "../../../context/authContext";
import API from "../../../api/axios";
import { HiOutlineUsers, HiOutlineAcademicCap, HiOutlineSearch, HiOutlineChevronDown } from "react-icons/hi";

const COURSE_COLORS = ["#1e4070", "#2a5494", "#3a6fba", "#6094d0"];

const AVATAR_SHADES = ["#0f2040", "#163058", "#1e4070", "#2a5494", "#3a6fba"];
function avatarBg(name) {
  return AVATAR_SHADES[name.charCodeAt(0) % AVATAR_SHADES.length];
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-blue-100 rounded-xl p-4">
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-blue-800 text-lg">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-medium text-blue-400">{label}</p>
        <p className="text-xl font-medium text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-blue-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CoursePill({ course, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all"
      style={
        active
          ? { background: course ? course.color : "#0f2040", borderColor: course ? course.color : "#0f2040", color: "#fff" }
          : { background: "#fff", borderColor: "#b8cfe8", color: "#5a7a9e" }
      }
    >
      {course && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: course.color }} />}
      {course ? course.name : "All Courses"}
      <span className="text-[10px] opacity-60">{count}</span>
    </button>
  );
}

function StudentCard({ student, course }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-blue-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-medium shrink-0"
        style={{ background: avatarBg(student.name) }}
      >
        {student.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{student.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: course?.color ?? "#1e4070" }} />
          <span className="text-xs text-blue-400 truncate">{course?.title ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}

export default function MyStudents() {
  const { allCourses } = useContext(AuthContext);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await API.get("/students");
        setStudents(res.data);
      } catch (error) {
        console.error(error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [allCourses]);

  const courseMap = useMemo(
    () => Object.fromEntries(
      (allCourses ?? []).map((c, i) => [
        String(c._id),
        { ...c, color: COURSE_COLORS[i % COURSE_COLORS.length] },
      ])
    ),
    [allCourses]
  );

  const courseCounts = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      const cid = String(s.courseId);
      counts[cid] = (counts[cid] ?? 0) + 1;
    });
    return counts;
  }, [students]);

  const filtered = useMemo(() => {
    let list = students.slice();
    if (selectedCourse !== "all")
      list = list.filter((s) => String(s.courseId) === selectedCourse);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (sortBy === "course")
      list = [...list].sort((a, b) => String(a.courseId).localeCompare(String(b.courseId)));
    else
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [students, search, selectedCourse, sortBy]);

  const statCards = [
    {
      label: "Total Enrolled",
      value: students.length,
      sub: "across all courses",
      icon: <HiOutlineUsers />,
    },
    ...(allCourses ?? []).slice(0, 3).map((c) => ({
      label: c.title,
      value: courseCounts[String(c._id)] ?? 0,
      sub: "students",
      icon: <HiOutlineAcademicCap />,
    })),
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-blue-50/60 px-6 py-7 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 text-2xl font-medium tracking-tight">My Students</h1>
        <p className="text-blue-400 text-sm mt-0.5">
          Track enrollment and engagement across your courses.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <StatCard key={i} icon={s.icon} label={s.label} value={s.value} sub={s.sub} />
        ))}
      </div>

      {/* Course Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <CoursePill
          course={null}
          active={selectedCourse === "all"}
          count={students.length}
          onClick={() => setSelectedCourse("all")}
        />
        {(allCourses ?? []).map((c, i) => (
          <CoursePill
            key={String(c._id)}
            course={{ id: String(c._id), name: c.title, color: COURSE_COLORS[i % COURSE_COLORS.length] }}
            active={selectedCourse === String(c._id)}
            count={courseCounts[String(c._id)] ?? 0}
            onClick={() => setSelectedCourse(String(c._id))}
          />
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            className="w-full pl-8 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-sm text-slate-800 placeholder-blue-300 focus:outline-none focus:border-blue-400 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-white border border-blue-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:border-blue-400 transition-all cursor-pointer"
          >
            <option value="name">Sort: Name</option>
            <option value="course">Sort: Course</option>
          </select>
          <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none text-sm" />
        </div>
        <span className="ml-auto text-blue-300 text-xs font-medium">
          {filtered.length} student{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20 text-blue-300 text-sm">
          Loading students…
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((student) => (
            <StudentCard
              key={String(student.studentId)}
              student={student}
              course={courseMap[String(student.courseId)]}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-blue-200">
          <HiOutlineUsers className="text-4xl mb-3" />
          <p className="text-sm font-medium text-blue-300">No students found</p>
          <p className="text-xs mt-1 text-blue-200">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
}