import { useState, useMemo, useContext, useEffect } from 'react';
import API from '../../api/axios';
import AuthContext from '../../context/authContext';
import { BookOpen, Users, Clock, Star, ArrowRight, Search, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const AllCourses = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const { enrolledCourses, setEnrolledCourses } = useContext(AuthContext);

  const filteredCourses = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    const query = searchQuery.toLowerCase().trim();
    if (!query) return courses;

    return courses.filter(course =>
      course.title?.toLowerCase().includes(query) ||
      course.subjectTag?.toLowerCase().includes(query)
    );
  }, [searchQuery, courses]);

  
  const handleEnroll = async (courseId) => {
    try {
      const response = await API.post("/course/enroll", { courseId });

      if (response.data.success) {
        setEnrolledCourses(response.data.enrolledCourses);
        toast.success("Enrollment confirmed");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Enrollment failed";
      toast.error(errorMsg);
    }
  };

  const fetchCourse = async () => {
    const cor = await API.get("/course");
    setCourses(cor.data);
    setLoading(false);
    console.log(courses);
  }

  useEffect(() => {
    fetchCourse();
  }, [])

  return (
    <div className="p-8 h-full overflow-y-auto w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Explore Courses</h1>
          <p className="text-slate-500 mt-1">Find the perfect course to enhance your career skills.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search courses or topics..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const enrolledMatch = enrolledCourses.find(id => id.toString() === course._id.toString());
            const isEnrolled = (enrolledMatch) ? true : false;

            return (
              <div
                key={course._id}
                className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col"
              >
                {/* Thumbnail Placeholder */}
                <div className={`relative h-40 bg-linear-to-br ${course.backgroundColor} flex items-center justify-center transition-transform group-hover:scale-105 duration-300`}>
                  <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/20" />
                  <div className="absolute bottom-0 right-8 w-14 h-14 rounded-full bg-black/12" />
                  <div className="absolute -bottom-9 -left-8 w-34 h-34 rounded-full bg-white/12" />
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {course.subjectTag}
                    </span>
                    <div className="flex items-center text-amber-500 text-sm font-bold">
                      <Star className="w-4 h-4 fill-current mr-1" /> 4.8
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{course.title}</h3>
                  <p className="text-slate-500 text-sm mt-2 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-4 text-slate-400 text-xs font-medium">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" /> {course.totalStudents}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" /> 4 hours
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto pt-6">
                    <button
                      onClick={() => handleEnroll(course._id)}
                      disabled={isEnrolled}
                      className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${isEnrolled
                          ? "bg-green-50 text-green-600 cursor-default"
                          : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]"
                        }`}
                    >
                      {isEnrolled ? (
                        <>
                          <CheckCircle className="w-4 h-4" /> Enrolled
                        </>
                      ) : (
                        <>
                          Enroll Now <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          {loading ? <p>loading...</p> : <p className="text-slate-500 text-lg">No courses found matching "{searchQuery}"</p>}
        </div>
      )}
    </div>
  );
};

export default AllCourses;