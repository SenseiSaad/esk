'use client';
import { useEffect } from 'react';
import { gsap, ScrollTrigger, SplitText, reduced } from '@/lib/gsap';

// Shared section animations:
//  [data-split]  -> masked line-by-line headline reveal
//  [data-reveal] -> fade/slide up, batched (one ScrollTrigger pass, cheap on mobile)
// `extra(ctx)` lets a section add its own tweens inside the same gsap context.
export default function useReveal(ref, extra) {
  useEffect(() => {
    if (reduced()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-split]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 115,
              duration: 1.2,
              ease: 'expo.out',
              stagger: 0.09,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            }),
        });
      });

      const items = gsap.utils.toArray('[data-reveal]');
      if (items.length) {
        gsap.set(items, { autoAlpha: 0, y: 36 });
        ScrollTrigger.batch(items, {
          start: 'top 90%',
          once: true,
          onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, overwrite: true }),
        });
      }

      extra?.();
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
