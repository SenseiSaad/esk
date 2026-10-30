'use client';
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, reduced, fine } from '@/lib/gsap';

// Global motion layer: smooth scroll, custom cursor, magnetic buttons, anchor links.
export default function Motion() {
  const cursor = useRef(null);

  useEffect(() => {
    const rm = reduced();
    let lenis;
    let tick;

    if (!rm) {
      lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      tick = (t) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const onAnchor = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      const el = id.length > 1 && document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.dispatchEvent(new Event('esk:closemenu'));
      if (lenis) lenis.scrollTo(el, { offset: -90, duration: 1.4 });
      else el.scrollIntoView({ behavior: 'auto' });
    };
    document.addEventListener('click', onAnchor);

    const cleanups = [() => document.removeEventListener('click', onAnchor)];

    if (!rm && fine() && cursor.current) {
      const c = cursor.current;
      const label = c.querySelector('span');
      const xTo = gsap.quickTo(c, 'x', { duration: 0.45, ease: 'power3' });
      const yTo = gsap.quickTo(c, 'y', { duration: 0.45, ease: 'power3' });
      const move = (e) => {
        xTo(e.clientX);
        yTo(e.clientY);
        c.classList.add('on');
      };
      const over = (e) => {
        const t = e.target.closest('[data-cursor]');
        if (t) {
          label.textContent = t.dataset.cursor;
          c.classList.add('big');
        } else c.classList.remove('big');
      };
      const leave = () => c.classList.remove('on');
      window.addEventListener('mousemove', move, { passive: true });
      document.addEventListener('mouseover', over, { passive: true });
      document.addEventListener('mouseleave', leave);

      // magnetic elements
      const mags = [...document.querySelectorAll('[data-magnetic]')].map((el) => {
        const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
        const qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
        const m = (e) => {
          const r = el.getBoundingClientRect();
          qx((e.clientX - (r.left + r.width / 2)) * 0.28);
          qy((e.clientY - (r.top + r.height / 2)) * 0.28);
        };
        const l = () => {
          qx(0);
          qy(0);
        };
        el.addEventListener('mousemove', m);
        el.addEventListener('mouseleave', l);
        return () => {
          el.removeEventListener('mousemove', m);
          el.removeEventListener('mouseleave', l);
        };
      });
      cleanups.push(
        () => window.removeEventListener('mousemove', move),
        () => document.removeEventListener('mouseover', over),
        () => document.removeEventListener('mouseleave', leave),
        ...mags,
      );
    }

    // layout settles after fonts load
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      cleanups.forEach((f) => f());
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      delete window.__lenis;
    };
  }, []);

  return (
    <div className="cursor" ref={cursor} aria-hidden="true">
      <span />
    </div>
  );
}
