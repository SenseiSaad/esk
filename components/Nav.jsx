'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

export const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="9" fill="#0D0D0B" />
    <path d="M9 9h14M9 16h9M9 23h14" stroke="#D2F53C" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const links = [
  ['Work', '#work'],
  ['Services', '#services'],
  ['Industries', '#industries'],
  ['Process', '#process'],
];

export default function Nav() {
  const bar = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // hide on scroll down, show on scroll up
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const hide = self.direction === 1 && self.scroll() > 200;
        gsap.to(bar.current, { yPercent: hide ? -140 : 0, duration: 0.5, ease: 'power3.out', overwrite: true });
      },
    });
    const close = () => setOpen(false);
    window.addEventListener('esk:closemenu', close);
    return () => {
      st.kill();
      window.removeEventListener('esk:closemenu', close);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('lock', open);
    if (open) window.__lenis?.stop();
    else window.__lenis?.start();
  }, [open]);

  const brief = () => {
    setOpen(false);
    window.dispatchEvent(new Event('esk:brief'));
  };

  return (
    <>
      <header className="nav" ref={bar}>
        <a href="#top" className="nav__logo" aria-label="ESK Enterprises home">
          <Logo />
          <span>ESK <em>Enterprises</em></span>
        </a>
        <nav className="nav__links" aria-label="Primary">
          {links.map(([t, h]) => (
            <a key={h} href={h}>{t}</a>
          ))}
        </nav>
        <button className="btn btn--lime nav__cta" onClick={brief} data-magnetic>
          Start a project <i>↗</i>
        </button>
        <button className={`burger ${open ? 'is-open' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
          <i /><i />
        </button>
      </header>
      <div className={`sheet ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        {links.map(([t, h], i) => (
          <a key={h} href={h} style={{ '--i': i }}>{t}</a>
        ))}
        <button className="btn btn--lime" onClick={brief}>Start a project ↗</button>
      </div>
    </>
  );
}
