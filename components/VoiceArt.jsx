// Illustration for the Outbound Voice Agent card: a live call card with an animated waveform and CRM outcome chips.
const bars = Array.from({ length: 28 }, (_, i) => i);

export default function VoiceArt() {
  return (
    <div className="voiceart" role="img" aria-label="Outbound voice agent: live call with transcript and CRM outcome">
      <div className="va__head">
        <span className="va__live"><i /> Live call</span>
        <span className="va__time">02:14</span>
      </div>
      <div className="va__wave" aria-hidden="true">
        {bars.map((i) => (
          <i key={i} style={{ '--d': `${(i * 83) % 900}ms`, '--h': `${28 + ((i * 37) % 62)}%` }} />
        ))}
      </div>
      <div className="va__bubbles">
        <p className="va__b va__b--a">Worth fifteen minutes with our team this week?</p>
        <p className="va__b va__b--p">Thursday morning works.</p>
      </div>
      <div className="va__chips">
        <span>Meeting booked</span>
        <span>Recording saved</span>
        <span>Follow-up sent</span>
      </div>
    </div>
  );
}
