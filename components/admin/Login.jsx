'use client';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { signIn, respond, beginMfaSetup, verifyMfaSetup } from './auth';

const group = (s) => (s || '').replace(/(.{4})/g, '$1 ').trim();

function CodeInput({ value, onChange, onComplete, disabled }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const change = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6); // "123 456", "123-456", pasted text: all fine
    onChange(v);
    if (v.length === 6) onComplete(v);
  };
  return (
    <input ref={ref} className="otp" inputMode="numeric" autoComplete="one-time-code" placeholder="000 000" aria-label="6-digit code" maxLength={9} disabled={disabled}
      value={value.length > 3 ? `${value.slice(0, 3)} ${value.slice(3)}` : value} onChange={change} />
  );
}

export default function Login({ onDone }) {
  const [step, setStep] = useState({ name: 'creds' });
  const [f, setF] = useState({ username: '', password: '', newPassword: '', code: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [mfa, setMfa] = useState(null);
  const [copied, setCopied] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const route = async (r) => {
    if (r.done) return onDone();
    setF((x) => ({ ...x, code: '' }));
    if (r.challenge === 'NEW_PASSWORD_REQUIRED') return setStep({ name: 'newpw', ...r });
    if (r.challenge === 'MFA_SETUP') {
      const a = await beginMfaSetup(r.session);
      const uri = `otpauth://totp/ESK%20Admin:${encodeURIComponent(r.username)}?secret=${a.SecretCode}&issuer=ESK%20Admin`;
      setMfa({ secret: a.SecretCode, qr: await QRCode.toDataURL(uri, { margin: 2, width: 220 }), session: a.Session });
      return setStep({ name: 'mfasetup', ...r, session: a.Session });
    }
    if (r.challenge === 'SOFTWARE_TOKEN_MFA') return setStep({ name: 'mfa', ...r });
    throw new Error(`Unsupported sign-in step: ${r.challenge}`);
  };
  const guarded = (fn) => async (e) => {
    e?.preventDefault?.(); if (busy) return; setErr(''); setBusy(true);
    try { await fn(); } catch (x) { setErr(x.message); setF((v) => ({ ...v, code: '' })); } finally { setBusy(false); }
  };

  const creds = guarded(async () => route(await signIn(f.username.trim(), f.password)));
  const newpw = guarded(async () => route(await respond('NEW_PASSWORD_REQUIRED', step.session, step.username, { NEW_PASSWORD: f.newPassword })));
  const mfaSetup = (code) => guarded(async () => {
    const v = await verifyMfaSetup(mfa.session, code || f.code);
    if (v.Status !== 'SUCCESS') throw new Error('Verification failed. Enter the newest code from your app.');
    await route(await respond('MFA_SETUP', v.Session, step.username, {}));
  })();
  const mfaCode = (code) => guarded(async () => route(await respond('SOFTWARE_TOKEN_MFA', step.session, step.username, { SOFTWARE_TOKEN_MFA_CODE: code || f.code })))();

  const copy = async () => { try { await navigator.clipboard.writeText(mfa.secret); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* user can select the text */ } };
  const back = () => { setStep({ name: 'creds' }); setErr(''); setF((x) => ({ ...x, password: '', code: '', newPassword: '' })); };
  useEffect(() => { document.title = 'ESK Admin'; }, []);

  const submit = step.name === 'creds' ? creds : step.name === 'newpw' ? newpw : step.name === 'mfasetup' ? (e) => { e.preventDefault(); mfaSetup(); } : (e) => { e.preventDefault(); mfaCode(); };

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit} noValidate={step.name !== 'creds' && step.name !== 'newpw'}>
        <div className="login__logo"><span /> ESK <em>Admin</em></div>

        {step.name === 'creds' && (<>
          <h1>Sign in</h1>
          <label>Username or email<input autoFocus autoComplete="username" value={f.username} onChange={set('username')} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={f.password} onChange={set('password')} required /></label>
        </>)}

        {step.name === 'newpw' && (<>
          <p className="login__step">Step 1 of 2</p>
          <h1>Choose your password</h1>
          <p className="muted">12+ characters with an uppercase letter, a lowercase letter, a number and a symbol.</p>
          <label>New password<input type="password" autoComplete="new-password" minLength={12} value={f.newPassword} onChange={set('newPassword')} required autoFocus /></label>
        </>)}

        {step.name === 'mfasetup' && mfa && (<>
          <p className="login__step">Step 2 of 2</p>
          <h1>Set up two-factor</h1>
          <ol className="login__steps">
            <li>Install an authenticator app (Google Authenticator, Microsoft Authenticator, Authy or 1Password).</li>
            <li>Scan this code with the app.</li>
            <li>Type the 6-digit code the app shows.</li>
          </ol>
          <img className="login__qr" src={mfa.qr} alt="Authenticator QR code" width="220" height="220" />
          <details className="login__manual">
            <summary>Can&apos;t scan? Enter the key manually</summary>
            <p className="login__key">{group(mfa.secret)}</p>
            <button type="button" className="btn" onClick={copy}>{copied ? 'Copied ✓' : 'Copy key'}</button>
            <p className="small muted">Choose &quot;time-based&quot; when the app asks. Account name: ESK Admin.</p>
          </details>
          <label>Code from your app<CodeInput value={f.code} onChange={(v) => setF((x) => ({ ...x, code: v }))} onComplete={(v) => mfaSetup(v)} disabled={busy} /></label>
        </>)}

        {step.name === 'mfa' && (<>
          <h1>Enter your code</h1>
          <p className="muted">Open your authenticator app and type the 6-digit code for ESK Admin.</p>
          <label>6-digit code<CodeInput value={f.code} onChange={(v) => setF((x) => ({ ...x, code: v }))} onComplete={(v) => mfaCode(v)} disabled={busy} /></label>
        </>)}

        {err && <p className="errtext" role="alert">{err}</p>}
        {step.name === 'mfasetup' && err && /correct|expired|newest/i.test(err) && <p className="small muted">Codes change every 30 seconds. If it keeps failing, check that your phone&apos;s clock is set to automatic time.</p>}
        <button className="btn btn--primary" disabled={busy || (['mfa', 'mfasetup'].includes(step.name) && f.code.length !== 6)}>{busy ? 'Please wait…' : step.name === 'mfasetup' ? 'Verify and finish' : 'Continue'}</button>
        {step.name !== 'creds' && <button type="button" className="link small" onClick={back}>← Back to sign in</button>}
      </form>
    </div>
  );
}
