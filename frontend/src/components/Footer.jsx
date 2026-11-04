import React from 'react';
import { Link } from 'react-router-dom';
import { FaLinkedin, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import logo from '../assets/logo.png';

const socials = [
  ['LinkedIn', FaLinkedin],
  ['Instagram', FaInstagram],
  ['Twitter', FaTwitter],
  ['Facebook', FaFacebook],
];

const Footer = () => (
  <footer className="site-footer">
    <div className="container site-footer__inner">
      <div>
        <img src={logo} alt="Yakadabadu.lk" className="site-footer__logo" />
        <p className="site-footer__tag">Scrap pickup made simple.</p>
      </div>

      <nav aria-label="Footer" className="site-footer__links">
        <Link to="/schedule-pickup">Schedule a pickup</Link>
        <Link to="/login">Log in</Link>
      </nav>

      <ul className="site-footer__social list-unstyled">
        {socials.map(([label, icon]) => {
          const Icon = icon;
          return (
            <li key={label}>
              <a href="#" aria-label={label}><Icon size={18} aria-hidden="true" /></a>
            </li>
          );
        })}
      </ul>
    </div>
    <p className="site-footer__copy">&copy; {new Date().getFullYear()} Yakadabadu.lk</p>
  </footer>
);

export default Footer;
