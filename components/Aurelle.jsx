// Hand-drawn SVG hero for the Maison Aurelle card: zero network cost, crisp at any size.
export default function Aurelle() {
  return (
    <svg className="aurelle" viewBox="0 0 640 444" role="img" aria-label="Maison Aurelle perfume bottle" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="a-bg" cx="50%" cy="38%" r="75%">
          <stop offset="0" stopColor="#4a3516" />
          <stop offset="0.55" stopColor="#1a140d" />
          <stop offset="1" stopColor="#0b0a08" />
        </radialGradient>
        <linearGradient id="a-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#e4c27a" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#f6e2a8" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="#8a6424" stopOpacity="0.22" />
          <stop offset="1" stopColor="#e4c27a" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="a-liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0cf84" stopOpacity="0.9" />
          <stop offset="1" stopColor="#a8761f" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="a-cap" x1="0" x2="1">
          <stop offset="0" stopColor="#6e5320" />
          <stop offset="0.35" stopColor="#f3dc9c" />
          <stop offset="0.7" stopColor="#c9a24c" />
          <stop offset="1" stopColor="#6e5320" />
        </linearGradient>
        <radialGradient id="a-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#e4c27a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e4c27a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="a-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4c27a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#e4c27a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="640" height="444" fill="url(#a-bg)" />
      <ellipse cx="320" cy="230" rx="230" ry="190" fill="url(#a-glow)" />
      {/* orbit rings */}
      <g fill="none" stroke="#e4c27a" strokeOpacity="0.22">
        <ellipse className="a-ring" cx="320" cy="238" rx="205" ry="205" />
        <ellipse className="a-ring a-ring--2" cx="320" cy="238" rx="150" ry="150" />
      </g>
      {/* reflection + bottle */}
      <ellipse cx="320" cy="400" rx="120" ry="14" fill="url(#a-floor)" />
      <g>
        {/* cap */}
        <rect x="288" y="82" width="64" height="58" rx="6" fill="url(#a-cap)" />
        <rect x="288" y="82" width="64" height="8" rx="4" fill="#fff" fillOpacity="0.35" />
        <rect x="302" y="138" width="36" height="16" fill="#8a6a2a" />
        {/* body */}
        <path d="M232 178a26 26 0 0 1 26-26h124a26 26 0 0 1 26 26v178a30 30 0 0 1-30 30H262a30 30 0 0 1-30-30z" fill="url(#a-glass)" stroke="#f3dc9c" strokeOpacity="0.7" strokeWidth="1.5" />
        {/* liquid */}
        <path d="M244 214h152v140a22 22 0 0 1-22 22H266a22 22 0 0 1-22-22z" fill="url(#a-liquid)" opacity="0.85" />
        {/* label */}
        <rect x="266" y="256" width="108" height="76" rx="3" fill="#0e0c09" fillOpacity="0.82" stroke="#e4c27a" strokeOpacity="0.8" />
        <text x="320" y="293" textAnchor="middle" fill="#f0cf84" fontFamily="Bricolage Grotesque Variable, sans-serif" fontWeight="800" fontSize="21" letterSpacing="1.5">AURELLE</text>
        <line x1="288" y1="302" x2="352" y2="302" stroke="#e4c27a" strokeOpacity="0.6" />
        <text x="320" y="318" textAnchor="middle" fill="#e4c27a" fontFamily="JetBrains Mono Variable, monospace" fontSize="6.5" letterSpacing="2.6">EAU DE PARFUM</text>
        {/* highlights */}
        <path d="M248 176v170" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" strokeLinecap="round" />
        <path d="M392 190v120" stroke="#fff" strokeOpacity="0.18" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* sparkles */}
      <g fill="#f6e2a8">
        <circle className="a-sp" cx="150" cy="120" r="2.2" />
        <circle className="a-sp a-sp--2" cx="500" cy="150" r="1.8" />
        <circle className="a-sp a-sp--3" cx="470" cy="310" r="2.4" />
        <circle className="a-sp a-sp--2" cx="170" cy="300" r="1.6" />
      </g>
    </svg>
  );
}
