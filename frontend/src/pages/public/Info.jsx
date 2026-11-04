import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuHeart, LuTruck, LuRecycle, LuShieldCheck, LuMail, LuPhone, LuClock } from 'react-icons/lu';
import { ABOUT, FAQ, LEGAL } from '../../lib/content';
import { Card, PageHeader } from '../../components/ui';

const ICONS = [LuShieldCheck, LuTruck, LuRecycle, LuHeart];

export const About = () => (
  <div className="container py-4">
    <div className="page-hero"><span className="eyebrow">About us</span><h1>Making scrap work for Sri Lanka</h1><p>{ABOUT.mission}</p></div>
    <div className="grid-2">
      {ABOUT.pillars.map(([title, text], i) => {
        const Icon = ICONS[i];
        return (
          <Card key={title}>
            <div className="empty-art"><Icon aria-hidden="true" /></div>
            <h2 className="h4">{title}</h2>
            <p className="text-muted mb-0">{text}</p>
          </Card>
        );
      })}
    </div>
    <div className="cta-band mt-5"><h2>Ready to give your scrap a second life?</h2><Link to="/login?mode=register" className="btn btn-success btn-lg">Get started</Link></div>
  </div>
);

export const Help = () => {
  const inApp = /^\/(app|driver)/.test(useLocation().pathname);
  const body = (
    <div className="grid-main">
      <Card title="Frequently asked questions" className="faq">
        <div className="faq">{FAQ.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
      </Card>
      <div className="stack">
        <Card title="Still need help?">
          <ul className="list-unstyled mb-0 d-grid gap-3">
            <li><LuMail aria-hidden="true" /> <strong>hello@yakadabadu.lk</strong><div className="text-muted small">We reply within one working day</div></li>
            <li><LuPhone aria-hidden="true" /> <strong>011 234 5678</strong><div className="text-muted small">Mon–Sat, 8am to 6pm</div></li>
            <li><LuClock aria-hidden="true" /> <strong>Response times</strong><div className="text-muted small">Pickup issues are handled first</div></li>
          </ul>
        </Card>
        <Card title="Quick links">
          <ul className="list-unstyled mb-0 d-grid gap-2"><li><Link to="/prices">Check today&rsquo;s prices</Link></li><li><Link to="/privacy">Privacy policy</Link></li><li><Link to="/terms">Terms of service</Link></li></ul>
        </Card>
      </div>
    </div>
  );
  return inApp ? <><PageHeader title="Help & FAQ" subtitle="Answers to the most common questions." />{body}</>
    : <div className="container py-4"><div className="page-hero"><span className="eyebrow">Help centre</span><h1>How can we help?</h1><p>Find answers below, or get in touch with the team.</p></div>{body}</div>;
};

export const Legal = ({ kind }) => {
  const doc = LEGAL[kind];
  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <div className="page-hero"><span className="eyebrow">Legal</span><h1>{doc.title}</h1><p>Last updated {doc.updated}</p></div>
      <div className="prose">{doc.sections.map(([h, t]) => <section key={h}><h2>{h}</h2><p>{t}</p></section>)}</div>
    </div>
  );
};

export const NotFound = () => (
  <div className="container py-5 text-center">
    <div className="empty-art mx-auto"><LuRecycle aria-hidden="true" /></div>
    <h1 className="page-title">Page not found</h1>
    <p className="text-muted">That page has been recycled. Let&rsquo;s get you back on track.</p>
    <div className="d-flex gap-2 justify-content-center"><Link to="/" className="btn btn-success">Home</Link><Link to="/help" className="btn btn-outline-success">Help</Link></div>
  </div>
);
