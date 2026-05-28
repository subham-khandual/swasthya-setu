import API_BASE_URL from '../../apiConfig';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import adminLoginImg from '../../assets/admin-login-main.jpg';

function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // 1. Firebase login
            await login(email, password);

            // 2. Sync with backend session
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                // 3. Fetch full user profile from backend to verify userType
                const userRes = await fetch(`${API_BASE_URL}/api/auth/user`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (userRes.ok) {
                    const userData = await userRes.json();
                    if (userData.userType === 'admin') {
                        localStorage.setItem('user', JSON.stringify(userData));
                        toast.success('Admin Login successful!');
                        navigate('/admin-dashboard');
                    } else {
                        toast.error('Access Denied: You are not authorized as an admin.');
                    }
                } else {
                    toast.error('Failed to fetch user profile.');
                }
            } else {
                const data = await response.json();
                toast.error(data.error || 'Login failed!');
            }
        } catch (err) {
            setError(err.message || 'Login failed!');
            toast.error(err.message || 'Login failed!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-sm-8 col-12">
                    <h2 className="text-center mb-4 animated fadeIn" style={{ color: '#1b558b' }}>Admin Login</h2>

                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={handleSubmit} className="card shadow-lg p-4 card-animate" style={{ borderRadius: '15px' }}>
                        <div className="form-group mb-3">
                            <label htmlFor="email" className="text-primary">Admin Email</label>
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
                            <label htmlFor="password" className="text-primary">Password</label>
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
                            className="btn w-100 btn-primary btn-animate mb-3"
                            style={{ backgroundColor: '#1b558b' }}
                        >
                            {loading ? 'Logging in...' : 'Login as Admin'}
                        </button>

                        <div className="mt-4">
                            <img
                                src={adminLoginImg}
                                alt="Admin Login"
                                className="img-fluid"
                                loading="lazy"
                                decoding="async"
                                style={{
                                    borderRadius: '15px',
                                    objectFit: 'cover',
                                    width: '100%',
                                    maxHeight: '300px',
                                }}
                            />
                        </div>
                    </form>

                    <div className="text-center mt-3">
                        <Link to="/" className="btn btn-link text-primary p-0" style={{ textDecoration: 'none' }}>
                            Back to selection
                        </Link>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

export default AdminLogin;
