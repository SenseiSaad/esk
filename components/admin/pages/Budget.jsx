'use client';
import { Async, Meter, useLoad, usd } from '../ui';

export default function Budget() {
  const s = useLoad('/budget', { poll: 30000 });
  return (
    <div className="stack"><h1>Budget</h1>
      <Async s={s}>{(b) => {
        const max = Math.max(0.01, ...b.days.map((d) => d.spentUsd), b.caps.dailyUsd);
        return (<>
          <section className="card">
            <Meter label="Today" used={b.day.usedUsd} cap={b.day.capUsd} />
            <Meter label="This month" used={b.month.usedUsd} cap={b.month.capUsd} />
            <Meter label="Lifetime" used={b.total.usedUsd} cap={b.total.capUsd} />
            <p className="muted small">Spent so far: today {usd(b.day.spentUsd, 3)} · month {usd(b.month.spentUsd, 3)} · lifetime {usd(b.total.spentUsd, 3)}. &quot;Used&quot; also counts money reserved for calls in progress. Before every call the dialer reserves the worst-case cost and refuses to dial if any cap would be exceeded. Change caps in Settings.</p>
          </section>
          <section className="card">
            <h2>Last 14 days (US Eastern days)</h2>
            <div className="bars">
              {b.days.map((d) => <div key={d.day} className="bars__c" title={`${d.day}: ${usd(d.spentUsd, 3)}`}><i style={{ height: `${(d.spentUsd / max) * 100}%` }} /><span>{d.day.slice(6)}</span></div>)}
              <div className="bars__cap" style={{ bottom: `${(b.caps.dailyUsd / max) * 100}%` }}><span>daily cap {usd(b.caps.dailyUsd)}</span></div>
            </div>
          </section>
          <section className="card">
            <h2>Cost model (estimates)</h2>
            <p className="small muted">Used for reservations and the per-call ledger until the AWS bill confirms them. Compare the ledger with AWS Billing monthly and adjust in Settings.</p>
            <ul className="small">{Object.entries(b.rates).map(([k, v]) => <li key={k}><span className="mono">{k}</span>: ${v}</li>)}</ul>
          </section>
        </>);
      }}</Async>
    </div>
  );
}
