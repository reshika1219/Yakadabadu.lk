import React from 'react';
import { Link } from 'react-router-dom';
import { LuCalendarPlus, LuClipboardList, LuScale, LuWallet, LuLeaf, LuTreePine, LuStore, LuTag, LuStar, LuArrowRight, LuTruck } from 'react-icons/lu';
import { useFetch } from '../../api';
import { useAuth } from '../../auth';
import { fmtDate, kg, money, dayLabel, SLOTS, MATERIALS } from '../../lib/format';
import { PageHeader, StatCard, Card, Pill, Loading, ErrorState, Empty, Stars } from '../../components/ui';
import { BarChart, HBars } from '../../components/charts';
import { PickupRow, MatIcon } from '../../components/pickup';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

const Dashboard = () => {
  const { name } = useAuth();
  const stats = useFetch('/analytics/customer');
  const pickups = useFetch('/pickups/mine');
  const listings = useFetch('/listings/mine');

  if (stats.loading || pickups.loading) return <Loading label="Loading your dashboard…" />;
  if (stats.error) return <ErrorState message={stats.error} onRetry={stats.reload} />;

  const { totals, months, byMaterial, next } = stats.data;
  const recent = (pickups.data || []).filter((p) => ['completed', 'cancelled'].includes(p.status)).slice(0, 4);
  const toRate = (pickups.data || []).find((p) => p.status === 'completed' && !p.rating?.stars);
  const openOffers = (listings.data || []).reduce((n, l) => n + l.offers.filter((o) => o.status === 'pending').length, 0);

  return (
    <>
      <PageHeader title={`${greeting()}, ${name?.split(' ')[0]}`} subtitle="Here is what is happening with your scrap and your listings."
        actions={<Link to="/app/schedule" className="btn btn-success"><LuCalendarPlus aria-hidden="true" /> Book a pickup</Link>} />

      <div className="stat-grid">
        <StatCard icon={LuClipboardList} label="Upcoming pickups" value={totals.upcoming} hint={`${totals.completed} completed so far`} to="/app/pickups" />
        <StatCard icon={LuScale} tone="lime" label="Recycled so far" value={kg(totals.kg)} hint={`${totals.pickups} pickups in total`} />
        <StatCard icon={LuWallet} tone="info" label="Earned from scrap" value={money(totals.earned)} to="/app/earnings" hint="View payments" />
        <StatCard icon={LuLeaf} tone="lime" label="CO₂ saved (est.)" value={`${totals.co2} kg`} hint={`about ${totals.trees} trees`} />
      </div>

      <div className="grid-main">
        <div className="stack">
          <Card title="Your next pickup" action={<Link to="/app/pickups" className="link-btn">All pickups <LuArrowRight aria-hidden="true" /></Link>}>
            {next ? (
              <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
                <div className="d-flex gap-3 align-items-center">
                  <MatIcon material={next.pickupType} size={52} />
                  <div>
                    <div className="row-item__title">{MATERIALS[next.pickupType]?.label} <Pill status={next.status} /></div>
                    <div className="row-item__sub">{next.address}</div>
                    <div><strong>{dayLabel(next.scheduledTime)}</strong> · {SLOTS[next.timeSlot]}</div>
                  </div>
                </div>
                <Link to={`/app/pickups/${next._id}`} className="btn btn-outline-success"><LuTruck aria-hidden="true" /> {next.status === 'on-the-way' ? 'Track driver' : 'View details'}</Link>
              </div>
            ) : (
              <Empty title="No pickups scheduled" hint="Book a collection and we will take care of the rest." />
            )}
          </Card>

          {toRate && (
            <Card>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div><strong>How was your pickup on {fmtDate(toRate.scheduledTime)}?</strong><div className="text-muted small">{totals.toRate} pickup{totals.toRate > 1 ? 's' : ''} waiting for a rating</div></div>
                <div className="d-flex align-items-center gap-3"><Stars value={0} size={18} /><Link to={`/app/pickups/${toRate._id}`} className="btn btn-success btn-sm"><LuStar aria-hidden="true" /> Rate now</Link></div>
              </div>
            </Card>
          )}

          <Card title="Recycled per month" action={<span className="text-muted small">last 6 months</span>}>
            <BarChart data={months.map((m) => ({ label: new Date(m.month + '-01').toLocaleDateString('en-GB', { month: 'short' }), value: m.kg }))} format={(v) => `${v} kg`} />
          </Card>

          <Card title="Recent history" flush action={<Link to="/app/pickups" className="link-btn">See all</Link>}>
            {recent.length ? <div className="rows">{recent.map((p) => <PickupRow key={p._id} pickup={p} to={`/app/pickups/${p._id}`} />)}</div> : <div className="p-3"><Empty title="Nothing here yet" /></div>}
          </Card>
        </div>

        <div className="stack">
          <Card title="Quick actions">
            <div className="d-grid gap-2">
              <Link to="/app/schedule" className="btn btn-success"><LuCalendarPlus aria-hidden="true" /> Book a pickup</Link>
              <Link to="/app/market?new=1" className="btn btn-outline-success"><LuStore aria-hidden="true" /> Sell an item</Link>
              <Link to="/app/prices" className="btn btn-outline-success"><LuTag aria-hidden="true" /> Check prices</Link>
            </div>
          </Card>
          {openOffers > 0 && (
            <Card>
              <strong>{openOffers} open offer{openOffers > 1 ? 's' : ''} on your listings</strong>
              <p className="text-muted small mb-2">Respond to keep buyers interested.</p>
              <Link to="/app/market" className="btn btn-lime btn-sm">Review offers</Link>
            </Card>
          )}
          <Card title="What you recycle">
            <HBars items={byMaterial.map((m) => ({ label: m.label, value: m.kg, color: MATERIALS[m.material]?.color }))} format={(v) => `${v} kg`} emptyText="Your breakdown appears after your first pickup." />
          </Card>
          <Card><LuTreePine aria-hidden="true" /> <strong>Your impact</strong><p className="text-muted small mb-0 mt-1">{stats.data.note}</p></Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
