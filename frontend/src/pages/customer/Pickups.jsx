import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuCalendarPlus, LuClipboardList } from 'react-icons/lu';
import { useFetch } from '../../api';
import { PageHeader, Card, Tabs, SearchBox, Loading, ErrorState, Empty } from '../../components/ui';
import { PickupRow } from '../../components/pickup';
import { MATERIALS } from '../../lib/format';

const GROUPS = {
  upcoming: ['pending', 'assigned', 'on-the-way'],
  completed: ['completed'],
  cancelled: ['cancelled'],
};

const Pickups = () => {
  const { data, loading, error, reload } = useFetch('/pickups/mine');
  const [tab, setTab] = useState('upcoming');
  const [q, setQ] = useState('');

  const counts = useMemo(() => Object.fromEntries(Object.entries(GROUPS).map(([k, s]) => [k, (data || []).filter((p) => s.includes(p.status)).length])), [data]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data || [])
      .filter((p) => tab === 'all' || GROUPS[tab].includes(p.status))
      .filter((p) => !t || `${p.address} ${MATERIALS[p.pickupType]?.label}`.toLowerCase().includes(t))
      .sort((a, b) => (tab === 'upcoming' ? new Date(a.scheduledTime) - new Date(b.scheduledTime) : new Date(b.scheduledTime) - new Date(a.scheduledTime)));
  }, [data, tab, q]);

  return (
    <>
      <PageHeader title="My pickups" subtitle="Track upcoming collections and look back at your history."
        actions={<Link to="/app/schedule" className="btn btn-success"><LuCalendarPlus aria-hidden="true" /> Book a pickup</Link>} />
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="toolbar">
            <Tabs value={tab} onChange={setTab} label="Pickup status" tabs={[
              { id: 'upcoming', label: 'Upcoming', count: counts.upcoming }, { id: 'completed', label: 'Completed', count: counts.completed },
              { id: 'cancelled', label: 'Cancelled', count: counts.cancelled }, { id: 'all', label: 'All', count: data.length },
            ]} />
            <SearchBox value={q} onChange={setQ} placeholder="Search address or material" />
          </div>
          <Card flush>
            {rows.length ? <div className="rows">{rows.map((p) => <PickupRow key={p._id} pickup={p} to={`/app/pickups/${p._id}`} />)}</div>
              : <div className="p-3"><Empty title={q ? 'No pickups match your search' : `No ${tab === 'all' ? '' : tab} pickups`} hint={tab === 'upcoming' ? 'Book your next collection in under a minute.' : undefined} /></div>}
          </Card>
          {data.length === 0 && <div className="text-center mt-4"><LuClipboardList aria-hidden="true" /> <Link to="/app/schedule">Book your first pickup</Link></div>}
        </>
      )}
    </>
  );
};

export default Pickups;
