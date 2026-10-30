'use client';
import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import useReveal from '@/lib/useReveal';

export default function Cta() {
  const ref = useRef(null);
  useReveal(ref, () => {
    gsap.fromTo('.cta__orb', { scale: 0.6 }, { scale: 1.25, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  return (
    <section className="cta card card--lime" id="contact" ref={ref}>
      <span className="cta__orb" aria-hidden="true" />
      <p className="eyebrow" data-reveal>07 / Start a project</p>
      <h2 data-split>Have an idea? Let’s make it <em>real</em>.</h2>
      <p className="cta__p" data-reveal>Tell us what you’re building, where you are in the process and what success looks like.</p>
      <button className="btn btn--ink btn--xl" data-magnetic data-reveal onClick={() => window.dispatchEvent(new Event('esk:brief'))}>
        Build your project brief <i>↗</i>
      </button>
      <p className="cta__note mono" data-reveal>Available for select product partnerships</p>
    </section>
  );
}
