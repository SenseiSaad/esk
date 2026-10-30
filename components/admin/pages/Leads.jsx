'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../auth';
import { Async, Modal, Field, Table, StageBadge, DialBadge, DispBadge, Badge, fmt, ago, phoneFmt, go, useLoad, useAction, useToast, useConfirm, dur, usd } from '../ui';
import { ComposeModal } from './Email';
import VoiceTest from './VoiceTest';

const STAGES = ['new', 'researching', 'ready', 'contacted', 'interested', 'meeting', 'proposal', 'won', 'lost', 'nurture'];
const CONSENTS = [['none', 'None (cold)'], ['inbound_request', 'They contacted us'], ['form_submission', 'Filled our form'], ['existing_customer', 'Existing customer'], ['express_consent', 'Gave express consent']];

// ------------------------------------------------------------------ list
export function Leads({ admin }) {
  const initial = useMemo(() => { const q = new URLSearchParams((window.location.hash.split('?')[1]) || ''); return { stage: q.get('stage') || '', dial: q.get('dial') || '' }; }, []);
  const [q, setQ] = useState(''), [stage, setStage] = useState(initial.stage), [dial, setDial] = useState(initial.dial);
  const qs = `?${new URLSearchParams({ ...(q && { q }), ...(stage && { stage }), ...(dial && { dialStatus: dial }) })}`;
  const s = useLoad(`/leads${qs}`, { poll: 30000 });
  const [modal, setModal] = useState(null);
  return (
    <div className="stack">
      <div className="row between wrap"><h1>Leads</h1>
        {admin && <div className="row"><button className="btn" onClick={() => setModal('import')}>Import CSV</button><button className="btn btn--primary" onClick={() => setModal('new')}>New lead</button></div>}
      </div>
      <div className="row wrap filters">
        <input placeholder="Search name, phone, email, city…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={stage} onChange={(e) => setStage(e.target.value)}><option value="">All stages</option>{STAGES.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={dial} onChange={(e) => setDial(e.target.value)}><option value="">All dial states</option>{['idle', 'calling', 'blocked'].map((x) => <option key={x}>{x}</option>)}</select>
      </div>
      <Async s={s}>{(d) => (
        <section className="card flush">
          <Table rowKey={(l) => l.id} onRow={(l) => go(`#/lead/${l.id}`)} empty="No leads match. Add one or import a CSV." rows={d.items} cols={[
            { h: 'Business', f: (l) => <><b>{l.businessName}</b><div className="muted small">{l.ownerName || 'owner unknown'}{l.city ? ` · ${l.city}${l.state ? `, ${l.state}` : ''}` : ''}</div></> },
            { h: 'Phone', f: (l) => <span className="mono">{phoneFmt(l.phone) || '–'}</span> },
            { h: 'Stage', f: (l) => <StageBadge v={l.stage} /> },
            { h: 'Dialer', f: (l) => <DialBadge v={l.dialStatus} reason={l.blockedReason || (l.dialStatus === 'held' ? l.heldReason : '')} /> },
            { h: 'Calls', f: (l) => l.attempts, cls: 'num' }, { h: 'Last result', f: (l) => (l.lastOutcome ? <DispBadge v={l.lastOutcome} /> : '–') },
            { h: 'Score', f: (l) => l.score, cls: 'num' },
            { h: '', f: (l) => <>{!l.researchReady && <Badge kind="amber">needs research</Badge>} {l.needsFollowup && <Badge kind="lime">follow up</Badge>}</> },
          ]} />
        </section>
      )}</Async>
      {modal === 'new' && <LeadForm onClose={() => setModal(null)} onSaved={(id) => { setModal(null); go(`#/lead/${id}`); }} />}
      {modal === 'import' && <ImportModal onClose={() => setModal(null)} onDone={() => { s.reload(); }} />}
    </div>
  );
}

