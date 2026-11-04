import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { LuMapPin, LuEye, LuTag, LuShieldCheck, LuHandCoins, LuCalendarCheck } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { useAuth } from '../../auth';
import { LISTING_CATEGORIES, CONDITIONS, money, timeAgo, fmtDate, isoDate } from '../../lib/format';
import { PageHeader, Card, Pill, Loading, ErrorState, Dialog, ConfirmDialog, Field } from '../../components/ui';
import { ListingArt } from '../../components/pickup';

const ListingDetail = () => {
  const { id } = useParams();
  const { pathname } = useLocation();
  const inApp = pathname.startsWith('/app');
  const base = inApp ? '/app/marketplace' : '/marketplace';
  const navigate = useNavigate();
  const { isAuthed, role } = useAuth();
  const { data: l, loading, error, reload } = useFetch(`/listings/${id}`);
  const [dialog, setDialog] = useState(null); // 'buy' | 'offer' | 'inspect'
  const [busy, setBusy] = useState(false);
  const [offer, setOffer] = useState({ amount: '', message: '' });
  const [inspect, setInspect] = useState({ date: '', note: '' });

  if (loading) return <div className="container py-5"><Loading /></div>;
  if (error) return <div className="container py-5"><ErrorState message={error} onRetry={reload} /></div>;

  const isCustomer = isAuthed && role === 'user';
  const available = l.status === 'approved';
  const isOwner = !!l.offers; // the API only includes offers for the owner and admins

  const act = async (fn, done) => {
    setBusy(true);
    try { await fn(); toast.success(done); setDialog(null); reload(); }
    catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className={inApp ? '' : 'container py-4'}>
      <PageHeader back={{ to: base, label: 'All listings' }} title={l.title} subtitle={`${l.city || 'Sri Lanka'} · posted ${timeAgo(l.createdAt)}`} actions={<Pill status={l.status} />} />
      <div className="grid-main">
        <div className="stack">
          <ListingArt listing={l} className="detail-img" />
          <Card title="About this item">
            <p className="mb-3" style={{ whiteSpace: 'pre-line' }}>{l.description || 'The seller has not added a description.'}</p>
            <dl className="kv">
              <div><dt>Condition</dt><dd>{CONDITIONS[l.condition]}</dd></div>
              <div><dt>Category</dt><dd>{LISTING_CATEGORIES[l.category]}</dd></div>
              <div><dt>Location</dt><dd><LuMapPin aria-hidden="true" /> {l.city || 'Sri Lanka'}</dd></div>
              <div><dt>Seller</dt><dd>{l.sellerName?.split(' ')[0]}</dd></div>
              <div><dt>Views</dt><dd><LuEye aria-hidden="true" /> {l.views}</dd></div>
            </dl>
          </Card>
        </div>

        <div className="stack">
          <Card>
            <div className="listing__price" style={{ fontSize: '2rem' }}>{money(l.price)}</div>
            {l.status === 'sold' && <p className="text-muted mb-0">This item has been sold.</p>}
            {available && !isAuthed && (
              <div className="d-grid gap-2 mt-3">
                <Link to="/login?mode=register" className="btn btn-success">Sign up to buy</Link>
                <Link to="/login" state={{ from: pathname }} className="btn btn-outline-success">Log in</Link>
              </div>
            )}
            {available && isCustomer && !isOwner && (
              <div className="d-grid gap-2 mt-3">
                <button type="button" className="btn btn-success" onClick={() => setDialog('buy')}><LuTag aria-hidden="true" /> Buy now</button>
                <button type="button" className="btn btn-outline-success" onClick={() => { setOffer({ amount: Math.round(l.price * 0.9), message: '' }); setDialog('offer'); }}><LuHandCoins aria-hidden="true" /> Make an offer</button>
                <button type="button" className="btn btn-outline-success" onClick={() => setDialog('inspect')}><LuCalendarCheck aria-hidden="true" /> Request inspection</button>
              </div>
            )}
            {l.myOffer && <p className="mt-3 mb-0 small">Your offer: <strong>{money(l.myOffer.amount)}</strong> <Pill status={l.myOffer.status} /></p>}
            {isOwner && isCustomer && <Link to="/app/market" className="btn btn-outline-success w-100 mt-3">Manage this listing</Link>}
            {available && isAuthed && role !== 'user' && <p className="text-muted small mt-3 mb-0">Staff accounts can view but not buy.</p>}
          </Card>
          <Card>
            <p className="mb-1"><LuShieldCheck aria-hidden="true" /> <strong>Reviewed by our team</strong></p>
            <p className="text-muted small mb-0">Every listing is checked before it goes live. Pay the seller directly when you collect the item. A 10% commission is charged to the seller only when it sells.</p>
          </Card>
        </div>
      </div>

      <ConfirmDialog show={dialog === 'buy'} onClose={() => setDialog(null)} busy={busy} title="Buy this item?" confirmLabel={`Buy for ${money(l.price)}`}
        message={`You are buying "${l.title}" for ${money(l.price)}. The seller will be notified and will contact you to arrange collection.`}
        onConfirm={() => act(() => http.post(`/listings/${id}/buy`), 'Purchase confirmed').then(() => navigate('/app/market'))} />

      <Dialog show={dialog === 'offer'} onClose={() => setDialog(null)} title="Make an offer" footer={(
        <><button type="button" className="btn btn-light" onClick={() => setDialog(null)}>Back</button>
          <button type="button" className="btn btn-success" disabled={busy || !(Number(offer.amount) > 0)} onClick={() => act(() => http.post(`/listings/${id}/offers`, offer), 'Offer sent')}>Send offer</button></>
      )}>
        <Field label="Your offer (Rs.)" htmlFor="offer-amount" hint={`Asking price is ${money(l.price)}`}>
          <input id="offer-amount" type="number" min="1" className="form-control" value={offer.amount} onChange={(e) => setOffer({ ...offer, amount: e.target.value })} />
        </Field>
        <Field label="Message to the seller (optional)" htmlFor="offer-msg">
          <textarea id="offer-msg" rows={3} className="form-control" value={offer.message} onChange={(e) => setOffer({ ...offer, message: e.target.value })} />
        </Field>
      </Dialog>

      <Dialog show={dialog === 'inspect'} onClose={() => setDialog(null)} title="Request an inspection" footer={(
        <><button type="button" className="btn btn-light" onClick={() => setDialog(null)}>Back</button>
          <button type="button" className="btn btn-success" disabled={busy || !inspect.date} onClick={() => act(() => http.post(`/listings/${id}/inspections`, inspect), `Requested for ${fmtDate(inspect.date)}`)}>Request</button></>
      )}>
        <Field label="Preferred date" htmlFor="insp-date"><input id="insp-date" type="date" min={isoDate()} className="form-control" value={inspect.date} onChange={(e) => setInspect({ ...inspect, date: e.target.value })} /></Field>
        <Field label="Note (optional)" htmlFor="insp-note"><textarea id="insp-note" rows={2} className="form-control" value={inspect.note} onChange={(e) => setInspect({ ...inspect, note: e.target.value })} /></Field>
      </Dialog>
    </div>
  );
};

export default ListingDetail;
