import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LuPlus, LuImage, LuCheck, LuX, LuEye, LuTrash2, LuPencil, LuUndo2 } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { LISTING_CATEGORIES, CONDITIONS, money, timeAgo, fmtDate, readImage } from '../../lib/format';
import { PageHeader, Card, Pill, Tabs, Dialog, ConfirmDialog, Field, Loading, ErrorState, Empty } from '../../components/ui';
import { ListingArt } from '../../components/pickup';

const blank = { title: '', description: '', category: 'furniture', condition: 'good', price: '', image: '' };

const ListingForm = ({ initial, onClose, onSaved }) => {
  const [f, setF] = useState(initial || blank);
  const [busy, setBusy] = useState(false);
  const set = (patch) => setF({ ...f, ...patch });
  const editing = !!initial?._id;

  const pickImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try { set({ image: await readImage(file) }); } catch { toast.error('That image could not be read'); }
  };
  const save = async () => {
    setBusy(true);
    try {
      if (editing) await http.put(`/listings/${initial._id}`, f); else await http.post('/listings', f);
      toast.success(editing ? 'Listing updated' : 'Submitted for review. We will let you know once it is live.');
      onSaved();
    } catch (err) { toast.error(errorMessage(err)); setBusy(false); }
  };

  return (
    <Dialog show onClose={onClose} title={editing ? 'Edit listing' : 'Sell an item'} footer={(
      <><button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-success" disabled={busy || !f.title.trim() || !(Number(f.price) > 0)} onClick={save}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Submit for review'}</button></>
    )}>
      <Field label="Title" htmlFor="l-title"><input id="l-title" className="form-control" value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Teak study desk" /></Field>
      <div className="row g-3">
        <div className="col-sm-6"><Field label="Category" htmlFor="l-cat"><select id="l-cat" className="form-select" value={f.category} onChange={(e) => set({ category: e.target.value })}>{Object.entries(LISTING_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field></div>
        <div className="col-sm-6"><Field label="Condition" htmlFor="l-cond"><select id="l-cond" className="form-select" value={f.condition} onChange={(e) => set({ condition: e.target.value })}>{Object.entries(CONDITIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field></div>
      </div>
      <Field label="Price (Rs.)" htmlFor="l-price" hint="A 10% commission is taken only when it sells."><input id="l-price" type="number" min="1" className="form-control" value={f.price} onChange={(e) => set({ price: e.target.value })} /></Field>
      <Field label="Description" htmlFor="l-desc"><textarea id="l-desc" rows={3} className="form-control" value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder="Size, age, flaws, why you are selling" /></Field>
      <Field label="Photo (optional)" htmlFor="l-img">
        <input id="l-img" type="file" accept="image/*" className="form-control" onChange={pickImage} />
        {f.image && <img src={f.image} alt="Preview" className="mt-2 rounded" style={{ maxHeight: 140 }} />}
      </Field>
    </Dialog>
  );
};

const MyMarket = () => {
  const [params, setParams] = useSearchParams();
  const mine = useFetch('/listings/mine');
  const buys = useFetch('/listings/purchases');
  const [tab, setTab] = useState('listings');
  const [form, setForm] = useState(null); // null | listing | 'new'
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (params.get('new')) { setForm('new'); setParams({}, { replace: true }); } }, [params, setParams]);

  const decide = async (listing, offer, action) => {
    try {
      await http.put(`/listings/${listing._id}/offers/${offer._id}`, { action });
      toast.success(action === 'accept' ? `Sold to ${offer.buyerName}` : 'Offer declined');
      mine.reload();
    } catch (err) { toast.error(errorMessage(err)); }
  };
  const withdraw = async (l) => { try { await http.put(`/listings/${l._id}`, { status: 'withdrawn' }); toast.success('Listing withdrawn'); mine.reload(); } catch (err) { toast.error(errorMessage(err)); } };
  const remove = async () => {
    setBusy(true);
    try { await http.delete(`/listings/${removing._id}`); toast.success('Listing deleted'); setRemoving(null); mine.reload(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };

  const openOffers = (mine.data || []).reduce((n, l) => n + (l.status === 'approved' ? l.offers.filter((o) => o.status === 'pending').length : 0), 0);

  return (
    <>
      <PageHeader title="My listings & orders" subtitle="Manage what you sell and what you have bought or offered on."
        actions={<><Link to="/app/marketplace" className="btn btn-outline-success">Browse items</Link><button type="button" className="btn btn-success" onClick={() => setForm('new')}><LuPlus aria-hidden="true" /> Sell an item</button></>} />
      <Tabs value={tab} onChange={setTab} label="Marketplace" tabs={[{ id: 'listings', label: 'My listings', count: mine.data?.length }, { id: 'orders', label: 'Purchases & offers', count: buys.data ? buys.data.bought.length + buys.data.offers.length : undefined }]} />
      {openOffers > 0 && tab === 'listings' && <div className="alert alert-success">You have {openOffers} open offer{openOffers > 1 ? 's' : ''} waiting for a reply.</div>}

      {tab === 'listings' && (mine.loading ? <Loading /> : mine.error ? <ErrorState message={mine.error} onRetry={mine.reload} /> : mine.data.length === 0 ? (
        <Empty title="You have not listed anything yet" hint="Furniture, electronics, tools: if it still works, someone wants it." />
      ) : (
        <div className="stack">
          {mine.data.map((l) => {
            const pending = l.offers.filter((o) => o.status === 'pending');
            return (
              <section key={l._id} className="panel">
                <div className="row-item">
                  <ListingArt listing={l} className="listing__img" />
                  <div className="row-item__main">
                    <div className="row-item__title">{l.title} <Pill status={l.status} /></div>
                    <div className="row-item__sub">{money(l.price)} · {CONDITIONS[l.condition]} · {LISTING_CATEGORIES[l.category]} · {timeAgo(l.createdAt)}</div>
                    <div className="row-item__sub"><LuEye aria-hidden="true" /> {l.views} views · {l.offers.length} offer{l.offers.length !== 1 ? 's' : ''}</div>
                    {l.status === 'pending' && <div className="row-item__sub">Waiting for review by our team.</div>}
                    {l.status === 'rejected' && <div className="text-danger small">Needs changes: {l.adminNote || 'Rejected by a moderator.'} Edit and resubmit.</div>}
                    {l.status === 'sold' && <div className="row-item__sub">Sold to {l.buyerName} for {money(l.soldPrice)} on {fmtDate(l.soldAt)}.</div>}
                  </div>
                  <div className="d-flex gap-1 flex-wrap justify-content-end">
                    {['approved', 'pending', 'rejected'].includes(l.status) && <button type="button" className="btn btn-light btn-sm" aria-label="Edit" onClick={() => setForm(l)}><LuPencil aria-hidden="true" /></button>}
                    {l.status === 'approved' && <button type="button" className="btn btn-light btn-sm" aria-label="Withdraw" onClick={() => withdraw(l)}><LuUndo2 aria-hidden="true" /></button>}
                    {l.status !== 'sold' && <button type="button" className="btn btn-light btn-sm" aria-label="Delete" onClick={() => setRemoving(l)}><LuTrash2 aria-hidden="true" /></button>}
                    {['approved', 'sold'].includes(l.status) && <Link to={`/app/marketplace/${l._id}`} className="btn btn-outline-success btn-sm">View</Link>}
                  </div>
                </div>
                {l.status === 'approved' && pending.length > 0 && (
                  <div className="offers">
                    <strong className="small text-muted">OPEN OFFERS</strong>
                    {pending.map((o) => (
                      <div key={o._id} className="offer">
                        <div><strong>{o.buyerName}</strong> offered <strong>{money(o.amount)}</strong>{o.amount >= l.price ? '' : ` (${Math.round((o.amount / l.price) * 100)}% of asking)`}{o.message && <div className="text-muted small">&ldquo;{o.message}&rdquo;</div>}</div>
                        <div className="d-flex gap-1"><button type="button" className="btn btn-success btn-sm" onClick={() => decide(l, o, 'accept')}><LuCheck aria-hidden="true" /> Accept</button><button type="button" className="btn btn-light btn-sm" onClick={() => decide(l, o, 'reject')}><LuX aria-hidden="true" /> Decline</button></div>
                      </div>
                    ))}
                  </div>
                )}
                {l.inspections?.length > 0 && l.status === 'approved' && (
                  <div className="offers"><strong className="small text-muted">INSPECTION REQUESTS</strong>{l.inspections.map((i, k) => <div key={k} className="small">{i.buyerName} would like to visit on <strong>{fmtDate(i.date)}</strong>{i.note && ` · ${i.note}`}</div>)}</div>
                )}
              </section>
            );
          })}
        </div>
      ))}

      {tab === 'orders' && (buys.loading ? <Loading /> : buys.error ? <ErrorState message={buys.error} onRetry={buys.reload} /> : (
        <div className="stack">
          <Card title="Purchases" flush>
            {buys.data.bought.length ? <div className="rows">{buys.data.bought.map((l) => (
              <Link key={l._id} to={`/app/marketplace/${l._id}`} className="row-item"><ListingArt listing={l} className="listing__img" /><div className="row-item__main"><div className="row-item__title">{l.title}</div><div className="row-item__sub">Bought {fmtDate(l.soldAt)} from {l.sellerName}</div></div><strong>{money(l.soldPrice)}</strong></Link>
            ))}</div> : <div className="p-3"><Empty title="No purchases yet" /></div>}
          </Card>
          <Card title="My offers" flush>
            {buys.data.offers.length ? <div className="rows">{buys.data.offers.map((o) => (
              <Link key={o._id} to={`/app/marketplace/${o.listing._id}`} className="row-item"><div className="row-item__main"><div className="row-item__title">{o.listing.title} <Pill status={o.status} /></div><div className="row-item__sub">Asking {money(o.listing.price)} · sent {timeAgo(o.createdAt)}</div></div><strong>{money(o.amount)}</strong></Link>
            ))}</div> : <div className="p-3"><Empty title="No offers sent" hint="Found something you like? Make an offer from the listing page." /></div>}
          </Card>
        </div>
      ))}

      {form && <ListingForm initial={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={() => { setForm(null); mine.reload(); }} />}
      <ConfirmDialog show={!!removing} onClose={() => setRemoving(null)} onConfirm={remove} busy={busy} danger title="Delete this listing?" confirmLabel="Delete" message={`"${removing?.title}" and its offers will be removed for good.`} />
    </>
  );
};

export default MyMarket;
