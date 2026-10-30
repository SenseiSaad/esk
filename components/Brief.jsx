'use client';
import { useEffect, useRef, useState } from 'react';
import { needs, budgets } from '@/lib/data';

const empty = { name: '', email: '', company: '', phone: '', consent: false, need: needs[0], budget: budgets[4], about: '', website: '' };

// Project starter: posts to /api/brief (same-origin via CloudFront) -> stored as a lead + email alert.
export default function Brief() {
  const dlg = useRef(null);
  const [form, setForm] = useState(empty);
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  useEffect(() => {
    const open = () => {
      setState('idle');
      setError('');
      dlg.current?.showModal();
      window.__lenis?.stop();
    };
    window.addEventListener('esk:brief', open);
    return () => window.removeEventListener('esk:brief', open);
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const close = () => dlg.current?.close();

  const submit = async (e) => {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setState('done');
      setForm(empty);
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
      setState('error');
    }
  };

  return (
    <dialog className="brief" ref={dlg} onClose={() => window.__lenis?.start()} onClick={(e) => e.target === dlg.current && close()}>
      {state === 'done' ? (
        <div className="brief__ok" style={{ padding: 'clamp(24px,4vw,40px)' }}>
          <button type="button" className="brief__x" onClick={close} aria-label="Close">×</button>
          <p className="eyebrow">Brief received</p>
          <h2>Thanks — we’ve got it.</h2>
          <p>A senior member of the team will read your brief and reply within one business day.</p>
          <button className="btn btn--ink btn--lg" type="button" onClick={close}>Close</button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <button type="button" className="brief__x" onClick={close} aria-label="Close">×</button>
          <p className="eyebrow">Project starter</p>
          <h2>What are we building together?</h2>
          <div className="row">
            <label>
              Your name
              <input required maxLength={80} value={form.name} onChange={set('name')} autoComplete="name" />
            </label>
            <label>
              Email
              <input required type="email" maxLength={120} value={form.email} onChange={set('email')} autoComplete="email" />
            </label>
          </div>
          <label>
            Phone <span style={{ opacity: 0.6 }}>(optional, US)</span>
            <input type="tel" maxLength={20} value={form.phone} onChange={set('phone')} autoComplete="tel" />
          </label>
          {form.phone.trim() && (
            <label className="consent">
              <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
              <span>I agree that ESK Enterprises may contact me about this request by phone call or text message. Message and data rates may apply. Reply STOP to opt out.</span>
            </label>
          )}
          <label>
            Company <span style={{ opacity: 0.6 }}>(optional)</span>
            <input maxLength={120} value={form.company} onChange={set('company')} autoComplete="organization" />
          </label>
          <div className="row">
            <label>
              What do you need?
              <select value={form.need} onChange={set('need')}>
                {needs.map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
            <label>
              Budget
              <select value={form.budget} onChange={set('budget')}>
                {budgets.map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <label>
            Tell us a little about it
            <textarea required minLength={10} maxLength={2000} rows="4" value={form.about} onChange={set('about')} />
          </label>
          {/* honeypot: real users never see or fill this */}
          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={form.website} onChange={set('website')} />
          {error && <p className="brief__err" role="alert">{error}</p>}
          <button className="btn btn--ink btn--lg" type="submit" disabled={state === 'sending'}>
            {state === 'sending' ? 'Sending…' : 'Send brief ↗'}
          </button>
        </form>
      )}
    </dialog>
  );
}
