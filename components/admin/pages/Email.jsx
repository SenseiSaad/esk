'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../auth';
import { Async, Modal, Field, Table, Badge, fmt, ago, go, useLoad, useAction, useToast } from '../ui';

const TEMPLATES = [
  { id: 'after', name: 'After our call', subject: 'Following up on our call, {{company}}', text: 'Hi {{firstName}},\n\nThanks for taking my call earlier. As promised, here is a short summary of what ESK Enterprises can do for {{company}}:\n\n• A simple website and an easy online enquiry or quote form, so new customers can find and contact you\n• Custom software or automation if your day-to-day work is still on paper\n\nIf it is useful, we can set up a free 15-minute call to look at your situation. Just reply with a day and time that suits you.\n\nBest regards,' },
  { id: 'intro', name: 'Quick introduction', subject: 'A quick idea for {{company}}', text: 'Hi {{firstName}},\n\nI am reaching out from ESK Enterprises. We build websites, mobile apps and custom software for small and mid-size businesses.\n\nI noticed {{company}} could benefit from an easier way for customers to reach you online. If you are open to a short conversation, reply to this email and we will arrange a time.\n\nBest regards,' },
  { id: 'meeting', name: 'Meeting confirmation', subject: 'Confirming our call', text: 'Hi {{firstName}},\n\nJust confirming our call. If you need to change the time, reply to this email and we will find another slot.\n\nLooking forward to speaking with you.\n\nBest regards,' },
  { id: 'thanks', name: 'Thank you', subject: 'Thank you, {{firstName}}', text: 'Hi {{firstName}},\n\nThank you for your time. If you have any questions, you can reply to this email any time.\n\nBest regards,' },
];
const fill = (t, lead) => t.replace(/\{\{firstName\}\}/g, (lead?.ownerName || '').split(/\s+/)[0] || 'there').replace(/\{\{company\}\}/g, lead?.businessName || 'your business');

/** composer: used from the Email page and from a lead */
export function ComposeModal({ lead, reply, onClose, onSent }) {
  const meta = useLoad('/email/meta');
  const [f, setF] = useState({ from: '', to: lead?.email || reply?.from || '', subject: reply ? (reply.subject?.startsWith('Re:') ? reply.subject : `Re: ${reply.subject}`) : '', text: '' });
  const [busy, run] = useAction();
  const toast = useToast();
  useEffect(() => { if (meta.data && !f.from) setF((x) => ({ ...x, from: meta.data.from[0] })); }, [meta.data]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const pick = (id) => { const t = TEMPLATES.find((x) => x.id === id); if (t) setF({ ...f, subject: fill(t.subject, lead), text: fill(t.text, lead) }); };
  const send = async (e) => {
    e.preventDefault();
    const r = await run(() => api('/emails', { method: 'POST', body: { ...f, leadId: lead?.id } }));
    if (r) { toast(`Email sent from ${f.from}`); onSent?.(r.email); onClose(); }
  };
  const sandbox = meta.data && !meta.data.account.production;
  return (
    <Modal title={reply ? 'Reply' : 'New email'} onClose={onClose} wide>
      <form onSubmit={send} className="stack tight">
        {sandbox && <div className="alert alert--warn">Amazon SES is in test mode: emails can only reach addresses you have verified until AWS approves production access. {meta.data.account.review ? `Review status: ${meta.data.account.review}.` : ''}</div>}
        <div className="formgrid">
          <Field label="From"><select value={f.from} onChange={set('from')}>{(meta.data?.from || []).map((a) => <option key={a}>{a}</option>)}</select></Field>
          <Field label="To"><input required type="email" value={f.to} onChange={set('to')} placeholder="name@company.com" autoFocus={!f.to} /></Field>
          <Field label="Template" wide><select defaultValue="" onChange={(e) => pick(e.target.value)}><option value="">Start from a template…</option>{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          <Field label="Subject" wide><input required maxLength={200} value={f.subject} onChange={set('subject')} /></Field>
          <Field label="Message" wide hint="Plain text. A footer with your company name, address and an unsubscribe line is added automatically."><textarea required rows={10} value={f.text} onChange={set('text')} /></Field>
        </div>
        <div className="row end"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn btn--primary" disabled={busy}>{busy ? 'Sending…' : 'Send email'}</button></div>
      </form>
    </Modal>
  );
}

export function EmailPage({ admin }) {
  const s = useLoad('/emails', { poll: 30000 });
  const meta = useLoad('/email/meta');
  const [compose, setCompose] = useState(null);
  const [view, setView] = useState(null);
  const open = async (m) => { try { setView((await api(`/emails/${m.id}`)).email); } catch { /* ignore */ } };
  return (
    <div className="stack">
      <div className="row between wrap"><h1>Email</h1>{admin && <button className="btn btn--primary" onClick={() => setCompose({})}>New email</button>}</div>
      <section className="card">
        <p className="small muted" style={{ margin: 0 }}>
          Your business addresses: {meta.data ? meta.data.from.map((a) => <b key={a} className="mono"> {a}</b>) : '…'}.
          Mail sent to any of them is copied to your personal inbox ({meta.data?.forwardTo || '…'}) and recorded here. Replying from your inbox goes to the sender directly; use this page to send from the business address.
        </p>
        {meta.data && !meta.data.account.production && <p className="small" style={{ marginBottom: 0 }}><Badge kind="amber">test mode</Badge> Sending is limited to verified addresses until AWS approves production access.</p>}
      </section>
      <Async s={s}>{(d) => (
        <section className="card flush"><Table rowKey={(m) => m.id} onRow={open} rows={d.items} empty="No emails yet." cols={[
          { h: 'When', f: (m) => <>{fmt(m.createdAt)}<div className="muted small">{ago(m.createdAt)}</div></> },
          { h: 'Dir', f: (m) => <Badge kind={m.direction === 'in' ? 'blue' : 'gray'}>{m.direction === 'in' ? 'received' : 'sent'}</Badge> },
          { h: 'From → To', f: (m) => <span className="small">{m.fromName ? `${m.fromName} ` : ''}<span className="mono">{m.from}</span><br />→ <span className="mono">{m.to}</span></span> },
          { h: 'Subject', f: (m) => <><b>{m.subject}</b><div className="muted small clip">{m.preview}</div></> },
          { h: 'Status', f: (m) => <Badge kind={['sent', 'received'].includes(m.status) ? 'green' : m.status === 'failed' ? 'red' : 'amber'}>{m.status}</Badge> },
          { h: '', f: (m) => m.leadId && <a className="link" href={`#/lead/${m.leadId}`} onClick={(e) => e.stopPropagation()}>Lead</a> },
        ]} /></section>
      )}</Async>
      {compose && <ComposeModal lead={compose.lead} reply={compose.reply} onClose={() => setCompose(null)} onSent={() => s.reload()} />}
      {view && (
        <Modal title={view.subject} onClose={() => setView(null)} wide>
          <p className="small muted">{view.direction === 'in' ? 'From' : 'To'}: <span className="mono">{view.direction === 'in' ? view.from : view.to}</span> · {fmt(view.createdAt)}</p>
          <p className="pre">{view.text}</p>
          {(view.attachments || []).length > 0 && <p className="small muted">Attachments (kept out of the CRM): {view.attachments.map((a) => a.name).join(', ')}</p>}
          <div className="row end">{admin && view.direction === 'in' && <button className="btn btn--primary" onClick={() => { setCompose({ reply: view }); setView(null); }}>Reply from business address</button>}</div>
        </Modal>
      )}
    </div>
  );
}
