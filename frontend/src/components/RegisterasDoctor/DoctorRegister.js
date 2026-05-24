import API_BASE_URL from '../../apiConfig';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';

function DoctorRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [contact, setContact] = useState("");
  const [experience, setExperience] = useState("");
  const [currentHospital, setCurrentHospital] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !contact.trim() || !specialization.trim() || !password.trim() || !experience || !currentHospital.trim() || !address.trim()) {
      toast.error("Please fill in all fields correctly.");
      return;
    }

    if (!email.endsWith('@gmail.com')) {
      toast.error("Registration is restricted to @gmail.com addresses only.");
      return;
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      toast.error('Full Name must contain only letters and spaces.');
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(contact)) {
      toast.error("Please enter a valid 10-digit phone number starting with 6-9.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create user in Firebase
      await signup(email, password, name);

      // 2. Sync with backend MongoDB
      const payload = {
        name,
        email,
        password,
        specialization,
        contact,
        experience: Number(experience),
        currentHospital,
        address,
      };

      const response = await fetch(`${API_BASE_URL}/api/doctor/doctor-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Registration successful!");
        navigate("/login-as-doctor");
      } else {
        const data = await response.json();
        toast.error(data.error || "Registration failed on backend. Please try again.");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-90" style={{ marginTop: '0px' }}>
      <div className="row w-100">
        <div className="col-12 col-md-6">
          <div className="card shadow-lg p-4" style={{ borderRadius: '15px' }}>
            <h2 className="text-center mb-4" style={{ color: "#1b558b" }}>Register as Doctor</h2>
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="fullName" className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="fullName"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
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
              </div>

              <div className="row mb-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="password" title="At least 6 characters" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="specialization" className="form-label">Specialization</label>
                  <select
                    className="form-select"
                    id="specialization"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Specialization</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Psychiatrist">Psychiatrist</option>
                    <option value="Dentist">Dentist</option>
                    <option value="Gynaecologist">Gynaecologist</option>
                    <option value="ENT Specialist">ENT Specialist</option>
                    <option value="Ophthalmologist">Ophthalmologist</option>
                    <option value="Urologist">Urologist</option>
                    <option value="Oncologist">Oncologist</option>
                    <option value="Pulmonologist">Pulmonologist</option>
                  </select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="contactNumber" className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    id="contactNumber"
                    placeholder="Enter your contact number"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="experience" className="form-label">Years of Experience</label>
                  <input
                    type="number"
                    className="form-control"
                    id="experience"
                    placeholder="Enter your years of experience"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="hospital" className="form-label">Current Hospital/Clinic</label>
                  <input
                    type="text"
                    className="form-control"
                    id="hospital"
                    placeholder="Enter your current workplace"
                    value={currentHospital}
                    onChange={(e) => setCurrentHospital(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="address" className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    id="address"
                    rows="3"
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>

              <div className="d-grid">
                <button
                  disabled={loading}
                  type="submit"
                  className="btn btn-success"
                  style={{ backgroundColor: "#1b558b", borderRadius: '10px' }}
                >
                  {loading ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
            <div className="text-center mt-3">
              <p>Already have an account? <Link to="/login-as-doctor">Login</Link></p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 d-flex justify-content-center align-items-center">
          <img
            src="/doctor_registration_hero.png"
            alt="Doctor Registration"
            className="img-fluid"
            loading="lazy"
            decoding="async"
            style={{ borderRadius: '15px', objectFit: 'cover' }}
          />
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}

export default DoctorRegister;
