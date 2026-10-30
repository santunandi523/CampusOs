import { useEffect, useState } from 'react'
import API from "../../../api/axios"

const TeachersNavBar = ({title, userName, userEmail}) => {
  // const [userName, setUserName] = useState(null);
  // const [userEmail, setUserEmail] = useState(null);

  // useEffect(() => {
  //   async function fetchUser() {
  //     try {
  //       const res = await API.get("/auth/me"); // ✅ await added
  //       console.log(res.data.name);
  //       setUserName(res.data.name); // store full user
  //       setUserEmail(res.data.email); // store full user
  //     } catch (err) {
  //       console.error("Error fetching user:", err);
  //     }
  //   }

  //   fetchUser();
  // }, []); // ✅ run only once
  return (
    <>
      <div className="sticky top-0 z-20 flex justify-between items-center px-8 h-16 bg-white border-b border-sky-100/80 shadow-sm">
        <h1 className="text-base font-black text-slate-800" style={{ fontFamily: "'Georgia', serif" }}>
          {title}
        </h1>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-linear-to-br from-sky-500 to-teal-400 flex items-center justify-center text-white text-xs font-black shadow-md shadow-sky-300">
            MS
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-700 leading-tight">{userName}</p>
            <p className="text-xs text-gray-400">{userEmail}</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default TeachersNavBar
