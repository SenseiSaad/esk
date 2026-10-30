'use client';
import { Async, Stat, Meter, Table, DispBadge, fmt, usd, dur, go, Badge, ago, phoneFmt } from '../ui';

function Setup({ items }) {
  const todo = items.filter((i) => i.done === false || i.done === null);
  if (!todo.length) return null;
  return (
    <section className="card">
      <div className="row between wrap"><h2>Setup checklist</h2><span className="muted small">{items.filter((i) => i.done).length} of {items.length} done</span></div>
      <ul className="checklist">
        {items.map((i) => (
          <li key={i.id} className={i.done ? 'is-done' : i.done === null ? 'is-wait' : ''}>
            <span className="check__i" aria-hidden="true">{i.done ? '✓' : i.done === null ? '…' : '○'}</span>
            <div><b>{i.label}</b>{!i.done && <div className="muted small">{i.hint} {i.href && <a className="link" href={i.href}>Open</a>}</div>}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Dashboard({ dash }) {
  return (
    <Async s={dash}>{(d) => (
      <div className="stack">
        <h1>Dashboard</h1>
        {d.alerts.filter((a) => a.level === 'error' || /budget/i.test(a.text)).map((a, i) => <div key={i} className={`alert alert--${a.level}`}>{a.text}</div>)}
        {d.activeCalls > 0 && <div className="alert alert--ok">A call is in progress right now. <a className="link" href="#/calls">Open Calls</a></div>}

        <div className="grid4">
          <Stat label="Calls today" value={d.today.calls} sub={`${d.today.answered} answered · ${d.today.conversations} conversations`} />
          <Stat label="Interested (7 days)" value={d.week.interested} sub={`${d.week.meetings} meetings booked`} kind="lime" />
          <Stat label="Need follow-up" value={d.needsFollowup} sub="leads waiting on you" />
          <Stat label="Spend (30 days)" value={usd(d.month.costUsd)} sub={d.month.calls ? `${usd(d.month.costUsd / d.month.calls)} per call` : 'no calls yet'} />
        </div>

        <Setup items={d.setup || []} />

        <div className="grid2">
          <section className="card">
            <h2>Budget</h2>
            <Meter label="Today" used={d.budget.day.usedUsd} cap={d.budget.day.capUsd} />
            <Meter label="This month" used={d.budget.month.usedUsd} cap={d.budget.month.capUsd} />
            <Meter label="Total (lifetime)" used={d.budget.total.usedUsd} cap={d.budget.total.capUsd} />
            <p className="muted small">Calls stop automatically at any cap. Change caps under Settings.</p>
          </section>
          <section className="card">
            <h2>Pipeline</h2>
            <div className="pipe">
              {['new', 'ready', 'contacted', 'interested', 'meeting', 'proposal', 'won', 'lost'].map((s) => (
                <a key={s} href={`#/leads?stage=${s}`} className="pipe__i"><b>{d.byStage[s] || 0}</b><span>{s}</span></a>
              ))}
            </div>
          </section>
        </div>

        <div className="grid2">
          <section className="card">
            <h2>Call-backs people asked for</h2>
            <Table cols={[
              { h: 'When', f: (c) => <b>{fmt(c.callbackAt)}</b> }, { h: 'Who', f: (c) => <>{c.businessName}<div className="muted small">{c.ownerName || ''}</div></> },
              { h: 'Phone', f: (c) => <span className="mono">{phoneFmt(c.phone)}</span> },
            ]} rows={d.callbacks || []} empty="No call-backs requested." onRow={(c) => go(`#/lead/${c.id}`)} />
          </section>
          <section className="card">
            <h2>Upcoming meetings</h2>
            <Table cols={[
              { h: 'When', f: (m) => <b>{fmt(m.startsAt)}</b> }, { h: 'Who', f: (m) => m.contactName || '–' }, { h: 'Source', f: (m) => <Badge>{m.source}</Badge> },
            ]} rows={d.upcomingMeetings} empty="No meetings booked yet." onRow={(m) => m.leadId && go(`#/lead/${m.leadId}`)} />
          </section>
        </div>

        <section className="card">
          <h2>Recent calls</h2>
          <Table cols={[
            { h: 'When', f: (c) => ago(c.createdAt) }, { h: 'Business', f: (c) => <b>{c.businessName}</b> },
            { h: 'Result', f: (c) => <DispBadge v={c.disposition} /> }, { h: 'Length', f: (c) => dur(c.talkSeconds), cls: 'num' },
            { h: 'Summary', f: (c) => <span className="clip">{c.summary || ''}</span> },
          ]} rows={d.recentCalls} empty="No calls yet." onRow={(c) => go(`#/call/${c.id}`)} />
        </section>
      </div>
    )}</Async>
  );
}
