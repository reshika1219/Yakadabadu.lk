import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuArrowRight, LuTrendingUp, LuTrendingDown, LuMinus, LuCalendarPlus, LuTruck, LuHandCoins, LuScale, LuMapPin, LuReceipt, LuStore, LuCheck, LuLeaf, LuRepeat, LuRecycle } from "react-icons/lu";
import { useFetch } from "../api";
import { useAuth, HOME } from "../auth";
import { MATERIALS, money } from "../lib/format";
import { ListingTile } from "./public/Marketplace";
import { MatIcon } from "../components/pickup";
import { FAQ } from "../lib/content";
import heroImage from "../images/hero.jpg";
import reduceImage from "../images/reduce.jpg";
import reuseImage from "../images/reuse.png";
import recycleImage from "../images/recycle.jpg";

const tabs = [
  {
    id: 'reduce',
    label: 'Reduce',
    icon: LuLeaf,
    tagline: 'Less waste at home',
    image: reduceImage,
    text: 'We make it easy to dispose of scrap responsibly. Book a pickup for metal, plastic, paper, glass, e-waste or wood and it leaves your home the same week, headed for the right channel.',
    points: ['Book a pickup in about a minute', 'Free doorstep collection', 'Fair, per-kilogram prices'],
    cta: ['Schedule a pickup', 'start'],
  },
  {
    id: 'reuse',
    label: 'Reuse',
    icon: LuRepeat,
    tagline: 'A second life for good items',
    image: reuseImage,
    text: 'Not everything is waste. List furniture, electronics and tools that still work, or find a bargain from someone nearby, and keep usable things out of the scrap pile.',
    points: ['Browse reviewed second-hand listings', 'Sell items that still work', '10% fee only when something sells'],
    cta: ['Browse the marketplace', '/marketplace'],
  },
  {
    id: 'recycle',
    label: 'Recycle',
    icon: LuRecycle,
    tagline: 'Back into the supply chain',
    image: recycleImage,
    text: 'We sort what we collect and pass it to specialised recycling partners, so metal, plastic and paper become new, usable products instead of landfill.',
    points: ['Sorted and weighed by material', 'Passed to specialised recyclers', 'A digital invoice for every payout'],
    cta: ['See today\'s prices', '/prices'],
  },
];

