import { motion } from "framer-motion";
import CourseCard from "./CourseCard";
import { useContext } from "react";
import AuthContext from "../../../context/authContext";


export default function MyCoursesPage({ onOpen }) {

  const { allCourses } = useContext(AuthContext);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-7">
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            My Courses
          </h2>
          <p className="text-sm text-gray-400">
            {allCourses.length} courses this semester
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          onClick={onOpen}
          className="px-5 py-2.5 rounded-xl bg-linear-to-r from-sky-500 to-teal-400 text-white font-bold"
        >
          + Add New Course
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {allCourses.map((course, index) => (
          <CourseCard 
            key={course.id}
            course={course}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
