import type { SVGProps } from 'react';
export type IconProps = SVGProps<SVGSVGElement> & { size?: number };
export const iconBase = (size?: number): SVGProps<SVGSVGElement> => ({
  width: size ?? 24,
  height: size ?? 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});
