import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../components/component1/sidebar";
import Main from "../components/component1/main";
import AllCourses from "../components/component1/allCourses"; 
import Query from "../components/component1/query";
import API from "../api/axios";
// import AuthContext from "../context/authContext";

const StudentDashboard = () => {
  // const [course, setCourse] = useState([]);
  // const fetchCourse = async () => {
  //   const cor = await API.get("/course/my-courses");
  //   setCourse(cor.data.courses);
  //   console.log(course);
  // }

  // useEffect(() => {
  //   fetchCourse();
  // }, [])
  
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. Sidebar stays fixed on the left */}
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden"> 
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<Main />} />
            <Route path="/all-courses" element={<AllCourses />} />
            <Route path="/my-courses" element={<div className="p-8"><h1>Enrolled Courses (Coming Soon)</h1></div>} />
            {/* <Route path="/timetable" element={<div className="p-8"><h1>TimeTable (Coming Soon)</h1></div>} /> */}
            <Route path="/queries" element={<Query />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;