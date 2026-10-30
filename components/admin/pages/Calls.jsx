'use client';
import { useState } from 'react';
import { api } from '../auth';
import { Async, Table, DispBadge, Badge, Modal, fmt, dur, usd, go, useLoad, useAction, phoneFmt, ago } from '../ui';

export function Calls() {
  const [mode, setMode] = useState('');
  const s = useLoad(`/calls${mode ? `?mode=${mode}` : ''}`, { poll: 15000 });
  return (
    <div className="stack">
      <div className="row between wrap"><h1>Calls</h1>
        <select value={mode} onChange={(e) => setMode(e.target.value)}><option value="">All</option><option value="live">Live calls</option><option value="dry">Dry runs</option></select>
      </div>
      <Async s={s}>{(d) => (
        <section className="card flush"><Table rowKey={(c) => c.id} onRow={(c) => go(`#/call/${c.id}`)} rows={d.items} empty="No calls yet." cols={[
          { h: 'When', f: (c) => <>{fmt(c.createdAt)}<div className="muted small">{ago(c.createdAt)}</div></> },
          { h: 'Business', f: (c) => <><b>{c.businessName}</b><div className="muted small mono">{phoneFmt(c.phone)}</div></> },
          { h: 'Mode', f: (c) => <Badge kind={c.mode === 'live' ? 'blue' : 'gray'}>{c.mode}</Badge> },
          { h: 'Status', f: (c) => (c.disposition ? <DispBadge v={c.disposition} /> : <Badge kind="lime">{c.status}</Badge>) },
          { h: 'Talk', f: (c) => dur(c.talkSeconds), cls: 'num' }, { h: 'Turns', f: (c) => c.turnCount, cls: 'num' },
          { h: 'Cost', f: (c) => usd((c.costMicro || 0) / 1e6, 3), cls: 'num' },
          { h: 'Flags', f: (c) => (c.violations?.length ? <Badge kind="red">{c.violations.length} flag</Badge> : c.recordingKey ? <Badge kind="green">recording</Badge> : '') },
        ]} /></section>
      )}</Async>
    </div>
  );
}

export function CallDetail({ id, admin }) {
  const s = useLoad(`/calls/${id}`, { poll: 8000 });
  const [url, setUrl] = useState(''), [busy, run] = useAction();
  const play = async () => { const r = await run(() => api(`/calls/${id}/recording`)); if (r) setUrl(r.url); };
  const hang = async () => { await run(() => api(`/calls/${id}/hangup`, { method: 'POST', body: {} }), 'Hang-up sent'); s.reload(true); };
  return (
    <Async s={s}>{({ call: c }) => (
      <div className="stack">
        <a className="link small" href="#/calls">← Calls</a>
        <div className="row between wrap">
          <div><h1>{c.businessName}</h1><div className="row wrap"><DispBadge v={c.disposition} /><Badge>{c.mode}</Badge><span className="mono">{phoneFmt(c.phone)}</span><a className="link" href={`#/lead/${c.leadId}`}>Open lead</a></div></div>
          {admin && ['dialing', 'ringing', 'in_progress'].includes(c.status) && <button className="btn btn--danger" disabled={busy} onClick={hang}>Hang up now</button>}
        </div>
        {c.violations?.length > 0 && <div className="alert alert--error">Compliance flags on this call: {c.violations.join(', ')}. Review the transcript.</div>}
        <div className="grid4">
          <div className="stat"><span className="stat__l">Started</span><strong className="sm">{fmt(c.startedAt)}</strong></div>
          <div className="stat"><span className="stat__l">Talk time</span><strong>{dur(c.talkSeconds)}</strong></div>
          <div className="stat"><span className="stat__l">Cost</span><strong>{usd((c.costMicro || c.reservedMicro || 0) / 1e6, 3)}</strong><span className="stat__s">{c.costMicro ? 'actual estimate' : 'reserved'}</span></div>
          <div className="stat"><span className="stat__l">Attempt</span><strong>{c.attempt}</strong><span className="stat__s">{c.disconnectReason || ''}</span></div>
        </div>

        {c.summary && (
          <section className="card"><h2>Summary</h2><p>{c.summary.summary}</p>
            <div className="row wrap small"><Badge kind="lime">interest {c.summary.interest}/100</Badge><Badge>{c.summary.sentiment}</Badge>{(c.summary.objections || []).map((o) => <Badge key={o} kind="amber">{o}</Badge>)}</div>
            {c.summary.nextStep && <p className="small"><b>Next step:</b> {c.summary.nextStep}</p>}
          </section>
        )}

        <section className="card">
          <h2>Recording</h2>
          {c.recordingKey ? (url ? <audio controls autoPlay src={url} style={{ width: '100%' }} /> : <button className="btn" onClick={play} disabled={busy}>Load recording</button>)
            : <p className="muted">{c.finalizedAt ? 'No recording yet. Recordings appear a few minutes after the call ends.' : 'Available after the call ends.'}</p>}
        </section>

        <section className="card">
          <h2>Transcript</h2>
          <div className="chat">{(c.turns || []).map((t, i) => <div key={i} className={`bubble bubble--${t.r}`}><span className="small muted">{t.r === 'agent' ? 'Agent' : 'Business'} · {fmt(t.ts)}</span>{t.t}</div>)}</div>
        </section>

        <section className="card"><h2>Technical</h2>
          <pre className="json">{JSON.stringify({ id: c.id, contactId: c.contactId, status: c.status, mode: c.mode, state: c.state, amd: c.amd, disconnectReason: c.disconnectReason, disclosureTiming: c.disclosureTiming, promptVersion: c.promptVersion, error: c.error }, null, 2)}</pre>
        </section>
      </div>
    )}</Async>
  );
}
