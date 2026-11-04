import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuTrendingUp, LuTrendingDown, LuMinus, LuCalculator, LuArrowRight } from 'react-icons/lu';
import { useFetch } from '../../api';
import { useAuth, HOME } from '../../auth';
import { MATERIALS, money, timeAgo } from '../../lib/format';
import { MATERIAL_GUIDE } from '../../lib/content';
import { Card, Loading, ErrorState, Tabs, PageHeader } from '../../components/ui';
import { Sparkline } from '../../components/charts';
import { MatIcon } from '../../components/pickup';
import { useLocation } from 'react-router-dom';

export const RateCards = ({ rates }) => (
  <div className="grid-3">
    {rates.map((r) => {
      const Trend = r.change > 0 ? LuTrendingUp : r.change < 0 ? LuTrendingDown : LuMinus;
      return (
        <div className="rate-card" key={r.material}>
          <div className="d-flex align-items-center gap-2"><MatIcon material={r.material} /><strong>{MATERIALS[r.material]?.label || r.label}</strong></div>
          <div className="rate-card__price">{money(r.pricePerKg)} <small>/ kg</small></div>
          <div className="d-flex justify-content-between align-items-center">
            <span className={`small ${r.change > 0 ? 'text-up' : r.change < 0 ? 'text-down' : 'text-muted'}`}><Trend aria-hidden="true" /> {r.change === 0 ? 'No change' : `${r.change > 0 ? '+' : ''}${r.change} since last update`}</span>
            <Sparkline values={r.history.map((h) => h.price)} color={r.change < 0 ? 'var(--danger)' : 'var(--leaf)'} />
          </div>
        </div>
      );
    })}
  </div>
);

const Prices = () => {
  const { pathname } = useLocation();
  const inApp = /^\/(app|driver)/.test(pathname);
  const { isAuthed, role } = useAuth();
  const { data, loading, error, reload } = useFetch('/rates');
  const [material, setMaterial] = useState('metal');
  const [weight, setWeight] = useState(10);
  const [guide, setGuide] = useState('metal');

  const rate = useMemo(() => data?.rates.find((r) => r.material === material)?.pricePerKg || 0, [data, material]);
  const cta = isAuthed && role === 'user' ? '/app/schedule' : isAuthed ? HOME[role] : '/login?mode=register';

  return (
    <div className={inApp ? '' : 'container py-4'}>
      {inApp ? <PageHeader title="Price guide" subtitle="What we pay per kilogram, updated by our team as the market moves." /> : (
        <div className="page-hero"><span className="eyebrow">Prices</span><h1>What your scrap is worth</h1><p>We pay by weight, on the spot. Rates follow the market and are always shown here before you book.</p></div>
      )}

      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <RateCards rates={data.rates} />
          <p className="text-muted small mt-2">Last updated {timeAgo(Math.max(...data.rates.map((r) => new Date(r.updatedAt))))}. Prices are per kilogram and may vary for mixed or contaminated loads.</p>

          <div className="grid-main mt-4">
            <Card title="Estimate your payout">
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label" htmlFor="est-material">Material</label>
                  <select id="est-material" className="form-select" value={material} onChange={(e) => setMaterial(e.target.value)}>
                    {data.rates.map((r) => <option key={r.material} value={r.material}>{MATERIALS[r.material]?.label || r.label}</option>)}
                  </select>
                </div>
                <div className="col-sm-6">
                  <label className="form-label" htmlFor="est-weight">Weight (kg)</label>
                  <input id="est-weight" type="number" min="0" className="form-control" value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
              </div>
              <input type="range" className="form-range mt-3" min="1" max="200" value={weight || 0} onChange={(e) => setWeight(e.target.value)} aria-label="Weight slider" />
            </Card>
            <div className="estimate">
              <small><LuCalculator aria-hidden="true" /> You could receive about</small>
              <strong>{money(rate * (Number(weight) || 0))}</strong>
              <small>{weight || 0} kg × {money(rate)} per kg, paid in cash at pickup</small>
              <Link to={cta} className="btn btn-lime w-100 mt-3">Book a pickup <LuArrowRight aria-hidden="true" /></Link>
            </div>
          </div>

          <h2 className="h4 mt-5 mb-3">Getting the best price</h2>
          <Tabs value={guide} onChange={setGuide} label="Material guide" tabs={Object.keys(MATERIAL_GUIDE).map((k) => ({ id: k, label: MATERIALS[k].label }))} />
          <Card>
            <p className="text-muted">Typically includes: {MATERIAL_GUIDE[guide].examples}.</p>
            <ul className="mb-0">{MATERIAL_GUIDE[guide].tips.map((t) => <li key={t} className="mb-1">{t}</li>)}</ul>
          </Card>
        </>
      )}
    </div>
  );
};

export default Prices;
