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

  return (
    <div>
      <Navbar />

      <header className="hero">
        <img src={heroImage} alt="" className="hero__image" />
        <div className="hero__text">
          <h1>Turn your scrap into something better</h1>
          <p>Reduce waste. Reuse materials. Recycle responsibly.</p>
          <button type="button" className="btn-cta" onClick={() => navigate(startPath)}>
            Get started
          </button>
        </div>
      </header>

      <main className="container py-5">
        <section className="text-center mx-auto" style={{ maxWidth: 640 }}>
          <h2 className="h3">Sustainable scrap collection, from your doorstep</h2>
          <p className="text-muted">
            Pick a path below to see how we help you manage waste, from scheduling a pickup to responsible recycling.
          </p>
        </section>

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

        <section id="rrr-panel" role="tabpanel" aria-labelledby={`tab-${active.id}`} className="rrr-panel">
          <img src={active.image} alt={`${active.label} illustration`} />
          <div>
            <h3>{active.label}</h3>
            <p>{active.text}</p>
            {active.cta && (
              <button type="button" className="btn btn-success px-4" onClick={() => navigate(active.cta[1])}>
                {active.cta[0]}
              </button>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Homepage;
