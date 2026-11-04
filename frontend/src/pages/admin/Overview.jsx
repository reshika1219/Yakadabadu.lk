import React from 'react';
import { Link } from 'react-router-dom';
import { LuClipboardList, LuTruck, LuScale, LuUsers, LuStar, LuStore, LuCalendarOff, LuFlag, LuArrowRight, LuCircleCheck } from 'react-icons/lu';
import { useFetch } from '../../api';
import { useAuth } from '../../auth';
import { kg, MATERIALS, dayLabel, timeAgo, SLOTS } from '../../lib/format';
import { PageHeader, StatCard, Card, Loading, ErrorState, Pill, Empty } from '../../components/ui';
import { BarChart, HBars } from '../../components/charts';
import { MatIcon } from '../../components/pickup';
import AssignSelect from '../../components/AssignSelect';

const Overview = () => {
  const { name } = useAuth();
  const { data, loading, error, reload } = useFetch('/analytics/admin');
  const drivers = useFetch('/drivers');
  if (loading) return <Loading label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { kpis, perDay, kgByMaterial, areas, unassigned, recent } = data;

  const attention = [
    { show: kpis.pending > 0, icon: LuClipboardList, text: `${kpis.pending} pickup${kpis.pending > 1 ? 's' : ''} waiting for a driver`, to: '/admin/pickups?status=pending' },
    { show: kpis.listingsPending > 0, icon: LuStore, text: `${kpis.listingsPending} listing${kpis.listingsPending > 1 ? 's' : ''} to review`, to: '/admin/marketplace' },
    { show: kpis.leavesPending > 0, icon: LuCalendarOff, text: `${kpis.leavesPending} leave request${kpis.leavesPending > 1 ? 's' : ''} pending`, to: '/admin/staff' },
    { show: kpis.flaggedReviews > 0, icon: LuFlag, text: `${kpis.flaggedReviews} flagged review${kpis.flaggedReviews > 1 ? 's' : ''}`, to: '/admin/reviews' },
  ].filter((a) => a.show);

  return (
    <>
      <PageHeader title={`Welcome back, ${name?.split(' ')[0]}`} subtitle="A live view of collections, people and money." />

      <Card className="mb-4" title="Needs your attention">
        {attention.length ? (
          <div className="attention">
            {attention.map((a) => { const Icon = a.icon; return <Link key={a.to} to={a.to} className="attention__item"><Icon aria-hidden="true" /><span>{a.text}</span><LuArrowRight aria-hidden="true" /></Link>; })}
          </div>
        ) : <p className="mb-0"><LuCircleCheck aria-hidden="true" /> Everything is up to date. Nice work.</p>}
      </Card>

      <div className="stat-grid">
        <StatCard icon={LuClipboardList} label="Active pickups" value={kpis.active} hint={`${kpis.pending} pending · ${kpis.completed} completed`} to="/admin/pickups" />
        <StatCard icon={LuScale} tone="lime" label="Collected" value={kg(kpis.kg)} hint="all time" />
        <StatCard icon={LuTruck} tone="info" label="Drivers available" value={`${kpis.driversAvailable}/${kpis.drivers}`} to="/admin/staff" />
        <StatCard icon={LuUsers} label="Customers" value={kpis.customers} to="/admin/customers" />
        <StatCard icon={LuStore} tone="warn" label="Live listings" value={kpis.listingsLive} hint={`${kpis.listingsPending} awaiting review`} to="/admin/marketplace" />
        <StatCard icon={LuStar} tone="warn" label="Average rating" value={kpis.avgRating ?? '—'} to="/admin/reviews" />
      </div>

      <div className="grid-main">
        <div className="stack">
          <Card title="Pickups, last 14 days">
            <BarChart data={perDay.map((d) => ({ label: new Date(d.date).getDate(), value: d.booked, value2: d.completed }))} legend={[['Booked', 'var(--forest)'], ['Completed', 'var(--lime)']]} />
          </Card>
          <Card title="Waiting for a driver" flush action={<Link to="/admin/pickups?status=pending" className="link-btn">View all <LuArrowRight aria-hidden="true" /></Link>}>
            {unassigned.length ? (
              <ul className="rows">
                {unassigned.map((p) => (
                  <li key={p._id} className="row-item flex-wrap">
                    <MatIcon material={p.pickupType} />
                    <div className="row-item__main"><div className="row-item__title">{p.customerName}</div><div className="row-item__sub">{p.address}</div><div className="row-item__sub">{dayLabel(p.scheduledTime)} · {SLOTS[p.timeSlot]?.split(' · ')[0]}</div></div>
                    {drivers.data && <AssignSelect pickup={p} drivers={drivers.data} onAssigned={reload} />}
                  </li>
                ))}
              </ul>
            ) : <div className="p-3"><Empty title="Every pickup has a driver" /></div>}
          </Card>
        </div>
        <div className="stack">
          <Card title="Collected by material"><HBars items={kgByMaterial.map((m) => ({ label: m.label, value: m.kg, color: MATERIALS[m.material]?.color }))} format={(v) => `${v} kg`} /></Card>
          <Card title="Top areas"><HBars items={areas.map((a) => ({ label: a.area, value: a.kg }))} format={(v) => `${v} kg`} /></Card>
          <Card title="Latest activity" flush>
            <ul className="rows">
              {recent.slice(0, 6).map((p) => (
                <li key={p._id} className="row-item"><div className="row-item__main"><div className="row-item__title">{p.customerName} <Pill status={p.status} /></div><div className="row-item__sub">{MATERIALS[p.pickupType]?.label} · {timeAgo(p.updatedAt)}</div></div></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Overview;
