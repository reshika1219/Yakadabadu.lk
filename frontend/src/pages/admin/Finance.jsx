import React, { useState } from 'react';
import { LuHandCoins, LuStore, LuPercent, LuTrendingUp, LuRecycle, LuDownload } from 'react-icons/lu';
import { useFetch } from '../../api';
import { money, fmtDate, downloadCsv, MATERIALS } from '../../lib/format';
import { PageHeader, StatCard, Card, Chips, Loading, ErrorState, Empty } from '../../components/ui';
import { BarChart, HBars } from '../../components/charts';

const Finance = () => {
  const sum = useFetch('/finance/summary');
  const txs = useFetch('/finance/transactions');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(0);
  if (sum.loading || txs.loading) return <Loading />;
  if (sum.error) return <ErrorState message={sum.error} onRetry={sum.reload} />;

  const { totals, months, byMaterial, note } = sum.data;
  const rows = (txs.data || []).filter((t) => type === 'all' || t.type === type);
  const PAGE = 12;

  return (
    <>
      <PageHeader title="Finance" subtitle="Payouts, marketplace commission and estimated margin."
        actions={<button type="button" className="btn btn-outline-success" onClick={() => downloadCsv('transactions.csv', [['Date', 'Reference', 'Type', 'From', 'To', 'Amount LKR', 'Commission LKR', 'Note'], ...rows.map((t) => [fmtDate(t.date), t.ref, t.type, t.from?.name, t.to?.name, t.amount, t.commission, t.note])])}><LuDownload aria-hidden="true" /> Export transactions</button>} />

      <div className="stat-grid">
        <StatCard icon={LuHandCoins} tone="bad" label="Paid to customers" value={money(totals.payouts)} hint="cash for scrap" />
        <StatCard icon={LuRecycle} tone="lime" label="Recycler value (est.)" value={money(totals.recyclerValue)} hint="scrap sold on" />
        <StatCard icon={LuStore} tone="info" label="Marketplace sales" value={money(totals.marketGmv)} hint="gross value" />
        <StatCard icon={LuPercent} tone="warn" label="Commission earned" value={money(totals.commission)} hint="10% of sales" />
        <StatCard icon={LuTrendingUp} label="Estimated margin" value={money(totals.margin)} hint="recycler value + commission − payouts" />
      </div>
      <p className="text-muted small mb-4">{note}</p>

      <div className="grid-2 mb-4">
        <Card title="Monthly payouts vs recycler value">
          <BarChart height={180} data={months.map((m) => ({ label: new Date(m.month + '-01').toLocaleDateString('en-GB', { month: 'short' }), value: m.payouts, value2: m.recyclerValue + m.commission }))} format={(v) => money(v)} legend={[['Paid out', 'var(--forest)'], ['Recycler value + commission', 'var(--lime)']]} />
        </Card>
        <Card title="Payouts by material">
          <HBars items={byMaterial.map((m) => ({ label: m.label, value: m.amount, color: MATERIALS[m.material]?.color }))} format={money} />
        </Card>
      </div>

      <div className="toolbar"><h2 className="h4 mb-0">Transactions</h2><Chips value={type} onChange={(v) => { setType(v); setPage(0); }} options={[['all', 'All'], ['pickup-payout', 'Pickup payouts'], ['resale', 'Marketplace']]} /></div>
      <Card flush>
        {rows.length ? (
          <>
            <div className="dt-wrap"><table className="dt"><thead><tr><th>Date</th><th>Reference</th><th>Type</th><th>Parties</th><th>Note</th><th className="num">Amount</th><th className="num">Commission</th></tr></thead>
              <tbody>{rows.slice(page * PAGE, page * PAGE + PAGE).map((t) => (
                <tr key={t._id}><td>{fmtDate(t.date)}</td><td><code>{t.ref}</code></td><td>{t.type === 'resale' ? 'Marketplace sale' : 'Pickup payout'}</td><td>{t.from?.name} → {t.to?.name}</td><td>{t.note}</td><td className="num">{money(t.amount)}</td><td className="num">{t.commission ? money(t.commission) : '—'}</td></tr>
              ))}</tbody></table></div>
            <div className="pager"><span>{page * PAGE + 1}–{Math.min(rows.length, (page + 1) * PAGE)} of {rows.length}</span><div className="d-flex gap-2"><button type="button" className="btn btn-light btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" className="btn btn-light btn-sm" disabled={(page + 1) * PAGE >= rows.length} onClick={() => setPage(page + 1)}>Next</button></div></div>
          </>
        ) : <div className="p-3"><Empty title="No transactions" /></div>}
      </Card>
    </>
  );
};

export default Finance;