// ------------------------------------------------------------------ create form
function LeadForm({ onClose, onSaved }) {
  const [f, setF] = useState({ businessName: '', ownerName: '', phone: '', email: '', website: '', city: '', state: '', industry: '', consentBasis: 'none', consentEvidence: '', hook: '' });
  const [busy, run] = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    const { hook, ...rest } = f;
    const body = { ...rest, ...(hook ? { research: { hook, observations: [], goal: '15-minute discovery call' } } : {}) };
    const r = await run(() => api('/leads', { method: 'POST', body }), 'Lead created');
    if (r?.lead) onSaved(r.lead.id);
  };
  return (
    <Modal title="New lead" onClose={onClose} wide>
      <form onSubmit={save} className="formgrid">
        <Field label="Business name *"><input required value={f.businessName} onChange={set('businessName')} autoFocus /></Field>
        <Field label="Owner / contact"><input value={f.ownerName} onChange={set('ownerName')} /></Field>
        <Field label="Phone *" hint="US: (512) 234-5678. UK or Pakistan: include +44 / +92"><input required value={f.phone} onChange={set('phone')} placeholder="+44 7835 568628" /></Field>
        <Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Website"><input value={f.website} onChange={set('website')} /></Field>
        <Field label="Industry"><input value={f.industry} onChange={set('industry')} /></Field>
        <Field label="City"><input value={f.city} onChange={set('city')} /></Field>
        <Field label="State"><input maxLength={2} value={f.state} onChange={set('state')} placeholder="TX" /></Field>
        <Field label="Consent basis" hint="How do we have the right to call them?"><select value={f.consentBasis} onChange={set('consentBasis')}>{CONSENTS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></Field>
        <Field label="Consent evidence" hint="Required if a basis is chosen"><input value={f.consentEvidence} onChange={set('consentEvidence')} /></Field>
        <Field label="Why are we calling THIS business?" wide hint="One specific, true sentence. The agent will not call without it."><textarea rows={2} value={f.hook} onChange={set('hook')} /></Field>
        <div className="row end wide"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn btn--primary" disabled={busy}>Create lead</button></div>
      </form>
    </Modal>
  );
}

