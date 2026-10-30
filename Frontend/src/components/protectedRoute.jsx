import { Navigate } from "react-router-dom";
import IsTokenExpired from "./isTokenExpired";
const ProtectedRoute = ({ children, role, allowedRole }) => {
    const token = localStorage.getItem("token");

    // Not logged in
    if (!token || IsTokenExpired(token)) {
        localStorage.removeItem("token");
        return <Navigate to="/login" replace />;
    }

    // Role not loaded yet
    // Wrong role trying to access
    if (role !== allowedRole) {
        return <Navigate to="/login" replace />;
    }
    return children;

}

export default ProtectedRoute;
