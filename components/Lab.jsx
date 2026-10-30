'use client';
import { useRef } from 'react';
import useReveal from '@/lib/useReveal';
import { reels } from '@/lib/data';

export default function Lab() {
  const ref = useRef(null);
  useReveal(ref);
  return (
    <section className="lab" ref={ref}>
      <header className="sec-head sec-head--tight">
        <p className="eyebrow" data-reveal>05 / More from the lab</p>
        <h2 data-split>Experiments, <em>shipped</em>.</h2>
      </header>
      <div className="lab__grid">
        <article className="lab__cv card card--dark" data-reveal>
          <p className="mono">Computer vision</p>
          <h3>CCTV violation detection</h3>
          <p>Real-time visual analysis that identifies incidents and triggers response workflows.</p>
          <div className="scan" aria-hidden="true"><i /><i /><i /></div>
        </article>
        <article className="lab__reels card card--lime" data-reveal>
          <p className="mono">Mobile product archive</p>
          <h3>Five more apps. One focused team.</h3>
          <ul>
            {reels.map(([t, h], i) => (
              <li key={t}>
                <a href={h} target="_blank" rel="noopener noreferrer" data-cursor="Play">
                  <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                  <b>{t}</b>
                  <em>Watch reel ↗</em>
                </a>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
