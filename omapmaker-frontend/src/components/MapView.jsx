import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const S = {
  wrap: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    background: 'var(--panel-bg)',
    borderBottom: '0.5px solid var(--panel-border)',
    flexShrink: 0,
  },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: '0.5px solid var(--panel-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '4px 10px',
    fontSize: 11,
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--sans)',
    transition: 'background 0.15s',
  },
  toolBtnActive: {
    background: '#f0ead6',
    color: 'var(--text-primary)',
    borderColor: '#d0c8b8',
  },
  divider: {
    width: '0.5px',
    height: 16,
    background: 'var(--panel-border)',
    margin: '0 2px',
    flexShrink: 0,
  },
  bboxInfo: {
    marginLeft: 'auto',
    fontFamily: 'var(--mono)',
    fontSize: 10,
    color: 'var(--text-secondary)',
  },
  mapContainer: { flex: 1, position: 'relative' },
  hint: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(26,31,46,0.82)',
    color: '#fff',
    fontFamily: 'var(--mono)',
    fontSize: 11,
    padding: '5px 14px',
    borderRadius: 20,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 1000,
  },
};

function fmtCoord(v) { return v.toFixed(4); }

export default function MapView({ bbox, onBboxChange }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const rectRef = useRef(null);
  const [tool, setTool] = useState('pan'); // 'pan' | 'select'
  const drawState = useRef({ drawing: false, start: null });

  // Init map
  useEffect(() => {
    if (leafletRef.current) return;
    const map = L.map(mapRef.current, {
      center: [49.8, 15.5],
      zoom: 7,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    leafletRef.current = map;
    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  // Draw existing bbox on mount / when it changes externally
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;
    if (rectRef.current) { rectRef.current.remove(); rectRef.current = null; }
    if (bbox) {
      rectRef.current = L.rectangle(
        [[bbox.min_lat, bbox.min_lon], [bbox.max_lat, bbox.max_lon]],
        { color: '#c96a3a', weight: 2, dashArray: '6 4', fillColor: '#c96a3a', fillOpacity: 0.07 }
      ).addTo(map);
    }
  }, [bbox]);

  // Tool switching — attach / detach mouse handlers
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;
    const container = map.getContainer();

    if (tool === 'pan') {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      container.style.cursor = '';
      map.off('mousedown', onMouseDown);
      return;
    }

    // Select mode
    map.dragging.disable();
    map.scrollWheelZoom.enable();
    container.style.cursor = 'crosshair';

    let startLatLng = null;
    let tempRect = null;

    function onMouseDown(e) {
      startLatLng = e.latlng;
      if (rectRef.current) { rectRef.current.remove(); rectRef.current = null; }
      if (tempRect) { tempRect.remove(); tempRect = null; }
      drawState.current.drawing = true;
    }

    function onMouseMove(e) {
      if (!drawState.current.drawing || !startLatLng) return;
      if (tempRect) tempRect.remove();
      tempRect = L.rectangle(
        [startLatLng, e.latlng],
        { color: '#c96a3a', weight: 1.5, dashArray: '5 3', fillColor: '#c96a3a', fillOpacity: 0.05 }
      ).addTo(map);
    }

    function onMouseUp(e) {
      if (!drawState.current.drawing || !startLatLng) return;
      drawState.current.drawing = false;
      if (tempRect) { tempRect.remove(); tempRect = null; }

      const b = {
        min_lat: Math.min(startLatLng.lat, e.latlng.lat),
        max_lat: Math.max(startLatLng.lat, e.latlng.lat),
        min_lon: Math.min(startLatLng.lng, e.latlng.lng),
        max_lon: Math.max(startLatLng.lng, e.latlng.lng),
      };
      const latSpan = b.max_lat - b.min_lat;
      const lonSpan = b.max_lon - b.min_lon;
      if (latSpan < 0.001 || lonSpan < 0.001) return; // too small

      rectRef.current = L.rectangle(
        [[b.min_lat, b.min_lon], [b.max_lat, b.max_lon]],
        { color: '#c96a3a', weight: 2, dashArray: '6 4', fillColor: '#c96a3a', fillOpacity: 0.07 }
      ).addTo(map);

      onBboxChange(b);
      startLatLng = null;
    }

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);

    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      if (tempRect) tempRect.remove();
      container.style.cursor = '';
    };
  }, [tool, onBboxChange]);

  const clearBbox = () => {
    if (rectRef.current) { rectRef.current.remove(); rectRef.current = null; }
    onBboxChange(null);
  };

  const bboxLabel = bbox
    ? `${fmtCoord(bbox.min_lat)}–${fmtCoord(bbox.max_lat)} N · ${fmtCoord(bbox.min_lon)}–${fmtCoord(bbox.max_lon)} E`
    : '';

  return (
    <div style={S.wrap}>
      <div style={S.toolbar}>
        <button
          style={{ ...S.toolBtn, ...(tool === 'pan' ? S.toolBtnActive : {}) }}
          onClick={() => setTool('pan')}
          onMouseEnter={(e) => { if (tool !== 'pan') e.currentTarget.style.background = '#f5f4f0'; }}
          onMouseLeave={(e) => { if (tool !== 'pan') e.currentTarget.style.background = 'none'; }}
        >
          ✋ Posun
        </button>
        <button
          style={{ ...S.toolBtn, ...(tool === 'select' ? S.toolBtnActive : {}) }}
          onClick={() => setTool('select')}
          onMouseEnter={(e) => { if (tool !== 'select') e.currentTarget.style.background = '#f5f4f0'; }}
          onMouseLeave={(e) => { if (tool !== 'select') e.currentTarget.style.background = 'none'; }}
        >
          ⬜ Výběr oblasti
        </button>
        <div style={S.divider} />
        {bbox && (
          <button
            style={S.toolBtn}
            onClick={clearBbox}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f4f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            × Zrušit výběr
          </button>
        )}
        {bboxLabel && <span style={S.bboxInfo}>{bboxLabel}</span>}
      </div>

      <div style={S.mapContainer}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {tool === 'select' && !bbox && (
          <div style={S.hint}>Táhněte myší pro výběr oblasti zpracování</div>
        )}
      </div>
    </div>
  );
}
