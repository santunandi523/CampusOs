import React, { useEffect, useState } from "react";
import CourseSidebar from "./lessons/lessonSidebar";
import LessonContent from "./lessons/lessonContent";
import { useParams } from "react-router-dom";
import API from "../../api/axios";

const LessonPlayer = ({ courses, fetchCourse }) => {
  const { courseId, lessonId } = useParams();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);

  // Step 1 — fetch and find the course
  useEffect(() => {
    fetchCourse();
  }, []);

  
  // Step 2 — once course is set, find the lesson
  useEffect(() => {
    if (!currentCourse) return;
    const lessons = currentCourse.units
      ?.flatMap((unit) => unit.chapters)
      ?.flatMap((chapter) => chapter.lessons) ?? [];
    const found = lessons.find((l) => l._id.toString() === lessonId.toString());
    setCurrentLesson(found ?? null);
  }, [currentCourse, lessonId]);

  const fetchCurrentCourse = async () => {
    const found = courses.courses?.find(
      (item) => item._id.toString() === courseId
    );
    setCurrentCourse(found);
  }

  const fetchCompletedLessons = async () => {
    if (!courseId) return;
    const res = await API.get(`/course/progress/${courseId}`);
    setCompletedLessons(res.data || []);
  }

  useEffect(() => {
    const run = async () => {
      fetchCurrentCourse();
      fetchCompletedLessons();
    };

    run();
  }, [courseId, courses]);


  const allLessons = currentCourse?.units
    ?.flatMap((unit) => unit.chapters)
    ?.flatMap((chapter) => chapter.lessons) ?? [];


  const handleNext = () => {
    if (!currentLesson) return;
    const idx = allLessons.findIndex((l) => l._id === currentLesson._id);
    const next = allLessons[idx + 1];
    if (next) setCurrentLesson(next);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <div className={`transition-all duration-300 overflow-hidden flex-shrink-0 ${isSidebarOpen ? "w-80" : "w-0"}`}>
        <CourseSidebar
          course={currentCourse}
          currentLessonId={currentLesson?._id}
          completedLessons={completedLessons}
          setCompletedLessons={setCompletedLessons}
          fetchCompletedLessons={fetchCompletedLessons}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      <LessonContent
        lesson={currentLesson}
        course={currentCourse}
        allLessons={allLessons}
        completedLessons={completedLessons}
        setCompletedLessons={setCompletedLessons}
        fetchCompletedLessons={fetchCompletedLessons}
        onNext={handleNext}
        isSidebarOpen={isSidebarOpen}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
    </div>
  );
};

export default LessonPlayer;