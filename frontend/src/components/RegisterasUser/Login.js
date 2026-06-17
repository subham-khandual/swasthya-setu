import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import { FaGoogle } from 'react-icons/fa';
import API_BASE_URL from '../../apiConfig';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleSignIn, resetPassword, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.endsWith('@gmail.com')) {
      toast.error('Please use a valid @gmail.com address.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);

      // Sync with backend session
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Fetch full user profile from backend to get userType
        const userRes = await fetch(`${API_BASE_URL}/api/auth/user`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.userType === 'admin') {
            toast.error('Access Denied: Admin accounts must use the Admin Login page.');
            setError('Access Denied: Admin accounts must use the Admin Login page.');
            await logout();
            return;
          }
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          toast.error('Failed to fetch user profile.');
          await logout();
          return;
        }

        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Backend session sync failed!');
      }
    } catch (err) {
      setError(err.message || 'Login failed!');
      toast.error(err.message || 'Login failed!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      const user = result.user;

      const idToken = await user.getIdToken();

      // Sync with backend session
      const response = await fetch(`${API_BASE_URL}/api/auth/google-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        const syncData = await response.json();
        
        // Fetch profile to get user details
        const userRes = await fetch(`${API_BASE_URL}/api/auth/user`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.userType === 'admin') {
            toast.error('Access Denied: Admin accounts must use the Admin Login page.');
            setError('Access Denied: Admin accounts must use the Admin Login page.');
            await logout();
            return;
          }
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          toast.error('Failed to fetch user profile.');
          await logout();
          return;
        }

        if (syncData.isNewUser) {
          toast.info('Please select your role');
          navigate('/select-role');
        } else {
          toast.success('Google Login successful!');
          navigate('/dashboard');
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Backend session sync failed!');
      }
    } catch (err) {
      setError(err.message || 'Google Login failed!');
      toast.error(err.message || 'Google Login failed!');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      return toast.warn('Please enter your email first.');
    }
    try {
      await resetPassword(email);
      toast.info('Password reset email sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-sm-8 col-12">
          <h2 className="text-center mb-4 animated fadeIn" style={{ color: '#1b558b' }}>Login as user</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="card shadow-lg p-4 card-animate">
            <div className="form-group mb-3">
              <label htmlFor="email" className="text-primary">Email address</label>
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
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-center mb-3">
              <span className="text-muted">OR</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="btn w-100 btn-outline-danger d-flex align-items-center justify-content-center gap-2"
            >
              <FaGoogle /> Sign in with Google
            </button>
          </form>

          <div className="text-center mt-3">
            <button
              onClick={handleForgotPassword}
              className="btn btn-link text-primary p-0"
              style={{ textDecoration: 'none' }}
            >
              Forgot Password?
            </button>
          </div>

          <p className="text-center mt-3">
            Don't have an account? <Link to="/register-as-user" className="text-primary">Register here</Link>
          </p>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Login;
