import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#16A34A',
    secondary: '#C2410C',
    ink: '#14211A',
    text: '#18251D',
    textSecondary: '#5A665F',
    background: '#F7F8F3',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EDF1EA',
    accent: '#FFF3E7',
    primaryLight: '#E3F3EA',
    secondaryLight: '#FDE9DE',
    onPrimary: '#FFFFFF',
    onPrimaryMuted: '#EAF7EF',
    onPrimarySurface: 'rgba(255,255,255,0.18)',
    onSecondary: '#FFFFFF',
    success: '#15803D',
    warning: '#B7791F',
    error: '#DC2626',
    border: '#E1E5DC',
    icon: '#5A665F',
    tint: '#16A34A',
  },
  dark: {
    primary: '#86EFAC',
    secondary: '#FDBA74',
    ink: '#F7F8F3',
    text: '#F7F8F3',
    textSecondary: '#C8D2CB',
    background: '#101710',
    backgroundElement: '#18231B',
    backgroundSelected: '#243225',
    accent: '#3A2A1D',
    primaryLight: '#213B2A',
    secondaryLight: '#3D2A20',
    onPrimary: '#0B1A10',
    onPrimaryMuted: '#17351F',
    onPrimarySurface: 'rgba(255,255,255,0.14)',
    onSecondary: '#2A1306',
    success: '#86EFAC',
    warning: '#FACC15',
    error: '#FCA5A5',
    border: '#2D3A30',
    icon: '#C8D2CB',
    tint: '#86EFAC',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const AppFonts = {
  regular: 'Vazirmatn',
  medium: 'VazirmatnMedium',
  semiBold: 'VazirmatnSemiBold',
  bold: 'VazirmatnBold',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
  }) ?? 0;

export const MaxContentWidth = 800;
