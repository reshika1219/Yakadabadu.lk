import React, { useState } from 'react';
import { LuPlay, LuCheck, LuBan, LuNavigation, LuPhone } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../api';
import { Dialog, Field } from './ui';
import { money, MATERIALS } from '../lib/format';

// Start / complete / cancel workflow shared by the driver dashboard and pickups list
export const useDriverActions = (onChanged) => {
  const [dialog, setDialog] = useState(null); // { type: 'complete' | 'cancel', pickup }
  const [busy, setBusy] = useState(false);
  const rates = useFetch('/rates');

  const run = async (fn, done) => {
    setBusy(true);
    try { await fn(); toast.success(done); setDialog(null); onChanged(); }
    catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };

  const start = (p) => run(() => http.put(`/pickups/${p._id}/start`), 'On the way. The customer has been notified.');
  const complete = (p, body) => run(() => http.put(`/pickups/${p._id}/confirm`, body), 'Pickup completed');
  const cancel = (p, reason) => run(() => http.put(`/pickups/${p._id}/cancel`, { reason }), 'Pickup marked as missed');

  const dialogs = dialog && (dialog.type === 'complete'
    ? <CompleteDialog pickup={dialog.pickup} rate={rates.data?.rates.find((r) => r.material === dialog.pickup.pickupType)?.pricePerKg || 0} busy={busy} onClose={() => setDialog(null)} onSubmit={(b) => complete(dialog.pickup, b)} />
    : <CancelDialog pickup={dialog.pickup} busy={busy} onClose={() => setDialog(null)} onSubmit={(r) => cancel(dialog.pickup, r)} />);

  return { start, openComplete: (pickup) => setDialog({ type: 'complete', pickup }), openCancel: (pickup) => setDialog({ type: 'cancel', pickup }), dialogs, busy };
};

const CompleteDialog = ({ pickup, rate, busy, onClose, onSubmit }) => {
  const [weight, setWeight] = useState('');
  const [amount, setAmount] = useState('');
  const auto = Math.round((Number(weight) || 0) * rate);
  const cashless = pickup.returnOption && pickup.returnOption !== 'cash';
  return (
    <Dialog show onClose={onClose} title="Complete pickup" footer={(
      <><button type="button" className="btn btn-light" onClick={onClose}>Back</button>
        <button type="button" className="btn btn-success" disabled={busy || !(Number(weight) > 0)} onClick={() => onSubmit({ weight: Number(weight), amount: cashless ? 0 : amount === '' ? undefined : Number(amount) })}>{busy ? 'Saving…' : 'Mark as complete'}</button></>
    )}>
      <p className="text-muted">{MATERIALS[pickup.pickupType]?.label} at {pickup.address}</p>
      <Field label="Weight collected (kg)" htmlFor="cw"><input id="cw" type="number" step="0.1" min="0" autoFocus className="form-control" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 7.5" /></Field>
      {cashless ? (
        <div className="alert alert-success mb-0">The customer chose <strong>{pickup.returnOption}</strong> instead of cash. No payment needed.</div>
      ) : (
        <Field label="Cash given (Rs.)" htmlFor="ca" hint={weight ? `Leave blank to use ${money(auto)} (${weight} kg × ${money(rate)}/kg)` : `Current rate: ${money(rate)} per kg`}>
          <input id="ca" type="number" min="0" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={weight ? String(auto) : ''} />
        </Field>
      )}
    </Dialog>
  );
};

const CancelDialog = ({ pickup, busy, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const quick = ['Customer not available', 'Items were not ready', 'Cannot access the location', 'Vehicle problem'];
  return (
    <Dialog show onClose={onClose} title="Mark as missed or cancelled" footer={(
      <><button type="button" className="btn btn-light" onClick={onClose}>Back</button>
        <button type="button" className="btn btn-danger" disabled={busy || !reason.trim()} onClick={() => onSubmit(reason)}>Confirm</button></>
    )}>
      <p className="text-muted">{pickup.address}</p>
      <div className="chips mb-3">{quick.map((q) => <button key={q} type="button" className={`chip-btn ${reason === q ? 'is-active' : ''}`} onClick={() => setReason(q)}>{q}</button>)}</div>
      <Field label="Reason" htmlFor="cr" hint="The customer and admin will see this."><textarea id="cr" rows={3} className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
    </Dialog>
  );
};

// Row buttons: Start -> Complete / Missed, plus call and navigate
export const PickupButtons = ({ pickup: p, actions }) => (
  <div className="d-flex flex-wrap gap-2 justify-content-end">
    {p.user?.phone && <a className="btn btn-light btn-sm" href={`tel:${p.user.phone}`} aria-label={`Call ${p.user.name}`}><LuPhone aria-hidden="true" /></a>}
    <a className="btn btn-light btn-sm" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.address)}`} aria-label="Navigate"><LuNavigation aria-hidden="true" /> <span className="d-none d-sm-inline">Navigate</span></a>
    {p.status === 'assigned' && <button type="button" className="btn btn-success btn-sm" disabled={actions.busy} onClick={() => actions.start(p)}><LuPlay aria-hidden="true" /> Start</button>}
    {['assigned', 'on-the-way'].includes(p.status) && (
      <>
        {p.status === 'on-the-way' && <button type="button" className="btn btn-success btn-sm" onClick={() => actions.openComplete(p)}><LuCheck aria-hidden="true" /> Complete</button>}
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => actions.openCancel(p)}><LuBan aria-hidden="true" /> Missed</button>
      </>
    )}
  </div>
);
