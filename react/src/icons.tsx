import type { SVGProps } from 'react'

// Icônes décoratives: toujours aria-hidden, le sens est porté par un texte (visible ou .lm-sr-only).
const Svg = ({ children, ...rest }: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className="lm-icon"
    {...rest}
  >
    {children}
  </svg>
)

export const CheckIcon = () => <Svg data-icon="check"><path d="M3 8.5 6.5 12 13 4.5" /></Svg>
export const ClockIcon = () => <Svg data-icon="clock"><circle cx="8" cy="8" r="6" /><path d="M8 4.5V8l2.5 1.5" /></Svg>
export const InfoIcon = () => <Svg data-icon="info"><circle cx="8" cy="8" r="6" /><path d="M8 7.5V11M8 5h.01" /></Svg>
export const AlertIcon = () => <Svg data-icon="alert"><path d="M8 2 14.5 13.5h-13Z" /><path d="M8 6.5v3M8 11.5h.01" /></Svg>
export const CloseIcon = () => <Svg data-icon="close"><path d="m4 4 8 8M12 4l-8 8" /></Svg>
export const ArrowUpIcon = () => <Svg data-icon="arrow-up"><path d="M8 13V3M4 7l4-4 4 4" /></Svg>
export const ArrowDownIcon = () => <Svg data-icon="arrow-down"><path d="M8 3v10M4 9l4 4 4-4" /></Svg>
export const ArrowFlatIcon = () => <Svg data-icon="arrow-flat"><path d="M3 8h10M9 4l4 4-4 4" /></Svg>
export const SortIcon = () => <Svg data-icon="sort"><path d="M5 6.5 8 3.5l3 3M5 9.5l3 3 3-3" /></Svg>
