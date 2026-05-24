import API_BASE_URL from '../../apiConfig';
import React, { useEffect, useRef, useState } from 'react';
import { FaBars, FaCheckCircle, FaSignOutAlt, FaTachometerAlt, FaTimes, FaUser, FaSearch, FaBell, FaMoon, FaSun, FaShoppingCart } from 'react-icons/fa'; // Importing icons
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/SwasthyaSetuLogo.png';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state
  const [authuser, setauthuser] = useState([]); // User data
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const userIconRef = useRef(null); // To reference the user icon
  const navigate = useNavigate();
  const { cartCount } = useCart(); // Get cart items count
  const { unreadCount } = useNotifications(); // Get unread notifications count
  // Check if the user is logged in on component mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);



  useEffect(() => {
    const handelaccessuser = async () => {
      const user = localStorage.getItem('user');
      if (!user) return; // Don't fetch if no local session

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated === false) {
            // Backend confirmed no session, clear local state silently
            localStorage.removeItem('user');
            setIsLoggedIn(false);
            setauthuser(null);
          } else {
            setauthuser(data); // Set the authenticated user
            setIsLoggedIn(true);
          }
        } else if (response.status === 401) {
          // Fallback for old 401 behavior if needed, or if other routes return 401
          localStorage.removeItem('user');
          setIsLoggedIn(false);
        }
      } catch (err) {
        // Silently fail for auth checks
        console.error("Auth check failed:", err);
      }
    };
    handelaccessuser();
  }, [isLoggedIn]); // Re-run when login state changes

  // Toggle the menu open/close
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close the menu when a link is clicked in mobile view
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user'); // Remove user data from localStorage
    setIsLoggedIn(false); // Update state
    navigate('/'); // Redirect to login page
    setIsModalOpen(false); // Close modal after logout
  };

  // Handle opening/closing the modal (popup)
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Position the modal relative to the user icon
  const modalStyle = {
    position: 'absolute',
    top: '100%', // Position it directly below the user icon
    left: 0,
    transform: 'translateY(10px)', // Add a small space between the icon and the modal
    width: '200px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '5px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    padding: '10px',
    zIndex: 1050,
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top sticky-top" style={{ backgroundColor: '#1b558b' }}>
      <div className="container">
        <Link className="navbar-brand title-animate" to="/landingpage" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
          <img src={logo} alt="" loading="lazy" decoding="async" style={{ height: "40px", width: "40px", boxShadow: "0px 0px 10px black", border: "2px solid #1b558b", borderRadius: "50%" }} />Swasthya Setu
        </Link>

        {/* Hamburger icon (only visible on smaller devices) */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleMenu} // Toggling the menu open/close
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen ? 'true' : 'false'}
          aria-label="Toggle navigation"
        >
          {isMenuOpen ? (
            <FaTimes size={30} color="#fff" /> // Cross icon when menu is open
          ) : (
            <FaBars size={30} color="#fff" /> // Hamburger icon when menu is closed
          )}
        </button>



        {/* Normal navbar for large devices */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">

            {isLoggedIn ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-animate" to="/dashboard" style={{ padding: '10px 15px' }}>
                    <FaBars className="me-2" size={20} />
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-animate" to="/blood-request-check" style={{ padding: '10px 15px' }}>
                    <FaCheckCircle className="me-2" size={20} />
                    Check Blood Request
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link text-animate"
                    to="/blood-donation-check"
                    style={{ padding: "10px 15px" }}
                  >
                    <FaSearch className="me-2" size={20} />
                    Find Donors
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link text-animate" to="/cart" style={{ padding: '10px 15px', position: 'relative' }}>
                    <FaShoppingCart className="me-2" size={20} />
                    {cartCount > 0 && (
                      <span className="badge rounded-pill bg-danger" style={{ position: 'absolute', top: '5px', left: '20px', fontSize: '0.6rem' }}>
                        {cartCount}
                      </span>
                    )}
                    Cart
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link text-animate" to="/notifications" style={{ padding: '10px 15px', position: 'relative' }}>
                    <FaBell className="me-2" size={20} />
                    {unreadCount > 0 && (
                      <span className="badge rounded-pill bg-danger" style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.6rem' }}>
                        {unreadCount}
                      </span>
                    )}
                    Notifications
                  </Link>
                </li>

                {/* User Icon Button */}
                <li className="nav-item" style={{ position: 'relative' }} ref={userIconRef}>
                  <button
                    className="nav-link text-animate"
                    style={{ padding: '10px 15px', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={toggleModal}
                  >
                    <FaUser className="me-2" size={20} />
                    {authuser?.userName} {/* Display username */}
                  </button>

                  {/* Modal (User Details) */}
                  {isModalOpen && (
                    <div style={{ ...modalStyle, borderTop: '4px solid #1b558b' }}>
                      <div style={{ padding: '10px', borderBottom: '1px solid #eee', marginBottom: '10px' }}>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#1b558b' }}>{authuser?.userName}</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{authuser?.userEmail}</p>
                      </div>
                      <div style={{ padding: '0 10px 10px' }}>
                        <p style={{ margin: '5px 0', fontSize: '0.9rem' }}><strong>Role:</strong> {authuser?.userType}</p>
                        <Link 
                          to={authuser?.userType === 'admin' ? '/admin-dashboard' : authuser?.userType === 'doctor' ? '/doctor-screen' : '/profile'} 
                          style={{ display: 'block', margin: '10px 0', textDecoration: 'none', color: '#1b558b', fontSize: '0.9rem' }} 
                          onClick={() => setIsModalOpen(false)}
                        >
                          <FaUser className="me-2" /> My Profile
                        </Link>
                        <button className="btn btn-danger btn-sm w-100 mt-2" onClick={handleLogout} style={{ borderRadius: '20px' }}>
                          <FaSignOutAlt className="me-2" size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link text-animate" to="/" style={{ padding: '10px 15px' }} onClick={closeMenu}>
                    <FaUser style={{ marginRight: '8px' }} /> Signup
                  </Link>
                </li>

              </>
            )}
          </ul>
        </div>
      </div>

      {/* Sidebar for mobile view */}
      <div
        className={`mobile-sidebar ${isMenuOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: isMenuOpen ? '0' : '-100%',
          width: '280px',
          height: '100%',
          backgroundColor: '#1b558b',
          transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1050,
          boxShadow: isMenuOpen ? '5px 0 15px rgba(0,0,0,0.3)' : 'none',
          padding: '2rem 1rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button onClick={closeMenu} style={{ background: 'none', border: 'none', color: 'white' }}>
            <FaTimes size={24} />
          </button>
        </div>

        <ul className="navbar-nav" style={{ width: '100%' }}>
          {isLoggedIn ? (
            <>
              <li className="nav-item" style={{ marginBottom: '10px' }}>
                <Link className="nav-link" to="/dashboard" style={{ padding: '15px', fontSize: '1.1rem', color: 'white' }} onClick={closeMenu}>
                  <FaBars className="me-2" /> Dashboard
                </Link>
              </li>
              <li className="nav-item" style={{ marginBottom: '10px' }}>
                <Link className="nav-link" to="/blood-request-check" style={{ padding: '15px', fontSize: '1.1rem', color: 'white' }} onClick={closeMenu}>
                  <FaCheckCircle className="me-2" /> Check Request
                </Link>
              </li>
              <li className="nav-item" style={{ marginBottom: '10px' }}>
                <Link className="nav-link" to="/blood-donation-check" style={{ padding: '15px', fontSize: '1.1rem', color: 'white' }} onClick={closeMenu}>
                  <FaSearch className="me-2" /> Find Donors
                </Link>
              </li>
              <li className="nav-item" style={{ marginBottom: '10px' }}>
                <Link className="nav-link" to="/cart" style={{ padding: '15px', fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center' }} onClick={closeMenu}>
                  <div style={{ position: 'relative', marginRight: '8px' }}>
                    <FaShoppingCart />
                    {cartCount > 0 && (
                      <span className="badge rounded-pill bg-danger" style={{ position: 'absolute', top: '-8px', right: '-12px', fontSize: '0.6rem' }}>
                        {cartCount}
                      </span>
                    )}
                  </div>
                  Cart
                </Link>
              </li>
              <li className="nav-item" style={{ marginBottom: '10px' }}>
                <Link className="nav-link" to="/notifications" style={{ padding: '15px', fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center' }} onClick={closeMenu}>
                  <div style={{ position: 'relative', marginRight: '8px' }}>
                    <FaBell />
                    {unreadCount > 0 && (
                      <span className="badge rounded-pill bg-danger" style={{ position: 'absolute', top: '-8px', right: '-12px', fontSize: '0.6rem' }}>
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  Notifications
                </Link>
              </li>
              <li className="nav-item" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <div style={{ color: 'white', padding: '10px 15px' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{authuser?.userName}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>{authuser?.userEmail}</p>
                  <p style={{ margin: '5px 0 0', fontSize: '0.8rem', opacity: 0.6 }}><strong>Role:</strong> {authuser?.userType}</p>
                </div>
                <div style={{ padding: '0 15px' }}>
                  <Link 
                    to={authuser?.userType === 'admin' ? '/admin-dashboard' : authuser?.userType === 'doctor' ? '/doctor-screen' : '/profile'} 
                    style={{ display: 'block', margin: '15px 0', textDecoration: 'none', color: 'white', fontSize: '1rem' }} 
                    onClick={closeMenu}
                  >
                    <FaUser className="me-2" /> My Profile
                  </Link>
                </div>
                <button
                  className="btn btn-danger w-100 mt-3"
                  onClick={handleLogout}
                  style={{ borderRadius: '10px', padding: '12px' }}
                >
                  <FaSignOutAlt className="me-2" /> Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/" style={{ padding: '15px', fontSize: '1.1rem', color: 'white' }} onClick={closeMenu}>
                  <FaUser className="me-2" /> Signup
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div
          onClick={closeMenu}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1040,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}
    </nav>
  );
}

export default Header;