// ------------------------------------------------------------------ CSV import
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some((x) => x.trim())) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur); if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}
const ALIASES = {
  businessName: ['business', 'business name', 'company', 'name', 'businessname'], ownerName: ['owner', 'owner name', 'contact', 'contact name', 'ownername'],
  phone: ['phone', 'phone number', 'mobile', 'tel', 'telephone'], email: ['email', 'e-mail'], website: ['website', 'url', 'site'], city: ['city'], state: ['state'], industry: ['industry', 'category', 'type'],
  tz: ['timezone', 'tz'], hook: ['hook', 'why', 'reason', 'research'], consentBasis: ['consent', 'consent basis'], consentEvidence: ['consent evidence', 'evidence'], lineType: ['line type', 'linetype'],
};
function mapRows(rows) {
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = {}; for (const [k, names] of Object.entries(ALIASES)) { const i = head.findIndex((h) => names.includes(h)); if (i >= 0) idx[k] = i; }
  return rows.slice(1).map((r) => {
    const o = {}; for (const [k, i] of Object.entries(idx)) if ((r[i] || '').trim()) o[k] = r[i].trim();
    if (o.hook) { o.research = { hook: o.hook, observations: [], goal: '15-minute discovery call' }; delete o.hook; }
    if (o.consentBasis && !['none', 'inbound_request', 'form_submission', 'existing_customer', 'express_consent'].includes(o.consentBasis)) o.consentBasis = 'none';
    if (o.lineType && !['mobile', 'landline', 'voip', 'unknown'].includes(o.lineType.toLowerCase())) delete o.lineType; else if (o.lineType) o.lineType = o.lineType.toLowerCase();
    return o;
  });
}
function ImportModal({ onClose, onDone }) {
  const [text, setText] = useState(''), [rows, setRows] = useState(null), [res, setRes] = useState(null), [busy, run] = useAction();
  const parse = () => { const p = parseCsv(text); if (p.length < 2) return setRows([]); setRows(mapRows(p)); };
  const upload = (e) => { const f = e.target.files?.[0]; if (f) f.text().then((t) => { setText(t); setRows(mapRows(parseCsv(t))); }); };
  const send = async () => {
    const out = [];
    for (let i = 0; i < rows.length; i += 200) {
      const r = await run(() => api('/leads/import', { method: 'POST', body: { rows: rows.slice(i, i + 200) } }));
      if (!r) return; out.push(...r.results.map((x) => ({ ...x, row: x.row + i })));
    }
    setRes(out); onDone();
  };
  return (
    <Modal title="Import leads from CSV" onClose={onClose} wide>
      {!res && (<>
        <p className="muted small">Columns recognised: business, owner, phone, email, website, city, state, industry, timezone, hook (why we are calling), consent, consent evidence, line type. Phone and business are required. Duplicates (same phone) are skipped.</p>
        <input type="file" accept=".csv,text/csv" onChange={upload} />
        <textarea rows={6} placeholder="…or paste CSV here" value={text} onChange={(e) => { setText(e.target.value); setRows(null); }} />
        {rows === null && <div className="row end"><button className="btn" onClick={parse} disabled={!text.trim()}>Preview</button></div>}
        {rows && (<>
          <p><b>{rows.length}</b> rows ready. {rows.slice(0, 3).map((r, i) => <span key={i} className="mono small"> {r.businessName || '?'} / {r.phone || '?'} ·</span>)}</p>
          <div className="row end"><button className="btn btn--primary" disabled={busy || !rows.length} onClick={send}>{busy ? 'Importing…' : `Import ${rows.length} leads`}</button></div>
        </>)}
      </>)}
      {res && (<>
        <p><b>{res.filter((r) => r.ok).length}</b> imported, <b>{res.filter((r) => !r.ok).length}</b> skipped.</p>
        <div className="tablewrap short"><table className="table"><tbody>{res.filter((r) => !r.ok).map((r) => <tr key={r.row}><td>Row {r.row}</td><td className="errtext">{r.error}</td></tr>)}</tbody></table></div>
        <div className="row end"><button className="btn btn--primary" onClick={onClose}>Done</button></div>
      </>)}
    </Modal>
  );
}

