import Image from 'next/image';
import type { CSSProperties } from 'react';

interface PlaceholderProps {
  tint?: string;
  aspect?: string;
  rose?: boolean;
}

export function Placeholder({ tint = 'rose', aspect = '3/4', rose = false }: PlaceholderProps) {
  const style: CSSProperties = {
    aspectRatio: aspect !== 'none' ? aspect : undefined,
    width: '100%',
    height: '100%',
  };
  return (
    <div className={`ph2 ph2-tint-${tint}`} style={style}>
      {rose && (
        <div className="ph2-rose-mark">
          <Image src="/assets/wridachicNlogo.svg" alt="" width={200} height={200} />
        </div>
      )}
    </div>
  );
}
