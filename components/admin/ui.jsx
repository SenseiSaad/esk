'use client';
import { useCallback, useEffect, useRef, useState, createContext, useContext } from 'react';
import { api } from './auth';

export const fmt = (ts) => (ts ? new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '–');
export const fmtDate = (ts) => (ts ? new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '–');
export const usd = (n, d = 2) => `$${(Number(n) || 0).toFixed(d)}`;
export const dur = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '–');
export const phoneFmt = (p) => (p && /^\+1\d{10}$/.test(p) ? `(${p.slice(2, 5)}) ${p.slice(5, 8)}-${p.slice(8)}` : p || '');
export const ago = (ts) => {
  if (!ts) return '–';
  const s = Math.round((Date.now() - new Date(ts)) / 1000);
  if (s < 0) { const f = -s; return f < 3600 ? `in ${Math.ceil(f / 60)}m` : f < 86400 ? `in ${Math.round(f / 3600)}h` : `in ${Math.round(f / 86400)}d`; }
  return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
};

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [items, set] = useState([]);
  const push = useCallback((text, kind = 'ok') => {
    const id = Math.random();
    set((x) => [...x, { id, text, kind }]);
    setTimeout(() => set((x) => x.filter((i) => i.id !== id)), kind === 'err' ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">{items.map((i) => <div key={i.id} className={`toast toast--${i.kind}`}>{i.text}</div>)}</div>
    </ToastCtx.Provider>
  );
}

/** data loader with refresh + optional polling */
export function useLoad(path, { poll = 0, deps = [] } = {}) {
  const [state, set] = useState({ data: null, error: null, loading: true });
  const reload = useCallback(async (quiet) => {
    if (!quiet) set((s) => ({ ...s, loading: true }));
    try { set({ data: await api(path), error: null, loading: false }); }
    catch (e) { set((s) => ({ data: s.data, error: e, loading: false })); }
  }, [path]);
  useEffect(() => { reload(); }, [reload, ...deps]);
  useEffect(() => { if (!poll) return; const t = setInterval(() => reload(true), poll); return () => clearInterval(t); }, [reload, poll]);
  return { ...state, reload };
}

export function Async({ s, children }) {
  if (s.loading && !s.data) return <div className="muted pad">Loading…</div>;
  if (s.error && !s.data) return <div className="errbox">{s.error.message} <button className="link" onClick={() => s.reload()}>Retry</button></div>;
  return <>{children(s.data)}</>;
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__head"><h3>{title}</h3><button className="x" onClick={onClose} aria-label="Close">×</button></div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export const Badge = ({ kind = 'gray', children }) => <span className={`badge badge--${kind}`}>{children}</span>;

const STAGE_KIND = { new: 'gray', researching: 'gray', ready: 'blue', contacted: 'blue', interested: 'lime', meeting: 'green', proposal: 'green', won: 'green', lost: 'red', nurture: 'gray' };
const DIAL_KIND = { idle: 'gray', queued: 'blue', calling: 'lime', cooldown: 'gray', exhausted: 'amber', blocked: 'red', held: 'amber' };
export const StageBadge = ({ v }) => <Badge kind={STAGE_KIND[v] || 'gray'}>{v}</Badge>;
export const DialBadge = ({ v, reason }) => <Badge kind={DIAL_KIND[v] || 'gray'}>{v}{reason ? ` · ${reason}` : ''}</Badge>;
const DISP_KIND = { meeting_booked: 'green', interested: 'lime', callback_requested: 'blue', send_info: 'lime', not_interested: 'gray', already_solved: 'gray', dnc: 'red', voicemail: 'gray', no_answer: 'gray', busy: 'gray', hung_up: 'amber', wrong_number: 'red', invalid_number: 'red', dry_run: 'gray', dial_failed: 'red', no_response: 'amber', gatekeeper_blocked: 'amber', no_conversation: 'gray' };
export const DispBadge = ({ v }) => (v ? <Badge kind={DISP_KIND[v] || 'gray'}>{String(v).replace(/_/g, ' ')}</Badge> : <Badge kind="gray">in progress</Badge>);

export function Field({ label, hint, children, wide }) {
  return <label className={`field ${wide ? 'field--wide' : ''}`}><span className="field__l">{label}</span>{children}{hint && <span className="field__h">{hint}</span>}</label>;
}

/** run an async action with busy flag + toast on error */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (fn, okMsg) => {
    setBusy(true);
    try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
    catch (e) { toast(e.message || 'Something went wrong', 'err'); return undefined; }
    finally { setBusy(false); }
  }, [toast]);
  return [busy, run];
}

export function useConfirm() {
  const [st, set] = useState(null);
  const ask = (message, opts = {}) => new Promise((res) => set({ message, opts, res }));
  const node = st && (
    <Modal title={st.opts.title || 'Please confirm'} onClose={() => { st.res(false); set(null); }}>
      <p>{st.message}</p>
      {st.opts.type && <TypeToConfirm word={st.opts.type} onOk={() => { st.res(true); set(null); }} onCancel={() => { st.res(false); set(null); }} danger={st.opts.danger} label={st.opts.ok} />}
      {!st.opts.type && (
        <div className="row end">
          <button className="btn" onClick={() => { st.res(false); set(null); }}>Cancel</button>
          <button className={`btn ${st.opts.danger ? 'btn--danger' : 'btn--primary'}`} onClick={() => { st.res(true); set(null); }}>{st.opts.ok || 'Confirm'}</button>
        </div>
      )}
    </Modal>
  );
  return [ask, node];
}
function TypeToConfirm({ word, onOk, onCancel, danger, label }) {
  const [v, set] = useState('');
  return (
    <>
      <Field label={`Type ${word} to continue`}><input autoFocus value={v} onChange={(e) => set(e.target.value)} /></Field>
      <div className="row end"><button className="btn" onClick={onCancel}>Cancel</button><button disabled={v !== word} className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onOk}>{label || 'Confirm'}</button></div>
    </>
  );
}

export function Table({ cols, rows, empty = 'Nothing here yet.', onRow, rowKey }) {
  if (!rows?.length) return <div className="muted pad">{empty}</div>;
  return (
    <div className="tablewrap">
      <table className="table">
        <thead><tr>{cols.map((c) => <th key={c.h} className={c.cls}>{c.h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={rowKey ? rowKey(r) : i} onClick={onRow ? () => onRow(r) : undefined} className={onRow ? 'clickable' : ''}>{cols.map((c) => <td key={c.h} className={c.cls}>{c.f(r)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export const go = (hash) => { window.location.hash = hash; };
export function Stat({ label, value, sub, kind }) { return <div className={`stat ${kind ? `stat--${kind}` : ''}`}><span className="stat__l">{label}</span><strong>{value}</strong>{sub && <span className="stat__s">{sub}</span>}</div>; }

export function Meter({ label, used, cap }) {
  const pct = cap ? Math.min(100, (used / cap) * 100) : 0;
  return (
    <div className="meter">
      <div className="meter__top"><span>{label}</span><b>{usd(used)} <span className="muted">/ {usd(cap)}</span></b></div>
      <div className="meter__bar"><i style={{ width: `${pct}%` }} className={pct >= 100 ? 'bad' : pct >= 80 ? 'warn' : ''} /></div>
    </div>
  );
}

export function useInterval(fn, ms) { const r = useRef(fn); r.current = fn; useEffect(() => { const t = setInterval(() => r.current(), ms); return () => clearInterval(t); }, [ms]); }
