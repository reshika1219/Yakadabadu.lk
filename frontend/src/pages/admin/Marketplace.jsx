import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuCheck, LuX, LuTrash2, LuEye } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { money, timeAgo, CONDITIONS, LISTING_CATEGORIES } from '../../lib/format';
import { PageHeader, Card, Tabs, Pill, Dialog, ConfirmDialog, Field, Loading, ErrorState, Empty } from '../../components/ui';
import { ListingArt } from '../../components/pickup';

const Marketplace = () => {
  const { data, loading, error, reload } = useFetch('/listings/admin/all');
  const [tab, setTab] = useState('pending');
  const [rejecting, setRejecting] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [note, setNote] = useState('');

  const counts = useMemo(() => ({ pending: 0, approved: 0, sold: 0, rejected: 0, ...Object.fromEntries(['pending', 'approved', 'sold', 'rejected'].map((s) => [s, (data || []).filter((l) => l.status === s).length])) }), [data]);
  const rows = (data || []).filter((l) => l.status === tab);

  const moderate = async (l, status, adminNote) => {
    try { await http.put(`/listings/${l._id}/moderate`, { status, note: adminNote }); toast.success(status === 'approved' ? 'Listing approved and live' : 'Listing rejected'); setRejecting(null); setNote(''); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const remove = async () => { try { await http.delete(`/listings/${removing._id}`); toast.success('Listing removed'); setRemoving(null); reload(); } catch (err) { toast.error(errorMessage(err)); } };

  return (
    <>
      <PageHeader title="Marketplace" subtitle="Review new listings before they go live and keep the catalogue clean." />
      <Tabs value={tab} onChange={setTab} label="Listing status" tabs={[['pending', 'Awaiting review'], ['approved', 'Live'], ['sold', 'Sold'], ['rejected', 'Rejected']].map(([id, label]) => ({ id, label, count: counts[id] }))} />
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <Card flush>
          {rows.length ? <ul className="rows">{rows.map((l) => (
            <li className="row-item flex-wrap" key={l._id}>
              <ListingArt listing={l} className="listing__img" />
              <div className="row-item__main">
                <div className="row-item__title">{l.title} <Pill status={l.status} /></div>
                <div className="row-item__sub">{money(l.price)} · {CONDITIONS[l.condition]} · {LISTING_CATEGORIES[l.category]} · by {l.sellerName} · {timeAgo(l.createdAt)}</div>
                {l.description && <div className="row-item__sub">{l.description.slice(0, 140)}{l.description.length > 140 ? '…' : ''}</div>}
                {l.status === 'sold' && <div className="row-item__sub">Sold to {l.buyerName} for {money(l.soldPrice)}</div>}
                {l.adminNote && <div className="row-item__sub">Note: {l.adminNote}</div>}
              </div>
              <div className="d-flex gap-2 flex-wrap">
                {l.status === 'pending' && <><button type="button" className="btn btn-success btn-sm" onClick={() => moderate(l, 'approved')}><LuCheck aria-hidden="true" /> Approve</button><button type="button" className="btn btn-light btn-sm" onClick={() => setRejecting(l)}><LuX aria-hidden="true" /> Reject</button></>}
                {l.status === 'approved' && <><Link to={`/marketplace/${l._id}`} className="btn btn-light btn-sm"><LuEye aria-hidden="true" /> View</Link><button type="button" className="btn btn-light btn-sm" onClick={() => setRejecting(l)}>Take down</button></>}
                {l.status !== 'sold' && <button type="button" className="btn btn-light btn-sm" aria-label="Delete listing" onClick={() => setRemoving(l)}><LuTrash2 aria-hidden="true" /></button>}
              </div>
            </li>
          ))}</ul> : <div className="p-3"><Empty title={tab === 'pending' ? 'Nothing to review' : 'No listings here'} hint={tab === 'pending' ? 'New listings from customers will appear here.' : undefined} /></div>}
        </Card>
      )}

      <Dialog show={!!rejecting} onClose={() => setRejecting(null)} title={rejecting?.status === 'approved' ? 'Take down listing' : 'Reject listing'} footer={<><button type="button" className="btn btn-light" onClick={() => setRejecting(null)}>Back</button><button type="button" className="btn btn-danger" disabled={!note.trim()} onClick={() => moderate(rejecting, 'rejected', note)}>Confirm</button></>}>
        <Field label="Reason for the seller" htmlFor="rn" hint="Be specific so they can fix it and resubmit."><textarea id="rn" rows={3} className="form-control" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </Dialog>
      <ConfirmDialog show={!!removing} onClose={() => setRemoving(null)} onConfirm={remove} danger confirmLabel="Delete" title="Delete listing?" message={`"${removing?.title}" will be permanently removed.`} />
    </>
  );
};

export default Marketplace;
