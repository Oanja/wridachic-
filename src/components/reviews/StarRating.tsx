'use client';

/**
 * Visual star rating — read-only or interactive.
 *
 * Read-only mode (default): renders 5 stars filled proportionally to
 * `value` (e.g. 3.5 → 3 full + 1 half + 1 empty). Used on product cards
 * and review list items.
 *
 * Interactive mode (`onChange` passed): renders 5 buttons the user can
 * click to set the rating. Used inside the ReviewForm.
 *
 * Why custom SVG instead of an emoji or font-awesome: emoji rendering
 * differs across phones (some show colored stars, some grey), and font
 * loading would push first paint. SVG is consistent everywhere and
 * weighs ~200 bytes.
 */

interface StarRatingProps {
  value: number;        // 0-5, fractions allowed (e.g. 3.5)
  size?: number;        // px size of each star (default 18)
  onChange?: (v: number) => void;
  className?: string;
  color?: string;       // fill color (default brand clay)
}

export function StarRating({ value, size = 18, onChange, className, color = '#C85C3F' }: StarRatingProps) {
  const interactive = !!onChange;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {stars.map((i) => {
        // Each star: filled (i <= value), half (i - 0.5 <= value < i), or empty.
        const fill = value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0;
        const Star = (
          <Svg key={i} size={size} fill={fill} color={color} />
        );
        if (!interactive) return Star;
        return (
          <button
            key={i}
            type="button"
            aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
            onClick={() => onChange?.(i)}
            style={{ background: 'transparent', border: 'none', padding: 2, cursor: 'pointer', lineHeight: 0 }}
          >{Star}</button>
        );
      })}
    </div>
  );
}

function Svg({ size, fill, color }: { size: number; fill: 0 | 0.5 | 1; color: string }) {
  // We use a clipPath when half-filled so the right half stays the empty
  // colour. clipId must be unique per render to avoid clashes across the
  // 5 stars on the same page — we tie it to the fill ratio + colour.
  const clipId = `clip-${fill}-${color.replace('#', '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {fill === 0.5 && (
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
      )}
      {/* base — always rendered as the outline */}
      <path
        d="M12 2.5l2.95 6 6.6.95-4.78 4.66 1.13 6.57L12 17.6 6.1 20.68l1.13-6.57L2.45 9.45l6.6-.95L12 2.5z"
        fill={fill === 1 ? color : 'transparent'}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {fill === 0.5 && (
        <path
          d="M12 2.5l2.95 6 6.6.95-4.78 4.66 1.13 6.57L12 17.6 6.1 20.68l1.13-6.57L2.45 9.45l6.6-.95L12 2.5z"
          fill={color}
          clipPath={`url(#${clipId})`}
        />
      )}
    </svg>
  );
}
