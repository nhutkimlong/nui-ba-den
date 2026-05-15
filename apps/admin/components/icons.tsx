import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size?: number): SVGProps<SVGSVGElement> => ({
  width: size ?? 18,
  height: size ?? 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </svg>
);
export const InboxIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <path d="M3 13h6l1 2h4l1-2h6" />
    <path d="M3 13 5 5h14l2 8" />
    <path d="M3 13v6h18v-6" />
  </svg>
);
export const MapPinIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const BookOpenIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <path d="M3 5h6a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H3Z" />
    <path d="M21 5h-6a3 3 0 0 0-3 3v11a3 3 0 0 1 3-3h6Z" />
  </svg>
);
export const TrophyIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <path d="M8 4h8v4a4 4 0 0 1-8 0Z" />
    <path d="M5 4h3v4a3 3 0 0 1-3-3Z" />
    <path d="M19 4h-3v4a3 3 0 0 0 3-3Z" />
    <path d="M9 14h6l-1 4h-4z" />
    <path d="M8 20h8" />
  </svg>
);
export const PlusIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);
export const PencilIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <path d="M4 20h4l11-11-4-4L4 16Z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const SearchIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);
export const RefreshIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
  </svg>
);
export const CheckIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);
export const ChatIcon = (p: IconProps) => (
  <svg {...base(p.size)} {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z" />
  </svg>
);
