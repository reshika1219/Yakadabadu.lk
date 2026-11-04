import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MapComponent from '../components/MapComponent';
import { Loading, ErrorState, Empty, StatusPill } from '../components/PageState';
import { API_URL } from '../api';

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const AdminDashboard = () => {
  const [drivers, setDrivers] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'danger', text }
  const [route, setRoute] = useState(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [optimizing, setOptimizing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [driverRes, pickupRes] = await Promise.all([
        axios.get(`${API_URL}/drivers`, authHeaders()),
        axios.get(`${API_URL}/pickups`, authHeaders()),
      ]);
      setDrivers(driverRes.data);
      setPickups(pickupRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load pickups and drivers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const assignDriver = async (pickupId, driverId) => {
    if (!driverId) return;
    setNotice(null);
    try {
      await axios.post(`${API_URL}/pickups/assign`, { pickupId, driverId }, authHeaders());
      setPickups((prev) =>
        prev.map((p) => (p._id === pickupId ? { ...p, driver: driverId, status: 'assigned' } : p))
      );
      setNotice({ type: 'success', text: 'Driver assigned.' });
    } catch (err) {
      setNotice({ type: 'danger', text: err.response?.data?.error || 'Could not assign that driver.' });
    }
  };

  const optimizeRoute = async (e) => {
    e.preventDefault();
    setNotice(null);
    setOptimizing(true);
    try {
      const res = await axios.post(`${API_URL}/pickups/optimize-route`, { origin, destination }, authHeaders());
      setRoute(res.data.optimizedRoute);
    } catch (err) {
      setNotice({ type: 'danger', text: err.response?.data?.error || 'Could not optimise that route.' });
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <main className="container flex-grow-1 py-4">
        <h1 className="h2 fw-bold text-primary mb-4">Admin dashboard</h1>

        {notice && <div className={`alert alert-${notice.type}`} role={notice.type === 'danger' ? 'alert' : 'status'}>{notice.text}</div>}

        <section className="mb-5" aria-labelledby="assign-heading">
          <h2 id="assign-heading" className="h4 mb-3">Assign pickups</h2>
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : pickups.length === 0 ? (
            <Empty title="No pickups yet" hint="Customer requests will appear here." />
          ) : (
            <div className="card">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Type</th>
                      <th scope="col">Address</th>
                      <th scope="col">Status</th>
                      <th scope="col">Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickups.map((pickup) => (
                      <tr key={pickup._id}>
                        <td className="text-capitalize">{pickup.pickupType}</td>
                        <td>{pickup.address}</td>
                        <td><StatusPill status={pickup.status} /></td>
                        <td style={{ minWidth: 180 }}>
                          <select
                            className="form-select form-select-sm"
                            aria-label={`Driver for ${pickup.address}`}
                            value={pickup.driver || ''}
                            onChange={(e) => assignDriver(pickup._id, e.target.value)}
                          >
                            <option value="">Select driver</option>
                            {drivers.map((driver) => (
                              <option key={driver._id} value={driver._id}>{driver.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="route-heading">
          <h2 id="route-heading" className="h4 mb-3">Optimise route</h2>
          <form className="card card-body" onSubmit={optimizeRoute}>
            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label htmlFor="origin" className="form-label">Origin</label>
                <input id="origin" className="form-control" value={origin} onChange={(e) => setOrigin(e.target.value)} required />
              </div>
              <div className="col-md-5">
                <label htmlFor="destination" className="form-label">Destination</label>
                <input id="destination" className="form-control" value={destination} onChange={(e) => setDestination(e.target.value)} required />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-success w-100" disabled={optimizing}>
                  {optimizing ? 'Working…' : 'Optimise'}
                </button>
              </div>
            </div>
          </form>

          {route && (
            <div className="mt-4">
              <div className="map-frame mb-3"><MapComponent route={route} /></div>
              <details className="card card-body">
                <summary className="fw-semibold">Route details</summary>
                <pre className="mt-3 mb-0 small">{JSON.stringify(route, null, 2)}</pre>
              </details>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
