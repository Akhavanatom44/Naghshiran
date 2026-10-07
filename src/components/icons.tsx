type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const HomeIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
  </svg>
);

export const GridIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const CartIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="9" cy="20" r="1.6" />
    <circle cx="17.5" cy="20" r="1.6" />
    <path d="M2.5 3.5h3l2.6 12h10.6l2.3-8.5H6.2" />
  </svg>
);

export const PackageIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M21 8.2 12 3 3 8.2v7.6L12 21l9-5.2V8.2Z" />
    <path d="M3.3 8.3 12 13.3l8.7-5" />
    <path d="M12 21v-7.7" />
  </svg>
);

export const UserIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </svg>
);

export const PhoneIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.27a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7a2 2 0 0 1 1.7 2.03Z" />
  </svg>
);

export const MapPinIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const ShieldIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />
    <path d="m9 11.5 2.2 2.2L15.5 9.4" />
  </svg>
);

export const TruckIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M1.5 5.5h13v11h-13z" />
    <path d="M14.5 9.5h4l3 3.5v3.5h-7" />
    <circle cx="6" cy="18.5" r="2" />
    <circle cx="18" cy="18.5" r="2" />
  </svg>
);

export const HeadsetIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 13.5V12a8 8 0 0 1 16 0v1.5" />
    <rect x="2.5" y="13.5" width="4.5" height="6" rx="2" />
    <rect x="17" y="13.5" width="4.5" height="6" rx="2" />
    <path d="M19.5 19.5v1a2.5 2.5 0 0 1-2.5 2.5h-3" />
  </svg>
);

export const LockIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="15.7" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const PlusIcon = ({ className }: IconProps) => (
  <svg {...base} strokeWidth={2.6} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = ({ className }: IconProps) => (
  <svg {...base} strokeWidth={2.6} className={className}>
    <path d="M5 12h14" />
  </svg>
);

export const CheckIcon = ({ className }: IconProps) => (
  <svg {...base} strokeWidth={2.6} className={className}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const LogOutIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const CrosshairIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const TrashIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3.5 6.5h17" />
    <path d="M8.5 6.5v-2a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2" />
    <path d="M6 6.5 7 21h10l1-14.5" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const ReceiptIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 2.5h14V21l-2.4-1.6L14.2 21l-2.2-1.6L9.8 21l-2.4-1.6L5 21V2.5Z" />
    <path d="M9 7.5h6M9 11.5h6M9 15.5h4" />
  </svg>
);
