'use client';
import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import useReveal from '@/lib/useReveal';
import { Logo } from './Nav';

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
      </div>
      <p className="foot__copy mono">© {new Date().getFullYear()} ESK Enterprises. All rights reserved.</p>
      <div className="foot__big" aria-hidden="true">ESK</div>
    </footer>
  );
}
