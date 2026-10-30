'use client';
import { useEffect, useRef } from 'react';
import { gsap, reduced } from '@/lib/gsap';

export default function Loader() {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    const ready = () => {
      window.__eskReady = true;
      window.dispatchEvent(new Event('esk:ready'));
    };
    if (reduced()) {
      el.style.display = 'none';
      ready();
      return;
    }
    const num = el.querySelector('.loader__num');
    const state = { v: 0 };
    document.documentElement.classList.add('lock');
    const tl = gsap.timeline({
      onComplete: () => {
        el.style.display = 'none';
        document.documentElement.classList.remove('lock');
      },
    });
    tl.from('.loader__logo', { yPercent: 120, duration: 0.9, ease: 'expo.out' })
      .to(state, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => (num.textContent = String(Math.round(state.v)).padStart(3, '0')) }, 0.1)
      .to('.loader__bar i', { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0.1)
      .to('.loader__inner', { yPercent: -40, autoAlpha: 0, duration: 0.5, ease: 'power3.in' }, '+=0.1')
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut', onStart: ready }, '-=0.15');
    return () => tl.kill();
  }, []);

  return (
    <div className="loader" ref={root} aria-hidden="true">
      <div className="loader__inner">
        <div className="loader__mask">
          <div className="loader__logo">
            <b>ESK</b> Enterprises
          </div>
        </div>
        <div className="loader__bar"><i /></div>
        <div className="loader__num">000</div>
      </div>
    </div>
  );
}
