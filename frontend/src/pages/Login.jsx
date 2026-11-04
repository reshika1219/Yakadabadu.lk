import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LuEye, LuEyeOff, LuShieldCheck, LuTruck, LuStore } from 'react-icons/lu';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';
import { useAuth, HOME } from '../auth';
import { errorMessage } from '../api';
import { SHOW_DEMO, DEMO_ACCOUNTS, DEMO_PASSWORD } from '../lib/demo';

const emptyForm = { name: '', email: '', password: '', address: '', phone: '', type: 'household' };

const Login = () => {
  const [params] = useSearchParams();
  const location = useLocation();
  const { login, register, isAuthed, role: currentRole } = useAuth();
  const navigate = useNavigate();
  const [audience, setAudience] = useState('customer'); // 'customer' | 'staff'
  const [registering, setRegistering] = useState(params.get('mode') === 'register');
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(params.get('expired') ? 'Your session expired. Please log in again.' : '');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const finish = (role, to) => {
    const target = to || (location.state?.from && role === 'user' ? location.state.from : HOME[role]);
    navigate(target, { replace: true });
  };

  const run = async (fn, to) => {
    setError('');
    setBusy(true);
    try { finish(await fn(), to); }
    catch (err) { setError(errorMessage(err, 'Login failed. Please try again.')); }
    finally { setBusy(false); }
  };

  const submit = (e) => {
    e.preventDefault();
    if (registering && audience === 'customer') run(() => register(form));
    else run(() => login(audience === 'staff' ? 'staff' : 'customer', { email: form.email, password: form.password }));
  };

  const quick = async (acct) => {
    setBusy(true);
    setError('');
    try {
      const role = await login(acct.kind, { email: acct.email, password: DEMO_PASSWORD });
      toast.success(`Signed in as ${acct.label}`);
      finish(role);
    } catch (err) { setError(errorMessage(err)); setBusy(false); }
  };

  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });
  const input = (name, label, type = 'text', autoComplete, extra = {}) => (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">{label}</label>
      <input id={name} name={name} type={type} className="form-control" value={form[name]} onChange={set(name)} required autoComplete={autoComplete} {...extra} />
    </div>
  );

  return (
    <main className="container pb-5 pt-3">
      <div className="auth">
        <aside className="auth__brand">
          <Link to="/" aria-label="Back to home"><img src={logo} alt="Yakadabadu.lk" /></Link>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2>Scrap out. <em>Cash in.</em></h2>
            <ul className="auth__points list-unstyled">
              <li><LuTruck aria-hidden="true" /> Doorstep pickup, weighed fairly</li>
              <li><LuStore aria-hidden="true" /> Sell second-hand items on our marketplace</li>
              <li><LuShieldCheck aria-hidden="true" /> Digital invoices for every payout</li>
            </ul>
          </div>
        </aside>

        <div className="auth__form">
          {isAuthed && (
            <div className="alert alert-success d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>You are already signed in.</span>
              <Link to={HOME[currentRole]} className="btn btn-success btn-sm">Go to dashboard</Link>
            </div>
          )}

          <div className="segmented mb-4" role="tablist" aria-label="Account type">
            {[['customer', 'Customer'], ['staff', 'Driver / Admin']].map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={audience === k} className={audience === k ? 'is-active' : ''} onClick={() => { setAudience(k); setRegistering(false); setError(''); }}>{label}</button>
            ))}
          </div>

          <h1 className="h2 mb-1">{registering ? 'Create your account' : 'Welcome back'}</h1>
          <p className="text-muted mb-4">{registering ? 'Book pickups and sell items in under a minute.' : audience === 'staff' ? 'Staff sign in to manage pickups and the platform.' : 'Log in to book and track your pickups.'}</p>

          {SHOW_DEMO && (
            <div className="quick">
              <div className="quick__title">Quick login <span>MVP demo</span></div>
              <div className="quick__row">
                {DEMO_ACCOUNTS.map((a) => (
                  <button key={a.key} type="button" className="quick__btn" disabled={busy} onClick={() => quick(a)}>
                    <strong>{a.label}</strong><small>{a.hint}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          <form onSubmit={submit}>
            {registering && audience === 'customer' && (
              <>
                {input('name', 'Full name', 'text', 'name')}
                <div className="mb-3">
                  <span className="form-label d-block">I am a</span>
                  <div className="segmented" role="radiogroup" aria-label="Account kind">
                    {[['household', 'Household'], ['industrial', 'Business']].map(([k, label]) => (
                      <button key={k} type="button" role="radio" aria-checked={form.type === k} className={form.type === k ? 'is-active' : ''} onClick={() => setForm({ ...form, type: k })}>{label}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {input('email', 'Email', 'email', 'username')}
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-affix">
                <input id="password" name="password" type={showPw ? 'text' : 'password'} className="form-control" value={form.password} onChange={set('password')} required minLength={registering ? 8 : undefined} autoComplete={registering ? 'new-password' : 'current-password'} />
                <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(!showPw)}>{showPw ? <LuEyeOff /> : <LuEye />}</button>
              </div>
              {registering && <div className="form-text">At least 8 characters.</div>}
            </div>
            {registering && audience === 'customer' && (
              <>
                {input('address', 'Pickup address', 'text', 'street-address', { placeholder: 'e.g. 12 Galle Road, Colombo 03' })}
                {input('phone', 'Phone', 'tel', 'tel')}
              </>
            )}
            <button type="submit" className="btn btn-success w-100 py-2" disabled={busy}>
              {busy ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Please wait…</> : registering ? 'Create account' : 'Log in'}
            </button>
          </form>

          {audience === 'customer' && (
            <button type="button" className="btn btn-link w-100 mt-2 text-decoration-none" onClick={() => { setRegistering(!registering); setError(''); }}>
              {registering ? 'Already have an account? Log in' : 'New here? Create an account'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export default Login;
