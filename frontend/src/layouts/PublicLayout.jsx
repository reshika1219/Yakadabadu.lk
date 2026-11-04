import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LuMenu, LuX, LuArrowRight } from 'react-icons/lu';
import logo from '../assets/logo.png';
import { useAuth, HOME } from '../auth';
import { PUBLIC_LINKS } from '../nav';
import Footer from '../components/Footer';

const PublicNav = () => {
  const { isAuthed, role } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="site-nav">
      <nav className="container" aria-label="Main">
        <div className="site-nav__inner">
          <Link to="/" aria-label="Yakadabadu.lk home"><img src={logo} alt="" className="site-nav__logo" /></Link>

          <ul className={`site-nav__links ${open ? 'is-open' : ''}`}>
            {PUBLIC_LINKS.map((l) => (
              <li key={l.to}>
                {l.to.includes('#') ? <Link to={l.to} className="site-nav__link">{l.label}</Link>
                  : <NavLink to={l.to} className={({ isActive }) => `site-nav__link ${isActive ? 'is-active' : ''}`}>{l.label}</NavLink>}
              </li>
            ))}
            <li className="site-nav__auth-mobile">
              {isAuthed ? <Link className="btn btn-lime w-100" to={HOME[role]}>Go to dashboard</Link>
                : <><Link className="btn btn-lime w-100" to="/login?mode=register">Get started</Link><Link className="btn btn-ghost w-100 mt-2" to="/login">Log in</Link></>}
            </li>
          </ul>

          <div className="site-nav__actions">
            {isAuthed ? (
              <Link className="site-nav__btn" to={HOME[role]}>Dashboard <LuArrowRight aria-hidden="true" /></Link>
            ) : (
              <>
                <Link className="site-nav__link d-none d-md-inline" to="/login">Log in</Link>
                <Link className="site-nav__btn d-none d-sm-inline-flex" to="/login?mode=register">Get started</Link>
              </>
            )}
            <button type="button" className="site-nav__burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? <LuX /> : <LuMenu />}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

const PublicLayout = () => {
  const { pathname, hash } = useLocation();
  // Scroll to top on navigation, or to the #anchor when there is one
  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 60);
    else window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return (
    <div className="d-flex flex-column min-vh-100">
      <PublicNav />
      <div className="flex-grow-1"><Outlet /></div>
      <Footer />
    </div>
  );
};

export default PublicLayout;
