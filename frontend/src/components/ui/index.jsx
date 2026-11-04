import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { LuStar, LuArrowLeft, LuSearch, LuX, LuCheck, LuTrendingUp, LuTrendingDown } from 'react-icons/lu';
import { STATUS } from '../../lib/format';
import { fmtDateTime } from '../../lib/format';

export { Loading, ErrorState, Empty } from '../PageState';

export const PageHeader = ({ title, subtitle, actions, back }) => (
  <div className="page-header">
    <div>
      {back && <Link to={back.to} className="page-header__back"><LuArrowLeft aria-hidden="true" /> {back.label}</Link>}
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </div>
);

export const Card = ({ title, action, children, flush, className = '' }) => (
  <section className={`panel ${className}`}>
    {(title || action) && (
      <header className="panel__head">
        {title && <h2 className="panel__title">{title}</h2>}
        {action}
      </header>
    )}
    <div className={flush ? '' : 'panel__body'}>{children}</div>
  </section>
);

export const StatCard = ({ icon: Icon, label, value, hint, tone = 'default', to, trend }) => {
  const body = (
    <>
      <div className={`stat__icon stat__icon--${tone}`}>{Icon && <Icon aria-hidden="true" />}</div>
      <div className="stat__body">
        <span className="stat__label">{label}</span>
        <strong className="stat__value">{value}</strong>
        {(hint || trend != null) && (
          <span className="stat__hint">
            {trend != null && (trend >= 0 ? <LuTrendingUp aria-hidden="true" className="text-up" /> : <LuTrendingDown aria-hidden="true" className="text-down" />)}
            {hint}
          </span>
        )}
      </div>
    </>
  );
  return to ? <Link to={to} className="stat stat--link">{body}</Link> : <div className="stat">{body}</div>;
};

export const Pill = ({ status, children, tone }) => {
  const meta = STATUS[status] || {};
  return <span className={`pill pill--${tone || meta.tone || 'muted'}`}>{children || meta.label || status}</span>;
};

export const Tabs = ({ tabs, value, onChange, label = 'Sections' }) => (
  <div className="tabs" role="tablist" aria-label={label}>
    {tabs.map((t) => (
      <button key={t.id} type="button" role="tab" aria-selected={value === t.id} className={`tabs__tab ${value === t.id ? 'is-active' : ''}`} onClick={() => onChange(t.id)}>
        {t.label}
        {t.count != null && <span className="tabs__count">{t.count}</span>}
      </button>
    ))}
  </div>
);

export const Stars = ({ value = 0, onChange, size = 20 }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className={`stars ${onChange ? 'stars--input' : ''}`} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const Star = <LuStar size={size} className={n <= shown ? 'is-on' : ''} aria-hidden="true" />;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>{Star}</button>
        ) : <span key={n}>{Star}</span>;
      })}
    </span>
  );
};

export const Timeline = ({ events = [] }) => (
  <ol className="timeline">
    {events.map((e, i) => (
      <li key={i} className={`timeline__item timeline__item--${STATUS[e.status]?.tone || 'muted'} ${i === events.length - 1 ? 'is-last' : ''}`}>
        <span className="timeline__dot"><LuCheck aria-hidden="true" /></span>
        <div>
          <strong>{STATUS[e.status]?.label || e.status}</strong>
          {e.note && <div className="text-muted small">{e.note}</div>}
          <div className="timeline__meta">{fmtDateTime(e.at)}{e.by ? ` · ${e.by}` : ''}</div>
        </div>
      </li>
    ))}
  </ol>
);

export const Avatar = ({ name = '', src, size = 36 }) => (
  <span className="avatar-sm" style={{ width: size, height: size, fontSize: size * 0.38 }}>
    {src ? <img src={src} alt="" /> : name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
  </span>
);

export const Field = ({ label, hint, error, children, htmlFor }) => (
  <div className="mb-3">
    {label && <label className="form-label" htmlFor={htmlFor}>{label}</label>}
    {children}
    {hint && !error && <div className="form-text">{hint}</div>}
    {error && <div className="text-danger small mt-1" role="alert">{error}</div>}
  </div>
);

export const SearchBox = ({ value, onChange, placeholder = 'Search…' }) => (
  <label className="searchbox">
    <LuSearch aria-hidden="true" />
    <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    {value && <button type="button" aria-label="Clear search" onClick={() => onChange('')}><LuX aria-hidden="true" /></button>}
  </label>
);

export const Dialog = ({ show, onClose, title, children, footer, size }) => (
  <Modal show={show} onHide={onClose} centered size={size}>
    <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
    <Modal.Body>{children}</Modal.Body>
    {footer && <Modal.Footer>{footer}</Modal.Footer>}
  </Modal>
);

export const ConfirmDialog = ({ show, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger, busy }) => (
  <Dialog show={show} onClose={onClose} title={title} footer={(
    <>
      <button type="button" className="btn btn-light" onClick={onClose}>Back</button>
      <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-success'}`} onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
    </>
  )}>
    <p className="mb-0">{message}</p>
  </Dialog>
);

// Generic filter chips
export const Chips = ({ options, value, onChange }) => (
  <div className="chips" role="group">
    {options.map(([id, label]) => (
      <button key={id} type="button" className={`chip-btn ${value === id ? 'is-active' : ''}`} aria-pressed={value === id} onClick={() => onChange(id)}>{label}</button>
    ))}
  </div>
);
