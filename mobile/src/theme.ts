/**
 * The web app's LIGHT tokens (src/app/globals.css :root), converted from
 * oklch to sRGB hex. Same rules as docs/design-system.md: brass is action,
 * never decoration; neutrals stay neutral; gain/loss is the only coloured
 * number. Change them together with globals.css.
 */
export const color = {
  background: "#f2f6f8",
  foreground: "#141c23",
  card: "#fafcfd",
  muted: "#e6ecf0",
  mutedForeground: "#5a5e62",
  border: "#ced5da",
  brass: "#8a6a2f",
  brassForeground: "#fefcf4",
  destructive: "#cc2827",
  warning: "#b17000",
  gain: "#007b56",
  surfacePhoto: "#e7ecef",
  // Photographic surfaces only (the viewfinder), as on the web's film strip
  // and glance scrims: the live image is the ground, so its chrome is white,
  // and the active lens reads in a light brass that holds contrast on black.
  viewfinder: "#000000",
  viewfinderText: "#ffffff",
  viewfinderAccent: "#f5d68a",
  viewfinderError: "#ffb4ab",
} as const

/** The six-step type scale: 11 / 13 / 15 / 19 / 26 / 38. */
export const text = { xxs: 11, xs: 13, sm: 15, md: 19, lg: 26, xl: 38 } as const

/** 8 controls · 14 cards · full pills. */
export const radius = { control: 8, card: 14, pill: 999 } as const

/** Apple's minimum comfortable touch target. */
export const TOUCH = 44
