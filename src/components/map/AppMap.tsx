import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import MapView, { Marker, UrlTile } from 'react-native-maps';

import type { AppMapHandle, AppMapProps } from './types';

const AppMap = forwardRef<AppMapHandle, AppMapProps>(function AppMap(
  {
    style, initialRegion, region, markers = [], showsUserLocation,
    showsMyLocationButton, loadingEnabled, loadingBackgroundColor,
    loadingIndicatorColor, tileUrlTemplate, onMapReady, onPress, onLongPress,
    onMoveStart, onRegionChangeComplete,
  },
  ref,
) {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (target, duration = 350) => {
        mapRef.current?.animateToRegion(target, duration);
      },
    }),
    [],
  );

  return (
    <MapView
      ref={mapRef}
      style={style}
      initialRegion={initialRegion}
      region={region}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      loadingEnabled={loadingEnabled}
      loadingBackgroundColor={loadingBackgroundColor}
      loadingIndicatorColor={loadingIndicatorColor}
      onMapReady={onMapReady}
      scrollEnabled
      zoomEnabled
      onRegionChange={() => onMoveStart?.()}
      onRegionChangeComplete={onRegionChangeComplete}
      onPress={onPress ? (e) => onPress(e.nativeEvent.coordinate) : undefined}
      onLongPress={onLongPress ? (e) => onLongPress(e.nativeEvent.coordinate) : undefined}
    >
      {tileUrlTemplate ? <UrlTile urlTemplate={tileUrlTemplate} maximumZ={19} /> : null}
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={m.coordinate}
          title={m.title}
          description={m.description}
          anchor={m.anchor}
        >
          {m.content}
        </Marker>
      ))}
    </MapView>
  );
});

export default AppMap;
