import React from 'react';
import { LuCircleCheck, LuStar, LuScale, LuBan } from 'react-icons/lu';
import { useFetch } from '../../api';
import { fmtDate, kg, MATERIALS } from '../../lib/format';
import { PageHeader, StatCard, Card, Stars, Loading, ErrorState, Empty } from '../../components/ui';
import { BarChart } from '../../components/charts';

const Performance = () => {
  const { data, loading, error, reload } = useFetch('/analytics/driver');
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { totals, perDay, recentReviews } = data;

  return (
    <>
      <PageHeader title="Performance" subtitle="How you are doing, based on completed pickups and customer ratings." />
      <div className="stat-grid">
        <StatCard icon={LuCircleCheck} tone="lime" label="Completed" value={totals.completed} hint={`${totals.completionRate}% completion rate`} />
        <StatCard icon={LuScale} tone="info" label="Total collected" value={kg(totals.kg)} />
        <StatCard icon={LuStar} tone="warn" label="Average rating" value={totals.rating ?? '—'} hint={`${totals.reviews} reviews`} />
        <StatCard icon={LuBan} tone="bad" label="Missed / cancelled" value={totals.cancelled} />
      </div>
      <div className="grid-2">
        <Card title="Last 7 days" action={<span className="text-muted small">completed pickups / kg</span>}>
          <BarChart data={perDay.map((d) => ({ label: new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' }), value: d.completed, value2: d.kg }))} legend={[['Pickups', 'var(--forest)'], ['Kilograms', 'var(--lime)']]} />
        </Card>
        <Card title="Recent reviews" flush>
          {recentReviews.length ? <ul className="rows">{recentReviews.map((r, i) => (
            <li className="row-item" key={i}><div className="row-item__main"><Stars value={r.stars} size={16} /><div>{r.feedback || <span className="text-muted">No comment</span>}</div><div className="row-item__sub">{MATERIALS[r.material]?.label} · {fmtDate(r.at)}</div></div></li>
          ))}</ul> : <div className="p-3"><Empty title="No reviews yet" hint="Ratings appear after customers rate completed pickups." /></div>}
        </Card>
      </div>
    </>
  );
};

export default Performance;
