import React from 'react';
import { toast } from 'react-toastify';
import { http, errorMessage } from '../api';

// Inline driver picker used wherever an admin can dispatch a pickup
const AssignSelect = ({ pickup, drivers, onAssigned, size = 'sm' }) => {
  const locked = ['completed', 'cancelled'].includes(pickup.status);
  const current = pickup.driver?._id || pickup.driver || '';

  const assign = async (driverId) => {
    if (!driverId) return;
    try {
      await http.post('/pickups/assign', { pickupId: pickup._id, driverId });
      toast.success('Driver assigned. They have been notified.');
      onAssigned?.();
    } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <select className={`form-select form-select-${size}`} aria-label={`Driver for ${pickup.address}`} disabled={locked} value={current} onChange={(e) => assign(e.target.value)} style={{ minWidth: 170 }}>
      <option value="">{locked ? '—' : 'Assign driver…'}</option>
      {drivers.filter((d) => d.role === 'driver').map((d) => (
        <option key={d._id} value={d._id} disabled={d.status === 'unavailable' || d.employeeStatus !== 'Active'}>
          {d.name}{d.status === 'unavailable' ? ' (unavailable)' : d.employeeStatus !== 'Active' ? ` (${d.employeeStatus.toLowerCase()})` : ''}
        </option>
      ))}
    </select>
  );
};

export default AssignSelect;
