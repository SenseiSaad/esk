'use client';
import { useEffect, useState } from 'react';
import { getSession, logout, api } from './auth';
import Login from './Login';
import { ToastProvider, useToast, useConfirm, useLoad, Badge } from './ui';
import Dashboard from './pages/Dashboard';
import { Leads, LeadDetail } from './pages/Leads';
import { Calls, CallDetail } from './pages/Calls';
import { SmsLog, Meetings, Dnc, Audit } from './pages/Lists';
import Budget from './pages/Budget';
import { EmailPage } from './pages/Email';
import Settings from './pages/Settings';

const NAV = [
  ['#/', 'Dashboard'], ['#/leads', 'Leads'], ['#/calls', 'Calls'], ['#/sms', 'SMS'], ['#/email', 'Email'], ['#/meetings', 'Meetings'],
  ['#/dnc', 'Do-not-call'], ['#/budget', 'Budget'], ['#/audit', 'Audit log'], ['#/settings', 'Settings'],
];

function useHash() {
  const [h, set] = useState(typeof window === 'undefined' ? '#/' : window.location.hash || '#/');
  useEffect(() => { const f = () => { set(window.location.hash || '#/'); window.scrollTo(0, 0); }; window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return h;
}

function Shell({ onLogout }) {
  const hash = useHash();
  const toast = useToast();
  const [confirm, confirmNode] = useConfirm();
  const me = useLoad('/me');
  const dash = useLoad('/dashboard', { poll: 20000 });
  const [open, setOpen] = useState(false);
  const [path, ...rest] = hash.replace(/^#\/?/, '').split('/');
  const admin = me.data?.admin;
  const ks = dash.data?.settings?.killSwitch;

  const toggleKill = async () => {
    const turningOn = !ks;
    if (turningOn && !(await confirm('This immediately stops all new calls. Calls already in progress will end at their time limit (or hang up from the call page).', { title: 'Activate kill switch?', ok: 'Stop all dialing', danger: true }))) return;
    try { await api('/killswitch', { method: 'POST', body: { on: turningOn } }); toast(turningOn ? 'Kill switch ON: dialing stopped' : 'Kill switch OFF'); dash.reload(true); } catch (e) { toast(e.message, 'err'); }
  };

  let page;
  switch (path) {
    case '': page = <Dashboard dash={dash} />; break;
    case 'leads': page = <Leads admin={admin} />; break;
    case 'lead': page = <LeadDetail id={rest[0]} admin={admin} />; break;
    case 'calls': page = <Calls />; break;
    case 'call': page = <CallDetail id={rest[0]} admin={admin} />; break;
    case 'sms': page = <SmsLog />; break;
    case 'email': page = <EmailPage admin={admin} />; break;
    case 'meetings': page = <Meetings admin={admin} />; break;
    case 'dnc': page = <Dnc admin={admin} />; break;
    case 'budget': page = <Budget />; break;
    case 'audit': page = <Audit />; break;
    case 'settings': page = <Settings admin={admin} onChanged={() => dash.reload(true)} />; break;
    default: page = <div className="pad">Page not found.</div>;
  }

  return (
    <div className="shell">
      <aside className={`side ${open ? 'is-open' : ''}`}>
        <div className="side__logo"><span /> ESK <em>Admin</em></div>
        <nav>{NAV.map(([h, t]) => <a key={h} href={h} onClick={() => setOpen(false)} className={(hash === h || (h !== '#/' && hash.startsWith(h))) ? 'on' : ''}>{t}</a>)}</nav>
        <div className="side__foot">
          <div className="muted small">{me.data?.username}{!admin && me.data ? ' (read-only)' : ''}</div>
          <button className="link" onClick={() => { logout(); onLogout(); }}>Sign out</button>
        </div>
      </aside>
      <div className="main">
        <header className="top">
          <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
          <div className="top__status">
            {dash.data && (<>
              <Badge kind={ks ? 'red' : dash.data.settings.dialingEnabled ? (dash.data.settings.dryRun ? 'amber' : 'green') : 'gray'}>
                {ks ? 'KILL SWITCH ON' : !dash.data.settings.dialingEnabled ? 'Calling off' : dash.data.settings.dryRun ? 'Dry run (no real calls)' : 'LIVE calling'}
              </Badge>
              {dash.data.activeCalls > 0 && <Badge kind="lime">{dash.data.activeCalls} call in progress</Badge>}
            </>)}
          </div>
          {admin && <button className={`btn ${ks ? 'btn--primary' : 'btn--danger'}`} onClick={toggleKill}>{ks ? 'Resume (switch off)' : 'Kill switch'}</button>}
        </header>
        <main className="page">{page}</main>
      </div>
      {confirmNode}
    </div>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(null);
  useEffect(() => { setAuthed(!!getSession()); document.title = 'ESK Admin'; }, []);
  if (authed === null) return null;
  return <ToastProvider>{authed ? <Shell onLogout={() => setAuthed(false)} /> : <Login onDone={() => setAuthed(true)} />}</ToastProvider>;
}
