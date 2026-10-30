import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

const navItems = [
    { label: "Dashboard",   emoji: "📊", path: "/studentDashboard",             end: true },
    { label: "All Courses", emoji: "🌐", path: "/studentDashboard/all-courses", end: false },
    { label: "Queries",     emoji: "⚙️", path: "/studentDashboard/queries",     end: false },
];

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="w-[15vw] h-screen bg-blue-950 shadow-xl p-6 hidden md:flex flex-col relative shrink-0">
            {/* Logo */}
            <h2 className="text-2xl font-bold mb-8 text-slate-200 select-none">
                Learn<span className="text-2xl font-bold text-[rgb(124,209,255)]">Cloud</span>
            </h2>

            {/* Nav */}
            <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                            `relative px-4 py-2 rounded-xl text-sm font-semibold w-full text-left flex items-center gap-2.5
                             transition-all duration-200
                             ${isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                                : "bg-transparent text-white hover:bg-blue-200/50"
                             }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.span
                                            layoutId="sidebarActiveTab"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-300 rounded-r-full"
                                            initial={{ opacity: 0, scaleY: 0 }}
                                            animate={{ opacity: 1, scaleY: 1 }}
                                            exit={{ opacity: 0, scaleY: 0 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </AnimatePresence>
                                <span className="text-base leading-none">{item.emoji}</span>
                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 mt-10 rounded-lg w-45 bg-red-500/30 text-red-500 text-lg cursor-pointer transition-all hover:border hover:border-red-500"
            >
                <LogOut className="w-4 h-4" />
                Logout
            </button>
        </div>
    );
};

export default Sidebar;