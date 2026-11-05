'use client';
import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import useReveal from '@/lib/useReveal';
import { Logo } from './Nav';
import { CONTACT, whatsappUrl } from '@/lib/contact';

export default function Footer() {
  const ref = useRef(null);
  useReveal(ref, () => {
    gsap.from('.foot__big', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  });
  return (
    <footer className="foot card card--dark" ref={ref}>
      <div className="foot__top">
        <div>
          <a href="#top" className="nav__logo nav__logo--light"><Logo /><span>ESK <em>Enterprises</em></span></a>
          <p>Custom software, web and mobile products. Building since 2019.</p>
        </div>
        <nav aria-label="Footer">
          <a href="#work">Work</a>
          <a href="#services">Services</a>
          <a href="#industries">Industries</a>
          <a href="#about">Company</a>
        </nav>
        <nav className="foot__contact" aria-label="Contact">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp {CONTACT.whatsappDisplay}</a>
          {CONTACT.email ? <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> : <span>Email address coming soon</span>}
          <a href={CONTACT.upworkUrl} target="_blank" rel="noopener noreferrer">Upwork profile</a>
        </nav>
      </div>
      <p className="foot__copy mono">© {new Date().getFullYear()} ESK Enterprises. All rights reserved.</p>
      <div className="foot__big" aria-hidden="true">ESK</div>
    </footer>
  );
}
