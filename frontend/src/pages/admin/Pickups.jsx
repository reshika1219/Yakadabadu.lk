import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LuDownload, LuChevronUp, LuChevronDown, LuBan } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { MATERIALS, SLOTS, STATUS, fmtDate, fmtDateTime, money, downloadCsv } from '../../lib/format';
import { PageHeader, Card, Tabs, SearchBox, Pill, Loading, ErrorState, Empty, Dialog, Timeline, Stars, Field } from '../../components/ui';
import { MatIcon } from '../../components/pickup';
import AssignSelect from '../../components/AssignSelect';

const PAGE = 12;
const TABS = [['all', 'All'], ['pending', 'Pending'], ['assigned', 'Assigned'], ['on-the-way', 'On the way'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];

const Pickups = () => {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const [q, setQ] = useState('');
  const [driver, setDriver] = useState('');
  const [sort, setSort] = useState({ key: 'scheduledTime', dir: 'desc' });
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(null);
  const [reason, setReason] = useState('');
  const { data, loading, error, reload } = useFetch('/pickups');
  const drivers = useFetch('/drivers');

  const counts = useMemo(() => Object.fromEntries(TABS.map(([k]) => [k, (data || []).filter((p) => k === 'all' || p.status === k).length])), [data]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = (data || [])
      .filter((p) => status === 'all' || p.status === status)
      .filter((p) => !driver || (driver === 'none' ? !p.driver : p.driver?._id === driver))
      .filter((p) => !t || `${p.address} ${p.customerName} ${p.driver?.firstName || ''} ${MATERIALS[p.pickupType]?.label}`.toLowerCase().includes(t));
    const val = (p) => ({ scheduledTime: +new Date(p.scheduledTime), customer: p.customerName, status: p.status, material: p.pickupType, amount: p.amount || p.estimatedAmount || 0 })[sort.key];
    return list.sort((a, b) => (val(a) > val(b) ? 1 : -1) * (sort.dir === 'asc' ? 1 : -1));
  }, [data, status, q, driver, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));
  const Th = ({ k, children, className }) => (
    <th className={`sortable ${className || ''}`} onClick={() => toggleSort(k)} aria-sort={sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      {children} {sort.key === k && (sort.dir === 'asc' ? <LuChevronUp aria-hidden="true" /> : <LuChevronDown aria-hidden="true" />)}
    </th>
  );

  const cancel = async () => {
    try { await http.put(`/pickups/${open._id}/cancel`, { reason }); toast.success('Pickup cancelled'); setOpen(null); setReason(''); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const refreshOpen = async () => { await reload(); };

  return (
    <>
      <PageHeader title="Pickups" subtitle="Dispatch, monitor and manage every collection request."
        actions={<button type="button" className="btn btn-outline-success" disabled={!rows.length} onClick={() => downloadCsv('pickups.csv', [['Date', 'Slot', 'Customer', 'Address', 'Material', 'Status', 'Driver', 'Weight kg', 'Amount LKR'], ...rows.map((p) => [fmtDate(p.scheduledTime), p.timeSlot, p.customerName, p.address, p.pickupType, p.status, p.driver?.name || '', p.weight || '', p.amount ?? ''])])}><LuDownload aria-hidden="true" /> Export CSV</button>} />

      <Tabs value={status} onChange={(s) => { setParams(s === 'all' ? {} : { status: s }); setPage(0); }} label="Status" tabs={TABS.map(([id, label]) => ({ id, label, count: counts[id] }))} />
      <div className="toolbar">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Search customer, address, driver" />
        <select className="form-select form-select-sm" style={{ width: 'auto' }} aria-label="Filter by driver" value={driver} onChange={(e) => { setDriver(e.target.value); setPage(0); }}>
          <option value="">All drivers</option><option value="none">Unassigned</option>
          {(drivers.data || []).filter((d) => d.role === 'driver').map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <Card flush>
          {shown.length ? (
            <div className="dt-wrap">
              <table className="dt">
                <thead><tr><Th k="scheduledTime">When</Th><Th k="customer">Customer</Th><th>Address</th><Th k="material">Material</Th><Th k="status">Status</Th><th>Driver</th><Th k="amount" className="num">Value</Th></tr></thead>
                <tbody>
                  {shown.map((p) => (
                    <tr key={p._id}>
                      <td><button type="button" className="link-btn" onClick={() => setOpen(p)}>{fmtDate(p.scheduledTime, { day: 'numeric', month: 'short' })}</button><div className="text-muted small">{SLOTS[p.timeSlot]?.split(' · ')[0]}</div></td>
                      <td>{p.customerName}<div className="text-muted small">{p.contactNumber}</div></td>
                      <td style={{ maxWidth: 220 }}>{p.address}</td>
                      <td><div className="d-flex align-items-center gap-2"><MatIcon material={p.pickupType} size={30} />{MATERIALS[p.pickupType]?.label}</div></td>
                      <td><Pill status={p.status} /></td>
                      <td>{drivers.data ? <AssignSelect pickup={p} drivers={drivers.data} onAssigned={reload} /> : '…'}</td>
                      <td className="num">{p.status === 'completed' ? <><strong>{money(p.amount)}</strong><div className="text-muted small">{p.weight} kg</div></> : p.estimatedAmount ? <span className="text-muted">~{money(p.estimatedAmount)}</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="p-3"><Empty title="No pickups match" hint="Try a different status or clear the search." /></div>}
          {rows.length > PAGE && (
            <div className="pager"><span>{page * PAGE + 1}–{Math.min(rows.length, (page + 1) * PAGE)} of {rows.length}</span>
              <div className="d-flex gap-2"><button type="button" className="btn btn-light btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" className="btn btn-light btn-sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button></div></div>
          )}
        </Card>
      )}

      {open && (
        <Dialog show onClose={() => { setOpen(null); setReason(''); }} size="lg" title={`${MATERIALS[open.pickupType]?.label} pickup · ${open.customerName}`}>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="mb-3 d-flex gap-2 align-items-center"><Pill status={open.status} /><span className="text-muted small">{STATUS[open.status]?.hint}</span></div>
              <dl className="kv">
                <div><dt>When</dt><dd>{fmtDate(open.scheduledTime)} · {SLOTS[open.timeSlot]?.split(' · ')[0]}</dd></div>
                <div><dt>Address</dt><dd>{open.address}</dd></div>
                <div><dt>Contact</dt><dd>{open.user?.name} · {open.contactNumber}</dd></div>
                {open.instructions && <div><dt>Notes</dt><dd>{open.instructions}</dd></div>}
                {open.status === 'completed' && <><div><dt>Weight</dt><dd>{open.weight} kg</dd></div><div><dt>Paid</dt><dd>{money(open.amount)}</dd></div></>}
                {open.rating?.stars && <div><dt>Rating</dt><dd><Stars value={open.rating.stars} size={16} /></dd></div>}
                {open.cancelReason && <div><dt>Cancelled</dt><dd>{open.cancelReason}</dd></div>}
              </dl>
              {!['completed', 'cancelled'].includes(open.status) && (
                <div className="mt-3">
                  <Field label="Driver">{drivers.data && <AssignSelect pickup={open} drivers={drivers.data} size="md" onAssigned={async () => { await refreshOpen(); setOpen(null); }} />}</Field>
                  <Field label="Cancel this pickup" htmlFor="cx"><div className="d-flex gap-2"><input id="cx" className="form-control form-control-sm" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} /><button type="button" className="btn btn-outline-danger btn-sm" onClick={cancel}><LuBan aria-hidden="true" /> Cancel</button></div></Field>
                </div>
              )}
            </div>
            <div className="col-md-6"><h3 className="h6 mb-3">Activity</h3><Timeline events={open.timeline} /><div className="text-muted small">Created {fmtDateTime(open.createdAt)}</div></div>
          </div>
        </Dialog>
      )}
    </>
  );
};

export default Pickups;
