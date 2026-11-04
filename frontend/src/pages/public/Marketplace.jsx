import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuPlus, LuEye } from 'react-icons/lu';
import { useFetch } from '../../api';
import { useAuth } from '../../auth';
import { LISTING_CATEGORIES, CONDITIONS, money, timeAgo } from '../../lib/format';
import { PageHeader, SearchBox, Chips, Loading, ErrorState, Empty } from '../../components/ui';
import { ListingArt } from '../../components/pickup';

export const ListingTile = ({ listing: l, base }) => (
  <Link to={`${base}/${l._id}`} className="listing">
    <ListingArt listing={l}><span className="listing__tag">{CONDITIONS[l.condition]}</span></ListingArt>
    <div className="listing__body">
      <span className="listing__price">{money(l.price)}</span>
      <span className="listing__title">{l.title}</span>
      <span className="listing__meta">{l.city || 'Sri Lanka'} · {timeAgo(l.createdAt)}</span>
    </div>
  </Link>
);

const Marketplace = () => {
  const { pathname } = useLocation();
  const inApp = pathname.startsWith('/app');
  const base = inApp ? '/app/marketplace' : '/marketplace';
  const { isAuthed, role } = useAuth();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [sort, setSort] = useState('newest');
  const [max, setMax] = useState('');

  const query = useMemo(() => {
    const p = new URLSearchParams({ sort });
    if (q) p.set('q', q);
    if (category) p.set('category', category);
    if (condition) p.set('condition', condition);
    if (max) p.set('max', max);
    return `/listings?${p}`;
  }, [q, category, condition, sort, max]);
  const { data, loading, error, reload } = useFetch(query);
  const sellTo = isAuthed && role === 'user' ? '/app/market?new=1' : '/login?mode=register';

  return (
    <div className={inApp ? '' : 'container py-4'}>
      <PageHeader
        title="Marketplace"
        subtitle="Second-hand furniture, electronics, tools and more. Every listing is reviewed by our team."
        actions={<Link to={sellTo} className="btn btn-success"><LuPlus aria-hidden="true" /> Sell an item</Link>}
      />

      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Search items or places" />
        <div className="d-flex gap-2 flex-wrap">
          <select className="form-select form-select-sm" aria-label="Condition" value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="">Any condition</option>
            {Object.entries(CONDITIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="form-select form-select-sm" aria-label="Maximum price" value={max} onChange={(e) => setMax(e.target.value)}>
            <option value="">Any price</option>
            {[5000, 10000, 25000, 50000].map((v) => <option key={v} value={v}>Under {money(v)}</option>)}
          </select>
          <select className="form-select form-select-sm" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="popular">Most viewed</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <Chips value={category} onChange={setCategory} options={[['', 'All'], ...Object.entries(LISTING_CATEGORIES)]} />
      </div>

      {loading ? <Loading label="Loading listings…" />
        : error ? <ErrorState message={error} onRetry={reload} />
          : data.length === 0 ? <Empty title="No items match" hint="Try clearing a filter or searching for something else." />
            : <div className="listing-grid">{data.map((l) => <ListingTile key={l._id} listing={l} base={base} />)}</div>}
      {data?.length > 0 && <p className="text-muted small mt-3 mb-0"><LuEye aria-hidden="true" /> Showing {data.length} live listing{data.length > 1 ? 's' : ''}</p>}
    </div>
  );
};

export default Marketplace;
