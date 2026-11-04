import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuReceipt, LuCalendarClock, LuPhone, LuTruck, LuBan, LuStar } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { MATERIALS, SLOTS, SCALES, RETURN_OPTIONS, money, fmtDate, fmtDateTime, isoDate, STATUS } from '../../lib/format';
import { PageHeader, Card, Pill, Timeline, Stars, Dialog, Field, Loading, ErrorState } from '../../components/ui';
import MapComponent from '../../components/MapComponent';

const FLOW = ['pending', 'assigned', 'on-the-way', 'completed'];

const PickupDetail = () => {
  const { id } = useParams();
  const { data: p, loading, error, reload } = useFetch(`/pickups/${id}`);
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [resched, setResched] = useState({ scheduledTime: '', timeSlot: 'morning' });
  const [rating, setRating] = useState({ stars: 0, feedback: '' });

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const open = ['pending', 'assigned'].includes(p.status);
  const step = FLOW.indexOf(p.status);

  const act = async (fn, done) => {
    setBusy(true);
    try { await fn(); toast.success(done); setDialog(null); reload(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader back={{ to: '/app/pickups', label: 'My pickups' }} title={`${MATERIALS[p.pickupType]?.label} pickup`} subtitle={`${fmtDate(p.scheduledTime, { weekday: 'long', day: 'numeric', month: 'long' })} · ${SLOTS[p.timeSlot]}`}
        actions={<>
          <Pill status={p.status} />
          {p.status === 'completed' && <Link to={`/app/pickups/${p._id}/invoice`} className="btn btn-outline-success btn-sm"><LuReceipt aria-hidden="true" /> Invoice</Link>}
        </>} />

      {p.status !== 'cancelled' && (
        <div className="progress-track" aria-label="Pickup progress">
          {FLOW.map((s, i) => (
            <div key={s} className={`progress-track__step ${i <= step ? 'is-done' : ''}`}><span /><small>{STATUS[s].label}</small></div>
          ))}
        </div>
      )}

      <div className="grid-main">
        <div className="stack">
          {p.status === 'on-the-way' && (
            <div className="estimate"><small>Your driver is on the way</small><strong><LuTruck aria-hidden="true" /> {p.driver?.name}</strong><small>Please keep your items ready at the pickup location.</small></div>
          )}
          {p.status === 'completed' && (
            <Card title="Result">
              <div className="stat-grid mb-0">
                <div><span className="text-muted small">Weight collected</span><div className="stat__value">{p.weight} kg</div></div>
                <div><span className="text-muted small">You received</span><div className="stat__value">{p.returnOption === 'cash' ? money(p.amount) : RETURN_OPTIONS.find((r) => r[0] === p.returnOption)?.[1]}</div></div>
              </div>
            </Card>
          )}
          {p.status === 'cancelled' && <div className="alert alert-danger mb-0"><strong>Cancelled{p.cancelledBy ? ` by ${p.cancelledBy === 'user' ? 'you' : p.cancelledBy}` : ''}.</strong> {p.cancelReason}</div>}

          <Card title="Details">
            <dl className="kv">
              <div><dt>Address</dt><dd>{p.address}</dd></div>
              <div><dt>Material</dt><dd>{MATERIALS[p.pickupType]?.label}</dd></div>
              <div><dt>Size</dt><dd>{SCALES.find((s) => s[0] === p.scale)?.[1] || '—'}</dd></div>
              <div><dt>In return</dt><dd>{RETURN_OPTIONS.find((r) => r[0] === p.returnOption)?.[1] || '—'}</dd></div>
              {p.estimatedAmount != null && p.status !== 'completed' && <div><dt>Estimated value</dt><dd>~{money(p.estimatedAmount)}</dd></div>}
              {p.instructions && <div><dt>Instructions</dt><dd>{p.instructions}</dd></div>}
            </dl>
          </Card>

          <Card title="Location" flush><MapComponent pickups={[p]} height={240} /></Card>

          {p.status === 'completed' && (
            <Card title="Your rating">
              {p.rating?.stars ? (
                <><Stars value={p.rating.stars} /><p className="mt-2 mb-0">{p.rating.feedback || 'No comment left.'}</p><div className="text-muted small">Rated {fmtDate(p.rating.at)}</div></>
              ) : (
                <><p className="text-muted">How was {p.driver?.firstName ? `${p.driver.firstName}'s` : 'the'} service?</p>
                  <button type="button" className="btn btn-success" onClick={() => setDialog('rate')}><LuStar aria-hidden="true" /> Rate this pickup</button></>
              )}
            </Card>
          )}
        </div>

        <div className="stack">
          {open && (
            <Card title="Manage">
              <div className="d-grid gap-2">
                <button type="button" className="btn btn-outline-success" onClick={() => { setResched({ scheduledTime: isoDate(p.scheduledTime), timeSlot: p.timeSlot }); setDialog('resched'); }}><LuCalendarClock aria-hidden="true" /> Reschedule</button>
                <button type="button" className="btn btn-outline-danger" onClick={() => setDialog('cancel')}><LuBan aria-hidden="true" /> Cancel pickup</button>
              </div>
            </Card>
          )}
          {p.driver && (
            <Card title="Your driver">
              <strong>{p.driver.name}</strong>
              <div className="text-muted small">{p.driver.vehicleCategory} {p.driver.vehicleNumber && `· ${p.driver.vehicleNumber}`}</div>
              {p.driver.phone && p.status !== 'completed' && <a className="btn btn-outline-success btn-sm mt-2" href={`tel:${p.driver.phone}`}><LuPhone aria-hidden="true" /> Call {p.driver.firstName}</a>}
            </Card>
          )}
          <Card title="Activity"><Timeline events={p.timeline} /></Card>
          <p className="text-muted small px-1">Booked {fmtDateTime(p.createdAt)}</p>
        </div>
      </div>

      <Dialog show={dialog === 'cancel'} onClose={() => setDialog(null)} title="Cancel this pickup?" footer={(
        <><button type="button" className="btn btn-light" onClick={() => setDialog(null)}>Keep pickup</button>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={() => act(() => http.put(`/pickups/${id}/cancel`, { reason }), 'Pickup cancelled')}>Cancel pickup</button></>
      )}>
        <Field label="Reason (optional)" htmlFor="reason"><textarea id="reason" rows={3} className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let us know why so we can improve" /></Field>
      </Dialog>

      <Dialog show={dialog === 'resched'} onClose={() => setDialog(null)} title="Reschedule pickup" footer={(
        <><button type="button" className="btn btn-light" onClick={() => setDialog(null)}>Back</button>
          <button type="button" className="btn btn-success" disabled={busy || !resched.scheduledTime} onClick={() => act(() => http.put(`/pickups/${id}/reschedule`, resched), 'Pickup rescheduled')}>Save new time</button></>
      )}>
        <Field label="New date" htmlFor="rd"><input id="rd" type="date" min={isoDate()} className="form-control" value={resched.scheduledTime} onChange={(e) => setResched({ ...resched, scheduledTime: e.target.value })} /></Field>
        <Field label="Time slot" htmlFor="rs"><select id="rs" className="form-select" value={resched.timeSlot} onChange={(e) => setResched({ ...resched, timeSlot: e.target.value })}>{Object.entries(SLOTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      </Dialog>

      <Dialog show={dialog === 'rate'} onClose={() => setDialog(null)} title="Rate your pickup" footer={(
        <><button type="button" className="btn btn-light" onClick={() => setDialog(null)}>Later</button>
          <button type="button" className="btn btn-success" disabled={busy || !rating.stars} onClick={() => act(() => http.post(`/pickups/${id}/rate`, rating), 'Thanks for your feedback')}>Submit</button></>
      )}>
        <div className="text-center mb-3"><Stars value={rating.stars} onChange={(stars) => setRating({ ...rating, stars })} size={34} /></div>
        <Field label="Comments (optional)" htmlFor="fb"><textarea id="fb" rows={3} className="form-control" value={rating.feedback} onChange={(e) => setRating({ ...rating, feedback: e.target.value })} /></Field>
      </Dialog>
    </>
  );
};

export default PickupDetail;
