import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-white/40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center md:gap-2">
          <img src="/Screenshot 2026-01-16 112749.png" alt="logo" className='h-6 md-h-10 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.1)]'/>
          <div className="text-sm md:text-xl font-bold tracking-tight text-gray-900">
            Learn<span className="text-indigo-600">Cloud</span>
          </div>
        </div>

        <div className="flex items-center gap-0 md:gap-3">
          <Link to="/" className="px-2 md:px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:text-indigo-600 transition">
            Home
          </Link>
          <Link to="/login" className="px-2 md:px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:text-indigo-600 transition">
            Login
          </Link>
          <Link to="/signup" className="px-4 md:px-5 py-2 rounded-full text-sm font-medium bg-indigo-600 text-white shadow hover:shadow-md hover:bg-indigo-700 transition">
            Signup
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
