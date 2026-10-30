import { motion } from "framer-motion";
import Navbar from "../components/navbar";
import FeatureCard from "../components/featureCard";
import Footer from "../components/footer";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50">
      <Navbar />

      <section className="px-4 pt-20 pb-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Learn Smarter. <span className="text-indigo-600">Grow Faster.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-gray-600">
              A modern LMS for students, educators, and teams.
            </p>
            <div className="mt-8">
              <Link to="/signup" className="px-8 py-3 rounded-full bg-indigo-600 text-white font-medium shadow-lg hover:bg-indigo-700 transition">
                Get Started
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <img src="E-learning-animation-video.jpg" alt="Preview" className="rounded-3xl shadow-xl" />
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Everything you need to learn better
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard title="Smart Courses" desc="Create and manage courses easily." icon="📚" />
            <FeatureCard title="Progress Analytics" desc="Track performance clearly." icon="📈" />
            <FeatureCard title="Collaboration" desc="Stay connected with your team." icon="💬" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
