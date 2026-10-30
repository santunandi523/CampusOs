import StatCard from "./Statcard";
import CourseCard from "../courses/CourseCard";
import { motion } from "framer-motion";
import AuthContext from "../../../context/authContext";
import { useContext, useState, useEffect } from "react";
import API from "../../../api/axios";

function DashboardPage({ onOpen, userName }) {
  const { allCourses } = useContext(AuthContext);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalAssignments, setTotalAssignments] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [studentsRes, assignmentsRes] = await Promise.all([
          API.get("/students"),
          API.get("/assignments/my")
        ]);
        setTotalStudents(studentsRes.data?.length || 0);
        setTotalAssignments(assignmentsRes.data?.assignments?.length || 0);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-7"
      >
        <h2 className="text-2xl font-black text-slate-800" style={{ fontFamily: "'Georgia', serif" }}>
          Good morning, {userName} 👋
        </h2>
        <p className="text-sm text-gray-400 mt-1.5">Here's your teaching overview for today.</p>
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Active Courses" value={allCourses?.length || 0} />
        <StatCard label="Assignments" value={totalAssignments} />  
      </div>

      <div className="bg-white rounded-2xl p-6 shadow">
        <div className="flex justify-between mb-5">
          <h3 className="font-black text-slate-800">My Courses</h3>
          <button
            onClick={onOpen}
            className="bg-linear-to-r from-sky-500 to-teal-400 text-white px-4 py-2 rounded-xl"
          >
            + Add
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allCourses.map((c, i) => ( 
            <CourseCard key={c._id} course={c} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
