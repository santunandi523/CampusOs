import './App.css'
import Home from './pages/home'
import Login from './pages/login'
import Signup from './pages/signup'
import DashBoard from './pages/dashboard'
import TeacherDashBoard from './pages/teacherDashboard'
import Navbar from './components/navbar'
import ProtectedRoute from './components/protectedRoute'
import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Toaster } from "react-hot-toast";
import AuthContext from "./context/authContext"
import API from './api/axios'
import CoursesApp from './components/component2/courses'
import LessonPlayer from './components/component2/lessonPlayer'
import TeacherCourseBuilderApp from "./components/component3/courseBuilder/coursePage"

function App() {
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);


  const fetchRole = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("no token");
        setLoading(false)
        return;
      }
      const res = await API.get("/auth/me");
      const userRole = res.data.role;
      setEnrolledCourses(res.data.enrolledCourses);
      setUserName(res.data.name); // store full user name
      setUserEmail(res.data.email); // store full user email
      console.log("hello", userRole);
      setRole(userRole);
    } catch (error) {
      console.log("error has occured", error);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRole();
  }, [])

  const [courses, setCourses] = useState([]);

  const fetchCourse = async () => {
    try {
      const res = await API.get("/course/my-courses");
      const course = res.data;
      setCourses(course);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* <Home /> */}
      <AuthContext.Provider value={{ fetchRole, role, setRole, loading, enrolledCourses, setEnrolledCourses }}>
        <Toaster position="top-right" />

        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/signup' element={<><Navbar /><Signup /></>} />
          <Route path='/login' element={<><Navbar /> <Login /></>} />
          {/* <Route path='/dashboard' element={role == "Student" ? <ProtectedRoute><DashBoard /></ProtectedRoute> : <ProtectedRoute><TeacherDashBoard /></ProtectedRoute>} /> */}

          <Route path='/studentDashboard/*' element={<ProtectedRoute role={role} allowedRole="Student"><DashBoard /></ProtectedRoute>} />
          <Route path='/teacherDashboard/*' element={<ProtectedRoute role={role} allowedRole="Teacher"><TeacherDashBoard userName={userName} userEmail={userEmail}/></ProtectedRoute>} />
          <Route path='/studentDashboard/courses/:courseId' element={<ProtectedRoute role={role} allowedRole="Student"><CoursesApp courses={courses} setCourses={setCourses} fetchCourse={fetchCourse}/></ProtectedRoute>} />
          <Route path='/studentDashboard/courses/:courseId/lesson/:lessonId' element={<ProtectedRoute role={role} allowedRole="Student"><LessonPlayer courses={courses} setCourses={setCourses} fetchCourse={fetchCourse}/></ProtectedRoute>} />
          <Route path="/teacherDashboard/my-courses/coursePage/:courseId" element={<ProtectedRoute role={role} allowedRole="Teacher"><TeacherCourseBuilderApp /></ProtectedRoute>} />

        </Routes>
      </AuthContext.Provider>
    </>
  )
}

export default App
