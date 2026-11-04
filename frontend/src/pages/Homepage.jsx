import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuArrowRight, LuTrendingUp, LuTrendingDown, LuMinus } from "react-icons/lu";
import { useFetch } from "../api";
import { useAuth, HOME } from "../auth";
import { MATERIALS, money } from "../lib/format";
import { ListingTile } from "./public/Marketplace";
import heroImage from "../images/hero.jpg";
import reduceIcon from "../images/reduce-icon.svg";
import reuseIcon from "../images/reuse-icon.svg";
import recycleIcon from "../images/recycle-icon.svg";
import reduceImage from "../images/reduce.jpg";
import reuseImage from "../images/reuse.png";
import recycleImage from "../images/recycle.jpg";

const tabs = [
  {
    id: 'reduce',
    label: 'Reduce',
    icon: reduceIcon,
    image: reduceImage,
    text: 'We make it easy to responsibly dispose of your waste with pickup scheduling and drop-off services for metal and plastic. Less buildup means a cleaner environment, and your materials go straight to the right channels.',
    cta: ['Schedule pickup', '/login?mode=register'],
  },
  {
    id: 'reuse',
    label: 'Reuse',
    icon: reuseIcon,
    image: reuseImage,
    text: 'Not everything is waste. We assess, repair and resell usable materials, giving them a second life and cutting demand for new production.',
  },
  {
    id: 'recycle',
    label: 'Recycle',
    icon: recycleIcon,
    image: recycleImage,
    text: 'We partner with specialised recycling companies so your metal, plastic and other recyclables are turned into new, usable products.',
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

  return (
    <div>
      <main className="container">
        <section className="hero">
          <div>
            <span className="eyebrow">Scrap pickup in Sri Lanka</span>
            <h1>Your scrap, <em>picked up.</em></h1>
            <p className="hero__sub">Book a collection for metal, plastic, paper, glass, e-waste or wood. We come to you, weigh it, and pay or swap it on the spot.</p>
            <div className="hero__cta">
              <button type="button" className="btn btn-lime btn-lg" onClick={() => navigate(startPath)}>Schedule a pickup</button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={scrollToHow}>How it works</button>
            </div>
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
                    <span>{MATERIALS[r.material]?.label || r.label}</span>
                    <strong>{money(r.pricePerKg)}</strong>
                    <Trend aria-hidden="true" className={r.change > 0 ? 'text-up' : r.change < 0 ? 'text-down' : 'text-muted'} />
                  </li>
                );
              })}
            </ul>
            <Link to="/prices" className="rates-strip__link">Estimate your payout <LuArrowRight aria-hidden="true" /></Link>
          </section>
        )}

        <section className="section" id="how">
          <div className="section__head">
            <span className="eyebrow">How it works</span>
            <h2>Three steps. No hauling.</h2>
          </div>
          <ol className="steps">
            <li><h3>Tell us what you have</h3><p>Pick the material, rough size and a day that suits you.</p></li>
            <li><h3>We send a driver</h3><p>A driver is assigned and arrives on your chosen day.</p></li>
            <li><h3>Get paid or swap</h3><p>We weigh it on site. Take cash, a broom, a basin, or nothing at all.</p></li>
          </ol>
        </section>

        <section className="section pt-0">
          <div className="section__head">
            <span className="eyebrow">What we take</span>
            <h2>Reduce. Reuse. Recycle.</h2>
          </div>
          <div className="materials" aria-label="Materials we collect">
            <span className="chip">Metal</span><span className="chip">Plastic</span><span className="chip">Wood</span>
          </div>

          <div className="rrr-tabs" role="tablist" aria-label="Reduce, reuse, recycle">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={activeTab === t.id}
                aria-controls="rrr-panel"
                className={`rrr-tab ${activeTab === t.id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <img src={t.icon} alt="" />
                {t.label}
              </button>
            ))}
          </div>

          <div id="rrr-panel" role="tabpanel" aria-labelledby={`tab-${active.id}`} className="rrr-panel">
            <img src={active.image} alt={`${active.label} illustration`} />
            <div>
              <h3>{active.label}</h3>
              <p>{active.text}</p>
              {active.cta && (
                <button type="button" className="btn btn-success" onClick={() => navigate(active.cta[1])}>
                  {active.cta[0]}
                </button>
              )}
            </div>
          </div>
        </section>

        {listings?.length > 0 && (
          <section className="section pt-0">
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 section__head" style={{ maxWidth: 'none' }}>
              <div><span className="eyebrow">Marketplace</span><h2>Fresh from our community</h2></div>
              <Link to="/marketplace" className="btn btn-outline-success">Browse all <LuArrowRight aria-hidden="true" /></Link>
            </div>
            <div className="listing-grid">{listings.slice(0, 4).map((l) => <ListingTile key={l._id} listing={l} base="/marketplace" />)}</div>
          </section>
        )}

        <section className="cta-band">
          <h2>Ready to clear the clutter?</h2>
          <button type="button" className="btn btn-success btn-lg" onClick={() => navigate(startPath)}>Book your pickup</button>
        </section>
      </main>
    </div>
  );
};

export default Homepage;
