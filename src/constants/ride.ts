/**
 * Palette and spacing used by the passenger (ride) experience.
 *
 * The legacy delivery screens keep using `Colors` from `@/constants/theme`;
 * this palette is intentionally separate so the two experiences do not fight
 * over the same tokens.
 */
import { AppFonts } from './theme';

export const RideColors = {
  primary: '#16A34A',
  primaryStrong: '#0E7C37',
  primarySoft: '#E8F6EE',
  primaryMuted: '#F3FBF6',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F6F5',
  surfaceRaised: '#FFFFFF',
  text: '#0F1F18',
  textSecondary: '#66756E',
  textInverse: '#FFFFFF',
  border: '#E4EAE7',
  borderStrong: '#D3DCD8',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
  warning: '#B45309',
  warningSoft: '#FDF3E7',
  info: '#2563EB',
  infoSoft: '#EFF4FF',
  shadow: '#0A2A1B',
  mapOverlay: 'rgba(255,255,255,0.94)',
} as const;

export const RideRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const RideSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Soft elevation used by the cards and the bottom sheet. */
export const RideShadow = {
  card: {
    shadowColor: RideColors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sheet: {
    shadowColor: RideColors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
} as const;

export const RideFonts = AppFonts;

/** Minimum touch target recommended by both platforms. */
export const TOUCH_TARGET = 44;
