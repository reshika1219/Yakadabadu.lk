import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { API_URL } from '../api';

const emptyForm = { name: '', email: '', password: '', address: '', phone: '' };

const Login = () => {
  const [role, setRole] = useState('driver'); // 'driver' | 'user'
  const [register, setRegister] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let data;
      if (role === 'driver') {
        ({ data } = await axios.post(`${API_URL}/drivers/login`, {
          email: formData.email,
          password: formData.password,
        }));
        localStorage.setItem('driverName', data.driver.name);
      } else {
        ({ data } = await axios.post(
          `${API_URL}/users/${register ? 'register' : 'login'}`,
          register ? formData : { email: formData.email, password: formData.password }
        ));
        localStorage.setItem('driverName', data.name);
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', role);
      navigate(role === 'driver' ? '/home' : '/schedule-pickup');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const switchRole = (r) => {
    setRole(r);
    setRegister(false);
    setError('');
  };

  const field = (name, label, type = 'text', autoComplete) => (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">{label}</label>
      <input
        type={type}
        className="form-control"
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        required
        autoComplete={autoComplete}
      />
    </div>
  );

  return (
    <div className="bg-light min-vh-100">
      <Navbar />
      <main className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg">
              <div className="card-body p-4">
                <div className="segmented mb-4" role="tablist" aria-label="Account type">
                  {[['driver', 'Driver'], ['user', 'Customer']].map(([r, label]) => (
                    <button
                      key={r}
                      type="button"
                      role="tab"
                      aria-selected={role === r}
                      className={role === r ? 'is-active' : ''}
                      onClick={() => switchRole(r)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <h1 className="h3 text-center mb-1 fw-bold text-primary">
                  {role === 'driver' ? 'Welcome back' : register ? 'Create your account' : 'Welcome back'}
                </h1>
                <p className="text-center text-muted mb-4">
                  {role === 'driver' ? 'Log in to see your pickups.' : register ? 'It takes less than a minute.' : 'Log in to schedule a pickup.'}
                </p>
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
                        Please wait...
                      </>
                    ) : register ? 'Register' : 'Login'}
                  </button>
                </form>

                {role === 'user' && (
                  <button type="button" className="btn btn-link w-100 mt-2" onClick={() => { setRegister(!register); setError(''); }}>
                    {register ? 'Already have an account? Login' : 'New here? Create an account'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
