import { iconBase, type IconProps } from './icon-base';

export function UserIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
export function BellIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
export function ChevronRightIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
export function ArrowLeftIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}
export function SendIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="m22 2-20 8 8 3 3 8z" />
      <path d="m22 2-11 11" />
    </svg>
  );
}
export function CheckIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}
export function XIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="m6 6 12 12" />
      <path d="M6 18 18 6" />
    </svg>
  );
}
export function TrashIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
export function ImageIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m4 18 5-5 4 4 3-3 4 4" />
    </svg>
  );
}
export function GlobeIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
export function HelpIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 .3c0 1.7-2.5 2-2.5 4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
export function ShieldIcon({ size, ...r }: IconProps) {
  return (
    <svg {...iconBase(size)} {...r}>
      <path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6Z" />
    </svg>
  );
}
