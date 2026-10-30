import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api/axios";
import CoursePreview from "./coursePreview";
import CourseEditor  from "./courseEditor";

export default function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course,  setCourse]  = useState(null);        // fix: was []
  const [mode,    setMode]    = useState("preview");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  async function fetchCourseContent() {
    try {
      const res = await API.get("/course");
      const foundCourse = res.data.find((item) => item._id === courseId);
      if (!foundCourse) throw new Error("Course not found");
      setCourse(foundCourse);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourseContent();
  }, [courseId]);

  // fix: was API.update(id, ...) — id undefined, wrong method
  const handleSave = async (updatedCourse) => {
    const res = await API.put(`/course/${courseId}`, updatedCourse);
    setCourse(res.data);
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-stone-400 text-sm animate-pulse">Loading course…</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-red-400 text-sm">{error}</div>
    </div>
  );

  if (mode === "edit") {
    return (
      <CourseEditor
        course={course}
        onSave={handleSave}
        onPreview={() => setMode("preview")}
        onBack={() => navigate("/teacherDashboard/my-courses")}
      />
    );
  }

  return (
    <CoursePreview
      course={course}
      onEdit={() => setMode("edit")}
      onBack={() => navigate("/teacherDashboard/my-courses")}
    />
  );
}