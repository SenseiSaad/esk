'use client';
import { useState } from 'react';
import { api } from '../auth';
import { Async, Table, Badge, Modal, Field, fmt, go, useLoad, useAction, useConfirm, useToast, phoneFmt } from '../ui';

export function SmsLog() {
  const s = useLoad('/sms', { poll: 20000 });
  return (
    <div className="stack"><h1>SMS log</h1>
      <Async s={s}>{(d) => (
        <section className="card flush"><Table rowKey={(m) => m.id} onRow={(m) => m.leadId && go(`#/lead/${m.leadId}`)} rows={d.items} empty="No SMS sent or received yet." cols={[
          { h: 'When', f: (m) => fmt(m.createdAt) }, { h: 'Business', f: (m) => m.businessName || '–' }, { h: 'To / from', f: (m) => <span className="mono">{phoneFmt(m.direction === 'in' ? m.from : m.to)}</span> },
          { h: 'Dir', f: (m) => <Badge kind={m.direction === 'in' ? 'blue' : 'gray'}>{m.direction}</Badge> },
          { h: 'Status', f: (m) => <Badge kind={['delivered', 'sent', 'received'].includes(m.status) ? 'green' : ['failed', 'undelivered'].includes(m.status) ? 'red' : 'amber'}>{m.status}</Badge> },
          { h: 'Message', f: (m) => <span className="clip">{m.body || m.error || m.skipReason}</span> },
        ]} /></section>
      )}</Async>
    </div>
  );
}

export function Meetings({ admin }) {
  const s = useLoad('/meetings');
  const [busy, run] = useAction();
  const [ask, node] = useConfirm();
  const cancel = async (m) => { if (!(await ask(`Cancel the meeting on ${fmt(m.startsAt)}?`, { ok: 'Cancel meeting', danger: true }))) return; await run(() => api(`/meetings/${m.id}/cancel`, { method: 'POST', body: { reason: 'cancelled by admin' } }), 'Cancelled'); s.reload(); };
  return (
    <div className="stack"><h1>Meetings</h1>
      <Async s={s}>{(d) => (
        <section className="card flush"><Table rowKey={(m) => m.id} rows={d.items} empty="No meetings yet." cols={[
          { h: 'When', f: (m) => <b>{fmt(m.startsAt)}</b> }, { h: 'Status', f: (m) => <Badge kind={m.status === 'booked' ? 'green' : 'gray'}>{m.status}</Badge> },
          { h: 'Contact', f: (m) => m.contactName || '–' }, { h: 'Email', f: (m) => m.contactEmail || '–' }, { h: 'Phone', f: (m) => <span className="mono">{phoneFmt(m.contactPhone)}</span> }, { h: 'Source', f: (m) => m.source },
          { h: '', f: (m) => <>{m.leadId && <a className="link" href={`#/lead/${m.leadId}`}>Lead</a>} {admin && m.status === 'booked' && <button className="link" onClick={() => cancel(m)}>Cancel</button>}</> },
        ]} /></section>
      )}</Async>
      {node}
    </div>
  );
}

export function Dnc({ admin }) {
  const s = useLoad('/dnc');
  const [phone, setPhone] = useState(''), [reason, setReason] = useState('');
  const [busy, run] = useAction();
  const [ask, node] = useConfirm();
  const add = async (e) => { e.preventDefault(); const r = await run(() => api('/dnc', { method: 'POST', body: { phone, reason } }), 'Added to do-not-call'); if (r) { setPhone(''); setReason(''); s.reload(); } };
  const remove = async (d) => { if (!(await ask(`Remove ${phoneFmt(d.e164)} from the do-not-call list? Only do this if the person asked to be called again.`, { ok: 'Remove', danger: true }))) return; await run(() => api(`/dnc/${encodeURIComponent(d.e164)}`, { method: 'DELETE' }), 'Removed'); s.reload(); };
  return (
    <div className="stack"><h1>Do-not-call list</h1>
      <p className="muted">Checked before every call and every SMS. Numbers are added automatically when someone asks to stop (on a call or by replying STOP).</p>
      {admin && <form className="row wrap" onSubmit={add}><input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required /><input className="grow" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} /><button className="btn btn--primary" disabled={busy}>Add</button></form>}
      <Async s={s}>{(d) => (
        <section className="card flush"><Table rowKey={(x) => x.e164} rows={d.items} empty="Empty." cols={[
          { h: 'Number', f: (x) => <span className="mono">{phoneFmt(x.e164)}</span> }, { h: 'Reason', f: (x) => x.reason }, { h: 'Source', f: (x) => <Badge>{x.source}</Badge> }, { h: 'Added', f: (x) => fmt(x.addedAt) }, { h: 'By', f: (x) => x.addedBy },
          { h: '', f: (x) => admin && <button className="link" onClick={() => remove(x)}>Remove</button> },
        ]} /></section>
      )}</Async>
      {node}
    </div>
  );
}

export function Audit() {
  const s = useLoad('/audit');
  return (
    <div className="stack"><h1>Audit log</h1><p className="muted">Every sensitive action: settings changes, kill switch, consent edits, recording plays, DNC changes, stage changes. Kept 3 years.</p>
      <Async s={s}>{(d) => (
        <section className="card flush"><Table rowKey={(a) => a.sk} rows={d.items} empty="Nothing yet." cols={[
          { h: 'When', f: (a) => fmt(a.ts) }, { h: 'Who', f: (a) => a.actor }, { h: 'Action', f: (a) => <Badge>{a.action}</Badge> }, { h: 'Target', f: (a) => <span className="mono small">{a.target || ''}</span> },
          { h: 'Detail', f: (a) => <span className="clip mono small">{JSON.stringify(a.detail)}</span> },
        ]} /></section>
      )}</Async>
    </div>
  );
}
