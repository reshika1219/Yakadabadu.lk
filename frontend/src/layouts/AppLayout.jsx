import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LuMenu, LuX, LuBell, LuSearch, LuLogOut, LuUser, LuCircleHelp, LuChevronDown, LuExternalLink, LuChevronRight, LuCheck, LuRepeat, LuCornerDownLeft } from 'react-icons/lu';
import logo from '../assets/logo.png';
import { useAuth, HOME } from '../auth';
import { NAV, flatNav } from '../nav';
import { http } from '../api';
import { timeAgo } from '../lib/format';
import { SHOW_DEMO, DEMO_ACCOUNTS, DEMO_PASSWORD } from '../lib/demo';
import { Avatar } from '../components/ui';
import { toast } from 'react-toastify';

const SHORT = { Dashboard: 'Home', 'My pickups': 'Pickups', 'Book a pickup': 'Book', 'Browse items': 'Browse', 'Profile & settings': 'Profile', 'Availability & leave': 'Shift', 'Staff & drivers': 'Staff', Marketplace: 'Market' };

/* ---------- Sidebar ---------- */
const Sidebar = ({ role, onNavigate, unread }) => {
  const nav = NAV[role];
  return (
    <aside className="sidebar" aria-label={`${nav.label} navigation`}>
      <div className="sidebar__head">
        <Link to={HOME[role]} onClick={onNavigate} aria-label="Dashboard home"><img src={logo} alt="" className="sidebar__logo" /></Link>
        <span className="sidebar__role">{nav.label}</span>
      </div>
      <nav className="sidebar__nav">
        {nav.groups.map((g) => (
          <div key={g.title} className="sidebar__group">
            <h2 className="sidebar__title">{g.title}</h2>
            <ul className="list-unstyled">
              {g.items.map((i) => {
                const Icon = i.icon;
                return (
                  <li key={i.to}>
                    <NavLink to={i.to} end={i.end} onClick={onNavigate} className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}>
                      <Icon aria-hidden="true" />
                      <span>{i.label}</span>
                      {i.label === 'Notifications' && unread > 0 && <b className="sidebar__badge">{unread}</b>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="sidebar__foot">
        <Link to="/" className="sidebar__link" onClick={onNavigate}><LuExternalLink aria-hidden="true" /><span>Public site</span></Link>
      </div>
    </aside>
  );
};

/* ---------- Breadcrumbs derived from the nav model ---------- */
const useCrumbs = (role) => {
  const { pathname } = useLocation();
  return useMemo(() => {
    const items = flatNav(role);
    const exact = items.find((i) => i.to.split('?')[0] === pathname);
    const parent = !exact && items.filter((i) => !i.end && pathname.startsWith(i.to.split('?')[0] + '/')).sort((a, b) => b.to.length - a.to.length)[0];
    const crumbs = [{ label: NAV[role].label, to: HOME[role] }];
    const hit = exact || parent;
    if (hit && hit.to !== HOME[role]) {
      crumbs.push({ label: hit.group, to: null });
      crumbs.push({ label: hit.label, to: parent ? hit.to : null });
      if (parent) crumbs.push({ label: 'Details', to: null });
    }
    return crumbs;
  }, [role, pathname]);
};

/* ---------- Notifications bell ---------- */
const Bell = ({ role, items, unread, reload }) => {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const navigate = useNavigate();
  const base = NAV[role].base;

  const readAll = async () => { await http.put('/notifications/read-all'); reload(); };
  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) { await http.put(`/notifications/${n._id}/read`); reload(); }
    if (n.link) navigate(n.link);
  };

  return (
    <div className="menu" ref={ref}>
      <button type="button" className="icon-btn" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <LuBell aria-hidden="true" />
        {unread > 0 && <b className="icon-btn__badge">{unread > 9 ? '9+' : unread}</b>}
      </button>
      {open && (
        <div className="menu__panel menu__panel--wide" role="dialog" aria-label="Notifications">
          <div className="menu__head">
            <strong>Notifications</strong>
            {unread > 0 && <button type="button" className="link-btn" onClick={readAll}><LuCheck aria-hidden="true" /> Mark all read</button>}
          </div>
          <ul className="notif-list list-unstyled">
            {items.slice(0, 6).map((n) => (
              <li key={n._id}>
                <button type="button" className={`notif ${n.read ? '' : 'is-unread'}`} onClick={() => openItem(n)}>
                  <strong>{n.title}</strong>
                  {n.body && <span>{n.body}</span>}
                  <small>{timeAgo(n.createdAt)}</small>
                </button>
              </li>
            ))}
            {items.length === 0 && <li className="menu__empty">You are all caught up.</li>}
          </ul>
          <Link to={`${base}/notifications`} className="menu__foot" onClick={() => setOpen(false)}>View all notifications <LuChevronRight aria-hidden="true" /></Link>
        </div>
      )}
    </div>
  );
};

/* ---------- User menu (with demo account switcher) ---------- */
const UserMenu = ({ role }) => {
  const { name, logout, login } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const navigate = useNavigate();
  const base = NAV[role].base;

  const switchTo = async (acct) => {
    try {
      const r = await login(acct.kind, { email: acct.email, password: DEMO_PASSWORD });
      setOpen(false);
      navigate(HOME[r]);
      toast.success(`Signed in as ${acct.label}`);
    } catch {
      toast.error('Could not switch account');
    }
  };

  return (
    <div className="menu" ref={ref}>
      <button type="button" className="user-btn" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>
        <Avatar name={name || '?'} />
        <span className="user-btn__text d-none d-md-flex"><strong>{name}</strong><small>{NAV[role].label}</small></span>
        <LuChevronDown aria-hidden="true" className="d-none d-md-block" />
      </button>
      {open && (
        <div className="menu__panel" role="menu">
          <div className="menu__head"><div><strong>{name}</strong><div className="text-muted small">{NAV[role].label} account</div></div></div>
          <Link role="menuitem" to={`${base}/profile`} className="menu__item" onClick={() => setOpen(false)}><LuUser aria-hidden="true" /> Profile & settings</Link>
          <Link role="menuitem" to={`${base}/help`} className="menu__item" onClick={() => setOpen(false)}><LuCircleHelp aria-hidden="true" /> Help</Link>
          {SHOW_DEMO && (
            <div className="menu__section">
              <span className="menu__label"><LuRepeat aria-hidden="true" /> Switch demo account</span>
              <div className="menu__switch">
                {DEMO_ACCOUNTS.map((a) => <button key={a.key} type="button" className="chip-btn" onClick={() => switchTo(a)}>{a.label}</button>)}
              </div>
            </div>
          )}
          <button role="menuitem" type="button" className="menu__item menu__item--danger" onClick={() => { logout(); navigate('/'); }}><LuLogOut aria-hidden="true" /> Log out</button>
        </div>
      )}
    </div>
  );
};

/* ---------- Command palette (Ctrl/Cmd + K) ---------- */
const Palette = ({ role, open, onClose }) => {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const items = useMemo(() => [...flatNav(role), { to: '/', label: 'Public site', group: 'Go to', keywords: 'home website' }], [role]);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? items.filter((i) => `${i.label} ${i.group} ${i.keywords || ''}`.toLowerCase().includes(t)) : items;
  }, [q, items]);

  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);
  useEffect(() => setActive(0), [q]);

  const go = (item) => { onClose(); navigate(item.to); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) go(results[active]);
    else if (e.key === 'Escape') onClose();
  };

  if (!open) return null;
  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Quick navigation" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette__input">
          <LuSearch aria-hidden="true" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Jump to a page…" aria-label="Jump to a page" />
          <kbd>Esc</kbd>
        </div>
        <ul className="palette__list list-unstyled" role="listbox">
          {results.map((r, i) => {
            const Icon = r.icon;
            return (
              <li key={r.to + r.label} role="option" aria-selected={i === active}>
                <button type="button" className={`palette__item ${i === active ? 'is-active' : ''}`} onMouseEnter={() => setActive(i)} onClick={() => go(r)}>
                  {Icon ? <Icon aria-hidden="true" /> : <LuExternalLink aria-hidden="true" />}
                  <span>{r.label}</span>
                  <small>{r.group}</small>
                  {i === active && <LuCornerDownLeft aria-hidden="true" />}
                </button>
              </li>
            );
          })}
          {results.length === 0 && <li className="menu__empty">Nothing matches &ldquo;{q}&rdquo;.</li>}
        </ul>
      </div>
    </div>
  );
};

