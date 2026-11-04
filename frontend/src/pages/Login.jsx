import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import logo from '../assets/logo.png';
import { API_URL } from '../api';

const emptyForm = { name: '', email: '', password: '', address: '', phone: '' };

// MVP shortcut: one-click logins for the seeded demo accounts (hide with VITE_DEMO_LOGIN=false)
const SHOW_QUICK_LOGIN = import.meta.env.VITE_DEMO_LOGIN !== 'false';
const DEMO_PASSWORD = 'Demo@1234';
const QUICK_LOGINS = [
  { key: 'driver', label: 'Driver', hint: 'Pickups & map', role: 'driver', email: 'driver@demo.lk', to: '/home' },
  { key: 'customer', label: 'Customer', hint: 'Book a pickup', role: 'user', email: 'customer@demo.lk', to: '/schedule-pickup' },
  { key: 'admin', label: 'Admin', hint: 'Assign & route', role: 'driver', email: 'driver@demo.lk', to: '/admin-dashboard' },
];

const Login = () => {
  const [role, setRole] = useState('driver'); // 'driver' | 'user'
  const [register, setRegister] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Shared by the form and the quick-login buttons
  const signIn = async (asRole, credentials, to) => {
    setError('');
    setIsSubmitting(true);
    try {
      let data;
      if (asRole === 'driver') {
        ({ data } = await axios.post(`${API_URL}/drivers/login`, credentials));
        localStorage.setItem('driverName', data.driver.name || data.driver.firstName);
      } else {
        ({ data } = await axios.post(`${API_URL}/users/${register ? 'register' : 'login'}`, register ? formData : credentials));
        localStorage.setItem('driverName', data.name);
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', asRole);
      navigate(to || (asRole === 'driver' ? '/home' : '/schedule-pickup'));
    } catch (err) {
      setError(err.response?.data?.error || (err.request ? 'Cannot reach the server. Is the API running on port 5001?' : err.message) || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signIn(role, { email: formData.email, password: formData.password });
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const switchRole = (r) => {
    setRole(r);
    setRegister(false);
    setError('');
  };

  const field = (name, label, type = 'text', autoComplete) => (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">{label}</label>
      <input type={type} className="form-control" id={name} name={name} value={formData[name]} onChange={handleInputChange} required autoComplete={autoComplete} />
    </div>
  );

  return (
    <div className="min-vh-100">
      <Navbar />
      <main className="container pb-5">
        <div className="auth">
          <aside className="auth__brand">
            <img src={logo} alt="Yakadabadu.lk" />
            <h2>Scrap out. <em>Cash in.</em></h2>
          </aside>

          <div className="auth__form">
            <div className="segmented mb-4" role="tablist" aria-label="Account type">
              {[['driver', 'Driver'], ['user', 'Customer']].map(([r, label]) => (
                <button key={r} type="button" role="tab" aria-selected={role === r} className={role === r ? 'is-active' : ''} onClick={() => switchRole(r)}>
                  {label}
                </button>
              ))}
            </div>

            <h1 className="h2 mb-1">{register ? 'Create your account' : 'Welcome back'}</h1>
            <p className="text-muted mb-4">
              {role === 'driver' ? 'Log in to see your pickups.' : register ? 'It takes less than a minute.' : 'Log in to schedule a pickup.'}
            </p>

            {SHOW_QUICK_LOGIN && (
              <div className="quick">
                <div className="quick__title">Quick login <span>MVP demo</span></div>
                <div className="quick__row">
                  {QUICK_LOGINS.map((q) => (
                    <button
                      key={q.key}
                      type="button"
                      className="quick__btn"
                      disabled={isSubmitting}
                      onClick={() => signIn(q.role, { email: q.email, password: DEMO_PASSWORD }, q.to)}
                    >
                      <strong>{q.label}</strong>
                      <small>{q.hint}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <form onSubmit={handleSubmit}>
              {role === 'user' && register && field('name', 'Name', 'text', 'name')}
              {field('email', 'Email', 'email', 'username')}
              {field('password', 'Password', 'password', register ? 'new-password' : 'current-password')}
              {role === 'user' && register && field('address', 'Address', 'text', 'street-address')}
              {role === 'user' && register && field('phone', 'Phone', 'tel', 'tel')}

              <button type="submit" className="btn btn-success w-100 py-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                    Please wait…
                  </>
                ) : register ? 'Register' : 'Log in'}
              </button>
            </form>

            {role === 'user' && (
              <button type="button" className="btn btn-link w-100 mt-2 text-decoration-none" onClick={() => { setRegister(!register); setError(''); }}>
                {register ? 'Already have an account? Log in' : 'New here? Create an account'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
