'use client';
import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import useReveal from '@/lib/useReveal';
import { steps } from '@/lib/data';

export default function Process() {
  const ref = useRef(null);
  useReveal(ref, () => {
    gsap.fromTo('.proc__fill', { scaleX: 0 }, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: '.proc__steps', start: 'top 75%', end: 'bottom 60%', scrub: 0.5 },
    });
  });
  return (
    <section className="process" id="process" ref={ref}>
      <header className="sec-head sec-head--tight">
        <p className="eyebrow" data-reveal>06 / How we work</p>
        <h2 data-split>Clarity at <em>every</em> stage.</h2>
      </header>
      <div className="proc__line" aria-hidden="true"><i className="proc__fill" /></div>
      <ol className="proc__steps">
        {steps.map(([t, d], i) => (
          <li key={t} data-reveal>
            <span className="mono">0{i + 1}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
