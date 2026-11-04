import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaLinkedin, FaFacebook, FaXTwitter, FaInstagram } from 'react-icons/fa6';
import { LuMail, LuPhone, LuMapPin } from 'react-icons/lu';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

const socials = [['LinkedIn', FaLinkedin], ['Instagram', FaInstagram], ['X', FaXTwitter], ['Facebook', FaFacebook]];

const Footer = () => {
  const [email, setEmail] = useState('');
  const subscribe = (e) => {
    e.preventDefault();
    toast.success('Thanks! You are on the list.');
    setEmail('');
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <img src={logo} alt="Yakadabadu.lk" className="site-footer__logo" />
            <p>Scrap pickup, fair prices and a marketplace for second-hand goods, across Sri Lanka.</p>
            <ul className="site-footer__social list-unstyled">
              {socials.map(([label, icon]) => {
                const Icon = icon;
                return <li key={label}><a href="#top" aria-label={label} onClick={(e) => e.preventDefault()}><Icon size={16} aria-hidden="true" /></a></li>;
              })}
            </ul>
          </div>

          <nav aria-label="Platform">
            <h2 className="site-footer__title">Platform</h2>
            <ul className="list-unstyled">
              <li><Link to="/login?mode=register">Book a pickup</Link></li>
              <li><Link to="/prices">Prices & estimator</Link></li>
              <li><Link to="/marketplace">Marketplace</Link></li>
              <li><Link to="/#how">How it works</Link></li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="site-footer__title">Company</h2>
            <ul className="list-unstyled">
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/help">Help & FAQ</Link></li>
              <li><Link to="/privacy">Privacy policy</Link></li>
              <li><Link to="/terms">Terms of service</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className="site-footer__title">Stay in the loop</h2>
            <form className="site-footer__form" onSubmit={subscribe}>
              <label htmlFor="footer-email" className="visually-hidden">Email address</label>
              <input id="footer-email" type="email" required placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit">Join</button>
            </form>
            <ul className="site-footer__contact list-unstyled">
              <li><LuMail aria-hidden="true" /> hello@yakadabadu.lk</li>
              <li><LuPhone aria-hidden="true" /> 011 234 5678</li>
              <li><LuMapPin aria-hidden="true" /> Colombo, Sri Lanka</li>
            </ul>
          </div>
        </div>
        <div className="site-footer__bottom">
          <span>&copy; {new Date().getFullYear()} Yakadabadu.lk. All rights reserved.</span>
          <span>Made for a cleaner, circular Sri Lanka.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
