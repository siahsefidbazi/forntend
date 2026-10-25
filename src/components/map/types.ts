import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type Coordinates = { latitude: number; longitude: number };

export type MapRegion = Coordinates & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type AppMapMarker = {
  id: string;
  coordinate: Coordinates;
  title?: string;
  description?: string;
  /** Custom marker view (native only). */
  content?: ReactNode;
  anchor?: { x: number; y: number };
};

export type AppMapProps = {
  style?: StyleProp<ViewStyle>;
  initialRegion: MapRegion;
  region?: MapRegion;
  markers?: AppMapMarker[];
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  loadingEnabled?: boolean;
  loadingBackgroundColor?: string;
  loadingIndicatorColor?: string;
  /** e.g. https://tile.openstreetmap.org/{z}/{x}/{y}.png */
  tileUrlTemplate?: string;
  onMapReady?: () => void;
  onMoveStart?: () => void;
  onRegionChangeComplete?: (region: MapRegion) => void;
  onPress?: (coordinate: Coordinates) => void;
  onLongPress?: (coordinate: Coordinates) => void;
  /** Texts shown by the web fallback. */
  fallbackTitle?: string;
  fallbackText?: string;
};

export type AppMapHandle = {
  animateToRegion: (region: MapRegion, duration?: number) => void;
};
