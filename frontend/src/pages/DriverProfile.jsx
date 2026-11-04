import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loading, ErrorState } from '../components/PageState';
import { API_URL } from '../api';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '—');

const Section = ({ title, rows }) => (
  <section className="card h-100">
    <div className="card-body">
      <h2 className="h5 text-primary mb-3">{title}</h2>
      <dl className="detail-list mb-0">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  </section>
);

const DriverProfile = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [picture, setPicture] = useState(null);
  const [pictureChanged, setPictureChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/drivers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch driver data');
      setDriver(data);
      setPicture(data.profilePicture || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPicture(reader.result);
      setPictureChanged(true);
      setNotice(null);
    };
    reader.readAsDataURL(file);
  };

  const savePicture = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch(`${API_URL}/drivers/upload-profile-picture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ profilePicture: picture }),
      });
      if (!response.ok) throw new Error('Failed to update profile picture');
      const updated = await response.json();
      setPicture(updated.profilePicture);
      setPictureChanged(false);
      setNotice({ type: 'success', text: 'Profile picture updated.' });
    } catch (err) {
      setNotice({ type: 'danger', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const initials = driver ? `${driver.firstName?.[0] || ''}${driver.lastName?.[0] || ''}` : '';

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="container flex-grow-1 py-5" style={{ maxWidth: 960 }}>
        {loading ? (
          <Loading label="Loading your profile…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <>
            <div className="profile-head">
              <label className="avatar" title="Change picture">
                {picture ? <img src={picture} alt="Your profile" /> : <span aria-hidden="true">{initials}</span>}
                <input type="file" accept="image/*" onChange={handleFileChange} className="visually-hidden" aria-label="Choose a new profile picture" />
              </label>
              <div>
                <h1 className="page-title mb-1">{driver.firstName} {driver.lastName}</h1>
                <p className="text-muted mb-2">{driver.email}</p>
                {pictureChanged && (
                  <button type="button" className="btn btn-success btn-sm" onClick={savePicture} disabled={saving}>
                    {saving ? 'Saving…' : 'Save picture'}
                  </button>
                )}
              </div>
            </div>

            {notice && <div className={`alert alert-${notice.type}`} role="status">{notice.text}</div>}

            <div className="row g-4">
              <div className="col-md-6">
                <Section
                  title="Personal"
                  rows={[
                    ['First name', driver.firstName],
                    ['Middle name', driver.middleName],
                    ['Last name', driver.lastName],
                    ['NIC', driver.nic],
                    ['Birthday', formatDate(driver.birthday)],
                    ['Nationality', driver.nationality],
                  ]}
                />
              </div>
              <div className="col-md-6">
                <Section
                  title="Employment"
                  rows={[
                    ['Employee ID', driver.employeeId],
                    ['Type', driver.employeeType],
                    ['Status', driver.employeeStatus],
                    ['Joined', formatDate(driver.joinedDate)],
                    ['Account status', driver.status],
                    ['Vehicle', driver.vehicleCategory],
                  ]}
                />
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DriverProfile;
