import React, { useMemo, useState } from 'react';
import { LuBan, LuCircleCheck, LuDownload } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { fmtDate, kg, downloadCsv } from '../../lib/format';
import { PageHeader, Card, SearchBox, Avatar, StatCard, Loading, ErrorState, Empty } from '../../components/ui';
import { LuUsers, LuBuilding2, LuScale } from 'react-icons/lu';

const Customers = () => {
  const { data, loading, error, reload } = useFetch('/users');
  const [q, setQ] = useState('');
  const rows = useMemo(() => { const t = q.trim().toLowerCase(); return (data || []).filter((u) => !t || `${u.name} ${u.email} ${u.address} ${u.phone}`.toLowerCase().includes(t)); }, [data, q]);

  const toggle = async (u) => {
    try { await http.put(`/users/${u._id}/suspend`, { suspended: !u.suspended }); toast.success(u.suspended ? 'Account reinstated' : 'Account suspended'); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Customers" subtitle="Households and businesses using the platform."
        actions={<button type="button" className="btn btn-outline-success" onClick={() => downloadCsv('customers.csv', [['Name', 'Email', 'Phone', 'Address', 'Type', 'Pickups', 'Kg', 'Joined'], ...rows.map((u) => [u.name, u.email, u.phone, u.address, u.type, u.pickups, u.kg, fmtDate(u.createdAt)])])}><LuDownload aria-hidden="true" /> Export CSV</button>} />
      <div className="stat-grid">
        <StatCard icon={LuUsers} label="Customers" value={data.length} />
        <StatCard icon={LuBuilding2} tone="info" label="Businesses" value={data.filter((u) => u.type === 'industrial').length} />
        <StatCard icon={LuScale} tone="lime" label="Total recycled" value={kg(data.reduce((s, u) => s + u.kg, 0))} />
      </div>
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search name, email, address" /></div>
      <Card flush>
        {rows.length ? (
          <div className="dt-wrap"><table className="dt">
            <thead><tr><th>Customer</th><th>Contact</th><th className="num">Pickups</th><th className="num">Recycled</th><th className="num">Listings</th><th>Joined</th><th>Status</th><th /></tr></thead>
            <tbody>{rows.map((u) => (
              <tr key={u._id}>
                <td><div className="d-flex align-items-center gap-2"><Avatar name={u.name} /><div><strong>{u.name}</strong><div className="text-muted small">{u.type === 'industrial' ? 'Business' : 'Household'}</div></div></div></td>
                <td>{u.email}<div className="text-muted small">{u.phone}</div></td>
                <td className="num">{u.pickups}</td><td className="num">{kg(u.kg)}</td><td className="num">{u.listings}</td>
                <td>{fmtDate(u.createdAt)}</td>
                <td>{u.suspended ? <span className="pill pill--bad">Suspended</span> : <span className="pill pill--ok">Active</span>}</td>
                <td className="text-end"><button type="button" className="btn btn-light btn-sm" onClick={() => toggle(u)}>{u.suspended ? <><LuCircleCheck aria-hidden="true" /> Reinstate</> : <><LuBan aria-hidden="true" /> Suspend</>}</button></td>
              </tr>
            ))}</tbody></table></div>
        ) : <div className="p-3"><Empty title="No customers match" /></div>}
      </Card>
      <p className="text-muted small mt-2">{rows.length} of {data.length} customers shown</p>
    </>
  );
};

export default Customers;
