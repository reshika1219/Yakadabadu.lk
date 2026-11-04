import React, { useState } from 'react';
import { LuRoute, LuTruck } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { dayLabel, MATERIALS } from '../../lib/format';
import { PageHeader, Card, Field, Loading, ErrorState, Pill, Empty } from '../../components/ui';
import MapComponent from '../../components/MapComponent';
import AssignSelect from '../../components/AssignSelect';

const Dispatch = () => {
  const pickups = useFetch('/pickups?status=pending,assigned,on-the-way');
  const drivers = useFetch('/drivers');
  const [route, setRoute] = useState(null);
  const [form, setForm] = useState({ origin: '', destination: '' });
  const [busy, setBusy] = useState(false);

  const optimise = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { const { data } = await http.post('/pickups/optimize-route', form); setRoute(data.optimizedRoute); toast.success('Route calculated'); }
    catch (err) { toast.error(errorMessage(err, 'Route optimisation needs a Google Maps API key on the server.')); }
    finally { setBusy(false); }
  };

  if (pickups.loading) return <Loading />;
  if (pickups.error) return <ErrorState message={pickups.error} onRetry={pickups.reload} />;
  const staff = (drivers.data || []).filter((d) => d.role === 'driver');

  return (
    <>
      <PageHeader title="Dispatch map" subtitle="Open pickups on the map, who is on duty, and a route planner." />
      <div className="grid-main">
        <div className="stack">
          <Card title={`${pickups.data.length} open pickups`} flush><MapComponent pickups={pickups.data} route={route} height={440} /></Card>
          <Card title="Pickups to dispatch" flush>
            {pickups.data.length ? (
              <ul className="rows">{pickups.data.slice(0, 12).map((p) => (
                <li className="row-item flex-wrap" key={p._id}>
                  <div className="row-item__main"><div className="row-item__title">{p.customerName} <Pill status={p.status} /></div><div className="row-item__sub">{p.address} · {MATERIALS[p.pickupType]?.label} · {dayLabel(p.scheduledTime)}</div></div>
                  {drivers.data && <AssignSelect pickup={p} drivers={drivers.data} onAssigned={() => { pickups.reload(); drivers.reload(); }} />}
                </li>
              ))}</ul>
            ) : <div className="p-3"><Empty title="Nothing to dispatch" /></div>}
          </Card>
        </div>
        <div className="stack">
          <Card title="Drivers on duty">
            <ul className="list-unstyled mb-0 d-grid gap-3">
              {staff.map((d) => (
                <li key={d._id} className="d-flex justify-content-between align-items-center gap-2">
                  <div><strong>{d.name}</strong><div className="text-muted small"><LuTruck aria-hidden="true" /> {d.vehicleCategory} {d.vehicleNumber}</div></div>
                  <div className="text-end"><span className={`pill ${d.status === 'available' ? 'pill--ok' : d.status === 'on-route' ? 'pill--info' : 'pill--muted'}`}>{d.status}</span><div className="text-muted small">{d.stats.assigned} active</div></div>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Route planner">
            <form onSubmit={optimise}>
              <Field label="Origin" htmlFor="o"><input id="o" className="form-control" required placeholder="Depot or first stop" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} /></Field>
              <Field label="Destination" htmlFor="d"><input id="d" className="form-control" required placeholder="Final stop" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></Field>
              <button type="submit" className="btn btn-success w-100" disabled={busy}><LuRoute aria-hidden="true" /> {busy ? 'Calculating…' : 'Plan route'}</button>
              {route && <p className="small text-muted mt-2 mb-0">{route.legs?.[0]?.distance?.text} · {route.legs?.[0]?.duration?.text}. The route is drawn on the map.</p>}
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dispatch;
