import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Play, CheckCircle2, ChevronDown, ChevronRight, Download, MessageSquare, ArrowLeft, Clock, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import { Link } from "react-router-dom";


const CourseStructure = ({ courses, setCourses, fetchCourse }) => {
  const [expandedChapters, setExpandedChapters] = useState(["c1"]);
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [completedLesson, setCompletedLessons] = useState([]);
  const [laoding, setLoading] = useState(true);


  const fetchCompletedLessons = async () => {
    if (!courseId) return;
    const res = await API.get(`/course/progress/${courseId}`);
    setCompletedLessons(res.data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchCompletedLessons();
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
    setCourse(courses.courses?.find((item) => item._id.toString() === courseId));
  }, [courseId, courses]);

  const toggleChapter = (id) => {
    setExpandedChapters(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20">
      {!course ? <><p className="h-screen w-full text-5xl font-bold text-slate-600 flex justify-center items-center">Loading....</p></>
      :
      <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-310 mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/studentDashboard" className="flex items-center gap-2 text-gray-500 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-semibold">Back to Dashboard</span>
          </Link>
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
      </header>

      <main className="max-w-300 mx-auto p-6 mt-4">
        {/* Intro Card */}
        <div className={`h-50 min-h-fit bg-linear-to-br ${course?.backgroundColor} text-white rounded-3xl p-8 mb-10 shadow-2xl relative overflow-hidden`}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/20" />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute bottom-1 right-8 w-16 h-16 rounded-full bg-black/8" />

          <h1 className="text-5xl md:text-4xl font-bold mb-2">{course?.title}</h1>
          <p className="text-slate-200 text-xl leading-relaxed">{course?.description}</p>

          <p className="text-slate-200 text-lg leading-relaxed absolute bottom-4">By {course?.instructorName}</p>
        </div>

        {/* Units / Lessons */}
        <div className="space-y-8">
          {course?.units?.sort((a, b) => a.order - b.order).map((unit, index) => (
            <div key={unit._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/80 border-b p-6">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Unit 0{unit.order}</span>
                <h3 className="text-xl font-bold">{unit.title}</h3>
              </div>

              <div className="p-4 md:p-6 space-y-4">
                {unit?.chapters?.sort((a, b) => a.order - b.order).map((chapter) => (
                  <div key={chapter._id} className="border border-gray-300 rounded-xl overflow-hidden">
                    <button onClick={() => toggleChapter(chapter._id)} className="w-full flex items-center justify-between p-4 bg-white">
                      <span className="font-bold">Chapter {chapter.order}: {chapter.title}</span>
                      {expandedChapters.includes(chapter._id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <AnimatePresence>
                      {expandedChapters.includes(chapter._id) && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-gray-50/30">
                          <div className="p-2 space-y-2">
                            {chapter?.lessons?.sort((a, b) => a.order - b.order).map((lesson) => (
                              <div key={lesson._id}>
                                <p className="text-xs px-2 font-semibold text-blue-500">Lesson 0{lesson.order}</p>
                                <Link
                                  key={lesson._id}
                                  to={`/studentDashboard/courses/${courseId}/lesson/${lesson._id}`}
                                  className="w-full flex items-center gap-4 p-4 bg-white border border-gray-300 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
                                >
                                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${completedLesson.some((id) => id.toString() === lesson._id) ? 'bg-green-100 text-green-600 border-green-200' : 'bg-white text-gray-400'}`}>
                                    {completedLesson.some((id) => id.toString() === lesson._id) ? <CheckCircle2 size={16} /> : <Play size={14} />}
                                  </div>
                                  <span className="flex-1 font-semibold text-gray-700 group-hover:text-blue-600">{lesson.title}</span>
                                  <span className="text-xs text-gray-400">{lesson.duration}</span>
                                </Link>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>}
    </div>
  );
};

export default CourseStructure;