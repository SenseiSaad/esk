'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { whatsappUrl } from '@/lib/contact';

export const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
    <rect width="64" height="64" rx="17" fill="#91F500" />
    <path d="M14 21c1-3 3-5 6-5l27-6c3-.5 4 1 3 4l-1 5c-1 3-3 5-6 6l-27 6c-3 .5-4-1-3-4l1-6Zm0 15c1-3 3-5 6-5l19-4c3-.5 4 1 3 4l-1 5c-1 3-3 5-6 6l-19 4c-3 .5-4-1-3-4l1-6Zm0 15c1-3 3-5 6-5l27-6c3-.5 4 1 3 4l-1 5c-1 3-3 5-6 6l-27 6c-3 .5-4-1-3-4l1-6Z" fill="#0D0D0B" />
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
        <a className="btn btn--lime nav__cta" href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-magnetic>
          WhatsApp us <i>↗</i>
        </a>
        <button className={`burger ${open ? 'is-open' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
          <i /><i />
        </button>
      </header>
      <div className={`sheet ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        {links.map(([t, h], i) => (
          <a key={h} href={h} style={{ '--i': i }}>{t}</a>
        ))}
        <a className="btn btn--lime" href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>WhatsApp us ↗</a>
      </div>
    </>
  );
}
