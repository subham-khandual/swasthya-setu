import React from 'react';
import { Link } from 'react-router-dom';
import adminLoginImg from '../../assets/admin-login-main.png';

function Authpage() {
  return (
    <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100">
      <div className="row g-4 w-100 text-center">
        {/* User Registration Card */}
        <div className="col-md-4">
          <div className="card border-0 shadow-lg h-100" style={{ height: '100%', width: '100%' }}>
            <div className="card-img-top overflow-hidden rounded-top" style={{ height: '200px' }}>
              <img
                src="https://th.bing.com/th/id/OIP.WNQzMWB6nZi_uYlSNxL5SQHaE8?rs=1&pid=ImgDetMain"
                className="img-fluid h-100 w-100 object-fit-cover"
                alt="User Registration"
                fetchpriority="high"
                decoding="async"
              />
            </div>
            <div className="card-body d-flex flex-column justify-content-center align-items-center">
              <h3 className="card-title text-primary mb-3">Register as User</h3>
              <p className="card-text text-muted mb-4">
                Join as a user and explore the best services tailored for you.
              </p>
              <Link to="/login-as-user" className="btn btn-primary btn-lg w-75">
                Get Started
              </Link>
            </div>
          </div>
        </div>

        {/* Doctor Registration Card */}
        <div className="col-md-4">
          <div className="card border-0 shadow-lg h-100" style={{ height: '100%', width: '100%' }}>
            <div className="card-img-top overflow-hidden rounded-top" style={{ height: '200px' }}>
              <img
                src="https://static.vecteezy.com/system/resources/previews/002/952/463/large_2x/doctor-holding-touching-hands-asian-senior-or-elderly-old-lady-woman-patient-with-love-care-helping-encourage-and-empathy-at-nursing-hospital-ward-healthy-strong-medical-concept-free-photo.jpg"
                className="img-fluid h-100 w-100 object-fit-cover"
                alt="Doctor Registration"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="card-body d-flex flex-column justify-content-center align-items-center">
              <h3 className="card-title text-primary mb-3">Register as Doctor</h3>
              <p className="card-text text-muted mb-4">
                Become part of a trusted network of healthcare providers.
              </p>
              <Link to="/login-as-doctor" className="btn btn-primary btn-lg w-75">
                Get Started
              </Link>
            </div>
          </div>
        </div>

        {/* Admin Registration Card */}
        <div className="col-md-4">
          <div className="card border-0 shadow-lg h-100" style={{ height: '100%', width: '100%' }}>
            <div className="card-img-top overflow-hidden rounded-top" style={{ height: '200px' }}>
              <img
                src={adminLoginImg}
                className="img-fluid h-100 w-100 object-fit-cover"
                alt="Admin Login"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="card-body d-flex flex-column justify-content-center align-items-center">
              <h3 className="card-title text-primary mb-3">Register as Admin</h3>
              <p className="card-text text-muted mb-4">
                Access the administrative dashboard to manage clinical data and users.
              </p>
              <Link to="/admin-auth-options" className="btn btn-primary btn-lg w-75">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Authpage;
