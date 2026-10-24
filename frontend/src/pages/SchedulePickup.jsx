import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import scheduleImage from '../images/schedule.jpg';
import { API_URL } from '../api';

const ENDPOINT = `${API_URL}/pickups/add`;

const emptyPickup = {
  itemType: '',
  scale: '',
  customerName: '',
  contactNumber: '',
  address: '',
  pickupDate: '',
  returnOption: '',
};

const today = () => new Date().toISOString().split('T')[0];

function SchedulePickup() {
  const [pickup, setPickup] = useState(emptyPickup);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) =>
    setPickup({ ...pickup, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const { pickupDate, ...rest } = pickup;
      await axios.post(
        ENDPOINT,
        { ...rest, pickupType: pickup.itemType, scheduledTime: pickupDate },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSuccess(true);
      setPickup(emptyPickup);
    } catch (err) {
      setError(err.response?.data?.error || 'Error scheduling pickup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const select = (name, label, options) => (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">{label}</label>
      <select id={name} name={name} className="form-select" value={pickup[name]} onChange={handleInputChange} required>
        <option value="" disabled>Select...</option>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </div>
  );

  const input = (name, label, props = {}) => (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">{label}</label>
      <input id={name} name={name} className="form-control" value={pickup[name]} onChange={handleInputChange} required {...props} />
    </div>
  );

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="container flex-grow-1 py-5">
        <div className="card shadow">
          <div className="row g-0">
            <div className="col-md-5 d-none d-md-block">
              <img src={scheduleImage} alt="Yakadabadu.lk" className="w-100 h-100" style={{ objectFit: 'cover' }} />
            </div>
            <div className="col-md-7 p-4">
              <h2 className="fw-bold">Schedule Pickup</h2>
              <p className="text-muted">We help you with your waste management!</p>

              {success && <div className="alert alert-success">Pickup scheduled successfully!</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                {select('itemType', 'Item Type', [['metal', 'Metal'], ['plastic', 'Plastic'], ['wood', 'Wood']])}
                {select('scale', 'Scale', [
                  ['small', 'Small (Less than 5kg)'],
                  ['medium', 'Medium (5-10kg)'],
                  ['large', 'Large (10-20kg)'],
                  ['extra-large', 'Extra Large (Above 20kg)'],
                ])}
                {input('customerName', 'Customer Name')}
                {input('contactNumber', 'Contact Number', { type: 'tel' })}
                {input('address', 'Address')}
                {input('pickupDate', 'Preferred Pickup Date', { type: 'date', min: today() })}
                {select('returnOption', 'What do you want in return?', [
                  ['broom', 'Broom'],
                  ['basin', 'Basin'],
                  ['cash', 'Cash (Amount depends on the item scale)'],
                  ['nothing', 'I want nothing—just take these and leave'],
                ])}
                <button type="submit" className="btn btn-success w-100 py-2 fw-bold" disabled={submitting}>
                  {submitting ? 'Scheduling...' : 'Schedule Pickup'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SchedulePickup;
