import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuArrowRight, LuArrowLeft, LuCheck, LuMapPin, LuCalendar } from 'react-icons/lu';
import { toast } from 'react-toastify';
import { http, useFetch, errorMessage } from '../../api';
import { MATERIALS, SCALES, SLOTS, RETURN_OPTIONS, money, fmtDate, isoDate } from '../../lib/format';
import { MATERIAL_GUIDE } from '../../lib/content';
import { PageHeader, Card, Field, Loading } from '../../components/ui';
import { MatIcon } from '../../components/pickup';

const SCALE_KG = { small: 3, medium: 7.5, large: 15, 'extra-large': 25 };
const STEPS = ['Material', 'Details', 'When & where', 'Review'];

const Schedule = () => {
  const navigate = useNavigate();
  const me = useFetch('/users/me');
  const rates = useFetch('/rates');
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ pickupType: '', scale: '', returnOption: 'cash', scheduledTime: '', timeSlot: 'morning', address: '', contactNumber: '', customerName: '', instructions: '' });

  // Fill address, phone and preferences from the profile once it loads
  const profile = me.data;
  const form = useMemo(() => ({
    ...f,
    address: f.address || profile?.address || '',
    contactNumber: f.contactNumber || profile?.phone || '',
    customerName: f.customerName || profile?.name || '',
    timeSlot: f.timeSlot,
  }), [f, profile]);
  const set = (patch) => setF({ ...f, ...patch });

  const rate = rates.data?.rates.find((r) => r.material === form.pickupType)?.pricePerKg || 0;
  const estimate = Math.round((SCALE_KG[form.scale] || 0) * rate);

  const valid = [
    !!form.pickupType,
    !!form.scale && !!form.returnOption,
    !!form.scheduledTime && !!form.address.trim() && /^[0-9+\s-]{7,}$/.test(form.contactNumber),
    true,
  ];

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await http.post('/pickups/add', { ...form, itemType: form.pickupType });
      toast.success('Pickup booked. We will assign a driver shortly.');
      navigate(`/app/pickups/${data._id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  if (me.loading || rates.loading) return <Loading />;

  return (
    <>
      <PageHeader title="Book a pickup" subtitle="Tell us what you have and when. It takes about a minute." />

      <ol className="stepper" aria-label="Booking steps">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <li className={`stepper__step ${i < step ? 'is-done' : ''} ${i === step ? 'is-current' : ''}`} aria-current={i === step ? 'step' : undefined}>
              <span className="stepper__num">{i < step ? <LuCheck aria-hidden="true" /> : i + 1}</span><span className="d-none d-sm-inline">{label}</span>
            </li>
            {i < STEPS.length - 1 && <span className="stepper__bar" aria-hidden="true" />}
          </React.Fragment>
        ))}
      </ol>

      <div className="grid-main">
        <Card>
          {step === 0 && (
            <>
              <h2 className="h4 mb-3">What are you recycling?</h2>
              <div className="choice-grid">
                {Object.entries(MATERIALS).map(([key, m]) => (
                  <button key={key} type="button" className={`choice ${form.pickupType === key ? 'is-active' : ''}`} onClick={() => set({ pickupType: key })} aria-pressed={form.pickupType === key}>
                    <strong><MatIcon material={key} />{m.label}</strong>
                    <small>{money(rates.data.rates.find((r) => r.material === key)?.pricePerKg)} / kg</small>
                  </button>
                ))}
              </div>
              {form.pickupType && <p className="text-muted small mt-3 mb-0">Typically includes {MATERIAL_GUIDE[form.pickupType].examples}.</p>}
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="h4 mb-3">How much, and what would you like in return?</h2>
              <h3 className="h6">Approximate size</h3>
              <div className="choice-grid mb-4">
                {SCALES.map(([key, label, hint]) => (
                  <button key={key} type="button" className={`choice ${form.scale === key ? 'is-active' : ''}`} onClick={() => set({ scale: key })} aria-pressed={form.scale === key}><strong>{label}</strong><small>{hint}</small></button>
                ))}
              </div>
              <h3 className="h6">In return</h3>
              <div className="choice-grid">
                {RETURN_OPTIONS.map(([key, label, hint]) => (
                  <button key={key} type="button" className={`choice ${form.returnOption === key ? 'is-active' : ''}`} onClick={() => set({ returnOption: key })} aria-pressed={form.returnOption === key}><strong>{label}</strong><small>{hint}</small></button>
                ))}
              </div>
              {form.pickupType && <p className="text-muted small mt-3 mb-0">{MATERIAL_GUIDE[form.pickupType].tips[0]}</p>}
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="h4 mb-3">When and where?</h2>
              <div className="row g-3">
                <div className="col-sm-6"><Field label="Date" htmlFor="date"><input id="date" type="date" min={isoDate()} className="form-control" value={form.scheduledTime} onChange={(e) => set({ scheduledTime: e.target.value })} /></Field></div>
                <div className="col-sm-6">
                  <Field label="Time slot" htmlFor="slot">
                    <select id="slot" className="form-select" value={form.timeSlot} onChange={(e) => set({ timeSlot: e.target.value })}>{Object.entries(SLOTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  </Field>
                </div>
              </div>
              <Field label="Pickup address" htmlFor="addr" hint="Include the town so the driver can find you easily."><input id="addr" className="form-control" value={form.address} onChange={(e) => set({ address: e.target.value })} autoComplete="street-address" /></Field>
              <div className="row g-3">
                <div className="col-sm-6"><Field label="Contact name" htmlFor="cname"><input id="cname" className="form-control" value={form.customerName} onChange={(e) => set({ customerName: e.target.value })} autoComplete="name" /></Field></div>
                <div className="col-sm-6"><Field label="Contact number" htmlFor="cphone"><input id="cphone" type="tel" className="form-control" value={form.contactNumber} onChange={(e) => set({ contactNumber: e.target.value })} autoComplete="tel" /></Field></div>
              </div>
              <Field label="Instructions for the driver (optional)" htmlFor="notes"><textarea id="notes" rows={2} className="form-control" placeholder="Gate code, where the items are, who to call…" value={form.instructions} onChange={(e) => set({ instructions: e.target.value })} /></Field>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="h4 mb-3">Review and confirm</h2>
              <dl className="kv">
                <div><dt>Material</dt><dd>{MATERIALS[form.pickupType]?.label}</dd></div>
                <div><dt>Size</dt><dd>{SCALES.find((s) => s[0] === form.scale)?.[1]} ({SCALES.find((s) => s[0] === form.scale)?.[2]})</dd></div>
                <div><dt>In return</dt><dd>{RETURN_OPTIONS.find((r) => r[0] === form.returnOption)?.[1]}</dd></div>
                <div><dt><LuCalendar aria-hidden="true" /> When</dt><dd>{fmtDate(form.scheduledTime, { weekday: 'long', day: 'numeric', month: 'long' })}, {SLOTS[form.timeSlot]}</dd></div>
                <div><dt><LuMapPin aria-hidden="true" /> Where</dt><dd>{form.address}</dd></div>
                <div><dt>Contact</dt><dd>{form.customerName} · {form.contactNumber}</dd></div>
                {form.instructions && <div><dt>Notes</dt><dd>{form.instructions}</dd></div>}
              </dl>
              {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
            </>
          )}

          <div className="d-flex justify-content-between mt-4">
            <button type="button" className="btn btn-light" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}><LuArrowLeft aria-hidden="true" /> Back</button>
            {step < 3
              ? <button type="button" className="btn btn-success" disabled={!valid[step]} onClick={() => setStep(step + 1)}>Continue <LuArrowRight aria-hidden="true" /></button>
              : <button type="button" className="btn btn-success" disabled={busy} onClick={submit}>{busy ? 'Booking…' : 'Confirm booking'}</button>}
          </div>
        </Card>

        <div className="estimate" aria-live="polite">
          <small>Estimated value</small>
          <strong>{form.pickupType && form.scale ? `~${money(estimate)}` : '—'}</strong>
          <small>{form.pickupType && form.scale ? `${SCALE_KG[form.scale]} kg × ${money(rate)} per kg. You are paid for the actual weight recorded by the driver.` : 'Choose a material and a size to see an estimate.'}</small>
        </div>
      </div>
    </>
  );
};

export default Schedule;
