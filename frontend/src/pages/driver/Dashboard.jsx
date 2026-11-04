import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { LuTruck, LuCircleCheck, LuStar, LuScale, LuLogIn, LuLogOut, LuDownload, LuArrowRight } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { useAuth } from '../../auth';
import { dayLabel, fmtTime, kg, MATERIALS, SLOTS, isoDate } from '../../lib/format';
import { PageHeader, StatCard, Card, Loading, ErrorState, Empty, Pill } from '../../components/ui';
import { MatIcon } from '../../components/pickup';
import { useDriverActions, PickupButtons } from '../../components/DriverActions';
import MapComponent from '../../components/MapComponent';
import PickupListPDF from '../../components/PickupListPDF';

const Dashboard = () => {
  const { name } = useAuth();
  const list = useFetch('/pickups/me');
  const stats = useFetch('/analytics/driver');
  const att = useFetch('/attendance/me');
  const me = useFetch('/drivers/me');
  const reloadAll = () => { list.reload(); stats.reload(); me.reload(); };
  const actions = useDriverActions(reloadAll);

  const { today, later } = useMemo(() => {
    const t = isoDate();
    const active = list.data || [];
    return { today: active.filter((p) => isoDate(p.scheduledTime) <= t), later: active.filter((p) => isoDate(p.scheduledTime) > t) };
  }, [list.data]);

  const attend = async (kind) => {
    try { await http.post(`/attendance/${kind}`); toast.success(kind === 'check-in' ? 'Checked in. Have a great day!' : 'Checked out. See you tomorrow.'); att.reload(); }
    catch (err) { toast.error(errorMessage(err)); }
  };
  const setAvailability = async (status) => {
    try { await http.put('/drivers/me', { status }); me.reload(); toast.success(status === 'available' ? 'You are available for assignments' : 'You are marked unavailable'); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  if (list.loading || stats.loading) return <Loading label="Loading your route…" />;
  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />;

  const checkedIn = att.data?.today;
  const totals = stats.data?.totals;
  const unavailable = me.data?.status === 'unavailable';

  const Row = ({ p }) => (
    <li className="row-item flex-wrap">
      <MatIcon material={p.pickupType} />
      <div className="row-item__main">
        <div className="row-item__title">{p.user?.name || p.customerName} <Pill status={p.status} /></div>
        <div className="row-item__sub">{p.address}</div>
        <div className="row-item__sub">{MATERIALS[p.pickupType]?.label} · {SLOTS[p.timeSlot]} {p.instructions && `· “${p.instructions}”`}</div>
      </div>
      <PickupButtons pickup={p} actions={actions} />
    </li>
  );

  return (
    <>
      <PageHeader title={`Hello, ${name?.split(' ')[0]}`} subtitle={`${dayLabel(new Date())}. ${today.length ? `${today.length} stop${today.length > 1 ? 's' : ''} on your route today.` : 'No stops scheduled for today.'}`}
        actions={list.data.length > 0 && (
          <PDFDownloadLink document={<PickupListPDF pickups={list.data} />} fileName="my-route.pdf">
            {({ loading }) => <button type="button" className="btn btn-outline-success" disabled={loading}><LuDownload aria-hidden="true" /> {loading ? 'Preparing…' : 'Trip sheet (PDF)'}</button>}
          </PDFDownloadLink>
        )} />

      <div className="stat-grid">
        <StatCard icon={LuTruck} label="Stops today" value={totals.today} hint={`${totals.active} active in total`} to="/driver/pickups" />
        <StatCard icon={LuCircleCheck} tone="lime" label="Completed" value={totals.completed} hint={`${totals.completionRate}% completion rate`} />
        <StatCard icon={LuScale} tone="info" label="Collected" value={kg(totals.kg)} hint="all time" />
        <StatCard icon={LuStar} tone="warn" label="Rating" value={totals.rating ?? '—'} hint={`${totals.reviews} review${totals.reviews === 1 ? '' : 's'}`} to="/driver/performance" />
      </div>

      <div className="grid-main">
        <div className="stack">
          <Card title="Today's route" flush action={<Link to="/driver/pickups" className="link-btn">All pickups <LuArrowRight aria-hidden="true" /></Link>}>
            {today.length ? <ul className="rows">{today.map((p) => <Row key={p._id} p={p} />)}</ul> : <div className="p-3"><Empty title="You are clear for today" hint="New assignments will appear here and in your notifications." /></div>}
          </Card>
          <Card title="Map" flush><MapComponent pickups={list.data} height={320} /></Card>
          {later.length > 0 && (
            <Card title="Coming up" flush>
              <ul className="rows">{later.slice(0, 5).map((p) => (
                <li className="row-item" key={p._id}><MatIcon material={p.pickupType} /><div className="row-item__main"><div className="row-item__title">{p.user?.name}</div><div className="row-item__sub">{p.address}</div></div><div className="row-item__side"><strong>{dayLabel(p.scheduledTime)}</strong><div className="row-item__sub">{SLOTS[p.timeSlot]?.split(' · ')[0]}</div></div></li>
              ))}</ul>
            </Card>
          )}
        </div>

        <div className="stack">
          <Card title="Shift">
            {checkedIn ? (
              <>
                <p className="mb-2">Checked in at <strong>{fmtTime(checkedIn.checkIn)}</strong>{checkedIn.checkOut && <> · out at <strong>{fmtTime(checkedIn.checkOut)}</strong></>}</p>
                {!checkedIn.checkOut ? <button type="button" className="btn btn-outline-success w-100" onClick={() => attend('check-out')}><LuLogOut aria-hidden="true" /> Check out</button> : <p className="text-muted small mb-0">Shift complete for today.</p>}
              </>
            ) : <button type="button" className="btn btn-success w-100" onClick={() => attend('check-in')}><LuLogIn aria-hidden="true" /> Check in</button>}
          </Card>
          <Card title="Availability">
            <div className="form-check form-switch mb-1">
              <input className="form-check-input" type="checkbox" id="avail" checked={!unavailable} onChange={(e) => setAvailability(e.target.checked ? 'available' : 'unavailable')} />
              <label className="form-check-label" htmlFor="avail">{unavailable ? 'Unavailable for new pickups' : 'Available for new pickups'}</label>
            </div>
            <p className="text-muted small mb-2">Admins will not assign new pickups while you are unavailable.</p>
            <Link to="/driver/availability" className="link-btn">Leave requests <LuArrowRight aria-hidden="true" /></Link>
          </Card>
          {me.data && <Card title="Your vehicle"><strong>{me.data.vehicleCategory || '—'}</strong><div className="text-muted">{me.data.vehicleNumber}</div></Card>}
        </div>
      </div>
      {actions.dialogs}
    </>
  );
};

export default Dashboard;