/* ---------- Close a popover on outside click or Escape ---------- */
function useDismiss(open, close) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, close]);
  return ref;
}

/* ---------- Shell ---------- */
const AppLayout = ({ role }) => {
  const nav = NAV[role];
  const { pathname } = useLocation();
  const crumbs = useCrumbs(role);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [notifs, setNotifs] = useState({ items: [], unread: 0 });
  const QuickIcon = nav.quick.icon;
  const tabs = nav.tabs.map((to) => flatNav(role).find((i) => i.to === to)).filter(Boolean);

  const loadNotifs = useCallback(async () => {
    try { const { data } = await http.get('/notifications'); setNotifs(data); } catch { /* the bell is optional */ }
  }, []);

  // Poll for new notifications, and refresh whenever the page changes
  useEffect(() => { loadNotifs(); const t = setInterval(loadNotifs, 30000); return () => clearInterval(t); }, [loadNotifs, pathname]);
  useEffect(() => { setDrawer(false); window.scrollTo({ top: 0 }); }, [pathname]);
  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <div className={`shell__sidebar ${drawer ? 'is-open' : ''}`}>
        <Sidebar role={role} onNavigate={() => setDrawer(false)} unread={notifs.unread} />
        <button type="button" className="shell__scrim" aria-label="Close menu" onClick={() => setDrawer(false)} />
      </div>

      <div className="shell__main">
        <header className="topbar">
          <button type="button" className="icon-btn topbar__burger" aria-label="Open menu" onClick={() => setDrawer(true)}>{drawer ? <LuX /> : <LuMenu />}</button>
          <nav className="crumbs" aria-label="Breadcrumb">
            <ol>
              {crumbs.map((c, i) => (
                <li key={c.label + i} className={i === crumbs.length - 1 ? 'is-current' : ''} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                  {c.to && i !== crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : c.label}
                </li>
              ))}
            </ol>
          </nav>
          <button type="button" className="topbar__search" onClick={() => setPalette(true)} aria-label="Search pages (Command K)">
            <LuSearch aria-hidden="true" /><span>Jump to…</span><kbd>⌘K</kbd>
          </button>
          <div className="topbar__actions">
            <Link to={nav.quick.to} className="btn btn-lime btn-sm topbar__quick"><QuickIcon aria-hidden="true" /> <span>{nav.quick.label}</span></Link>
            <Bell role={role} items={notifs.items} unread={notifs.unread} reload={loadNotifs} />
            <UserMenu role={role} />
          </div>
        </header>

        <main id="main" className="content"><Outlet /></main>

        <footer className="app-footer">
          <span>&copy; {new Date().getFullYear()} Yakadabadu.lk</span>
          <nav aria-label="Footer">
            <Link to={`${nav.base}/help`}>Help</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/">Public site</Link>
          </nav>
        </footer>
      </div>

      <nav className="tabbar" aria-label="Quick navigation">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tabbar__item ${isActive ? 'is-active' : ''}`}>
              <Icon aria-hidden="true" /><span>{SHORT[t.label] || t.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
        <button type="button" className="tabbar__item" onClick={() => setDrawer(true)}><LuMenu aria-hidden="true" /><span>More</span></button>
      </nav>

      <Palette role={role} open={palette} onClose={() => setPalette(false)} />
    </div>
  );
};

export default AppLayout;
