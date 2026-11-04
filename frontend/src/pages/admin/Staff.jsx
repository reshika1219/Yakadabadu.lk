import React, { useState } from 'react';
import { LuPlus, LuPencil, LuTrash2, LuCheck, LuX, LuStar } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { fmtDate, fmtTime, kg, isoDate } from '../../lib/format';
import { PageHeader, Card, Tabs, Dialog, ConfirmDialog, Field, Pill, Avatar, Loading, ErrorState, Empty } from '../../components/ui';

const blank = { firstName: '', lastName: '', email: '', password: '', phone: '', nic: '', vehicleCategory: '', vehicleNumber: '', employeeType: 'Permanent', role: 'driver' };

const StaffForm = ({ initial, onClose, onSaved }) => {
  const editing = !!initial?._id;
  const [f, setF] = useState(initial ? { ...initial, password: '' } : blank);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...f }; if (editing && !body.password) delete body.password;
      if (editing) await http.put(`/drivers/${initial._id}`, body); else await http.post('/drivers', body);
      toast.success(editing ? 'Staff member updated' : 'Staff member added');
      onSaved();
    } catch (err) { toast.error(errorMessage(err)); setBusy(false); }
  };
  return (
    <Dialog show onClose={onClose} size="lg" title={editing ? `Edit ${initial.name}` : 'Add staff member'}>
      <form onSubmit={save}>
        <div className="row g-3">
          <div className="col-sm-6"><Field label="First name" htmlFor="sf1"><input id="sf1" required className="form-control" value={f.firstName} onChange={set('firstName')} /></Field></div>
          <div className="col-sm-6"><Field label="Last name" htmlFor="sf2"><input id="sf2" required className="form-control" value={f.lastName} onChange={set('lastName')} /></Field></div>
          <div className="col-sm-6"><Field label="Email" htmlFor="sf3"><input id="sf3" type="email" required disabled={editing} className="form-control" value={f.email} onChange={set('email')} /></Field></div>
          <div className="col-sm-6"><Field label={editing ? 'New password (optional)' : 'Password'} htmlFor="sf4" hint="At least 8 characters"><input id="sf4" type="password" required={!editing} minLength={8} autoComplete="new-password" className="form-control" value={f.password} onChange={set('password')} /></Field></div>
          <div className="col-sm-6"><Field label="Phone" htmlFor="sf5"><input id="sf5" className="form-control" value={f.phone || ''} onChange={set('phone')} /></Field></div>
          <div className="col-sm-6"><Field label="NIC" htmlFor="sf6"><input id="sf6" className="form-control" value={f.nic || ''} onChange={set('nic')} /></Field></div>
          <div className="col-sm-4"><Field label="Vehicle type" htmlFor="sf7"><input id="sf7" className="form-control" value={f.vehicleCategory || ''} onChange={set('vehicleCategory')} placeholder="Lorry, van…" /></Field></div>
          <div className="col-sm-4"><Field label="Plate number" htmlFor="sf8"><input id="sf8" className="form-control" value={f.vehicleNumber || ''} onChange={set('vehicleNumber')} /></Field></div>
          <div className="col-sm-4"><Field label="Employment" htmlFor="sf9"><select id="sf9" className="form-select" value={f.employeeType} onChange={set('employeeType')}>{['Permanent', 'Contract', 'Trainee'].map((v) => <option key={v}>{v}</option>)}</select></Field></div>
          <div className="col-sm-6"><Field label="Role" htmlFor="sf10"><select id="sf10" className="form-select" value={f.role} onChange={set('role')}><option value="driver">Driver</option><option value="admin">Administrator</option></select></Field></div>
          {editing && <div className="col-sm-6"><Field label="Employment status" htmlFor="sf11"><select id="sf11" className="form-select" value={f.employeeStatus} onChange={set('employeeStatus')}>{['Active', 'On Leave', 'Inactive'].map((v) => <option key={v}>{v}</option>)}</select></Field></div>}
        </div>
        <div className="d-flex justify-content-end gap-2 mt-2"><button type="button" className="btn btn-light" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-success" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Dialog>
  );
};

