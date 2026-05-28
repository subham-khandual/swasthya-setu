import API_BASE_URL from '../../apiConfig';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import adminLoginImg from '../../assets/admin-login-main.jpg';

function AdminRegister() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.endsWith('@gmail.com')) {
            toast.error('Registration is restricted to @gmail.com addresses only.');
            return;
        }

        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(name)) {
            toast.error('Full Name must contain only letters and spaces.');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            toast.error('Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character.');
            return;
        }

        setLoading(true);

        try {
            // 1. Create user in Firebase
            await signup(email, password, name);

            // 2. Sync with backend MongoDB (hardcoding userType as 'admin')
            const response = await fetch(`${API_BASE_URL}/api/auth/userAuth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    userType: 'admin',
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Admin Registration successful! Please log in.');
                navigate('/login-as-admin');
            } else {
                toast.error(data.error || 'Registration failed!');
            }
        } catch (err) {
            toast.error(err.message || 'An error occurred. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-sm-8 col-12">
                    <h2 className="text-center mb-4 animated fadeIn" style={{ color: '#1b558b' }}>Register as Admin</h2>

                    <form onSubmit={handleSubmit} className="card shadow-lg p-4 card-animate" style={{ borderRadius: '15px' }}>
                        <div className="form-group mb-3">
                            <label htmlFor="name" className="text-primary">Admin Full Name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group mb-3">
                            <label htmlFor="email" className="text-primary">Admin Email address</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group mb-3">
                            <label htmlFor="password" title="At least 6 characters" className="text-primary">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            disabled={loading}
                            type="submit"
                            className="btn w-100 btn-primary btn-animate"
                            style={{ backgroundColor: '#1b558b' }}
                        >
                            {loading ? 'Registering...' : 'Register as Admin'}
                        </button>

                        <div className="mt-4">
                            <img
                                src={adminLoginImg}
                                alt="Admin Register"
                                className="img-fluid"
                                loading="lazy"
                                decoding="async"
                                style={{
                                    borderRadius: '15px',
                                    objectFit: 'cover',
                                    width: '100%',
                                    maxHeight: '250px',
                                }}
                            />
                        </div>
                    </form>
                    <p className="text-center mt-3">
                        Already have an account? <Link to="/login-as-admin" className="text-primary">Login here</Link>
                    </p>
                    <div className="text-center">
                        <Link to="/admin-auth-options" className="text-decoration-none text-muted small">
                            Back to options
                        </Link>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

export default AdminRegister;
