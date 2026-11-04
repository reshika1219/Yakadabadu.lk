import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from '../components/MapComponent';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PickupListPDF from '../components/PickupListPDF';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PickupConfirmationModal from '../components/PickupConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../api';
import { Loading, ErrorState, Empty, StatusPill } from '../components/PageState';

const DriverDashboard = () => {
  const [location] = useState({ lat: 6.9271, lng: 79.8612 });
  const [pickups, setPickups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPickup, setCurrentPickup] = useState(null);
  const [actionMode, setActionMode] = useState('confirm');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const navigate = useNavigate();

  // Authenticated JSON request; an expired token sends the driver back to login
  const request = useCallback(async (path, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    });
    if (response.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
      return null;
    }
    if (!response.ok) throw new Error('The server could not complete that request.');
    return response.json();
  }, [navigate]);

  const loadPickups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request('/pickups/me');
      if (data) setPickups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { loadPickups(); }, [loadPickups]);

  const updatePickup = async (action, body) => {
    setActionError(null);
    try {
      const updated = await request(`/pickups/${currentPickup._id}/${action}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      if (updated) setPickups((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } catch (err) {
      setActionError(`Could not ${action} the pickup. ${err.message}`);
    }
  };

  const openModal = (pickup, mode) => {
    setCurrentPickup(pickup);
    setActionMode(mode);
    setShowModal(true);
  };

  const open = pickups.filter((p) => p.status === 'assigned').length;

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="flex-grow-1 container py-4">
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
          <div>
            <h1 className="h2 fw-bold text-primary mb-1">Today&rsquo;s pickups</h1>
            <p className="text-muted mb-0">{loading ? 'Loading…' : `${open} waiting, ${pickups.length} total`}</p>
          </div>
          {pickups.length > 0 && (
            <PDFDownloadLink document={<PickupListPDF pickups={pickups} />} fileName="assigned_pickups.pdf">
              {({ loading: generating }) => (
                <button type="button" className="btn btn-outline-success" disabled={generating}>
                  {generating ? 'Preparing PDF…' : 'Download list (PDF)'}
                </button>
              )}
            </PDFDownloadLink>
          )}
        </div>

        <div className="map-frame mb-4">
          <MapComponent location={location} />
        </div>

        {actionError && <div className="alert alert-danger" role="alert">{actionError}</div>}

        {loading ? (
          <Loading label="Loading your pickups…" />
        ) : error ? (
          <ErrorState message={error} onRetry={loadPickups} />
        ) : pickups.length === 0 ? (
          <Empty
            title={new Date().getHours() < 18 ? 'No pickups assigned today' : 'No upcoming pickups'}
            hint="New assignments will show up here."
          />
        ) : (
          <ul className="list-unstyled d-grid gap-3">
            {pickups.map((pickup) => (
              <li key={pickup._id} className="card">
                <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h2 className="h5 mb-0">{pickup.user?.name || 'Customer'}</h2>
                      <StatusPill status={pickup.status} />
                    </div>
                    <div>{pickup.address}</div>
                    <small className="text-muted">{new Date(pickup.scheduledTime).toLocaleString()}</small>
                  </div>
                  {pickup.status === 'assigned' && (
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-success" onClick={() => openModal(pickup, 'confirm')}>Complete</button>
                      <button type="button" className="btn btn-outline-danger" onClick={() => openModal(pickup, 'cancel')}>Cancel</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
      <PickupConfirmationModal
        show={showModal}
        onConfirm={(data) => updatePickup('confirm', data)}
        onCancel={(reason) => updatePickup('cancel', { reason })}
        onClose={() => setShowModal(false)}
        mode={actionMode}
      />
    </div>
  );
};

export default DriverDashboard;
