// Illustration for the Certification Academy LMS card: seat licensing, module progress and a hash-chained audit trail.
const seats = Array.from({ length: 40 }, (_, i) => i);
const chain = ['a91f', '7c2e', 'd04b', '1be8'];

export default function LmsArt() {
  return (
    <div className="lmsart" role="img" aria-label="Learning platform dashboard: seat assignments, module progress and a hash-chained audit log">
      <div className="lms__head">
        <b>Certification Academy</b>
        <span className="lms__pill">38 / 50 seats</span>
      </div>
      <div className="lms__body">
        <div className="lms__seats" aria-hidden="true">
          {seats.map((i) => <i key={i} className={i < 31 ? 'on' : i < 38 ? 'mid' : ''} style={{ '--d': `${(i * 37) % 700}ms` }} />)}
        </div>
        <div className="lms__mods" aria-hidden="true">
          {[['Module 4', 72], ['Module 7', 46], ['Final exam', 18]].map(([n, v]) => (
            <div key={n}><span>{n}</span><em><i style={{ '--w': `${v}%` }} /></em></div>
          ))}
        </div>
      </div>
      <div className="lms__chain" aria-hidden="true">
        {chain.map((h, i) => <span key={h}><code>{h}…</code>{i < chain.length - 1 && <b>→</b>}</span>)}
        <small>tamper-evident audit log</small>
      </div>
      <div className="lms__chips"><span>Stripe billing</span><span>PO invoicing</span><span>Tenant isolation</span></div>
    </div>
  );
}
