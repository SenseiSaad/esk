const words = ['Healthcare', 'EdTech', 'AI & Automation', 'FinTech', 'E-commerce', 'Real Estate', 'Logistics', 'Security', 'Media', 'Startups'];

// Pure-CSS marquee: zero JS cost, GPU transform only.
export default function Marquee() {
  const row = words.map((w) => (
    <span key={w}>
      {w} <b aria-hidden="true">✦</b>
    </span>
  ));
  return (
    <section className="marquee card" aria-label="Industries we serve">
      <div className="marquee__track">
        <div>{row}</div>
        <div aria-hidden="true">{row}</div>
      </div>
    </section>
  );
}
