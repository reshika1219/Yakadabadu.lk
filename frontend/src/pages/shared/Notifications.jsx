import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuBell, LuTruck, LuStore, LuCalendarCheck, LuInfo, LuCheckCheck } from 'react-icons/lu';
import { http, useFetch } from '../../api';
import { timeAgo } from '../../lib/format';
import { PageHeader, Card, Chips, Loading, ErrorState, Empty } from '../../components/ui';

const ICON = { pickup: LuTruck, market: LuStore, leave: LuCalendarCheck, info: LuInfo };

const Notifications = () => {
  const { data, loading, error, reload } = useFetch('/notifications');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const rows = data.items.filter((n) => filter === 'all' || !n.read);
  const open = async (n) => {
    if (!n.read) await http.put(`/notifications/${n._id}/read`);
    if (n.link) navigate(n.link); else reload();
  };

  return (
    <>
      <PageHeader title="Notifications" subtitle={data.unread ? `${data.unread} unread` : 'You are all caught up.'}
        actions={data.unread > 0 && <button type="button" className="btn btn-outline-success" onClick={async () => { await http.put('/notifications/read-all'); reload(); }}><LuCheckCheck aria-hidden="true" /> Mark all as read</button>} />
      <div className="mb-3"><Chips value={filter} onChange={setFilter} options={[['all', 'All'], ['unread', 'Unread']]} /></div>
      <Card flush>
        {rows.length ? (
          <div className="rows">
            {rows.map((n) => {
              const Icon = ICON[n.type] || LuBell;
              return (
                <button type="button" key={n._id} className="row-item w-100 text-start border-0 bg-transparent" onClick={() => open(n)}>
                  <span className="mat-dot" style={{ background: n.read ? 'var(--muted)' : 'var(--forest)' }}><Icon aria-hidden="true" /></span>
                  <div className="row-item__main"><div className="row-item__title">{n.title}{!n.read && <span className="pill pill--ok">New</span>}</div><div className="row-item__sub">{n.body}</div></div>
                  <small className="text-muted">{timeAgo(n.createdAt)}</small>
                </button>
              );
            })}
          </div>
        ) : <div className="p-3"><Empty title="Nothing to show" hint="Updates about pickups, offers and approvals will appear here." /></div>}
      </Card>
    </>
  );
};

export default Notifications;
