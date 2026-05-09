import Image from 'next/image';

const SRC = {
  full: '/assets/wridachicNlogo.svg',
  menu: '/assets/wridachicNlogo-2.svg',
} as const;

interface LogoProps {
  size?: number;
  invert?: boolean;
  variant?: keyof typeof SRC;
  priority?: boolean;
}

export function Logo({ size = 38, invert = false, variant = 'full', priority = false }: LogoProps) {
  return (
    <Image
      src={SRC[variant]}
      alt="wridachic"
      width={size * 4}
      height={size}
      priority={priority}
      style={{
        height: size,
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        filter: invert ? 'invert(1)' : 'none',
        mixBlendMode: invert ? 'normal' : 'multiply',
        display: 'block',
      }}
    />
  );
}
