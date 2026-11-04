export const money = (n) => `Rs. ${Math.round(n || 0).toLocaleString('en-LK')}`;
export const kg = (n) => `${(Math.round((n || 0) * 10) / 10).toLocaleString('en-LK')} kg`;

export const fmtDate = (d, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('en-GB', opts) : '—';
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—');
export const fmtDateTime = (d) => (d ? `${fmtDate(d)}, ${fmtTime(d)}` : '—');

export const timeAgo = (d) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(d)) / 1000));
  if (s < 60) return 'just now';
  const units = [[60, 'min'], [3600, 'hr'], [86400, 'day']];
  for (let i = units.length - 1; i >= 0; i -= 1) {
    if (s >= units[i][0]) { const v = Math.floor(s / units[i][0]); return `${v} ${units[i][1]}${v > 1 ? 's' : ''} ago`; }
  }
  return 'just now';
};

export const dayLabel = (d) => {
  const date = new Date(d); const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(date).setHours(0, 0, 0, 0) - today) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' });
};

export const isoDate = (d = new Date()) => new Date(d).toISOString().slice(0, 10);

export const MATERIALS = {
  metal: { label: 'Metal', color: '#2f7d4a', icon: 'cog' },
  plastic: { label: 'Plastic', color: '#2f6fb0', icon: 'recycle' },
  paper: { label: 'Paper & cardboard', color: '#98720f', icon: 'inbox' },
  glass: { label: 'Glass', color: '#0d8585', icon: 'sparkles' },
  ewaste: { label: 'E-waste', color: '#6d3fd1', icon: 'tv' },
  wood: { label: 'Wood', color: '#a0673a', icon: 'hammer' },
};

export const SLOTS = { morning: 'Morning · 8–12', afternoon: 'Afternoon · 12–4', evening: 'Evening · 4–7' };
export const SCALES = [
  ['small', 'Small', 'Under 5 kg'],
  ['medium', 'Medium', '5–10 kg'],
  ['large', 'Large', '10–20 kg'],
  ['extra-large', 'Extra large', 'Over 20 kg'],
];
export const RETURN_OPTIONS = [
  ['cash', 'Cash', 'Paid on the spot at today’s rate'],
  ['broom', 'A broom', 'Swap your scrap for a broom'],
  ['basin', 'A basin', 'Swap your scrap for a basin'],
  ['nothing', 'Nothing', 'Just take it away'],
];

// Status presentation used by pills, timelines and filters
export const STATUS = {
  pending: { label: 'Pending', tone: 'muted', hint: 'Waiting for a driver' },
  assigned: { label: 'Driver assigned', tone: 'warn', hint: 'A driver is booked' },
  'on-the-way': { label: 'On the way', tone: 'info', hint: 'Driver is heading to you' },
  completed: { label: 'Completed', tone: 'ok', hint: 'Collected and weighed' },
  cancelled: { label: 'Cancelled', tone: 'bad', hint: 'This pickup was cancelled' },
  approved: { label: 'Live', tone: 'ok' },
  rejected: { label: 'Rejected', tone: 'bad' },
  sold: { label: 'Sold', tone: 'info' },
  withdrawn: { label: 'Withdrawn', tone: 'muted' },
  accepted: { label: 'Accepted', tone: 'ok' },
};
export const statusLabel = (s) => STATUS[s]?.label || s;

export const LISTING_CATEGORIES = {
  furniture: 'Furniture', electronics: 'Electronics', appliances: 'Appliances', 'metal-parts': 'Metal parts',
  building: 'Building materials', tools: 'Tools', other: 'Other',
};
export const CONDITIONS = { 'like-new': 'Like new', good: 'Good', fair: 'Fair', 'for-parts': 'For parts' };

// Read a File as a data URL, shrinking large photos so they stay small enough to store
export const readImage = (file, max = 900) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export const downloadCsv = (filename, rows) => {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};
