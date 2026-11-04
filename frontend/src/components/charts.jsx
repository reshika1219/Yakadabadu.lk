import React from 'react';

// Vertical bars with an optional second (overlaid) series. Pure CSS, no dependencies.
export const BarChart = ({ data, height = 160, format = (v) => v, color = 'var(--forest)', color2 = 'var(--lime)', legend }) => {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.value2 || 0)));
  return (
    <figure className="chart">
      <div className="chart__bars" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="chart__col" title={`${d.label}: ${format(d.value)}${d.value2 != null ? ` / ${format(d.value2)}` : ''}`}>
            <div className="chart__stack">
              <span className="chart__bar" style={{ height: `${(d.value / max) * 100}%`, background: color }} />
              {d.value2 != null && <span className="chart__bar chart__bar--second" style={{ height: `${(d.value2 / max) * 100}%`, background: color2 }} />}
            </div>
            <span className="chart__label">{d.label}</span>
          </div>
        ))}
      </div>
      {legend && (
        <figcaption className="chart__legend">
          {legend.map(([label, c]) => <span key={label}><i style={{ background: c }} />{label}</span>)}
        </figcaption>
      )}
    </figure>
  );
};

// Horizontal ranked bars
export const HBars = ({ items, format = (v) => v, emptyText = 'No data yet' }) => {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="text-muted mb-0">{emptyText}</p>;
  return (
    <ul className="hbars">
      {items.map((i) => (
        <li key={i.label}>
          <div className="hbars__row"><span>{i.label}</span><strong>{format(i.value)}</strong></div>
          <div className="hbars__track"><span style={{ width: `${(i.value / max) * 100}%`, background: i.color || 'var(--forest)' }} /></div>
        </li>
      ))}
    </ul>
  );
};

// Small inline trend line
export const Sparkline = ({ values, width = 90, height = 28, color = 'var(--leaf)' }) => {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 3 - ((v - min) / span) * (height - 6)}`).join(' ');
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};