// ------------------------------------------------------------------ detail
export function LeadDetail({ id, admin }) {
  const s = useLoad(`/leads/${id}`, { poll: 15000 });
  const [tab, setTab] = useState('overview');
  const toast = useToast();
  const [busy, run] = useAction();
  const [ask, confirmNode] = useConfirm();
  const [modal, setModal] = useState(null);
  return (
    <Async s={s}>{(d) => {
      const l = d.lead;
      const act = (fn, msg) => async () => { await run(fn, msg); s.reload(true); };
      return (
        <div className="stack">
          <div className="row between wrap">
            <div><a className="link small" href="#/leads">← Leads</a><h1>{l.businessName}</h1>
              <div className="row wrap"><StageBadge v={l.stage} /><DialBadge v={l.dialStatus} reason={l.blockedReason || (l.dialStatus === 'held' ? l.heldReason : '')} />{l.engaged && <Badge kind="lime">engaged</Badge>}{l.needsFollowup && <Badge kind="amber">needs follow-up</Badge>}<span className="mono">{phoneFmt(l.phone)}</span></div>
            </div>
            {admin && (
              <div className="row wrap">
                <button className="btn btn--primary" disabled={busy || l.dialStatus === 'calling' || l.dialStatus === 'blocked'} onClick={() => setModal('call')} title={d.dialGate && !d.dialGate.ok ? d.dialGate.message : 'Call this lead now'}>{l.dialStatus === 'calling' ? 'On a call…' : 'Call now'}</button>
                <button className="btn" onClick={() => setModal('email')}>Send email</button>
                <button className="btn" onClick={() => setModal('voicetest')}>Browser voice test</button>
                <button className="btn" onClick={() => setModal('sms')}>Send SMS</button>
                <button className="btn" onClick={() => setModal('stage')}>Change stage</button>
              </div>
            )}
          </div>

          {d.dialGate && !d.dialGate.ok && <div className="alert alert--info">Not callable right now: {d.dialGate.message}{d.dialGate.retryAt ? ` (earliest ${fmt(d.dialGate.retryAt)})` : ''}</div>}
          {d.dialGate?.ok && l.dialStatus === 'idle' && <div className="alert alert--ok">Ready: this lead passes every safety check.</div>}
          {l.dialStatus === 'calling' && <div className="alert alert--ok">A call is in progress. {l.currentCallId && <a className="link" href={`#/call/${l.currentCallId}`}>Open the live call</a>}</div>}
          {l.callbackAt && !['won', 'lost'].includes(l.stage) && <div className="alert alert--info">They asked to be called back around <b>{fmt(l.callbackAt)}</b>{l.callbackNote ? `: ${l.callbackNote}` : ''}.</div>}

          <div className="tabs">{['overview', 'timeline', 'calls', 'sms', 'meetings'].map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}{t === 'calls' ? ` (${d.calls.length})` : t === 'sms' ? ` (${d.sms.length})` : ''}</button>)}</div>

          {tab === 'overview' && <Overview lead={l} admin={admin} onSaved={() => s.reload(true)} />}
          {tab === 'timeline' && <Timeline id={id} items={d.timeline} admin={admin} onAdded={() => s.reload(true)} />}
          {tab === 'calls' && <section className="card flush"><Table rowKey={(c) => c.id} onRow={(c) => go(`#/call/${c.id}`)} rows={d.calls} empty="No calls yet." cols={[
            { h: 'When', f: (c) => fmt(c.createdAt) }, { h: 'Mode', f: (c) => <Badge>{c.mode}</Badge> }, { h: 'Result', f: (c) => <DispBadge v={c.disposition} /> }, { h: 'Length', f: (c) => dur(c.talkSeconds), cls: 'num' }, { h: 'Cost', f: (c) => usd((c.costMicro || 0) / 1e6, 3), cls: 'num' }, { h: 'Summary', f: (c) => <span className="clip">{c.summary?.summary || ''}</span> },
          ]} /></section>}
          {tab === 'sms' && <section className="card flush"><Table rowKey={(m) => m.id} rows={d.sms} empty="No SMS yet." cols={[
            { h: 'When', f: (m) => fmt(m.createdAt) }, { h: 'Dir', f: (m) => <Badge kind={m.direction === 'in' ? 'blue' : 'gray'}>{m.direction}</Badge> }, { h: 'Status', f: (m) => <Badge kind={['delivered', 'sent', 'received'].includes(m.status) ? 'green' : ['failed', 'undelivered'].includes(m.status) ? 'red' : 'amber'}>{m.status}</Badge> }, { h: 'Message', f: (m) => <span className="clip">{m.body || m.error || m.skipReason}</span> },
          ]} /></section>}
          {tab === 'meetings' && <section className="card flush"><Table rowKey={(m) => m.id} rows={d.meetings} empty="No meetings." cols={[
            { h: 'When', f: (m) => <b>{fmt(m.startsAt)}</b> }, { h: 'Status', f: (m) => <Badge kind={m.status === 'booked' ? 'green' : 'gray'}>{m.status}</Badge> }, { h: 'Contact', f: (m) => m.contactName || '–' }, { h: 'Email', f: (m) => m.contactEmail || '–' }, { h: 'Source', f: (m) => m.source },
          ]} /></section>}

          {modal === 'voicetest' && <VoiceTest lead={l} onClose={() => setModal(null)} />}
          {modal === 'call' && <CallModal lead={l} gate={d.dialGate} onClose={() => setModal(null)} onStarted={() => { setModal(null); s.reload(true); }} />}
          {modal === 'email' && <ComposeModal lead={l} onClose={() => setModal(null)} onSent={() => s.reload(true)} />}
          {modal === 'sms' && <SmsModal lead={l} onClose={() => setModal(null)} onSent={() => { setModal(null); s.reload(true); }} />}
          {modal === 'stage' && <StageModal lead={l} onClose={() => setModal(null)} onSaved={() => { setModal(null); s.reload(true); }} />}
          {confirmNode}
        </div>
      );
    }}</Async>
  );
}

