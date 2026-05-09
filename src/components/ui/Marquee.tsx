interface MarqueeProps {
  items: readonly string[];
}

export function Marquee({ items }: MarqueeProps) {
  return (
    <div className="marquee">
      <div className="marquee-track">
        {[0, 1].map((k) => (
          <div key={k} className="marquee-half">
            {items.map((m, i) => <span key={i}>{m}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}
