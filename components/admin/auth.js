// Minimal Cognito client (no SDK): USER_PASSWORD_AUTH with NEW_PASSWORD_REQUIRED, MFA_SETUP and SOFTWARE_TOKEN_MFA challenges.
let cfg;
export async function config() {
  if (cfg) return cfg;
  const r = await fetch('/config.json', { cache: 'no-store' });
  if (!r.ok) throw new Error('Admin is not configured yet (config.json missing).');
  cfg = await r.json();
  return cfg;
}

async function idp(target, body) {
  const c = await config();
  const r = await fetch(`https://cognito-idp.${c.region}.amazonaws.com/`, {
    method: 'POST', headers: { 'content-type': 'application/x-amz-json-1.1', 'x-amz-target': `AWSCognitoIdentityProviderService.${target}` }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(friendly(j)); e.code = j.__type; throw e; }
  return j;
}
const friendly = (j) => {
  const t = (j.__type || '').split('#').pop();
  if (t === 'NotAuthorizedException') return 'Incorrect username or password.';
  if (t === 'CodeMismatchException' || t === 'EnableSoftwareTokenMFAException') return 'That code is not correct. Try the newest code from your authenticator app.';
  if (t === 'ExpiredCodeException') return 'That code expired. Try again.';
  if (t === 'InvalidPasswordException') return j.message || 'Password does not meet the requirements.';
  if (t === 'TooManyRequestsException' || t === 'LimitExceededException') return 'Too many attempts. Wait a minute and try again.';
  if (t === 'UserNotFoundException') return 'Incorrect username or password.';
  return j.message || 'Sign-in failed.';
};

const KEY = 'esk.auth';
export const getSession = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } };
const store = (r, username) => {
  const prev = getSession();
  const s = { access: r.AccessToken, refresh: r.RefreshToken || prev?.refresh, exp: Date.now() + (r.ExpiresIn - 60) * 1000, username: username || prev?.username };
  sessionStorage.setItem(KEY, JSON.stringify(s));
  return s;
};
export const logout = () => { sessionStorage.removeItem(KEY); };

/** returns {done:true} or {challenge, session, username} */
export async function signIn(username, password) {
  const c = await config();
  const r = await idp('InitiateAuth', { AuthFlow: 'USER_PASSWORD_AUTH', ClientId: c.clientId, AuthParameters: { USERNAME: username, PASSWORD: password } });
  return handle(r, username);
}
function handle(r, username) {
  if (r.AuthenticationResult) { store(r.AuthenticationResult, username); return { done: true }; }
  return { challenge: r.ChallengeName, session: r.Session, username };
}
export async function respond(challenge, session, username, answers) {
  const c = await config();
  return handle(await idp('RespondToAuthChallenge', { ClientId: c.clientId, ChallengeName: challenge, Session: session, ChallengeResponses: { USERNAME: username, ...answers } }), username);
}
export async function beginMfaSetup(session) { return idp('AssociateSoftwareToken', { Session: session }); }
export async function verifyMfaSetup(session, code) { return idp('VerifySoftwareToken', { Session: session, UserCode: code, FriendlyDeviceName: 'ESK admin' }); }

export async function freshToken() {
  const s = getSession();
  if (!s) return null;
  if (Date.now() < s.exp) return s.access;
  if (!s.refresh) { logout(); return null; }
  try {
    const c = await config();
    const r = await idp('InitiateAuth', { AuthFlow: 'REFRESH_TOKEN_AUTH', ClientId: c.clientId, AuthParameters: { REFRESH_TOKEN: s.refresh } });
    return store(r.AuthenticationResult).access;
  } catch { logout(); return null; }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const token = await freshToken();
  if (!token) { const e = new Error('Your session expired. Please sign in again.'); e.status = 401; throw e; }
  const r = await fetch(`/api/admin${path}`, { method, signal, headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || `Request failed (${r.status})`); e.status = r.status; e.data = j; if (r.status === 401) logout(); throw e; }
  return j;
}
