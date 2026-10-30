'use client';
import { useEffect, useRef } from 'react';
import { gsap, SplitText, reduced, fine } from '@/lib/gsap';

const shots = [
  ['thinkwell', 'ThinkWell healthcare platform'],
  ['bridge', 'B.R.I.D.G.E. directory'],
  ['groupxam', 'GroupXam exam prep'],
];

export default function Hero() {
  const root = useRef(null);

  useEffect(() => {
    const rm = reduced();
    const ctx = gsap.context(() => {
      if (rm) return;
      const split = SplitText.create('.hero__title', { type: 'lines', mask: 'lines', linesClass: 'ln' });
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
      tl.from(split.lines, { yPercent: 115, duration: 1.4, stagger: 0.12 })
        .from('.hero__eyebrow, .hero__sub, .hero__cta > *, .hero__proof', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08 }, 0.35)
        .from('.shot', { y: 120, rotate: 0, autoAlpha: 0, duration: 1.5, stagger: 0.14 }, 0.3)
        .from('.hero__chip', { scale: 0.6, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'back.out(1.8)' }, 0.9);
      const go = () => tl.play();
      if (window.__eskReady) go();
      else window.addEventListener('esk:ready', go, { once: true });

      // floating idle motion (transform only)
      gsap.utils.toArray('.shot').forEach((s, i) =>
        gsap.to(s.querySelector('.shot__in'), { y: i % 2 ? -14 : 14, duration: 3 + i * 0.6, repeat: -1, yoyo: true, ease: 'sine.inOut' }),
      );

      // mouse parallax + glow
      if (fine()) {
        const el = root.current;
        const glowX = gsap.quickTo(el, '--mx', { duration: 0.8, ease: 'power3' });
        const glowY = gsap.quickTo(el, '--my', { duration: 0.8, ease: 'power3' });
        const layers = gsap.utils.toArray('.shot').map((s, i) => ({
          x: gsap.quickTo(s, 'x', { duration: 1, ease: 'power3' }),
          y: gsap.quickTo(s, 'y', { duration: 1, ease: 'power3' }),
          d: (i + 1) * 14,
        }));
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          glowX(e.clientX - r.left);
          glowY(e.clientY - r.top);
          layers.forEach((l) => {
            l.x(px * l.d * -2);
            l.y(py * l.d * -2);
          });
        });
      }

      // scroll: gently shrink the hero card
      gsap.to('.hero__bg', { scale: 1.12, yPercent: 8, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hero card card--dark" id="top" ref={root}>
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />
      <div className="hero__left">
        <p className="hero__eyebrow pill"><span className="dot" /> Independent software studio · Est. 2019</p>
        <h1 className="hero__title">
          We engineer digital products that <em>move</em> businesses forward.
        </h1>
        <p className="hero__sub">
          From first sketch to production release, ESK Enterprises builds software people rely on and businesses grow with.
        </p>
        <div className="hero__cta">
          <button className="btn btn--lime btn--lg" data-magnetic onClick={() => window.dispatchEvent(new Event('esk:brief'))}>
            Start a project <i>↗</i>
          </button>
          <a className="btn btn--ghost btn--lg" href="#work" data-magnetic>See our work</a>
        </div>
        <p className="hero__proof">
          <b>10+</b> products shipped · Web + Mobile · End-to-end delivery
        </p>
      </div>

      <div className="hero__right" aria-hidden="false">
        {shots.map(([f, alt], i) => (
          <figure className={`shot shot--${i + 1}`} key={f}>
            <div className="shot__in">
              <div className="mock__bar"><i /><i /><i /></div>
              <img
                src={`/work/${f}-640.webp`}
                srcSet={`/work/${f}-640.webp 640w, /work/${f}-1100.webp 1100w`}
                sizes="(max-width:900px) 70vw, 34vw"
                width="640"
                height="444"
                alt={alt}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                decoding="async"
              />
            </div>
          </figure>
        ))}
        <span className="hero__chip chip--1">Web</span>
        <span className="hero__chip chip--2">iOS &amp; Android</span>
        <span className="hero__chip chip--3">AI</span>
      </div>
    </section>
  );
}
