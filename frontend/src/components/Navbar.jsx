// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const name = localStorage.getItem('driverName');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    ['token', 'driverName', 'role'].forEach((k) => localStorage.removeItem(k));
    navigate('/');
  };

  return (
    <header className="site-nav">
      <nav className="container" aria-label="Main"><div className="site-nav__inner">
        <Link to="/" aria-label="Yakadabadu.lk home">
          <img src={logo} alt="" className="site-nav__logo" />
        </Link>

        <div className="site-nav__actions">
          {token && role === 'user' && (
            <Link className="site-nav__link" to="/schedule-pickup">Schedule pickup</Link>
          )}
          {token && role === 'driver' && (
            <Link className="site-nav__link" to="/home">Dashboard</Link>
          )}
          {name && <span className="site-nav__user d-none d-sm-inline">Hi, {name}</span>}
          {token ? (
            <button type="button" className="site-nav__btn" onClick={handleLogout}>Log out</button>
          ) : (
            <Link className="site-nav__btn" to="/login">Log in</Link>
          )}
        </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
