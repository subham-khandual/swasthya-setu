const API_BASE_URL = 
  process.env.REACT_APP_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://swasthya-setu-backend-7d6i.onrender.com'
    : 'http://localhost:2001');

console.log("Health Check: API_BASE_URL holds ->", API_BASE_URL);

export default API_BASE_URL;
