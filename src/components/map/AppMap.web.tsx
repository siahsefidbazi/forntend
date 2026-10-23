import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppFonts, Colors } from '@/constants/theme';
import type { AppMapHandle, AppMapProps } from './types';

const theme = Colors.light;
const TILE_SIZE = 256;
const ZOOM = 14;

function longitudeToTileX(longitude: number) {
  return ((longitude + 180) / 360) * 2 ** ZOOM;
}

function latitudeToTileY(latitude: number) {
  const radians = (latitude * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2) * 2 ** ZOOM;
}

function tileXToLongitude(tileX: number) {
  return (tileX / 2 ** ZOOM) * 360 - 180;
}

function tileYToLatitude(tileY: number) {
  return (Math.atan(Math.sinh(Math.PI * (1 - (2 * tileY) / 2 ** ZOOM))) * 180) / Math.PI;
}

function wrapTileX(tileX: number) {
  return ((tileX % 2 ** ZOOM) + 2 ** ZOOM) % 2 ** ZOOM;
}

const AppMap = forwardRef<AppMapHandle, AppMapProps>(function AppMap(
  {
    style,
    initialRegion,
    region,
    markers = [],
    showsUserLocation = false,
    onPress,
    onLongPress,
  },
  ref,
) {
  const { width, height } = useWindowDimensions();
  const center = region ?? initialRegion;
  const centerTileX = longitudeToTileX(center.longitude);
  const centerTileY = latitudeToTileY(center.latitude);
  const columns = Math.ceil(width / TILE_SIZE) + 2;
  const rows = Math.ceil(height / TILE_SIZE) + 2;

  const tiles = useMemo(() => {
    const firstX = Math.floor(centerTileX - columns / 2);
    const firstY = Math.floor(centerTileY - rows / 2);
    return Array.from({ length: columns * rows }, (_, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = firstX + column;
      const y = firstY + row;
      return {
        key: `${x}-${y}`,
        uri: `https://tile.openstreetmap.org/${ZOOM}/${wrapTileX(x)}/${y}.png`,
        left: width / 2 + (x - centerTileX) * TILE_SIZE,
        top: height / 2 + (y - centerTileY) * TILE_SIZE,
        visible: y >= 0 && y < 2 ** ZOOM,
      };
    });
  }, [centerTileX, centerTileY, columns, height, rows, width]);

  const projectMarker = (latitude: number, longitude: number) => ({
    left: width / 2 + (longitudeToTileX(longitude) - centerTileX) * TILE_SIZE,
    top: height / 2 + (latitudeToTileY(latitude) - centerTileY) * TILE_SIZE,
  });

  const handleMapPress = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (!onPress) return;
    const tileX = centerTileX + (event.nativeEvent.locationX - width / 2) / TILE_SIZE;
    const tileY = centerTileY + (event.nativeEvent.locationY - height / 2) / TILE_SIZE;
    onPress({
      latitude: tileYToLatitude(tileY),
      longitude: tileXToLongitude(tileX),
    });
  };

  useImperativeHandle(ref, () => ({ animateToRegion: () => {} }), []);

  return (
    <View style={[styles.container, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {tiles.map((tile) => tile.visible ? (
          <Image
            key={tile.key}
            source={{ uri: tile.uri }}
            resizeMode="stretch"
            style={[styles.tile, { left: tile.left, top: tile.top }]}
          />
        ) : null)}
      </View>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? 'انتخاب نقطه روی نقشه' : undefined}
        onPress={onPress ? handleMapPress : undefined}
        onLongPress={onLongPress ? handleMapPress : undefined}
        style={StyleSheet.absoluteFill}
      />
      {showsUserLocation && markers.length === 0 ? (
        <View pointerEvents="none" style={[styles.currentMarker, { left: width / 2 - 10, top: height / 2 - 10 }]}>
          <View style={styles.currentMarkerCore} />
        </View>
      ) : null}
      {markers.map((marker) => {
        const position = projectMarker(marker.coordinate.latitude, marker.coordinate.longitude);
        return (
          <View key={marker.id} pointerEvents="none" style={[styles.marker, { left: position.left - 8, top: position.top - 8 }]}>
            <View style={styles.markerCore} />
            {!!marker.title && <Text style={styles.markerLabel}>{marker.title}</Text>}
          </View>
        );
      })}
      <View pointerEvents="none" style={styles.attribution}>
        <Ionicons name="map-outline" size={12} color={theme.textSecondary} />
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </View>
    </View>
  );
});

export default AppMap;

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', backgroundColor: '#E5ECE7' },
  tile: { position: 'absolute', width: TILE_SIZE, height: TILE_SIZE },
  currentMarker: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(22,163,74,0.2)', alignItems: 'center', justifyContent: 'center' },
  currentMarkerCore: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: theme.primary },
  marker: { position: 'absolute', alignItems: 'center' },
  markerCore: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: theme.primary, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 },
  markerLabel: { marginTop: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: '#FFFFFF', fontFamily: AppFonts.medium, fontSize: 10, color: theme.text },
  attribution: { position: 'absolute', right: 4, bottom: 4, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.9)' },
  attributionText: { fontFamily: AppFonts.regular, fontSize: 9, color: theme.textSecondary },
});
