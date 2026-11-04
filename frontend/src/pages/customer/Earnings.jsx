import React, { useState } from 'react';
import { LuArrowDownLeft, LuArrowUpRight, LuWallet, LuShoppingBag, LuDownload } from 'react-icons/lu';
import { useFetch } from '../../api';
import { money, fmtDate, downloadCsv } from '../../lib/format';
import { PageHeader, StatCard, Card, Chips, Loading, ErrorState, Empty } from '../../components/ui';

const Earnings = () => {
  const { data, loading, error, reload } = useFetch('/finance/me');
  const [filter, setFilter] = useState('all');
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const rows = data.transactions.filter((t) => filter === 'all' || t.direction === filter);

  return (
    <>
      <PageHeader title="Earnings" subtitle="Money from scrap pickups and marketplace sales, and what you have spent."
        actions={<button type="button" className="btn btn-outline-success" onClick={() => downloadCsv('my-transactions.csv', [['Date', 'Reference', 'Type', 'Note', 'Direction', 'Amount (LKR)'], ...data.transactions.map((t) => [fmtDate(t.date), t.ref, t.type, t.note, t.direction, t.amount])])}><LuDownload aria-hidden="true" /> Export CSV</button>} />
      <div className="stat-grid">
        <StatCard icon={LuWallet} tone="lime" label="Total earned" value={money(data.earned)} hint="after marketplace commission" />
        <StatCard icon={LuShoppingBag} tone="info" label="Total spent" value={money(data.spent)} hint="marketplace purchases" />
        <StatCard icon={LuArrowDownLeft} label="Net" value={money(data.earned - data.spent)} />
      </div>
      <div className="mb-3"><Chips value={filter} onChange={setFilter} options={[['all', 'All'], ['in', 'Money in'], ['out', 'Money out']]} /></div>
      <Card flush>
        {rows.length ? (
          <div className="rows">
            {rows.map((t) => (
              <div className="row-item" key={t._id}>
                <span className="mat-dot" style={{ background: t.direction === 'in' ? 'var(--leaf)' : 'var(--danger)' }}>{t.direction === 'in' ? <LuArrowDownLeft aria-hidden="true" /> : <LuArrowUpRight aria-hidden="true" />}</span>
                <div className="row-item__main"><div className="row-item__title">{t.type === 'pickup-payout' ? 'Scrap pickup payout' : t.direction === 'in' ? 'Marketplace sale' : 'Marketplace purchase'}</div><div className="row-item__sub">{t.note} · {fmtDate(t.date)} · {t.ref}</div></div>
                <strong className={t.direction === 'in' ? 'text-up' : ''}>{t.direction === 'in' ? '+' : '−'}{money(t.amount)}</strong>
              </div>
            ))}
          </div>
        ) : <div className="p-3"><Empty title="No transactions yet" hint="Payouts from completed pickups and marketplace sales show up here." /></div>}
      </Card>
    </>
  );
};

export default Earnings;
