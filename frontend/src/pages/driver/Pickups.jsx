import React, { useMemo, useState } from 'react';
import { useFetch } from '../../api';
import { dayLabel, MATERIALS, SLOTS, money } from '../../lib/format';
import { PageHeader, Card, Tabs, SearchBox, Loading, ErrorState, Empty, Pill } from '../../components/ui';
import { MatIcon } from '../../components/pickup';
import { useDriverActions, PickupButtons } from '../../components/DriverActions';

const Pickups = () => {
  const [tab, setTab] = useState('active');
  const [q, setQ] = useState('');
  const active = useFetch('/pickups/me?scope=active');
  const history = useFetch('/pickups/me?scope=history');
  const actions = useDriverActions(() => { active.reload(); history.reload(); });
  const src = tab === 'active' ? active : history;

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (src.data || []).filter((p) => !t || `${p.address} ${p.user?.name} ${MATERIALS[p.pickupType]?.label}`.toLowerCase().includes(t));
  }, [src.data, q]);

  return (
    <>
      <PageHeader title="My pickups" subtitle="Everything assigned to you, and what you have finished." />
      <div className="toolbar">
        <Tabs value={tab} onChange={setTab} label="Pickup scope" tabs={[{ id: 'active', label: 'Active', count: active.data?.length }, { id: 'history', label: 'History', count: history.data?.length }]} />
        <SearchBox value={q} onChange={setQ} placeholder="Search customer or address" />
      </div>
      {src.loading ? <Loading /> : src.error ? <ErrorState message={src.error} onRetry={src.reload} /> : (
        <Card flush>
          {rows.length ? (
            <ul className="rows">
              {rows.map((p) => (
                <li key={p._id} className="row-item flex-wrap">
                  <MatIcon material={p.pickupType} />
                  <div className="row-item__main">
                    <div className="row-item__title">{p.user?.name || p.customerName} <Pill status={p.status} /></div>
                    <div className="row-item__sub">{p.address}</div>
                    <div className="row-item__sub">{dayLabel(p.scheduledTime)} · {SLOTS[p.timeSlot]?.split(' · ')[0]} · {MATERIALS[p.pickupType]?.label}{p.status === 'completed' ? ` · ${p.weight} kg · ${money(p.amount)}` : ''}{p.cancelReason ? ` · ${p.cancelReason}` : ''}</div>
                  </div>
                  {tab === 'active' && <PickupButtons pickup={p} actions={actions} />}
                  {tab === 'history' && p.rating?.stars && <span className="pill pill--warn">{p.rating.stars} ★</span>}
                </li>
              ))}
            </ul>
          ) : <div className="p-3"><Empty title={q ? 'No matches' : tab === 'active' ? 'No active pickups' : 'No history yet'} /></div>}
        </Card>
      )}
      {actions.dialogs}
    </>
  );
};

export default Pickups;
