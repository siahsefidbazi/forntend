import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map.web.css';

import type { AppMapHandle, AppMapProps, MapRegion } from './types';

function zoomFor(region: MapRegion) {
  return Math.max(2, Math.min(19, Math.log2(360 / Math.max(region.longitudeDelta, 0.0001))));
}

const AppMap = forwardRef<AppMapHandle, AppMapProps>(function AppMap(props, ref) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const markerLayer = useRef<Leaflet.LayerGroup | null>(null);
  const tileLayer = useRef<Leaflet.TileLayer | null>(null);
  const callbacks = useRef(props);
  const [initialRegion] = useState(() => props.region ?? props.initialRegion);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tilesLoading, setTilesLoading] = useState(true);
  const [tileError, setTileError] = useState(false);

  useEffect(() => { callbacks.current = props; });

  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    void import('leaflet').then((L) => {
      if (disposed || !container.current) return;
      leaflet.current = L;
      const instance = L.map(container.current, {
        center: [initialRegion.latitude, initialRegion.longitude],
        zoom: zoomFor(initialRegion), minZoom: 2, maxZoom: 19,
        dragging: true, touchZoom: true, scrollWheelZoom: true,
        doubleClickZoom: true, keyboard: true, zoomControl: false,
      });
      map.current = instance;
      L.control.zoom({ position: 'topright', zoomInTitle: 'بزرگ‌نمایی', zoomOutTitle: 'کوچک‌نمایی' }).addTo(instance);
      L.control.scale({ position: 'bottomleft', imperial: false }).addTo(instance);
      const tiles = L.tileLayer(callbacks.current.tileUrlTemplate ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      });
      tileLayer.current = tiles;
      let loadedTiles = 0;
      tiles.on('loading', () => setTilesLoading(true));
      tiles.on('load', () => setTilesLoading(false));
      tiles.on('tileload', () => { loadedTiles++; setTileError(false); });
      tiles.on('tileerror', () => { if (!loadedTiles) setTileError(true); });
      tiles.addTo(instance);
      markerLayer.current = L.layerGroup().addTo(instance);
      instance.on('movestart', () => callbacks.current.onMoveStart?.());
      instance.on('moveend', () => {
        const center = instance.getCenter();
        const bounds = instance.getBounds();
        callbacks.current.onRegionChangeComplete?.({ latitude: center.lat, longitude: center.lng,
          latitudeDelta: bounds.getNorth() - bounds.getSouth(), longitudeDelta: bounds.getEast() - bounds.getWest() });
      });
      instance.on('click', (event: Leaflet.LeafletMouseEvent) => callbacks.current.onPress?.({ latitude: event.latlng.lat, longitude: event.latlng.lng }));
      instance.on('contextmenu', (event: Leaflet.LeafletMouseEvent) => callbacks.current.onLongPress?.({ latitude: event.latlng.lat, longitude: event.latlng.lng }));
      observer = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
      observer.observe(container.current);
      instance.whenReady(() => { setReady(true); callbacks.current.onMapReady?.(); });
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; observer?.disconnect(); map.current?.remove(); map.current = null; };
  }, [initialRegion]);

  useEffect(() => {
    if (ready && props.region) map.current?.setView([props.region.latitude, props.region.longitude], zoomFor(props.region));
  }, [props.region, ready]);

  useEffect(() => {
    const L = leaflet.current;
    const layer = markerLayer.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    for (const marker of props.markers ?? []) {
      const icon = L.divIcon({ className: 'hammasir-map-pin',
        html: '<span class="hammasir-map-pin-dot"></span>', iconSize: [28, 36], iconAnchor: [14, 36] });
      const item = L.marker([marker.coordinate.latitude, marker.coordinate.longitude], { icon }).addTo(layer);
      if (marker.title) {
        const label = document.createElement('span');
        label.textContent = marker.title;
        item.bindTooltip(label, { direction: 'top', offset: [0, -30] });
      }
    }
  }, [props.markers, ready]);

  useImperativeHandle(ref, () => ({ animateToRegion: (target, duration = 350) => {
    map.current?.setView([target.latitude, target.longitude], zoomFor(target), { animate: duration > 0, duration: duration / 1000 });
  } }), []);

  return <View style={[styles.container, props.style]}>
    <div ref={container} aria-label="نقشه تعاملی؛ با کشیدن جابه‌جا شوید و با اسکرول زوم کنید" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
    {tilesLoading && !tileError ? <View pointerEvents="none" style={styles.loading}><ActivityIndicator color="#16834a" accessibilityLabel="بارگذاری جزئیات نقشه" /></View> : null}
    {tileError ? <Pressable accessibilityRole="button" onPress={() => { setTileError(false); tileLayer.current?.redraw(); }} style={styles.notice}><Text style={styles.noticeText}>نقشه بارگیری نشد؛ برای تلاش دوباره لمس کنید</Text></Pressable> : null}
    {failed ? <div role="alert" style={{ padding: 20, direction: 'rtl' }}>بارگذاری نقشه انجام نشد. اتصال اینترنت را بررسی و صفحه را دوباره باز کنید.</div> : null}
  </View>;
});

export default AppMap;
const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', backgroundColor: '#E5ECE7' },
  loading: { position: 'absolute', top: '50%', left: 16, padding: 10, backgroundColor: 'white', borderRadius: 20 },
  notice: { position: 'absolute', bottom: 85, left: 16, right: 16, padding: 12, backgroundColor: 'white', borderRadius: 16 },
  noticeText: { fontSize: 12, color: '#9a3412', textAlign: 'right' },
});
