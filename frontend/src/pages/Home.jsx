// frontend/src/pages/Home.jsx
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const driverName = localStorage.getItem('driverName');

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="container flex-grow-1 py-5">
        <h1 className="page-title mb-1">Hello, {driverName || 'Driver'}</h1>
        <p className="text-muted mb-4">What would you like to do today?</p>

        <div className="row g-3">
          {[
            ['Today\'s pickups', 'See your assigned stops and mark them done.', '/driver-dashboard'],
            ['My profile', 'View and update your details.', '/driver-profile'],
          ].map(([title, desc, path]) => (
            <div className="col-md-6" key={path}>
              <button type="button" className="tile" onClick={() => navigate(path)}>
                <strong>{title}</strong>
                <span>{desc}</span>
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;