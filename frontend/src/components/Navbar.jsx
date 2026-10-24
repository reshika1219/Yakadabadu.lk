// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const driverName = localStorage.getItem('driverName');

  const handleLogout = () => {
    ['token', 'driverName', 'role'].forEach((k) => localStorage.removeItem(k));
    navigate('/');
  };

  return (
    <nav style={{ backgroundColor: '#144A20' }} className="navbar navbar-expand-md navbar-dark">
      <div className="container">
        <Link to="/">
          <img src={logo} alt="Logo" style={{ width: '80px', height: '40px', marginRight: '20px' }} />
        </Link>

        <ul className="navbar-nav ms-auto flex-row align-items-center">
          {driverName && (
            <li className="nav-item me-3">
              <span className="nav-link text-white">Welcome, {driverName}</span>
            </li>
          )}
          <li className="nav-item">
            {token ? (
              <button className="btn btn-link text-white" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <Link className="btn btn-link text-white" to="/login">Login</Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
