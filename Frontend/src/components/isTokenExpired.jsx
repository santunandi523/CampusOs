import { jwtDecode } from 'jwt-decode';

const isTokenExpired = (token) => {
    try {
        const decoded = jwtDecode(token);
        return decoded.exp*1000 < Date.now();
    }
    catch(err) {
        return true;
    }
}

export default isTokenExpired;