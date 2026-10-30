'use client';
import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import useReveal from '@/lib/useReveal';
import { services } from '@/lib/data';

export default function Services() {
  const ref = useRef(null);
  useReveal(ref, () => {
    // stacking cards: as the next card slides over, the previous one recedes
    const cards = gsap.utils.toArray('.svc');
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      // explicit from/to: animating `filter` from the computed "none" makes GSAP start at brightness(0) (black card)
      gsap.fromTo(card.querySelector('.svc__in'), { scale: 1, filter: 'brightness(1)' }, {
        scale: 0.93,
        filter: 'brightness(0.86)',
        ease: 'none',
        scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 20%', scrub: true },
      });
    });
  });

  return (
    <section className="services" id="services" ref={ref}>
      <header className="sec-head">
        <p className="eyebrow" data-reveal>03 / Capabilities</p>
        <h2 data-split>One team. <em>Full</em> product.</h2>
        <p className="sec-head__p" data-reveal>We plug in at idea stage or help an existing product find its next level.</p>
      </header>
      <div className="svc-stack">
        {services.map((s, i) => (
          <article className="svc" key={s.n} style={{ '--bg': s.bg, '--fg': s.fg, '--i': i }}>
            <div className="svc__in">
              <span className="svc__n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <ul>{s.tags.map((t) => <li key={t}>{t}</li>)}</ul>
              <span className="svc__orb" aria-hidden="true" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
