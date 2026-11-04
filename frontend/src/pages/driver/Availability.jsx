import React, { useState } from 'react';
import { LuLogIn, LuLogOut, LuSend, LuUndo2 } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { fmtDate, fmtTime, isoDate } from '../../lib/format';
import { PageHeader, Card, Field, Pill, Loading, ErrorState, Empty, StatCard } from '../../components/ui';

const hours = (r) => (r.checkIn && r.checkOut ? Math.round(((new Date(r.checkOut) - new Date(r.checkIn)) / 36e5) * 10) / 10 : null);

const Availability = () => {
  const att = useFetch('/attendance/me');
  const leaves = useFetch('/leaves/me');
  const me = useFetch('/drivers/me');
  const [f, setF] = useState({ from: '', to: '', reason: '' });
  const [busy, setBusy] = useState(false);

  const attend = async (kind) => {
    try { await http.post(`/attendance/${kind}`); toast.success(kind === 'check-in' ? 'Checked in' : 'Checked out'); att.reload(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await http.post('/leaves', f); toast.success('Leave request sent to the admin'); setF({ from: '', to: '', reason: '' }); leaves.reload(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  const withdraw = async (l) => { try { await http.delete(`/leaves/${l._id}`); toast.success('Request withdrawn'); leaves.reload(); } catch (err) { toast.error(errorMessage(err)); } };
  const setStatus = async (status) => { try { await http.put('/drivers/me', { status }); me.reload(); toast.success('Availability updated'); } catch (err) { toast.error(errorMessage(err)); } };

  if (att.loading || leaves.loading) return <Loading />;
  if (att.error) return <ErrorState message={att.error} onRetry={att.reload} />;

  const today = att.data.today;
  const worked = att.data.records.map(hours).filter(Boolean);
  const avg = worked.length ? Math.round((worked.reduce((a, b) => a + b, 0) / worked.length) * 10) / 10 : 0;

  return (
    <>
      <PageHeader title="Availability & leave" subtitle="Check in for your shift, set your availability and request time off." />
      <div className="stat-grid">
        <StatCard icon={LuLogIn} label="Days worked (60 days)" value={att.data.records.length} />
        <StatCard icon={LuLogOut} tone="lime" label="Average shift" value={`${avg} h`} />
        <div className="stat"><div className="stat__body"><span className="stat__label">Availability</span>
          <div className="form-check form-switch mt-1"><input className="form-check-input" id="av" type="checkbox" checked={me.data?.status !== 'unavailable'} onChange={(e) => setStatus(e.target.checked ? 'available' : 'unavailable')} /><label htmlFor="av" className="form-check-label">{me.data?.status === 'unavailable' ? 'Unavailable' : 'Available'}</label></div></div></div>
      </div>

      <div className="grid-main">
        <div className="stack">
          <Card title="Today's shift">
            {!today ? <button type="button" className="btn btn-success" onClick={() => attend('check-in')}><LuLogIn aria-hidden="true" /> Check in</button>
              : <div className="d-flex flex-wrap align-items-center justify-content-between gap-3"><div>In at <strong>{fmtTime(today.checkIn)}</strong>{today.checkOut ? <> · out at <strong>{fmtTime(today.checkOut)}</strong></> : ' · shift in progress'}</div>{!today.checkOut && <button type="button" className="btn btn-outline-success" onClick={() => attend('check-out')}><LuLogOut aria-hidden="true" /> Check out</button>}</div>}
          </Card>
          <Card title="Attendance history" flush>
            <div className="dt-wrap"><table className="dt"><thead><tr><th>Date</th><th>In</th><th>Out</th><th className="num">Hours</th></tr></thead>
              <tbody>{att.data.records.slice(0, 14).map((r) => <tr key={r._id}><td>{fmtDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td><td>{fmtTime(r.checkIn)}</td><td>{r.checkOut ? fmtTime(r.checkOut) : '—'}</td><td className="num">{hours(r) ?? '—'}</td></tr>)}
                {att.data.records.length === 0 && <tr><td colSpan={4} className="text-center text-muted">No attendance yet</td></tr>}</tbody></table></div>
          </Card>
        </div>
        <div className="stack">
          <Card title="Request leave">
            <form onSubmit={submit}>
              <div className="row g-2">
                <div className="col-6"><Field label="From" htmlFor="lf"><input id="lf" type="date" min={isoDate()} required className="form-control" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field></div>
                <div className="col-6"><Field label="To" htmlFor="lt"><input id="lt" type="date" min={f.from || isoDate()} required className="form-control" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field></div>
              </div>
              <Field label="Reason" htmlFor="lr"><textarea id="lr" rows={2} required className="form-control" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
              <button type="submit" className="btn btn-success w-100" disabled={busy}><LuSend aria-hidden="true" /> Send request</button>
            </form>
          </Card>
          <Card title="My requests" flush>
            {leaves.data?.length ? <ul className="rows">{leaves.data.map((l) => (
              <li className="row-item" key={l._id}><div className="row-item__main"><div className="row-item__title">{fmtDate(l.from)} – {fmtDate(l.to)} <Pill status={l.status === 'approved' ? 'completed' : l.status === 'rejected' ? 'cancelled' : 'pending'}>{l.status}</Pill></div><div className="row-item__sub">{l.reason}</div>{l.decisionNote && <div className="row-item__sub">Admin: {l.decisionNote}</div>}</div>{l.status === 'pending' && <button type="button" className="btn btn-light btn-sm" aria-label="Withdraw request" onClick={() => withdraw(l)}><LuUndo2 aria-hidden="true" /></button>}</li>
            ))}</ul> : <div className="p-3"><Empty title="No leave requests" /></div>}
          </Card>
        </div>
      </div>
    </>
  );
};

export default Availability;
