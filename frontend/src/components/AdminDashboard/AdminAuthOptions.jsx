import React from 'react';
import { Link } from 'react-router-dom';
import adminLoginImg from '../../assets/admin-login-main.png';

function AdminAuthOptions() {
    return (
        <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100">
            <div className="card shadow-lg p-4 text-center" style={{ maxWidth: "40rem", width: "100%", borderRadius: '20px' }}>
                <h2 className="mb-4" style={{ color: '#1b558b' }}>Admin Authentication</h2>
                <p className="text-muted mb-4">Choose how you want to proceed to the administrative panel.</p>

                <div className="row g-4 mb-4">
                    <div className="col-md-6">
                        <Link to="/login-as-admin" className="btn btn-primary btn-lg w-100 py-3" style={{ backgroundColor: '#1b558b', borderRadius: '10px' }}>
                            Sign In as Admin
                        </Link>
                    </div>
                    <div className="col-md-6">
                        <Link to="/register-as-admin" className="btn btn-outline-primary btn-lg w-100 py-3" style={{ borderRadius: '10px' }}>
                            Register as Admin
                        </Link>
                    </div>
                </div>

                <div className="mt-2">
                    <img
                        src={adminLoginImg}
                        alt="Admin Auth"
                        className="img-fluid"
                        loading="lazy"
                        decoding="async"
                        style={{
                            borderRadius: '20px',
                            objectFit: 'cover',
                            width: '100%',
                            maxHeight: '350px',
                        }}
                    />
                </div>

                <div className="mt-4">
                    <Link to="/" className="text-decoration-none text-muted">
                        <i className="bi bi-arrow-left mt-1"></i> Back to main selection
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default AdminAuthOptions;
