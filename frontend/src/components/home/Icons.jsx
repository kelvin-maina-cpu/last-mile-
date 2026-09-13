/* Inline SVG icons — no icon-library dependency added.
   All use currentColor so they follow each theme's text/accent colors. */

function base(props) {
  return {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
    ...props,
  }
}

export const BoltIcon = (p) => (
  <svg {...base(p)}>
    <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" fill="currentColor" stroke="none" />
  </svg>
)

export const BoxIcon = (p) => (
  <svg {...base(p)}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="M3 8l9 5 9-5" />
    <path d="M12 13v8" />
  </svg>
)

export const MapIcon = (p) => (
  <svg {...base(p)}>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14" />
    <path d="M15 6v14" />
  </svg>
)

export const BikeIcon = (p) => (
  <svg {...base(p)}>
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M5.5 17.5 9 9h4" />
    <path d="M9 9 15 17.5" />
    <path d="M13 5h3l2.5 12.5" />
    <circle cx="16" cy="5" r="1" fill="currentColor" />
  </svg>
)

export const ClipboardIcon = (p) => (
  <svg {...base(p)}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 2h6v4H9Z" />
    <path d="M9 11h6" />
    <path d="M9 15h4" />
  </svg>
)

export const UsersIcon = (p) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4" />
    <path d="M17.5 14.4a6.5 6.5 0 0 1 4 5.6" />
  </svg>
)

export const RadioIcon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    <path d="M7.8 16.2a6 6 0 0 1 0-8.4" />
    <path d="M16.2 7.8a6 6 0 0 1 0 8.4" />
    <path d="M5 19a10 10 0 0 1 0-14" />
    <path d="M19 5a10 10 0 0 1 0 14" />
  </svg>
)

export const ShieldCheckIcon = (p) => (
  <svg {...base(p)}>
    <path d="M12 2 4 5.5V11c0 5.2 3.4 9.4 8 11 4.6-1.6 8-5.8 8-11V5.5L12 2Z" />
    <path d="m8.8 11.8 2.3 2.3 4.4-4.4" />
  </svg>
)

export const RouteIcon = (p) => (
  <svg {...base(p)}>
    <circle cx="6" cy="19" r="2.5" />
    <circle cx="18" cy="5" r="2.5" />
    <path d="M8.5 19H14a3.5 3.5 0 0 0 0-7h-4a3.5 3.5 0 0 1 0-7h5.5" />
  </svg>
)

export const LayersIcon = (p) => (
  <svg {...base(p)}>
    <path d="m12 2 9 5-9 5-9-5 9-5Z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 17 9 5 9-5" />
  </svg>
)

export const CheckIcon = (p) => (
  <svg {...base(p)} strokeWidth={2.4}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
)

export const ArrowRightIcon = (p) => (
  <svg {...base(p)}>
    <path d="M4 12h16" />
    <path d="m13 5 7 7-7 7" />
  </svg>
)

export const MenuIcon = (p) => (
  <svg {...base(p)}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
)

export const CloseIcon = (p) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </svg>
)

export const SunIcon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const MoonIcon = (p) => (
  <svg {...base(p)}>
    <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z" />
  </svg>
)

export const MailIcon = (p) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
)

export const PinIcon = (p) => (
  <svg {...base(p)}>
    <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)

export const StarIcon = ({ filled, ...p }) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'} strokeWidth={1.4}>
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
  </svg>
)
