import { useState, useEffect } from 'react'
import { Bell, BookOpen, CheckCircle, Clock, BarChart3, Search } from "lucide-react";
import { motion } from "framer-motion";
import { GrNext } from "react-icons/gr";
import { Link } from "react-router-dom";
import API from "../../api/axios";

const Progress = ({ value }) => (
    <div className="w-full h-1.5 bg-slate-300 rounded-full">
        <div
            className="h-1.5 bg-blue-500 rounded-full"
            style={{ width: `${value}%` }}
        />
    </div>
);

const main = () => {
    const [course, setCourse] = useState([]);
    const [progress, setProgress] = useState([]);
    const [completedCount, setCompletedCount] = useState(0);
    const [inProgressCount, setInProgressCount] = useState(0);
    const [performance, setPerformance] = useState(0);
    const [loading, setLoading] = useState(true);



    const fetchCourse = async () => {
        const cor = await API.get("/course/my-courses");
        setCourse(cor.data.courses);
        setProgress(cor.data.progress);

        const progressData = cor.data.progress; //use fresh data
        let completed = 0;
        let inProgress = 0;
        let totalPerformance = 0;
        progressData.forEach((c) => {
            totalPerformance += c.progress;
            if (c.progress === 100) {
                completed++;
            } else {
                inProgress++;
            }
        });

        setPerformance(Math.round(totalPerformance / progressData.length));
        console.log(performance);
        setCompletedCount(completed);
        setInProgressCount(inProgress);
        setLoading(false);
    }

    useEffect(() => {
        fetchCourse();
    }, [])

    return (
        <div>
            <main className="h-screen w-[85vw] flex-1 p-6">
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 w-full max-w-md">
                        <Search className="text-gray-500" />
                        <input className='w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500' placeholder="Search courses..." />
                    </div>
                    <Bell className="cursor-pointer" />
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[{
                        title: "Enrolled",
                        value: course.length,
                        icon: <BookOpen />
                    }, {
                        title: "In Progress",
                        value: inProgressCount,
                        icon: <Clock />
                    }, {
                        title: "Completed",
                        value: completedCount,
                        icon: <CheckCircle />
                    }, {
                        title: "Performance",
                        value: `${performance}%`,
                        icon: <BarChart3 />
                    }].map((item, i) => (
                        <motion.div key={i} whileHover={{ scale: 1.05 }}>
                            <div className="p-5 flex items-center gap-4 bg-white rounded-2xl shadow-lg cursor-pointer">
                                <div className="p-3 bg-blue-100 rounded-xl">{item.icon}</div>
                                <div>
                                    <p className="text-sm text-gray-500">{item.title}</p>
                                    <p className="text-2xl font-bold">{item.value}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Courses */}

                <section className="h-[65%] overflow-y-auto">
                    <h3 className="mx-4 text-2xl font-semibold mb-4">Continue Learning</h3>
                    <div className="flex justify-start items-center flex-wrap gap-12 my-5">
                        {loading ? <p className="text-3xl text-slate-400 font-semibold p-5 text-center h-100 w-full">Loading....</p> 
                        : 
                        course.map((item, i) => {
                            const p = progress.find(p => p.courseId === item._id);
                            return <>
                                <Link to={`/studentDashboard/courses/${item._id}`} key={i}>
                                    <motion.div whileHover={{ y: -4, x: 3, scale: 1.02 }}>
                                        <div className={`bg-green-400 bg-cover bg-no-repeat rounded-2xl shadow-lg h-65 w-92 relative cursor-pointer min-h-fit z-30`}>
                                            <div className={`relative h-30 bg-linear-to-br ${item.backgroundColor} p-4 flex flex-col justify-between overflow-hidden rounded-t-2xl`}>
                                                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
                                                <div className="absolute bottom-0 right-8 w-14 h-14 rounded-full bg-white/8" />

                                                <h3 className="text-white font-black text-2xl relative py-2 z-10 leading-tight" style={{ fontFamily: "'Georgia', serif" }}>
                                                    {item.title}
                                                </h3>
                                                <span className="text-sm w-fit text-white font-semibold px-3 py-1 rounded-full bg-black/40">{item.subjectTag}</span>
                                            </div>
                                            <div className="w-full h-30 absolute p-2.5 bg-white rounded-b-2xl min-h-fit">
                                                <div className="h-16">
                                                    <p className="h-12 overflow-y-scroll s1 text-sm text-slate-500 mb-2">{item.description}</p>
                                                </div>
                                                <div className="h-14 relative pt-1 border-t-1 border-t-gray-400/30">
                                                    <h4 className="text-md text-black font-semibold mb-2">Progress: {p ? p.progress : 0}%</h4>
                                                    <Progress value={p ? p.progress : 0} />
                                                    <GrNext className="h-5 w-5 absolute bottom-6.5 right-0 p-1 bg-white rounded-full cursor-pointer" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            </>
                        })}
                    </div>

                </section>

                <footer className="mt-5 h-6 border-t-2 border-gray-400 py-2 text-center text-2xs text-gray-500">
                    © {new Date().getFullYear()} LearnCloud · Your future starts here.
                </footer>
            </main>
        </div>
    )
}

export default main
