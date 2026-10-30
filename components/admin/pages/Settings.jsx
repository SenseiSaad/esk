'use client';
import { useEffect, useState } from 'react';
import { api } from '../auth';
import { Async, Field, Badge, useLoad, useAction, useConfirm, useToast, fmt } from '../ui';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const get = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const setIn = (o, p, v) => { const c = structuredClone(o); const ks = p.split('.'); let t = c; ks.slice(0, -1).forEach((k) => (t = t[k])); t[ks.at(-1)] = v; return c; };

export default function Settings({ admin, onChanged }) {
  const s = useLoad('/settings');
  const [f, setF] = useState(null), [busy, run] = useAction(), [ask, node] = useConfirm();
  useEffect(() => { if (s.data) setF(s.data.settings); }, [s.data]);
  if (!f) return <Async s={s}>{() => null}</Async>;
  const infra = s.data.infra, orig = s.data.settings;
  const dis = !admin;
  const dirty = JSON.stringify(f) !== JSON.stringify(orig);
  const num = (p, label, props = {}, hint) => <Field label={label} hint={hint}><input disabled={dis} type="number" step="any" value={get(f, p)} onChange={(e) => setF(setIn(f, p, e.target.value === '' ? '' : Number(e.target.value)))} {...props} /></Field>;
  const txt = (p, label, props = {}, hint) => <Field label={label} hint={hint}><input disabled={dis} value={get(f, p) ?? ''} onChange={(e) => setF(setIn(f, p, e.target.value))} {...props} /></Field>;
  const chk = (p, label, hint) => <label className="check"><input disabled={dis} type="checkbox" checked={!!get(f, p)} onChange={(e) => setF(setIn(f, p, e.target.checked))} /> <span>{label}{hint && <span className="muted small"> — {hint}</span>}</span></label>;

  const save = async () => {
    const body = structuredClone(f);
    if (body.allowColdCalls && !orig.allowColdCalls) {
      const ok = await ask('You are enabling calls to businesses that have NOT given recorded consent. AI-voice calls to mobile numbers can violate the US TCPA and state laws, with penalties per call. You are responsible for compliance. This acknowledgement is logged with your name and the time.', { title: 'Enable cold calling?', type: 'I UNDERSTAND', ok: 'Enable', danger: true });
      if (!ok) return; body.coldAck = 'I UNDERSTAND';
    }
    if (orig.dryRun && !body.dryRun) {
      const ok = await ask('Turning off dry-run means the dialer places REAL phone calls to real businesses and spends real money (up to your caps).', { title: 'Go live?', type: 'GO LIVE', ok: 'Place real calls', danger: true });
      if (!ok) return; body.confirmLive = true;
    }
    for (const k of ['coldAckBy', 'coldAckAt']) delete body[k];
    const r = await run(() => api('/settings', { method: 'PUT', body }), 'Settings saved');
    if (r) { s.reload(); onChanged?.(); }
  };

  return (
    <div className="stack">
      <div className="row between wrap"><h1>Settings</h1></div>

      <section className="card">
        <h2>System status</h2>
        <div className="row wrap">
          <Badge kind={infra.connectConfigured ? 'green' : 'red'}>{infra.connectConfigured ? 'Dialer online' : 'Dialer offline'}</Badge>
          <Badge kind="gray">Caller ID {infra.outboundNumber || 'not set'}</Badge>
          <Badge kind={infra.smsOrigination ? 'green' : 'amber'}>{infra.smsOrigination ? `SMS number ${infra.smsOrigination}` : 'SMS number not registered'}</Badge>
          <Badge kind={infra.notifyEmail ? 'green' : 'amber'}>{infra.notifyEmail ? 'Email alerts on' : 'Email alerts not configured'}</Badge>
          {infra.lastHeartbeat && <span className="muted small">last dialer heartbeat {fmt(infra.lastHeartbeat)}</span>}
        </div>
      </section>

      <section className="card">
        <h2>Master controls</h2>
        <div className="stack tight">
          {chk('dialingEnabled', 'Calling enabled', 'master switch: the Call button does nothing while this is off')}
          {chk('dryRun', 'Dry-run mode', 'the Call button only shows what would happen: no call is placed, nothing is spent')}
          {chk('allowColdCalls', 'Allow calls to leads without recorded consent', 'legal responsibility is yours; acknowledgement is logged')}
          {orig.coldAckBy && <p className="small muted">Cold calling acknowledged by {orig.coldAckBy} on {fmt(orig.coldAckAt)}.</p>}
          {chk('smsEnabled', 'SMS follow-ups enabled', 'needs a registered SMS number and your public site URL')}
          {chk('killSwitch', 'Kill switch', 'stops everything immediately (also in the top bar)')}
        </div>
      </section>

      <section className="card">
        <h2>Identity</h2>
        <div className="formgrid">
          {txt('agentName', 'Agent first name', {}, 'Spoken on every call')}
          {txt('companyName', 'Company name')}
          {txt('callbackNumber', 'Callback number (E.164)', { placeholder: '+15125550123' }, 'Spoken/texted so people can reach you. Required to go live.')}
          {txt('publicSiteUrl', 'Public site URL', { placeholder: 'https://eskenterprises.com' }, 'Your own domain, used in SMS links. No link shorteners.')}
          {txt('transferNumber', 'Live transfer number (E.164)', {}, 'Leave empty to offer callbacks instead')}
          {txt('callerIds.default', 'Caller ID: default', { placeholder: '+19373459258' }, 'Must be a number claimed in your Connect instance. Empty = the instance number.')}
          {txt('callerIds.US', 'Caller ID for US leads')}{txt('callerIds.GB', 'Caller ID for UK leads', {}, 'A UK number gets far more answers from UK businesses')}{txt('callerIds.PK', 'Caller ID for Pakistan leads', {}, 'Connect has no Pakistan numbers; use a UK or US number')}
          <Field label="AI disclosure timing" hint="'Before commit' = say it when asked and before booking/consent. Honesty rules always apply.">
            <select disabled={dis} value={f.disclosureTiming} onChange={(e) => setF({ ...f, disclosureTiming: e.target.value })}><option value="on_ask">Only when the person asks (never volunteered)</option><option value="on_ask_and_before_commit">When asked, and before booking or text consent</option><option value="start">At the start of every call</option></select></Field>
          {chk('recordCalls', 'Record calls', 'OFF = nothing is recorded and the notice is never spoken. ON = recorded (play back in Calls) and the notice is added to the opening.')}
          {chk('recordingNotice', 'Say "this call may be recorded" (only used when recording is on)')}
        </div>
      </section>

      <section className="card">
        <h2>Calling hours &amp; limits</h2>
        <p className="muted small">Times are in the business&apos;s own time zone. Federal limits (8am–9pm) cannot be widened here; areas spanning two zones get a stricter window automatically.</p>
        <div className="formgrid">
          {txt('window.start', 'Earliest call', { type: 'time' })}{txt('window.end', 'Latest call', { type: 'time' })}
          <Field label="Days"><div className="row wrap">{DAYS.map((d, i) => <label key={d} className="check"><input disabled={dis} type="checkbox" checked={f.window.days.includes(i)} onChange={(e) => setF(setIn(f, 'window.days', e.target.checked ? [...f.window.days, i].sort() : f.window.days.filter((x) => x !== i)))} />{d}</label>)}</div></Field>
          {chk('window.skipHolidays', 'Skip US holidays')}
          {chk('ignoreHoursForConsented', 'No time restriction for consented leads', 'applies only to leads who contacted us, used our form, are customers, or gave express consent. Cold leads always follow the window above.')}
          {num('maxConcurrent', 'Calls at the same time', { min: 1, max: 3 })}{num('maxCallsPerDay', 'Max calls per day', { min: 0 }, 'A safety cap on how many calls can be started per day')}
          {num('maxCallSeconds', 'Maximum call length (seconds)', { min: 30, max: 900 }, 'The agent wraps up near the limit; the system hangs up at the limit')}
        </div>
      </section>

      <section className="card">
        <h2>Budget (USD)</h2>
        <div className="formgrid">{num('budget.dailyUsd', 'Daily cap')}{num('budget.monthlyUsd', 'Monthly cap')}{num('budget.totalUsd', 'Lifetime cap')}</div>
        <h3>Cost estimates per unit</h3>
        <div className="formgrid">{Object.keys(f.rates).map((k) => num(`rates.${k}`, k))}</div>
      </section>

      <section className="card">
        <h2>Meeting availability</h2>
        <p className="muted small">When the agent books a discovery call it picks from these slots.</p>
        <div className="formgrid">
          {txt('availability.tz', 'Your time zone')}{txt('availability.start', 'From', { type: 'time' })}{txt('availability.end', 'Until', { type: 'time' })}
          {num('availability.slotMinutes', 'Meeting length (min)')}{num('availability.bufferMinutes', 'Buffer between meetings (min)')}{num('availability.minNoticeHours', 'Minimum notice (hours)')}{num('availability.maxDaysAhead', 'Book up to (days ahead)')}
          <Field label="Days"><div className="row wrap">{DAYS.map((d, i) => <label key={d} className="check"><input disabled={dis} type="checkbox" checked={f.availability.days.includes(i)} onChange={(e) => setF(setIn(f, 'availability.days', e.target.checked ? [...f.availability.days, i].sort() : f.availability.days.filter((x) => x !== i)))} />{d}</label>)}</div></Field>
        </div>
      </section>

      <section className="card">
        <h2>AI models</h2>
        <div className="formgrid">{txt('agentModelId', 'Conversation model')}{txt('summaryModelId', 'Summary model')}{txt('voiceId', 'Voice')}{txt('promptVersion', 'Prompt version label', {}, 'Stored on every call for comparing results')}</div>
      </section>
      {admin && (
        <div className={`savebar ${dirty ? 'is-dirty' : ''}`} role="status">
          <span>{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
          <div className="row"><button className="btn" disabled={!dirty || busy} onClick={() => setF(orig)}>Discard</button><button className="btn btn--primary" disabled={!dirty || busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button></div>
        </div>
      )}
      {node}
    </div>
  );
}
