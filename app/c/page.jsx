'use client';
import { useEffect, useState } from 'react';
import './c.css';

const WORK = [
  ['ThinkWell', 'AI-powered care platform for therapist matching, appointments and video sessions', 'https://drive.google.com/file/d/1o3u0vmgAlGf6WnmgWwNrz-P--Q-he8TA/view'],
  ['B.R.I.D.G.E. Directory', 'A searchable directory that makes trusted local businesses easy to find', 'https://bridge-directory.com/'],
  ['GroupXam', 'Exam preparation with question banks, timed practice and progress tracking', 'https://www.groupxam.com/'],
  ['EFG Games', 'Game-based learning for K-12', 'https://www.efggames.com/'],
];

export default function Landing() {
  const [info, setInfo] = useState(null), [err, setErr] = useState('');
  const [f, setF] = useState({ message: '', email: '', preferredTime: '' }), [state, setState] = useState('idle'), [formErr, setFormErr] = useState('');
  const token = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean)[1] : '';

  useEffect(() => {
    if (!token) return setErr('This link is not valid.');
    fetch(`/api/c/${encodeURIComponent(token)}`).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setInfo(j); }).catch((e) => setErr(e.message || 'This link has expired.'));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault(); setState('sending'); setFormErr('');
    try {
      const r = await fetch(`/api/c/${encodeURIComponent(token)}/reply`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Please try again.');
      setState('done');
    } catch (x) { setFormErr(x.message); setState('idle'); }
  };

  return (
    <main className="cp">
      <header><span className="cp__logo" /> <b>ESK</b> <em>Enterprises</em></header>
      {err && <section className="cp__card"><h1>Link unavailable</h1><p>{err}</p><p><a href="/">Visit eskenterprises →</a></p></section>}
      {info && (<>
        <section className="cp__card cp__hero">
          <p className="cp__eyebrow">Following up on our call</p>
          <h1>{info.firstName ? `Thanks, ${info.firstName}.` : 'Thanks for your time.'}</h1>
          <p>We build custom software, websites, mobile apps and AI automation for businesses like {info.businessName}. Here are a few things we have built, and an easy way to reach us.</p>
          {info.callbackNumber && <p><a className="cp__btn" href={`tel:${info.callbackNumber}`}>Call us {info.callbackNumber.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3')}</a></p>}
        </section>
        <section className="cp__card">
          <h2>Recent work</h2>
          <ul className="cp__work">{WORK.map(([t, d, h]) => <li key={t}><a href={h} target="_blank" rel="noopener noreferrer"><b>{t}</b><span>{d}</span></a></li>)}</ul>
          <p><a href="/">See everything we do →</a></p>
        </section>
        <section className="cp__card">
          <h2>Tell us what would help</h2>
          {state === 'done' ? <p className="cp__ok">Got it. Someone from the team will reply personally. Thank you!</p> : (
            <form onSubmit={submit}>
              <label>What are you looking to improve?<textarea rows={4} maxLength={1500} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
              <label>Your email<input type="email" maxLength={254} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
              <label>Best time to talk <input maxLength={80} placeholder="e.g. Thursday morning" value={f.preferredTime} onChange={(e) => setF({ ...f, preferredTime: e.target.value })} /></label>
              {formErr && <p className="cp__err" role="alert">{formErr}</p>}
              <button className="cp__btn" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send'}</button>
            </form>
          )}
        </section>
      </>)}
      <footer>© ESK Enterprises. To stop receiving texts from us, reply STOP.</footer>
    </main>
  );
}
