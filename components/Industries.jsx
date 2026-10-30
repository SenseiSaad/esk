'use client';
import { useRef } from 'react';
import useReveal from '@/lib/useReveal';
import { industries } from '@/lib/data';

export default function Industries() {
  const ref = useRef(null);
  useReveal(ref);
  return (
    <section className="industries card card--paper" id="industries" ref={ref}>
      <header className="sec-head sec-head--tight">
        <p className="eyebrow" data-reveal>04 / Industries we serve</p>
        <h2 data-split>Deep thinking. <em>Across</em> sectors.</h2>
        <p className="sec-head__p" data-reveal>Different industries, same standard: useful technology, intuitive experiences and systems built to scale.</p>
      </header>
      <div className="ind-grid">
        {industries.map(([t, d], i) => (
          <div className="ind" key={t} data-reveal>
            <span className="mono">{String(i + 1).padStart(2, '0')}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
