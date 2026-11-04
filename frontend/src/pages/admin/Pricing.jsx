import React, { useEffect, useState } from 'react';
import { LuSave, LuTrendingUp, LuTrendingDown, LuMinus } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { money, timeAgo, MATERIALS } from '../../lib/format';
import { PageHeader, Card, Loading, ErrorState } from '../../components/ui';
import { Sparkline } from '../../components/charts';
import { MatIcon } from '../../components/pickup';

const Pricing = () => {
  const { data, loading, error, reload } = useFetch('/rates');
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(null);
  useEffect(() => { if (data) setDraft(Object.fromEntries(data.rates.map((r) => [r.material, r.pricePerKg]))); }, [data]);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const save = async (r) => {
    setSaving(r.material);
    try { await http.put(`/rates/${r.material}`, { pricePerKg: Number(draft[r.material]) }); toast.success(`${MATERIALS[r.material]?.label} is now ${money(draft[r.material])} per kg`); reload(); }
    catch (err) { toast.error(errorMessage(err)); } finally { setSaving(null); }
  };

  return (
    <>
      <PageHeader title="Pricing" subtitle="Rates per kilogram. Changes apply instantly to estimates, payouts and the public price page." />
      <Card flush>
        <div className="dt-wrap"><table className="dt">
          <thead><tr><th>Material</th><th>Current</th><th>Trend</th><th>Updated</th><th style={{ width: 220 }}>New price (Rs./kg)</th><th /></tr></thead>
          <tbody>{data.rates.map((r) => {
            const Trend = r.change > 0 ? LuTrendingUp : r.change < 0 ? LuTrendingDown : LuMinus;
            const changed = Number(draft[r.material]) !== r.pricePerKg;
            return (
              <tr key={r.material}>
                <td><div className="d-flex align-items-center gap-2"><MatIcon material={r.material} size={32} /><strong>{MATERIALS[r.material]?.label}</strong></div></td>
                <td><strong>{money(r.pricePerKg)}</strong></td>
                <td><span className={r.change > 0 ? 'text-up' : r.change < 0 ? 'text-down' : 'text-muted'}><Trend aria-hidden="true" /> {r.change > 0 ? '+' : ''}{r.change}</span> <Sparkline values={r.history.map((h) => h.price)} width={70} height={22} color={r.change < 0 ? 'var(--danger)' : 'var(--leaf)'} /></td>
                <td className="text-muted">{timeAgo(r.updatedAt)}</td>
                <td><input type="number" min="0" aria-label={`New price for ${MATERIALS[r.material]?.label}`} className="form-control form-control-sm" value={draft[r.material] ?? ''} onChange={(e) => setDraft({ ...draft, [r.material]: e.target.value })} /></td>
                <td className="text-end"><button type="button" className="btn btn-success btn-sm" disabled={!changed || saving === r.material || !(Number(draft[r.material]) >= 0)} onClick={() => save(r)}><LuSave aria-hidden="true" /> Save</button></td>
              </tr>
            );
          })}</tbody></table></div>
      </Card>
      <div className="grid-2 mt-4">
        <Card title="How pricing works"><p className="text-muted mb-0">Customers are paid <strong>weight × rate</strong> at the moment the driver completes the pickup. Update rates as the market moves; each change is kept in the history shown by the trend line.</p></Card>
        <Card title="Platform settings"><dl className="kv"><div><dt>Marketplace commission</dt><dd>{Math.round(data.config.commission * 100)}%</dd></div><div><dt>Recycler margin (estimate)</dt><dd>{Math.round(data.config.recyclerMargin * 100)}%</dd></div></dl></Card>
      </div>
    </>
  );
};

export default Pricing;
