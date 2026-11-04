import React from 'react';

export const Loading = ({ label = 'Loading…' }) => (
  <div className="page-state" role="status">
    <span className="spinner-border text-success" aria-hidden="true"></span>
    <span>{label}</span>
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="page-state" role="alert">
    <strong>Something went wrong</strong>
    <span className="text-muted">{message}</span>
    {onRetry && (
      <button type="button" className="btn btn-outline-success btn-sm" onClick={onRetry}>Try again</button>
    )}
  </div>
);

export const Empty = ({ title, hint }) => (
  <div className="page-state">
    <strong>{title}</strong>
    {hint && <span className="text-muted">{hint}</span>}
  </div>
);

const STATUS_TONE = { assigned: 'warn', 'on-the-way': 'info', confirmed: 'ok', completed: 'ok', cancelled: 'bad', pending: 'muted' };

export const StatusPill = ({ status }) => (
  <span className={`pill pill--${STATUS_TONE[status] || 'muted'}`}>{status}</span>
);
