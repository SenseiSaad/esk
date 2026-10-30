'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '../auth';
import { Modal, Badge } from '../ui';

// Browser voice test: talk to the REAL voice agent (the same deployed server, Nova 2.5 Sonic, prompt, interruption handling and tools that a phone
// call uses). The only differences: your microphone instead of a phone line, and tools run in DRY mode (no meeting is booked, no DNC entry, no email).

const WORKLET = `
class Down extends AudioWorkletProcessor {
  constructor() { super(); this.ratio = sampleRate / 16000; this.pos = 0; this.buf = []; this.acc = []; }
  process(inputs) {
    const ch = inputs[0][0]; if (!ch) return true;
    for (let i = 0; i < ch.length; i++) this.buf.push(ch[i]);
    while (this.pos + 1 < this.buf.length) {
      const i = Math.floor(this.pos), f = this.pos - i;
      const s = Math.max(-1, Math.min(1, this.buf[i] * (1 - f) + this.buf[i + 1] * f));
      this.acc.push(s < 0 ? s * 32768 : s * 32767); this.pos += this.ratio;
      if (this.acc.length >= 320) {                       // 20 ms at 16 kHz
        const pcm = Int16Array.from(this.acc.splice(0, 320)); let peak = 0;
        for (let k = 0; k < pcm.length; k++) peak = Math.max(peak, Math.abs(pcm[k]));
        this.port.postMessage({ pcm: pcm.buffer, peak }, [pcm.buffer]);
      }
    }
    const drop = Math.floor(this.pos); this.buf = this.buf.slice(drop); this.pos -= drop;
    return true;
  }
}
registerProcessor('down', Down);`;