const Staff = () => {
  const [tab, setTab] = useState('team');
  const staff = useFetch('/drivers');
  const leaves = useFetch('/leaves');
  const att = useFetch(`/attendance?date=${isoDate()}`);
  const [form, setForm] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [deciding, setDeciding] = useState(null); // { leave, status }
  const [note, setNote] = useState('');

  const pendingLeaves = (leaves.data || []).filter((l) => l.status === 'pending').length;

  const remove = async () => {
    try { await http.delete(`/drivers/${removing._id}`); toast.success('Staff member removed'); setRemoving(null); staff.reload(); } catch (err) { toast.error(errorMessage(err)); setRemoving(null); }
  };
  const decide = async () => {
    try { await http.put(`/leaves/${deciding.leave._id}`, { status: deciding.status, note }); toast.success(`Leave ${deciding.status}`); setDeciding(null); setNote(''); leaves.reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <>
      <PageHeader title="Staff & drivers" subtitle="Your team, their performance, attendance and leave."
        actions={<button type="button" className="btn btn-success" onClick={() => setForm('new')}><LuPlus aria-hidden="true" /> Add staff</button>} />
      <Tabs value={tab} onChange={setTab} label="Staff sections" tabs={[{ id: 'team', label: 'Team', count: staff.data?.length }, { id: 'leave', label: 'Leave requests', count: pendingLeaves || undefined }, { id: 'attendance', label: 'Attendance today' }]} />

      {tab === 'team' && (staff.loading ? <Loading /> : staff.error ? <ErrorState message={staff.error} onRetry={staff.reload} /> : (
        <div className="staff-grid">
          {staff.data.map((d) => (
            <article className="panel" key={d._id}>
              <div className="panel__body">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <Avatar name={d.name} src={d.profilePicture} size={48} />
                  <div className="flex-grow-1 min-w-0"><strong>{d.name}</strong><div className="text-muted small">{d.employeeId} · {d.role === 'admin' ? 'Administrator' : d.vehicleCategory || 'Driver'}</div></div>
                  <span className={`pill ${d.employeeStatus !== 'Active' ? 'pill--bad' : d.status === 'available' ? 'pill--ok' : d.status === 'on-route' ? 'pill--info' : 'pill--muted'}`}>{d.employeeStatus !== 'Active' ? d.employeeStatus : d.status}</span>
                </div>
                {d.role === 'driver' ? (
                  <dl className="kv small">
                    <div><dt>Active</dt><dd>{d.stats.assigned}</dd></div>
                    <div><dt>Completed</dt><dd>{d.stats.completed}</dd></div>
                    <div><dt>Collected</dt><dd>{kg(d.stats.kg)}</dd></div>
                    <div><dt>Rating</dt><dd>{d.stats.rating ? <><LuStar aria-hidden="true" className="text-warning" /> {d.stats.rating} ({d.stats.reviews})</> : '—'}</dd></div>
                    <div><dt>Vehicle</dt><dd>{d.vehicleNumber || '—'}</dd></div>
                  </dl>
                ) : <p className="text-muted small">Platform administrator</p>}
                <div className="d-flex gap-2 mt-3">
                  <button type="button" className="btn btn-outline-success btn-sm flex-grow-1" onClick={() => setForm(d)}><LuPencil aria-hidden="true" /> Edit</button>
                  <button type="button" className="btn btn-light btn-sm" aria-label={`Remove ${d.name}`} onClick={() => setRemoving(d)}><LuTrash2 aria-hidden="true" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ))}

      {tab === 'leave' && (leaves.loading ? <Loading /> : (
        <Card flush>
          {leaves.data?.length ? <ul className="rows">{leaves.data.map((l) => (
            <li className="row-item flex-wrap" key={l._id}>
              <Avatar name={`${l.driver?.firstName} ${l.driver?.lastName}`} />
              <div className="row-item__main"><div className="row-item__title">{l.driver?.firstName} {l.driver?.lastName} <Pill status={l.status === 'approved' ? 'completed' : l.status === 'rejected' ? 'cancelled' : 'pending'}>{l.status}</Pill></div><div className="row-item__sub">{fmtDate(l.from)} – {fmtDate(l.to)} · {l.reason}</div>{l.decisionNote && <div className="row-item__sub">{l.decidedBy}: {l.decisionNote}</div>}</div>
              {l.status === 'pending' && <div className="d-flex gap-2"><button type="button" className="btn btn-success btn-sm" onClick={() => setDeciding({ leave: l, status: 'approved' })}><LuCheck aria-hidden="true" /> Approve</button><button type="button" className="btn btn-light btn-sm" onClick={() => setDeciding({ leave: l, status: 'rejected' })}><LuX aria-hidden="true" /> Reject</button></div>}
            </li>
          ))}</ul> : <div className="p-3"><Empty title="No leave requests" /></div>}
        </Card>
      ))}

      {tab === 'attendance' && (att.loading || staff.loading ? <Loading /> : (
        <Card flush>
          <div className="dt-wrap"><table className="dt"><thead><tr><th>Driver</th><th>Status</th><th>Checked in</th><th>Checked out</th></tr></thead>
            <tbody>{staff.data.filter((d) => d.role === 'driver').map((d) => {
              const r = (att.data || []).find((a) => a.driver?._id === d._id);
              return <tr key={d._id}><td><strong>{d.name}</strong></td><td>{r ? <span className="pill pill--ok">{r.checkOut ? 'Shift done' : 'On shift'}</span> : <span className="pill pill--muted">Not in yet</span>}</td><td>{r ? fmtTime(r.checkIn) : '—'}</td><td>{r?.checkOut ? fmtTime(r.checkOut) : '—'}</td></tr>;
            })}</tbody></table></div>
        </Card>
      ))}

      {form && <StaffForm initial={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={() => { setForm(null); staff.reload(); }} />}
      <ConfirmDialog show={!!removing} onClose={() => setRemoving(null)} onConfirm={remove} danger confirmLabel="Remove" title="Remove staff member?" message={`${removing?.name} will lose access immediately. Their open pickups go back to the pending queue.`} />
      <Dialog show={!!deciding} onClose={() => setDeciding(null)} title={deciding?.status === 'approved' ? 'Approve leave' : 'Reject leave'} footer={<><button type="button" className="btn btn-light" onClick={() => setDeciding(null)}>Back</button><button type="button" className={`btn ${deciding?.status === 'approved' ? 'btn-success' : 'btn-danger'}`} onClick={decide}>Confirm</button></>}>
        <Field label="Note to the driver (optional)" htmlFor="ln"><textarea id="ln" rows={2} className="form-control" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </Dialog>
    </>
  );
};

export default Staff;
