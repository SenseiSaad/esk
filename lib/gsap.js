'use client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger, SplitText);

export const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
// Skip heavy media on data-saver / slow connections
export const lowData = () => {
  const c = typeof navigator !== 'undefined' && navigator.connection;
  return !!c && (c.saveData || /2g|3g/.test(c.effectiveType || ''));
};

export { gsap, ScrollTrigger, SplitText };
