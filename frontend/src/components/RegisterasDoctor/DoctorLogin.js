import API_BASE_URL from '../../apiConfig';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';

function DoctorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Firebase Login
      await login(email, password);

      // 2. Fetch Doctor data from backend to sync session/localStorage
      const response = await fetch(`${API_BASE_URL}/api/doctor/doctor-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Login successful!");
        localStorage.setItem("doctor", JSON.stringify(data.doctor));
        navigate("/doctor-screen");
      } else {
        toast.error(data.error || "Login failed on backend. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-90">
      <div className="card shadow p-4" style={{ width: "100%", maxWidth: "30rem", borderRadius: '15px' }}>
        <h3 className="text-center mb-4" style={{ color: "#1b558b" }}>
          Login as Doctor
        </h3>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="d-grid">
            <button
              disabled={loading}
              type="submit"
              className="btn btn-primary"
              style={{ backgroundColor: "#1b558b" }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
        <div className="text-center mt-3">
          <p>
            Don't have an account? <Link to="/register-as-doctor">Register</Link>
          </p>
        </div>

        <div className="mt-4">
          <img
            src="https://drgalen.org/assets/img/doctor-login.png"
            alt="Doctor Login"
            className="img-fluid"
            loading="lazy"
            decoding="async"
            style={{
              borderRadius: '15px',
              objectFit: 'cover',
              width: '100%',
              maxHeight: '400px',
            }}
          />
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}

export default DoctorLogin;
