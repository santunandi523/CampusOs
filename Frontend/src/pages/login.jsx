import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { useState, useContext } from 'react';
import AuthContext from "../context/authContext";
import toast from 'react-hot-toast';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { fetchRole, setRole } = useContext(AuthContext);

  async function login() {
    try {
      const res = await API.post("/auth/login", { email, password });
      const { token, role } = res.data;
      if(token) toast.success("Login Successfull");
      
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      setRole(role);
      fetchRole(); 
      if (role === "Student") {
        navigate("/studentDashboard");
      } else if (role === "Teacher") {
        navigate("/teacherDashboard");
      } else {
        console.log("Invalid role");
      }

    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Login Failed";
      toast.error(msg);
      console.log(err);
    }
  }


  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-indigo-600 text-center mb-4">Welcome Back</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="space-y-4"
          >
            <input type="email" placeholder="Email" className="w-full rounded-xl border px-4 py-2.5" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="w-full rounded-xl border px-4 py-2.5" onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="w-full px-6 py-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700" onClick={login}>
              Login
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            Don’t have an account? <Link to="/signup" className="text-indigo-600">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