function CallModal({ lead, gate, onClose, onStarted }) {
  const [busy, run] = useAction();
  const toast = useToast();
  const settings = useLoad('/settings');
  const s = settings.data?.settings;
  const local = lead.tz ? new Intl.DateTimeFormat([], { timeZone: lead.tz, weekday: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date()) : 'unknown';
  const blocked = gate && !gate.ok;
  const start = async () => {
    const r = await run(() => api(`/leads/${lead.id}/call`, { method: 'POST', body: {} }));
    if (r) { toast(r.mode === 'dry' ? 'Dry run: nothing was dialled' : 'Calling now. Answer your phone if this is a test.'); onStarted(); }
  };
  return (
    <Modal title="Start a call" onClose={onClose}>
      <div className="callcard">
        <b>{lead.businessName}</b><span>{lead.ownerName || 'Owner unknown'}</span>
        <span className="mono">{phoneFmt(lead.phone)}</span>
        <span className="muted small">Local time there: {local}</span>
      </div>
      {s?.dryRun && <div className="alert alert--info">Dry-run is ON: this only shows what would happen. No call is placed and nothing is charged. Turn it off under Settings.</div>}
      {s && !s.dryRun && <p className="small muted">This places a real phone call. Worst-case cost is about {usd(((s.rates.connectPerMin + s.rates.telephonyPerMin + s.rates.aiPerMin) * s.maxCallSeconds) / 60 + s.rates.llmPerCall)}; calls end after {Math.round((s.maxCallSeconds / 60) * 10) / 10} minutes.</p>}
      {blocked && <div className="alert alert--error">Cannot call right now: {gate.message}{gate.retryAt ? ` (earliest ${fmt(gate.retryAt)})` : ''}</div>}
      <div className="row end"><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn--primary" disabled={busy || blocked} onClick={start}>{busy ? 'Starting…' : s?.dryRun ? 'Run dry-run' : 'Call now'}</button></div>
    </Modal>
  );
}

function SmsModal({ lead, onClose, onSent }) {
  const [busy, run] = useAction();
  return (
    <Modal title="Send follow-up SMS" onClose={onClose}>
      <p>Sends our standard follow-up text with a personalised link to <b>{phoneFmt(lead.phone)}</b>.</p>
      <ul className="small muted"><li>Needs SMS consent recorded on this lead ({lead.smsConsent ? 'recorded' : 'NOT recorded'}).</li><li>Skips landlines, do-not-call numbers and quiet hours automatically.</li></ul>
      <div className="row end"><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn--primary" disabled={busy} onClick={async () => { const r = await run(() => api(`/leads/${lead.id}/sms`, { method: 'POST', body: {} })); if (r) { onSent(); } }}>Send</button></div>
    </Modal>
  );
}

function StageModal({ lead, onClose, onSaved }) {
  const [stage, setStage] = useState(lead.stage), [value, setValue] = useState(lead.value || ''), [notes, setNotes] = useState(lead.dealNotes || ''), [reason, setReason] = useState('');
  const [busy, run] = useAction();
  const save = async () => { const r = await run(() => api(`/leads/${lead.id}/stage`, { method: 'POST', body: { stage, value, dealNotes: notes, reason } }), 'Stage updated'); if (r) onSaved(); };
  return (
    <Modal title="Change stage" onClose={onClose}>
      <Field label="Stage"><select value={stage} onChange={(e) => setStage(e.target.value)}>{STAGES.map((x) => <option key={x}>{x}</option>)}</select></Field>
      {stage === 'won' && (<><Field label="Deal value (USD) *"><input type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} /></Field><Field label="What was agreed (scope, terms, next step)"><textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field></>)}
      {stage === 'lost' && <Field label="Reason"><input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
      <div className="row end"><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn--primary" disabled={busy} onClick={save}>Save</button></div>
    </Modal>
  );
}

function Overview({ lead, admin, onSaved }) {
  const [f, setF] = useState(() => init(lead));
  const [busy, run] = useAction();
  useEffect(() => setF(init(lead)), [lead.version]);
  function init(l) { return { businessName: l.businessName || '', ownerName: l.ownerName || '', ownerTitle: l.ownerTitle || '', phone: l.phone || '', email: l.email || '', website: l.website || '', industry: l.industry || '', city: l.city || '', state: l.state || '', tz: l.tz || '', lineType: l.lineType || 'unknown', priority: l.priority || 3, consentBasis: l.consentBasis || 'none', consentEvidence: l.consentEvidence || '', smsConsent: !!l.smsConsent, research: { hook: '', observations: [], pain: '', service: '', avoid: [], goal: '15-minute discovery call', notes: '', ...(l.research || {}) } }; }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setR = (k, v) => setF({ ...f, research: { ...f.research, [k]: v } });
  const obs = f.research.observations;
  const save = async (e) => {
    e.preventDefault();
    await run(() => api(`/leads/${lead.id}`, { method: 'PATCH', body: { ...f, priority: Number(f.priority), tz: f.tz || undefined, version: lead.version } }), 'Saved');
    onSaved();
  };
  const dis = !admin;
  return (
    <form onSubmit={save} className="stack">
      <section className="card">
        <h2>Contact</h2>
        <div className="formgrid">
          <Field label="Business"><input disabled={dis} required value={f.businessName} onChange={set('businessName')} /></Field>
          <Field label="Owner / contact"><input disabled={dis} value={f.ownerName} onChange={set('ownerName')} /></Field>
          <Field label="Title"><input disabled={dis} value={f.ownerTitle} onChange={set('ownerTitle')} /></Field>
          <Field label="Phone"><input disabled={dis} value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><input disabled={dis} type="email" value={f.email} onChange={set('email')} /></Field>
          <Field label="Website"><input disabled={dis} value={f.website} onChange={set('website')} /></Field>
          <Field label="Industry"><input disabled={dis} value={f.industry} onChange={set('industry')} /></Field>
          <Field label="City"><input disabled={dis} value={f.city} onChange={set('city')} /></Field>
          <Field label="State"><input disabled={dis} maxLength={2} value={f.state} onChange={set('state')} /></Field>
          <Field label="Time zone" hint={lead.tzAmbiguous ? 'Area code spans zones: shorter calling window applied' : 'Used for legal calling hours'}>
            <select disabled={dis} value={f.tz} onChange={set('tz')}><option value="">Unknown (blocks calling)</option>{['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Asia/Karachi', 'Pacific/Auckland'].map((z) => <option key={z}>{z}</option>)}</select></Field>
          <Field label="Line type" hint="Mobile numbers reach owners but carry the most legal risk"><select disabled={dis} value={f.lineType} onChange={set('lineType')}>{['unknown', 'mobile', 'landline', 'voip'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Priority (1-5)"><input disabled={dis} type="number" min="1" max="5" value={f.priority} onChange={set('priority')} /></Field>
        </div>
      </section>

      <section className="card">
        <h2>Consent</h2>
        <div className="formgrid">
          <Field label="Basis for contacting"><select disabled={dis} value={f.consentBasis} onChange={set('consentBasis')}>{CONSENTS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></Field>
          <Field label="Evidence (where / when)"><input disabled={dis} value={f.consentEvidence} onChange={set('consentEvidence')} /></Field>
          <label className="check"><input disabled={dis} type="checkbox" checked={f.smsConsent} onChange={(e) => setF({ ...f, smsConsent: e.target.checked })} /> Agreed to receive SMS</label>
        </div>
      </section>

      <section className="card">
        <h2>Research brief <span className="muted small">what the agent knows before it dials</span></h2>
        <div className="formgrid">
          <Field wide label="Why are we calling THIS business? *" hint="Required to call. One specific, true reason."><textarea disabled={dis} rows={2} value={f.research.hook} onChange={(e) => setR('hook', e.target.value)} /></Field>
          <Field label="Likely pain (plain words)"><input disabled={dis} value={f.research.pain} onChange={(e) => setR('pain', e.target.value)} /></Field>
          <Field label="The one service to mention"><input disabled={dis} value={f.research.service} onChange={(e) => setR('service', e.target.value)} /></Field>
          <Field label="Goal of the call"><input disabled={dis} value={f.research.goal} onChange={(e) => setR('goal', e.target.value)} /></Field>
          <Field label="Do NOT mention (comma separated)"><input disabled={dis} value={(f.research.avoid || []).join(', ')} onChange={(e) => setR('avoid', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} /></Field>
        </div>
        <h3>Observations</h3>
        <p className="muted small">Verified = you saw it (the agent may say it). Inferred = a guess (the agent may only ask about it).</p>
        {obs.map((o, i) => (
          <div className="obs" key={i}>
            <select disabled={dis} value={o.confidence} onChange={(e) => setR('observations', obs.map((x, j) => (j === i ? { ...x, confidence: e.target.value } : x)))}><option>verified</option><option>inferred</option></select>
            <input disabled={dis} placeholder="What you noticed" value={o.text} onChange={(e) => setR('observations', obs.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
            <input disabled={dis} placeholder="Source (URL, date)" value={o.source || ''} onChange={(e) => setR('observations', obs.map((x, j) => (j === i ? { ...x, source: e.target.value } : x)))} />
            {!dis && <button type="button" className="x" onClick={() => setR('observations', obs.filter((_, j) => j !== i))} aria-label="Remove">×</button>}
          </div>
        ))}
        {!dis && obs.length < 8 && <button type="button" className="btn" onClick={() => setR('observations', [...obs, { text: '', confidence: 'verified', source: '' }])}>+ Add observation</button>}
        <Field wide label="Extra notes for the agent"><textarea disabled={dis} rows={2} value={f.research.notes} onChange={(e) => setR('notes', e.target.value)} /></Field>
      </section>
      {lead.stage === 'won' && <section className="card"><h2>Won deal</h2><p><b>${lead.value}</b> on {fmt(lead.wonAt)}</p><p className="pre">{lead.dealNotes}</p></section>}
      {admin && <div className="row end sticky"><button className="btn btn--primary" disabled={busy}>Save changes</button></div>}
    </form>
  );
}

function Timeline({ id, items, admin, onAdded }) {
  const [text, setText] = useState(''), [busy, run] = useAction();
  const add = async (e) => { e.preventDefault(); if (!text.trim()) return; await run(() => api(`/leads/${id}/notes`, { method: 'POST', body: { text } }), 'Note added'); setText(''); onAdded(); };
  const icon = { email: '✉️', note: '📝', call: '📞', sms: '💬', meeting: '📅', status: '🏷️', system: '⚙️', brief: '📨', reply: '↩️', engagement: '👀' };
  return (
    <section className="card">
      {admin && <form onSubmit={add} className="row"><input className="grow" placeholder="Add a note…" value={text} onChange={(e) => setText(e.target.value)} /><button className="btn btn--primary" disabled={busy}>Add</button></form>}
      <ol className="timeline">
        {items.map((t) => <li key={t.sk}><span className="tl__i">{icon[t.type] || '•'}</span><div><div className="small muted">{fmt(t.ts)} · {t.actor}</div><div className="pre">{t.text}</div>{t.meta?.callId && <a className="link small" href={`#/call/${t.meta.callId}`}>Open call</a>}</div></li>)}
        {!items.length && <li className="muted">No activity yet.</li>}
      </ol>
    </section>
  );
}
