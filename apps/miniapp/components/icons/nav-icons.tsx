import { iconBase, type IconProps } from './icon-base';

export function HomeIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
export function CompassIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 5-5 2 2-5z" />
    </svg>
  );
}
export function MegaphoneIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="M3 11v2a2 2 0 0 0 2 2h2l4 4V5L7 9H5a2 2 0 0 0-2 2Z" />
      <path d="M14 8a4 4 0 0 1 0 8" />
      <path d="M17 5a8 8 0 0 1 0 14" />
    </svg>
  );
}
export function MessageIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z" />
    </svg>
  );
}
export function MapPinIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
export function PhoneIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="M5 4h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}
export function QrCodeIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3" />
      <path d="M21 14v3" />
      <path d="M14 21h3" />
      <path d="M21 21v-3" />
    </svg>
  );
}
export function TrophyIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="M8 4h8v4a4 4 0 0 1-8 0Z" />
      <path d="M5 4h3v4a3 3 0 0 1-3-3Z" />
      <path d="M19 4h-3v4a3 3 0 0 0 3-3Z" />
      <path d="M9 14h6l-1 4h-4z" />
      <path d="M8 20h8" />
    </svg>
  );
}
