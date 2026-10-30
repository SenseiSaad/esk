'use client';
import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import Aurelle from './Aurelle';
import VoiceArt from './VoiceArt';
import LmsArt from './LmsArt';
import useReveal from '@/lib/useReveal';
import { projects } from '@/lib/data';

function Card({ p }) {
  const ext = /^https?:/.test(p.href);
  return (
    <article className="wcard" data-reveal>
      <a
        className="wcard__tile"
        href={p.href}
        {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        style={{ '--bg': p.bg, '--fg': p.fg }}
        data-cursor="View"
        aria-label={`${p.title} — ${p.label}`}
      >
        <span className="wcard__n">{p.n}</span>
        <span className="wcard__arrow">↗</span>
        <h3 className="wcard__title">{p.title}</h3>
        <div className="wcard__mock">
          <div className="mock__bar"><i /><i /><i /></div>
          <div className="wcard__shot">
            {p.img ? (
              <img
                src={`/work/${p.img}-640.webp`}
                srcSet={`/work/${p.img}-640.webp 640w, /work/${p.img}-1100.webp 1100w`}
                sizes="(max-width:760px) 80vw, 36vw"
                width="640"
                height="444"
                loading="lazy"
                decoding="async"
                alt={`${p.title} screenshot`}
              />
            ) : (
              p.art === 'voice' ? <VoiceArt /> : p.art === 'lms' ? <LmsArt /> : <Aurelle />
            )}
          </div>
        </div>
      </a>
      <div className="wcard__meta">
        <p className="mono">{p.cat}</p>
        <p>{p.desc}</p>
      </div>
    </article>
  );
}

export default function Work() {
  const ref = useRef(null);
  useReveal(ref, () => {
    if (!window.matchMedia('(min-width: 761px)').matches) return;
    // desktop only: right column drifts slower than the left -> Pinterest-style stagger
    gsap.to('.work__col--r', { yPercent: -4, ease: 'none', scrollTrigger: { trigger: '.work__grid', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.utils.toArray('.wcard__mock').forEach((m) =>
      gsap.fromTo(m, { yPercent: 6 }, { yPercent: -3, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } }),
    );
  });

  const cols = [projects.filter((p) => p.col === 0), projects.filter((p) => p.col === 1)];
  return (
    <section className="work" id="work" ref={ref}>
      <header className="sec-head">
        <p className="eyebrow" data-reveal>02 / Selected work</p>
        <h2 data-split>Built for the <em>real</em> world.</h2>
        <p className="sec-head__p" data-reveal>Platforms, apps and digital experiences designed around a clear business goal.</p>
      </header>
      <div className="work__grid">
        <div className="work__col">{cols[0].map((p) => <Card p={p} key={p.id} />)}</div>
        <div className="work__col work__col--r">{cols[1].map((p) => <Card p={p} key={p.id} />)}</div>
      </div>
    </section>
  );
}
