'use client';
import { useRef } from 'react';
import { gsap, SplitText } from '@/lib/gsap';
import useReveal from '@/lib/useReveal';

const stats = [
  { v: 2019, label: 'Founded', fmt: false },
  { v: 10, suffix: '+', label: 'Products shipped' },
  { v: 12, label: 'Industries served' },
  { t: 'Web + Mobile', label: 'End-to-end delivery' },
];

export default function About() {
  const ref = useRef(null);
  useReveal(ref, () => {
    // scroll-scrubbed word highlight
    const split = SplitText.create('.about__text', { type: 'words' });
    gsap.fromTo(split.words, { opacity: 0.16 }, {
      opacity: 1,
      stagger: 0.12,
      ease: 'none',
      scrollTrigger: { trigger: '.about__text', start: 'top 80%', end: 'bottom 55%', scrub: 0.6 },
    });
    // count-up
    gsap.utils.toArray('[data-count]').forEach((el) => {
      const end = +el.dataset.count;
      const o = { v: end > 1000 ? end - 40 : 0 };
      gsap.to(o, {
        v: end,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => (el.textContent = Math.round(o.v)),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  });

  return (
    <section className="about card card--paper" id="about" ref={ref}>
      <p className="eyebrow" data-reveal>01 / Who we are</p>
      <p className="about__text">
        Small, senior and built for ambitious products. ESK Enterprises is a product engineering studio for teams that need more than a vendor — product thinking, design and development in one focused delivery team, across healthcare, education, business platforms, AI tools, e-commerce and mobile.
      </p>
      <div className="stats">
        {stats.map((s, i) => (
          <div className={`stat ${i === 3 ? 'stat--lime' : ''}`} key={s.label} data-reveal>
            <span className="stat__label">{s.label}</span>
            <strong className="stat__v">
              {s.t ? s.t : (<><span data-count={s.v}>{s.v}</span>{s.suffix}</>)}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
