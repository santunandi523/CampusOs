import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import TeachersSideBar from "../components/component3/layout/TeacherSideBar";
import DashboardPage from "../components/component3/dashboard/Dashboard";
import MyCoursesPage from "../components/component3/courses/MyCoursesPage";
import AddCourseModal from "../components/component3/courses/AddCourseModal";
import API from "../api/axios";
import AuthContext from "../context/authContext";
import TeachersNavBar from "../components/component3/layout/TeachersNavBar";
import MyStudents from "../components/component3/layout/MyStudents";
import Assignments from "../components/component3/Assignment/Assignment";
// inside your teacher dashboard <Routes>:
{/* <Route path="/teacherDashboard/assignments" element={<Assignments />} /> */}

export default function TeacherDashboard({userName, userEmail}) {
  const [modal, setModal] = useState(false);
  const [allCourses, setAllCourses] = useState([]);

  async function fetchCourse() {
    try {
      const courses = await API.get("/course/createdCourses");
      setAllCourses(courses.data);
    } catch (err) {
      console.error("Not able to fetch courses", err);
    }
  }

  useEffect(() => {
    fetchCourse();
  }, []);

  return (
    <AuthContext.Provider value={{ allCourses, fetchCourse }}>
      <div className="min-h-screen bg-sky-50 flex">
        <TeachersSideBar/>

        <main className="flex-1 h-screen overflow-scroll">
            <Routes>
              {/* index route displays for /teacherDashboard */}
              <Route index element={
                <>
                  <TeachersNavBar title="Dashboard" userName={userName} userEmail={userEmail}/>
                  <DashboardPage onOpen={() => setModal(true)} userName={userName}/> 
                </>
              } />
              
              {/* path matches the 'to' prop in your sidebar NavLinks */}
              <Route path="/my-courses" element={
                <>
                  <TeachersNavBar title="My Courses" userName={userName} userEmail={userEmail}/>
                  <MyCoursesPage onOpen={() => setModal(true)} /> 
                </>
              } />
                
              <Route path="/assignments" element={
                <>
                  <TeachersNavBar title="Assignments" userName={userName} userEmail={userEmail}/>
                  <Assignments />
                </>   
              }/>

              <Route path="/my-students" element={
                 <>
                  <TeachersNavBar title="Enrolled Students" userName={userName} userEmail={userEmail}/>
                  <MyStudents />
                </>   
              } />

            </Routes>
        </main>

        <AddCourseModal
          isOpen={modal}
          onClose={() => setModal(false)}
        />
      </div>
    </AuthContext.Provider>
  );
}