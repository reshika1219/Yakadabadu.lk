import React, { useMemo, useState } from 'react';
import { LuFlag, LuFlagOff } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { fmtDate, MATERIALS } from '../../lib/format';
import { PageHeader, Card, StatCard, Stars, Chips, Loading, ErrorState, Empty } from '../../components/ui';
import { HBars } from '../../components/charts';
import { LuStar, LuMessageSquare } from 'react-icons/lu';

const Reviews = () => {
  const { data, loading, error, reload } = useFetch('/reviews');
  const [filter, setFilter] = useState('all');

  const stats = useMemo(() => {
    const list = data || [];
    const avg = list.length ? list.reduce((s, p) => s + p.rating.stars, 0) / list.length : 0;
    return { avg: Math.round(avg * 10) / 10, dist: [5, 4, 3, 2, 1].map((n) => ({ label: `${n} star${n > 1 ? 's' : ''}`, value: list.filter((p) => p.rating.stars === n).length, color: n >= 4 ? 'var(--leaf)' : n === 3 ? '#c9a227' : 'var(--danger)' })) };
  }, [data]);

  const flag = async (p) => {
    try { await http.put(`/reviews/${p._id}/flag`, { flagged: !p.rating.flagged }); toast.success(p.rating.flagged ? 'Flag removed' : 'Review flagged'); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const rows = data.filter((p) => filter === 'all' || (filter === 'flagged' ? p.rating.flagged : filter === 'low' ? p.rating.stars <= 3 : p.rating.stars >= 4));

  return (
    <>
      <PageHeader title="Reviews" subtitle="Customer ratings of drivers and service. Flag anything inappropriate." />
      <div className="grid-main">
        <div className="stack">
          <Chips value={filter} onChange={setFilter} options={[['all', `All (${data.length})`], ['high', 'Positive'], ['low', 'Needs attention'], ['flagged', 'Flagged']]} />
          <Card flush>
            {rows.length ? <ul className="rows">{rows.map((p) => (
              <li className="row-item flex-wrap" key={p._id}>
                <div className="row-item__main">
                  <div className="d-flex align-items-center gap-2"><Stars value={p.rating.stars} size={16} />{p.rating.flagged && <span className="pill pill--bad">Flagged</span>}</div>
                  <div className="mt-1">{p.rating.feedback || <span className="text-muted">No comment</span>}</div>
                  <div className="row-item__sub">{p.user?.name} about {p.driver?.firstName} {p.driver?.lastName} · {MATERIALS[p.pickupType]?.label} · {fmtDate(p.rating.at)}</div>
                </div>
                <button type="button" className="btn btn-light btn-sm" onClick={() => flag(p)}>{p.rating.flagged ? <><LuFlagOff aria-hidden="true" /> Unflag</> : <><LuFlag aria-hidden="true" /> Flag</>}</button>
              </li>
            ))}</ul> : <div className="p-3"><Empty title="No reviews here" /></div>}
          </Card>
        </div>
        <div className="stack">
          <StatCard icon={LuStar} tone="warn" label="Average rating" value={stats.avg || '—'} hint={`from ${data.length} reviews`} />
          <Card title="Rating breakdown"><HBars items={stats.dist} format={(v) => v} /></Card>
          <StatCard icon={LuMessageSquare} label="With written feedback" value={data.filter((p) => p.rating.feedback).length} />
        </div>
      </div>
    </>
  );
};

export default Reviews;
