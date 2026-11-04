import React from 'react';
import { useParams } from 'react-router-dom';
import { LuPrinter } from 'react-icons/lu';
import { useFetch } from '../../api';
import { PageHeader, Loading, ErrorState } from '../../components/ui';
import { money, fmtDate, RETURN_OPTIONS } from '../../lib/format';
import logo from '../../assets/logo.png';

const Invoice = () => {
  const { id } = useParams();
  const { data: inv, loading, error, reload } = useFetch(`/pickups/${id}/invoice`);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const inKind = inv.returnOption && inv.returnOption !== 'cash';

  return (
    <>
      <PageHeader back={{ to: `/app/pickups/${id}`, label: 'Back to pickup' }} title="Invoice" actions={<button type="button" className="btn btn-success" onClick={() => window.print()}><LuPrinter aria-hidden="true" /> Print / save PDF</button>} />
      <article className="invoice">
        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
          <div style={{ background: 'var(--forest)', borderRadius: 14, padding: '0.6rem 1rem' }}><img src={logo} alt="Yakadabadu.lk" height="40" /></div>
          <div className="text-end"><h2 className="h4 mb-0">Payment receipt</h2><div className="text-muted">{inv.invoiceNo}</div><div className="text-muted">{fmtDate(inv.date)}</div></div>
        </div>
        <div className="row g-4 mb-4">
          <div className="col-sm-6"><div className="text-muted small">Paid to</div><strong>{inv.customer.name}</strong><div>{inv.address}</div><div className="text-muted">{inv.customer.phone}</div></div>
          <div className="col-sm-6"><div className="text-muted small">Collected by</div><strong>{inv.driver || 'Yakadabadu.lk driver'}</strong><div className="text-muted">Yakadabadu.lk, Colombo</div></div>
        </div>
        <table>
          <thead><tr><th>Item</th><th>Weight</th><th>Rate</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
          <tbody>
            <tr><td>{inv.material}</td><td>{inv.weight} kg</td><td>{money(inv.ratePerKg)} / kg</td><td style={{ textAlign: 'right' }}>{money(inv.weight * (inv.ratePerKg || 0))}</td></tr>
            <tr className="total"><td colSpan={3}>{inKind ? `Settled in kind (${RETURN_OPTIONS.find((r) => r[0] === inv.returnOption)?.[1]})` : 'Total paid in cash'}</td><td style={{ textAlign: 'right' }}>{inKind ? '—' : money(inv.amount)}</td></tr>
          </tbody>
        </table>
        <p className="text-muted small mt-4 mb-0">Thank you for recycling with Yakadabadu.lk. Weight was recorded by the driver at the time of collection.</p>
      </article>
    </>
  );
};

export default Invoice;
