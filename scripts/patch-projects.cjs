const fs = require('fs');
const rep = (s, a, b, l) => { if (!s.includes(a)) throw new Error('missing: ' + l); return s.replace(a, b); };

// ---- data: 8 projects in a balanced left/right order
let d = fs.readFileSync('lib/data.js', 'utf8');
const start = d.indexOf('export const projects = [');
const end = d.indexOf('];', start) + 2;
const old = d.slice(start, end);
const byId = Object.fromEntries([...old.matchAll(/^\s*\{ id: '([^']+)'.*\},$/gm)].map((m) => [m[1], m[0].trim()]));
const mk = (line, n, col) => line.replace(/n: '\d\d'/, `n: '0${n}'`).replace(/col: \d/, `col: ${col}`);
const restoration = "{ id: 'restoration', n: '00', title: 'Restoration', cat: 'Youth wellness · Program website', desc: 'A warm, photo-led launch site for an eight-week confidence and wellness program for tweens, with an interest-list sign-up for parents.', href: 'https://restoration-six-brown.vercel.app/', label: 'Visit site', bg: '#EADBC8', fg: '#2a1f14', img: 'restoration', col: 0 },";
const lms = "{ id: 'lms', n: '00', title: 'Certification Academy LMS', cat: 'Multi-tenant LMS · Stripe · Compliance', desc: 'Multi-tenant LMS backend for government compliance training: Stripe billing, seat licensing and tamper-evident audit logging. TypeScript, Node, MySQL, Docker.', href: '#contact', label: 'Discuss a similar project', bg: '#BBD3F0', fg: '#0b2540', img: null, art: 'lms', col: 0 },";
const order = [byId.thinkwell, byId.voice, lms, restoration, byId.efg, byId.bridge, byId.groupxam, byId.maison];
if (order.some((x) => !x)) throw new Error('a project line is missing: ' + Object.keys(byId).join(','));
const lines = order.map((l, i) => '  ' + mk(l, i + 1, i % 2));
d = d.slice(0, start) + 'export const projects = [\n' + lines.join('\n') + '\n];' + d.slice(end);
fs.writeFileSync('lib/data.js', d);

// ---- work cards: pick the illustration by art type
let w = fs.readFileSync('components/Work.jsx', 'utf8');
w = rep(w, "import VoiceArt from './VoiceArt';", "import VoiceArt from './VoiceArt';\nimport LmsArt from './LmsArt';", 'import');
w = rep(w, 'p.art === "voice" ? <VoiceArt /> : <Aurelle />', "p.art === 'voice' ? <VoiceArt /> : p.art === 'lms' ? <LmsArt /> : <Aurelle />", 'art switch');
fs.writeFileSync('components/Work.jsx', w);

// ---- styles
let c = fs.readFileSync('app/globals.css', 'utf8');
c += [
'',
'/* LMS card art */',
'.wcard__mock:has(.lmsart) { background: #0a1c2f; }',
'.wcard__mock:has(.lmsart) .mock__bar { background: #10263d; }',
'.wcard__mock:has(.lmsart) .mock__bar i { background: #2a4560; }',
'.lmsart { aspect-ratio: 640/444; padding: 5% 6%; display: flex; flex-direction: column; gap: 4.5%; color: #e8f0fa; background: radial-gradient(80% 70% at 100% 0%, #1b4a7a55, transparent 60%), #0a1c2f; overflow: hidden; }',
'.lms__head { display: flex; justify-content: space-between; align-items: center; font-size: clamp(11px, 1.3vw, 16px); }',
'.lms__pill { font: 10px var(--mono); letter-spacing: 0.06em; padding: 4px 10px; border-radius: 99px; background: #d2f53c; color: #0a1c2f; font-weight: 600; }',
'.lms__body { display: grid; grid-template-columns: 1fr 1fr; gap: 6%; align-items: center; }',
'.lms__seats { display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; }',
'.lms__seats i { aspect-ratio: 1; border-radius: 50%; border: 1px solid #ffffff33; }',
'.lms__seats i.on { background: #6fb3ff; border-color: #6fb3ff; animation: seat 2.6s ease-in-out infinite; animation-delay: var(--d); }',
'.lms__seats i.mid { background: #d2f53c; border-color: #d2f53c; }',
'@keyframes seat { 50% { opacity: 0.45; } }',
'.lms__mods { display: grid; gap: 9px; font: 10px var(--mono); letter-spacing: 0.04em; color: #ffffffb0; }',
'.lms__mods span { display: block; margin-bottom: 3px; }',
'.lms__mods em { display: block; height: 6px; border-radius: 9px; background: #ffffff1c; overflow: hidden; }',
'.lms__mods em i { display: block; height: 100%; width: var(--w); background: linear-gradient(90deg, #6fb3ff, #d2f53c); border-radius: 9px; animation: grow 1.6s var(--ease) both; }',
'@keyframes grow { from { width: 0; } }',
'.lms__chain { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 8px 10px; border-radius: 10px; background: #ffffff0f; border: 1px solid #ffffff1a; }',
'.lms__chain span { display: inline-flex; align-items: center; gap: 6px; }',
'.lms__chain code { font: 10.5px var(--mono); padding: 3px 7px; border-radius: 6px; background: #6fb3ff22; color: #bcd9ff; }',
'.lms__chain b { color: #d2f53c; font-weight: 400; }',
'.lms__chain small { margin-left: auto; font: 9.5px var(--mono); letter-spacing: 0.06em; text-transform: uppercase; color: #ffffff88; }',
'.lms__chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: auto; }',
'.lms__chips span { padding: 4px 10px; border-radius: 99px; border: 1px solid #ffffff33; font: 9.5px var(--mono); letter-spacing: 0.06em; text-transform: uppercase; color: #ffffffc0; }',
'@media (max-width: 760px) { .lms__chain small { display: none; } .lms__seats { gap: 3px; } }',
''].join('\n');
fs.writeFileSync('app/globals.css', c);
console.log('projects added');
