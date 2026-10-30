import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, NavLink } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuBookOpen,
  LuCalendarDays,
  LuClipboardList,
  LuUsers,
  LuLogOut,
} from "react-icons/lu";

function TeachersSideBar() {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LuLayoutDashboard, path: "/teacherDashboard" },
    { id: "courses", label: "My Courses", icon: LuBookOpen, path: "/teacherDashboard/my-courses" },
    // { id: "timetable", label: "Timetable", icon: LuCalendarDays, path: "/teacherDashboard/timetable" },
    { id: "assignments", label: "Assignments", icon: LuClipboardList, path: "/teacherDashboard/assignments" },
    { id: "students", label: "Students", icon: LuUsers, path: "/teacherDashboard/my-students" },
  ];

  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login", {replace : true});
  }

  return (
    <motion.aside
      animate={{ width: 250 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="z-30 flex flex-col bg-[#04111f] shadow-2xl overflow-hidden h-screen"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 min-h-[68px]">
        <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-xl shadow-blue-700/30 bg-[url('/image.png')] bg-cover bg-no-repeat"></div>

        <AnimatePresence>
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-white font-bold text-xl"
            >
              Learn<span className="text-blue-400">Cloud</span>
            </motion.span>
        </AnimatePresence>
      </div>

    
      <nav className="flex-1 flex flex-col gap-1 px-2.5">
        {items.map(({ id, label, icon: Icon, path }) => (
          <NavLink
            key={id}
            to={path}
            end={id === "dashboard"}
            className="no-underline"
          >
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center px-3 py-2.5 rounded-xl text-left transition-all border gap-4 ${
                  isActive
                    ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                    : "border-transparent text-sky-200/35 hover:bg-white/5 hover:text-sky-200/70"
                }`}
              >
                <span className="shrink-0 text-lg">
                  <Icon />
                </span>

                <AnimatePresence>
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.14 }}
                      className="text-[13px] font-semibold whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                </AnimatePresence>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-2 h-px bg-white/5" />

      {/* Logout */}
      <div className="px-2.5 pb-5">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full border border-transparent text-rose-400 hover:bg-rose-400/10 hover:border-rose-400/20 hover:text-rose-400 transition-all" onClick={handleLogout}>
          <span className="shrink-0 text-lg">
            <LuLogOut />
          </span>

          <AnimatePresence>
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.14 }}
                className="text-[13px] font-semibold whitespace-nowrap"
              >
                Logout
              </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

export default TeachersSideBar;