export default function VoiceTest({ lead, onClose }) {
  const [phase, setPhase] = useState('idle');                 // idle | connecting | live | ended
  const [err, setErr] = useState('');
  const [lines, setLines] = useState([]);                      // {r:'agent'|'caller', text}
  const [tools, setTools] = useState([]);
  const [lastGap, setLastGap] = useState(null);
  const [level, setLevel] = useState(0);
  const [meta, setMeta] = useState(null);
  const R = useRef({});                                        // ws, ctx, stream, playback state
  const endRef = useRef(null);

  const addAgent = (text) => setLines((l) => (l.length && l.at(-1).r === 'agent' && l.at(-1).open ? [...l.slice(0, -1), { r: 'agent', text, open: true }] : [...l, { r: 'agent', text, open: true }]));
  const closeAgent = () => setLines((l) => (l.length && l.at(-1).open ? [...l.slice(0, -1), { ...l.at(-1), open: false }] : l));

  function stopPlayback() { const r = R.current; (r.sources || []).forEach((s) => { try { s.stop(); } catch { /* already ended */ } }); r.sources = []; r.next = 0; }
  function playChunk(buf) {
    const r = R.current, ctx = r.ctx; if (!ctx) return;
    const i16 = new Int16Array(buf), f32 = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;
    const ab = ctx.createBuffer(1, f32.length, 24000); ab.copyToChannel(f32, 0);
    const src = ctx.createBufferSource(); src.buffer = ab; src.connect(ctx.destination);
    const t = Math.max(ctx.currentTime + 0.04, r.next || 0); src.start(t); r.next = t + ab.duration;
    (r.sources ||= []).push(src); src.onended = () => { r.sources = (r.sources || []).filter((x) => x !== src); };
    if (r.lastLoud && !r.gapDone) { setLastGap(Date.now() - r.lastLoud); r.gapDone = true; }      // speaking-ended -> first agent audio
  }

  async function start() {
    setErr(''); setLines([]); setTools([]); setPhase('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
      const ctx = new (window.AudioContext || window.webkitAudioContext)(); await ctx.resume();
      const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
      await ctx.audioWorklet.addModule(url); URL.revokeObjectURL(url);
      const session = await api('/voicetest', { method: 'POST', body: { leadId: lead.id } });
      setMeta(session);
      const ws = new WebSocket(session.url); ws.binaryType = 'arraybuffer';
      Object.assign(R.current, { ws, ctx, stream, next: 0, sources: [], lastLoud: 0, gapDone: true });
      const node = new AudioWorkletNode(ctx, 'down'); R.current.node = node;
      ctx.createMediaStreamSource(stream).connect(node);
      node.port.onmessage = (e) => {
        const { pcm, peak } = e.data; setLevel(peak / 32768);
        if (peak > 1800) { R.current.lastLoud = Date.now(); R.current.gapDone = false; }
        if (ws.readyState === 1) ws.send(pcm);
      };
      ws.onmessage = (e) => {
        if (typeof e.data !== 'string') return playChunk(e.data);
        const m = JSON.parse(e.data);
        if (m.t === 'ready') setPhase('live');
        else if (m.t === 'turn') { closeAgent(); setLines((l) => [...l, { r: 'caller', text: m.text }]); }
        else if (m.t === 'agent_text') addAgent(m.text);
        else if (m.t === 'turn_end') closeAgent();
        else if (m.t === 'interrupt') { stopPlayback(); closeAgent(); }
        else if (m.t === 'tool') setTools((t) => [...t, m]);
        else if (m.t === 'finish') { setPhase('ended'); setLines((l) => [...l, { r: 'system', text: `Call ended by the agent: ${m.reason || m.type}` }]); }
        else if (m.t === 'error') { setErr(m.message); }
      };
      ws.onclose = () => { setPhase((p) => (p === 'ended' ? p : 'ended')); cleanup(false); };
      ws.onerror = () => setErr('Could not reach the voice server. Is the voice service running?');
    } catch (e) {
      setErr(e?.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow the microphone for this site and try again.' : e.message || String(e));
      setPhase('idle'); cleanup(true);
    }
  }

  function cleanup(closeWs) {
    const r = R.current;
    try { r.node?.disconnect(); } catch { /* ignore */ }
    try { r.stream?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
    try { stopPlayback(); r.ctx?.close(); } catch { /* ignore */ }
    if (closeWs) try { r.ws?.close(); } catch { /* ignore */ }
    R.current = {};
  }
  function hangUp() { const ws = R.current.ws; if (ws && ws.readyState === 1) { ws.send(JSON.stringify({ t: 'end' })); setTimeout(() => { try { ws.close(); } catch { /* ignore */ } }, 6000); } else onClose(); }

  useEffect(() => () => cleanup(true), []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [lines, tools]);

  return (
    <Modal title={`Browser voice test: ${lead.businessName}`} onClose={() => { cleanup(true); onClose(); }} wide>
      <div className="stack">
        <div className="alert alert--info">
          This is the real voice agent (same server, Nova 2.5 Sonic, prompt and interruption handling as a phone call) using your microphone.
          Use headphones so it does not hear itself. Tools run in <b>dry mode</b>: nothing is booked, no one is added to the do-not-call list, no email or text is sent.
        </div>
        {err && <div className="alert alert--danger">{err}</div>}
        <div className="row between wrap">
          <div className="row wrap">
            {phase === 'idle' && <button className="btn btn--primary" onClick={start}>Start test call</button>}
            {phase === 'connecting' && <button className="btn" disabled>Connecting…</button>}
            {phase === 'live' && <button className="btn btn--danger" onClick={hangUp}>Hang up</button>}
            {phase === 'ended' && <button className="btn btn--primary" onClick={() => { cleanup(true); setPhase('idle'); }}>Start again</button>}
            <Badge kind={phase === 'live' ? 'lime' : phase === 'ended' ? 'gray' : 'amber'}>{phase}</Badge>
          </div>
          <div className="muted small">
            {phase === 'live' && <>mic <span style={{ display: 'inline-block', width: 80, height: 8, background: '#2a2a2a', verticalAlign: 'middle', borderRadius: 4 }}><span style={{ display: 'block', height: 8, width: `${Math.min(100, level * 300)}%`, background: '#b7f34a', borderRadius: 4 }} /></span></>}
            {lastGap != null && <> · last reply time {(lastGap / 1000).toFixed(1)} s</>}
            {meta?.maxSeconds ? <> · max {Math.round(meta.maxSeconds / 60)} min</> : null}
          </div>
        </div>
        <div className="card" style={{ minHeight: 220, maxHeight: 360, overflow: 'auto' }}>
          {!lines.length && <div className="muted">{phase === 'live' ? `Say “Hello?” like someone answering a phone. The agent waits for you to speak first, as on a real call.` : 'The conversation appears here.'}</div>}
          {lines.map((l, i) => (
            <div key={i} style={{ margin: '6px 0' }}><b>{l.r === 'agent' ? 'Agent' : l.r === 'caller' ? 'You' : '•'}</b> <span className={l.r === 'system' ? 'muted' : ''}>{l.text}</span></div>
          ))}
          {tools.map((t, i) => (
            <div key={`t${i}`} className="muted small" style={{ margin: '4px 0' }}>⚙ {t.name}({JSON.stringify(t.input)}) → {JSON.stringify(t.result).slice(0, 140)} <Badge kind="amber">dry run</Badge></div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
    </Modal>
  );
}
