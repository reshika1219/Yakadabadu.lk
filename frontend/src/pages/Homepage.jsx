import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
    cta: ['Schedule pickup', '/schedule-pickup'],
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
  const startPath = localStorage.getItem('token') ? '/schedule-pickup' : '/login';

  const scrollToHow = () => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div>
      <Navbar />

      <main className="container">
        <section className="hero">
          <div>
            <span className="eyebrow">Scrap pickup in Sri Lanka</span>
            <h1>Your scrap, <em>picked up.</em></h1>
            <p className="hero__sub">Book a collection for metal, plastic or wood. We come to you, weigh it, and pay or swap it on the spot.</p>
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

        <section className="cta-band">
          <h2>Ready to clear the clutter?</h2>
          <button type="button" className="btn btn-success btn-lg" onClick={() => navigate(startPath)}>Book your pickup</button>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Homepage;