const Homepage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reduce');
  const active = tabs.find((t) => t.id === activeTab);
  const { isAuthed, role } = useAuth();
  const { data: rateData } = useFetch('/rates');
  const { data: listings } = useFetch('/listings?sort=newest');
  const startPath = !isAuthed ? '/login?mode=register' : role === 'user' ? '/app/schedule' : HOME[role];

  const scrollToHow = () => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' });
  const rateOf = (m) => rateData?.rates.find((r) => r.material === m);

  return (
    <main className="container home">
      <section className="hero">
        <div>
          <span className="eyebrow">Scrap pickup in Sri Lanka</span>
          <h1>Your scrap, <em>picked up.</em></h1>
          <p className="hero__sub">Book a collection for metal, plastic, paper, glass, e-waste or wood. We come to you, weigh it, and pay or swap it on the spot.</p>
          <div className="hero__cta">
            <button type="button" className="btn btn-lime btn-lg" onClick={() => navigate(startPath)}>Schedule a pickup</button>
            <button type="button" className="btn btn-ghost btn-lg" onClick={scrollToHow}>How it works</button>
          </div>
          <ul className="hero__trust list-unstyled">
            <li><LuCheck aria-hidden="true" /> Free doorstep pickup</li>
            <li><LuCheck aria-hidden="true" /> Weighed in front of you</li>
            <li><LuCheck aria-hidden="true" /> Paid on the spot</li>
          </ul>
        </div>
        <div className="hero__media">
          <img src={heroImage} alt="" />
          <div className="hero__badge">
            <strong>Metal &middot; 12 kg</strong>
            <span>Collected tomorrow, 10:00</span>
          </div>
        </div>
      </section>

      {rateData && (
        <section className="rates-strip" aria-label="Today's prices">
          <span className="rates-strip__title">Today&rsquo;s prices <small>per kg</small></span>
          <ul className="list-unstyled">
            {rateData.rates.map((r) => {
              const Trend = r.change > 0 ? LuTrendingUp : r.change < 0 ? LuTrendingDown : LuMinus;
              return (
                <li key={r.material}>
                  <span>{(MATERIALS[r.material]?.label || r.label).split(' ')[0]}</span>
                  <strong>{money(r.pricePerKg)}</strong>
                  <Trend aria-hidden="true" className={r.change > 0 ? 'text-up' : r.change < 0 ? 'text-down' : 'text-muted'} />
                </li>
              );
            })}
          </ul>
          <Link to="/prices" className="rates-strip__link">Estimate payout <LuArrowRight aria-hidden="true" /></Link>
        </section>
      )}

      <section className="section" id="how">
        <div className="section__head">
          <span className="eyebrow">How it works</span>
          <h2>Three steps. No hauling.</h2>
        </div>
        <ol className="steps">
          {[
            [LuCalendarPlus, 'Tell us what you have', 'Pick the material, a rough size and a day that suits you.'],
            [LuTruck, 'We send a driver', 'A driver is assigned and arrives in your chosen time slot. Track them live.'],
            [LuHandCoins, 'Get paid or swap', 'We weigh it on site. Take cash, a broom, a basin, or nothing at all.'],
          ].map((row) => {
            const [Icon, title, text] = row;
            return (
              <li key={title}>
                <span className="steps__icon"><Icon aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="section">
        <div className="section__head">
          <span className="eyebrow">What we collect</span>
          <h2>Six materials, one price list</h2>
        </div>
        <div className="material-grid">
          {Object.entries(MATERIALS).map(([key, m]) => (
            <Link to="/prices" className="material-tile" key={key}>
              <MatIcon material={key} size={46} />
              <strong>{m.label}</strong>
              <span>{rateOf(key) ? `${money(rateOf(key).pricePerKg)} / kg` : '—'}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <ul className="benefits list-unstyled">
          {[
            [LuScale, 'Fair weighing', 'Every load is weighed in front of you.'],
            [LuMapPin, 'Live tracking', 'See your driver and the status of every pickup.'],
            [LuReceipt, 'Digital invoices', 'A clear record of every payout.'],
            [LuStore, 'Marketplace', 'Sell items that still work, not just scrap.'],
          ].map((row) => {
            const [Icon, title, text] = row;
            return <li key={title}><Icon aria-hidden="true" /><div><strong>{title}</strong><span>{text}</span></div></li>;
          })}
        </ul>
      </section>

      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Our approach</span>
          <h2>Reduce. Reuse. Recycle.</h2>
          <p className="text-muted mb-0">Three habits that keep materials in use. Pick one to see how we help.</p>
        </div>

        <div className="rrr-cards" role="tablist" aria-label="Reduce, reuse, recycle">
          {tabs.map((t, i) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={activeTab === t.id}
                aria-controls="rrr-panel"
                className={`rrr-card ${activeTab === t.id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="rrr-card__icon"><Icon aria-hidden="true" /></span>
                <span className="rrr-card__text"><small>Step {i + 1}</small><strong>{t.label}</strong><span>{t.tagline}</span></span>
              </button>
            );
          })}
        </div>

        <div id="rrr-panel" role="tabpanel" aria-labelledby={`tab-${active.id}`} className="rrr-panel">
          <img src={active.image} alt={`${active.label} illustration`} />
          <div>
            <h3>{active.label}</h3>
            <p>{active.text}</p>
            <ul className="checks list-unstyled">
              {active.points.map((pt) => <li key={pt}><span><LuCheck aria-hidden="true" /></span>{pt}</li>)}
            </ul>
            <button type="button" className="btn btn-success" onClick={() => navigate(active.cta[1] === 'start' ? startPath : active.cta[1])}>
              {active.cta[0]} <LuArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {listings?.length > 0 && (
        <section className="section">
          <div className="section__head">
            <span className="eyebrow">Marketplace</span>
            <h2>Fresh from our community</h2>
          </div>
          <div className="listing-grid listing-grid--center">{listings.slice(0, 4).map((l) => <ListingTile key={l._id} listing={l} base="/marketplace" />)}</div>
          <div className="text-center mt-4"><Link to="/marketplace" className="btn btn-outline-success">Browse all items <LuArrowRight aria-hidden="true" /></Link></div>
        </section>
      )}

      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Questions</span>
          <h2>Good to know</h2>
        </div>
        <div className="faq faq--narrow">
          {FAQ.slice(0, 4).map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </div>
        <div className="text-center mt-3"><Link to="/help" className="link-btn">More answers in the help centre <LuArrowRight aria-hidden="true" /></Link></div>
      </section>

      <section className="cta-band">
        <h2>Ready to clear the clutter?</h2>
        <p>Book your first pickup in about a minute.</p>
        <div className="d-flex gap-2 flex-wrap justify-content-center">
          <button type="button" className="btn btn-success btn-lg" onClick={() => navigate(startPath)}>Book your pickup</button>
          <Link to="/prices" className="btn btn-outline-success btn-lg">See prices</Link>
        </div>
      </section>
    </main>
  );
};

export default Homepage;
