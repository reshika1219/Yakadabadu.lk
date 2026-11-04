import React, { useEffect, useState } from 'react';
import { LuSave, LuLock } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { useAuth } from '../../auth';
import { MATERIALS, SLOTS, fmtDate, readImage } from '../../lib/format';
import { PageHeader, Card, Field, Chips, Loading, ErrorState } from '../../components/ui';

const PasswordCard = ({ endpoint }) => {
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const mismatch = f.confirm && f.confirm !== f.newPassword;
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await http.put(endpoint, { currentPassword: f.currentPassword, newPassword: f.newPassword }); toast.success('Password updated'); setF({ currentPassword: '', newPassword: '', confirm: '' }); }
    catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <Card title="Change password">
      <form onSubmit={save}>
        <Field label="Current password" htmlFor="pw0"><input id="pw0" type="password" className="form-control" autoComplete="current-password" required value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /></Field>
        <Field label="New password" htmlFor="pw1" hint="At least 8 characters."><input id="pw1" type="password" className="form-control" autoComplete="new-password" minLength={8} required value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /></Field>
        <Field label="Confirm new password" htmlFor="pw2" error={mismatch ? 'Passwords do not match' : ''}><input id="pw2" type="password" className="form-control" autoComplete="new-password" required value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
        <button type="submit" className="btn btn-outline-success" disabled={busy || mismatch}><LuLock aria-hidden="true" /> Update password</button>
      </form>
    </Card>
  );
};

const CustomerProfile = () => {
  const { data, loading, error, reload } = useFetch('/users/me');
  const { setName } = useAuth();
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setF({ name: data.name, phone: data.phone, address: data.address, type: data.type, preferences: { materials: [], timeSlot: '', notifyEmail: true, notifySms: false, ...data.preferences } }); }, [data]);
  if (loading || !f) return error ? <ErrorState message={error} onRetry={reload} /> : <Loading />;

  const prefs = f.preferences;
  const setPref = (patch) => setF({ ...f, preferences: { ...prefs, ...patch } });
  const toggleMat = (m) => setPref({ materials: prefs.materials.includes(m) ? prefs.materials.filter((x) => x !== m) : [...prefs.materials, m] });
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await http.put('/users/me', f); setName(f.name); toast.success('Profile saved'); reload(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Profile & settings" subtitle={`Member since ${fmtDate(data.createdAt)}`} />
      <div className="grid-main">
        <form onSubmit={save} className="stack">
          <Card title="Your details">
            <div className="row g-3">
              <div className="col-sm-6"><Field label="Full name" htmlFor="pn"><input id="pn" className="form-control" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field></div>
              <div className="col-sm-6"><Field label="Phone" htmlFor="pp"><input id="pp" type="tel" className="form-control" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field></div>
            </div>
            <Field label="Email" hint="Your email is your login and cannot be changed here."><input className="form-control" value={data.email} disabled /></Field>
            <Field label="Default pickup address" htmlFor="pa"><input id="pa" className="form-control" required value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
            <Field label="Account type"><Chips value={f.type} onChange={(type) => setF({ ...f, type })} options={[['household', 'Household'], ['industrial', 'Business']]} /></Field>
          </Card>
          <Card title="Pickup preferences">
            <Field label="Materials you usually recycle"><Chips value="" onChange={toggleMat} options={Object.entries(MATERIALS).map(([k, v]) => [k, `${prefs.materials.includes(k) ? '✓ ' : ''}${v.label}`])} /></Field>
            <Field label="Preferred time" htmlFor="pt">
              <select id="pt" className="form-select" value={prefs.timeSlot || ''} onChange={(e) => setPref({ timeSlot: e.target.value })}><option value="">No preference</option>{Object.entries(SLOTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </Field>
            <div className="form-check form-switch mb-2"><input className="form-check-input" type="checkbox" id="ne" checked={!!prefs.notifyEmail} onChange={(e) => setPref({ notifyEmail: e.target.checked })} /><label className="form-check-label" htmlFor="ne">Email me about pickup updates</label></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" id="ns" checked={!!prefs.notifySms} onChange={(e) => setPref({ notifySms: e.target.checked })} /><label className="form-check-label" htmlFor="ns">SMS for critical alerts</label></div>
          </Card>
          <div><button type="submit" className="btn btn-success" disabled={busy}><LuSave aria-hidden="true" /> {busy ? 'Saving…' : 'Save changes'}</button></div>
        </form>
        <div className="stack"><PasswordCard endpoint="/users/me/password" /></div>
      </div>
    </>
  );
};

const StaffProfile = () => {
  const { data, loading, error, reload } = useFetch('/drivers/me');
  const { role } = useAuth();
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setF({ phone: data.phone || '', vehicleCategory: data.vehicleCategory || '', vehicleNumber: data.vehicleNumber || '' }); }, [data]);
  if (loading || !f) return error ? <ErrorState message={error} onRetry={reload} /> : <Loading />;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await http.put('/drivers/me', f); toast.success('Profile saved'); reload(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  const picture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try { await http.put('/drivers/me', { profilePicture: await readImage(file, 400) }); toast.success('Picture updated'); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const rows = [['Employee ID', data.employeeId], ['Role', role === 'admin' ? 'Administrator' : 'Driver'], ['Employment', data.employeeType], ['Status', data.employeeStatus], ['Joined', fmtDate(data.joinedDate)], ['Email', data.email], ['NIC', data.nic], ['Birthday', fmtDate(data.birthday)]];

  return (
    <>
      <PageHeader title="Profile" subtitle="Your staff record. Ask an admin to change locked fields." />
      <div className="grid-main">
        <div className="stack">
          <Card>
            <div className="profile-head mb-0">
              <label className="avatar" title="Change picture">
                {data.profilePicture ? <img src={data.profilePicture} alt="Your profile" /> : <span aria-hidden="true">{data.firstName[0]}{data.lastName[0]}</span>}
                <input type="file" accept="image/*" onChange={picture} className="visually-hidden" aria-label="Choose a new profile picture" />
              </label>
              <div><h2 className="h3 mb-0">{data.name}</h2><div className="text-muted">{data.email}</div></div>
            </div>
          </Card>
          <Card title="Employment record"><dl className="kv">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>)}</dl></Card>
          <form onSubmit={save}>
            <Card title="Contact & vehicle" action={<button type="submit" className="btn btn-success btn-sm" disabled={busy}><LuSave aria-hidden="true" /> Save</button>}>
              <div className="row g-3">
                <div className="col-sm-4"><Field label="Phone" htmlFor="sp"><input id="sp" className="form-control" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field></div>
                <div className="col-sm-4"><Field label="Vehicle type" htmlFor="sv"><input id="sv" className="form-control" value={f.vehicleCategory} onChange={(e) => setF({ ...f, vehicleCategory: e.target.value })} /></Field></div>
                <div className="col-sm-4"><Field label="Plate number" htmlFor="sn"><input id="sn" className="form-control" value={f.vehicleNumber} onChange={(e) => setF({ ...f, vehicleNumber: e.target.value })} /></Field></div>
              </div>
            </Card>
          </form>
        </div>
        <div className="stack"><PasswordCard endpoint="/drivers/me/password" /></div>
      </div>
    </>
  );
};

const Profile = () => (useAuth().role === 'user' ? <CustomerProfile /> : <StaffProfile />);
export default Profile;
