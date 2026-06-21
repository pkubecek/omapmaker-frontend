import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  startCuzkDownload, getCuzkStatus,
  startPolandDownload, getPolandStatus,
  startAustriaDownload, getAustriaStatus,
} from '../api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const S = {
  wrap: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 12px', background: 'var(--panel-bg)',
    borderBottom: '0.5px solid var(--panel-border)', flexShrink: 0, flexWrap: 'wrap',
  },
  toolBtn: {
    display: 'flex', alignItems: 'center', gap: 4, background: 'none',
    border: '0.5px solid var(--panel-border)', borderRadius: 'var(--radius-sm)',
    padding: '4px 10px', fontSize: 11, cursor: 'pointer',
    color: 'var(--text-secondary)', fontFamily: 'var(--sans)', transition: 'background 0.15s',
  },
  toolBtnActive: { background: '#f0ead6', color: 'var(--text-primary)', borderColor: '#d0c8b8' },
  divider: { width: '0.5px', height: 16, background: 'var(--panel-border)', margin: '0 2px', flexShrink: 0 },
  bboxInfo: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-secondary)' },
  mapContainer: { flex: 1, position: 'relative' },
  hint: {
    position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(26,31,46,0.82)', color: '#fff', fontFamily: 'var(--mono)',
    fontSize: 11, padding: '5px 14px', borderRadius: 20, pointerEvents: 'none',
    whiteSpace: 'nowrap', zIndex: 1000,
  },
  cuzkPanel: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 12px', background: '#f6f9f3',
    borderBottom: '0.5px solid #d0e0c0', flexShrink: 0, flexWrap: 'wrap',
  },
  cuzkLabel: { fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--mono)' },
  cuzkSelect: {
    fontFamily: 'var(--mono)', fontSize: 11, padding: '3px 6px',
    borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--panel-border)',
    background: '#fff', cursor: 'pointer',
  },
  cuzkBtn: {
    display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px',
    borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--rock)',
    color: '#fff', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  cuzkProgress: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 8,
  },
  cuzkBarWrap: {
    flex: 1, height: 4, background: '#e0ddd5', borderRadius: 2, overflow: 'hidden', minWidth: 60,
  },
  cuzkBarFill: { height: '100%', background: 'var(--forest)', borderRadius: 2, transition: 'width 0.4s' },
  cuzkMsg: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-secondary)', whiteSpace: 'nowrap' },
};

function fmtCoord(v) { return v.toFixed(4); }

// Dostupné zdroje dat
const DATA_SOURCES = [
  { key: 'cz', flag: '🇨🇿', label: 'ČÚZK',   sublabel: 'Česká republika', available: true  },
  { key: 'pl', flag: '🇵🇱', label: 'GUGiK',   sublabel: 'Polsko',          available: true  },
  { key: 'at', flag: '🇦🇹', label: 'BEV',     sublabel: 'Rakousko',        available: true  },
  { key: 'sk', flag: '🇸🇰', label: 'ÚGKK SR', sublabel: 'Slovensko',       available: false },
  { key: 'de', flag: '🇩🇪', label: 'BKG',     sublabel: 'Německo',         available: false },
];

function CountryDropdown({ country, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = DATA_SOURCES.find(s => s.key === country) || DATA_SOURCES[0];

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 8px',
          fontFamily: 'var(--mono)', fontSize: 11,
          background: open ? 'var(--ink)' : '#fff',
          color: open ? '#fff' : 'var(--text-primary)',
          border: '0.5px solid var(--panel-border)',
          borderRadius: 'var(--radius-sm)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: 16 }}>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{ opacity: 0.5, fontSize: 9 }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 2000,
          background: '#fff', border: '0.5px solid var(--panel-border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          minWidth: 180, marginTop: 4, overflow: 'hidden',
        }}>
          {DATA_SOURCES.map(src => (
            <button
              key={src.key}
              disabled={!src.available}
              onClick={() => { if (src.available) { onChange(src.key); setOpen(false); } }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '8px 12px', border: 'none', textAlign: 'left',
                background: src.key === country ? '#f0ead6' : 'transparent',
                cursor: src.available ? 'pointer' : 'default',
                opacity: src.available ? 1 : 0.5,
              }}
              onMouseEnter={e => { if (src.available) e.currentTarget.style.background = src.key === country ? '#e8e0cc' : '#fafaf8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = src.key === country ? '#f0ead6' : 'transparent'; }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{src.flag}</span>
              <div>
                <div style={{
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500,
                  color: src.available ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>
                  {src.label}
                  {!src.available && (
                    <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--text-muted)', fontWeight: 400 }}>
                      připravujeme
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                  {src.sublabel}
                </div>
              </div>
              {src.key === country && (
                <span style={{ marginLeft: 'auto', color: 'var(--forest)', fontSize: 12 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MapView({ bbox, onBboxChange, onCuzkComplete, onHelp, isMobile }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const rectRef = useRef(null);
  const drawState = useRef({ drawing: false, start: null });
  const [tool, setTool] = useState('pan');

  const [dsmType, setDsmType] = useState('DMPOK');
  const [cuzkState, setCuzkState] = useState('idle');
  const [cuzkProgress, setCuzkProgress] = useState(0);
  const [cuzkMsg, setCuzkMsg] = useState('');
  const [country, setCountry] = useState('cz');

  useEffect(() => {
    if (!bbox) setCountry('cz');
  }, [bbox]);

  // Init map
  useEffect(() => {
    if (leafletRef.current) return;
    const map = L.map(mapRef.current, { center: [49.8, 15.5], zoom: 7, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    leafletRef.current = map;
    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  // Draw bbox rectangle
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

  // Tool mouse/touch handlers
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;
    const container = map.getContainer();

    if (tool === 'pan') {
      map.dragging.enable();
      container.style.cursor = '';
      return;
    }

    map.dragging.disable();
    container.style.cursor = 'crosshair';

    let startLatLng = null;
    let tempRect = null;

    function touchToLatLng(touch) {
      const rect = container.getBoundingClientRect();
      const point = L.point(touch.clientX - rect.left, touch.clientY - rect.top);
      return map.containerPointToLatLng(point);
    }

    function onMouseDown(e) {
      startLatLng = e.latlng;
      if (rectRef.current) { rectRef.current.remove(); rectRef.current = null; }
      if (tempRect) { tempRect.remove(); tempRect = null; }
      drawState.current.drawing = true;
      setCuzkState('idle');
      setCuzkProgress(0);
      setCuzkMsg('');
    }
    function onMouseMove(e) {
      if (!drawState.current.drawing || !startLatLng) return;
      if (tempRect) tempRect.remove();
      tempRect = L.rectangle([startLatLng, e.latlng], {
        color: '#c96a3a', weight: 1.5, dashArray: '5 3', fillOpacity: 0.05,
      }).addTo(map);
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
      if (b.max_lat - b.min_lat < 0.001 || b.max_lon - b.min_lon < 0.001) { startLatLng = null; return; }
      rectRef.current = L.rectangle(
        [[b.min_lat, b.min_lon], [b.max_lat, b.max_lon]],
        { color: '#c96a3a', weight: 2, dashArray: '6 4', fillOpacity: 0.07 }
      ).addTo(map);
      onBboxChange(b);
      startLatLng = null;
    }

    function onTouchStart(e) {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const latlng = touchToLatLng(e.touches[0]);
      if (rectRef.current) { rectRef.current.remove(); rectRef.current = null; }
      if (tempRect) { tempRect.remove(); tempRect = null; }
      startLatLng = latlng;
      drawState.current.drawing = true;
      setCuzkState('idle');
    }
    function onTouchMove(e) {
      if (!drawState.current.drawing || !startLatLng || e.touches.length !== 1) return;
      e.preventDefault();
      const latlng = touchToLatLng(e.touches[0]);
      if (tempRect) tempRect.remove();
      tempRect = L.rectangle([startLatLng, latlng], {
        color: '#c96a3a', weight: 1.5, dashArray: '5 3', fillOpacity: 0.05,
      }).addTo(map);
    }
    function onTouchEnd(e) {
      if (!drawState.current.drawing || !startLatLng) return;
      e.preventDefault();
      drawState.current.drawing = false;
      if (tempRect) { tempRect.remove(); tempRect = null; }
      const lastTouch = e.changedTouches[0];
      const endLatlng = touchToLatLng(lastTouch);
      const b = {
        min_lat: Math.min(startLatLng.lat, endLatlng.lat),
        max_lat: Math.max(startLatLng.lat, endLatlng.lat),
        min_lon: Math.min(startLatLng.lng, endLatlng.lng),
        max_lon: Math.max(startLatLng.lng, endLatlng.lng),
      };
      if (b.max_lat - b.min_lat < 0.001 || b.max_lon - b.min_lon < 0.001) { startLatLng = null; return; }
      rectRef.current = L.rectangle(
        [[b.min_lat, b.min_lon], [b.max_lat, b.max_lon]],
        { color: '#c96a3a', weight: 2, dashArray: '6 4', fillOpacity: 0.07 }
      ).addTo(map);
      onBboxChange(b);
      startLatLng = null;
    }

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      map.dragging.enable();
      container.style.cursor = '';
      if (tempRect) tempRect.remove();
    };
  }, [tool, onBboxChange]);

  const clearBbox = () => {
    if (rectRef.current) { rectRef.current.remove(); rectRef.current = null; }
    onBboxChange(null);
    setCuzkState('idle');
  };

  // -------------------------------------------------------------------------
  // Generic polling helper
  // -------------------------------------------------------------------------
  const _pollDownload = useCallback((dlId, statusFn, dmrEndpoint, dmpEndpoint, dmrFilename, dmpFilename, crsDefault) => {
    const poll = setInterval(async () => {
      try {
        const s = await statusFn(dlId);
        setCuzkProgress(s.progress || 0);
        setCuzkMsg(s.step || '');

        if (s.status === 'done') {
          clearInterval(poll);
          setCuzkMsg('Načítám soubory...');
          try {
            const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            const dmrResp = await fetch(`${BASE}${dmrEndpoint}`);
            const dmrBlob = await dmrResp.blob();
            const dmrFile = new File([dmrBlob], dmrFilename, { type: 'application/octet-stream' });

            let dmpFile = null;
            if (s.dmp_path) {
              const dmpResp = await fetch(`${BASE}${dmpEndpoint}`);
              if (dmpResp.ok) {
                const dmpBlob = await dmpResp.blob();
                dmpFile = new File([dmpBlob], dmpFilename, { type: 'application/octet-stream' });
              }
            }

            setCuzkState('done');
            setCuzkProgress(100);
            setCuzkMsg('✓ Soubory načteny jako vstup');
            if (onCuzkComplete) onCuzkComplete(dmrFile, dmpFile, s.crs || crsDefault);
          } catch (fetchErr) {
            setCuzkMsg(`Chyba načítání souborů: ${fetchErr.message}`);
            setCuzkState('error');
          }
        } else if (s.status === 'error') {
          clearInterval(poll);
          setCuzkMsg(`Chyba: ${s.error || s.step}`);
          setCuzkState('error');
        }
      } catch (pollErr) {
        clearInterval(poll);
        setCuzkMsg(`Chyba připojení: ${pollErr.message}`);
        setCuzkState('error');
      }
    }, 3000);
  }, [onCuzkComplete]);

  // -------------------------------------------------------------------------
  // ČÚZK (CZ)
  // -------------------------------------------------------------------------
  const handleCuzkDownload = useCallback(async () => {
    if (!bbox || cuzkState === 'downloading') return;
    setCuzkState('downloading');
    setCuzkProgress(5);
    setCuzkMsg('Spouštím stahování...');
    try {
      const { download_id } = await startCuzkDownload(bbox, dsmType);
      _pollDownload(
        download_id, getCuzkStatus,
        `/api/download/cuzk/${download_id}/dmr`,
        `/api/download/cuzk/${download_id}/dmp`,
        'DMR5G_merged.laz', `${dsmType}_merged.laz`,
        'EPSG:5514',
      );
    } catch (err) {
      setCuzkMsg(`Chyba: ${err.response?.data?.detail || err.message}`);
      setCuzkState('error');
    }
  }, [bbox, dsmType, cuzkState, _pollDownload]);

  // -------------------------------------------------------------------------
  // GUGiK (PL)
  // -------------------------------------------------------------------------
  const handlePolandDownload = useCallback(async () => {
    if (!bbox || cuzkState === 'downloading') return;
    setCuzkState('downloading');
    setCuzkProgress(5);
    setCuzkMsg('Spouštím stahování z GUGiK...');
    try {
      const { download_id } = await startPolandDownload(bbox, true);
      _pollDownload(
        download_id, getPolandStatus,
        `/api/download/poland/${download_id}/dmr`,
        `/api/download/poland/${download_id}/dmp`,
        'PL_LiDAR_DTM_merged.laz', 'PL_NMPT_merged.laz',
        'EPSG:2180',
      );
    } catch (err) {
      setCuzkMsg(`Chyba: ${err.response?.data?.detail || err.message}`);
      setCuzkState('error');
    }
  }, [bbox, cuzkState, _pollDownload]);

  // -------------------------------------------------------------------------
  // BEV (AT)
  // -------------------------------------------------------------------------
  const handleAustriaDownload = useCallback(async () => {
    if (!bbox || cuzkState === 'downloading') return;
    setCuzkState('downloading');
    setCuzkProgress(5);
    setCuzkMsg('Spouštím stahování z BEV...');
    try {
      const { download_id } = await startAustriaDownload(bbox);
      _pollDownload(
        download_id, getAustriaStatus,
        `/api/download/austria/${download_id}/dmr`,
        `/api/download/austria/${download_id}/dmp`,
        'AT_BEV_DTM_merged.tif', 'AT_BEV_DSM_merged.tif',
        'EPSG:3035',
      );
    } catch (err) {
      setCuzkMsg(`Chyba: ${err.response?.data?.detail || err.message}`);
      setCuzkState('error');
    }
  }, [bbox, cuzkState, _pollDownload]);

  const handleDownload = country === 'cz' ? handleCuzkDownload
    : country === 'pl' ? handlePolandDownload
    : handleAustriaDownload;

  const bboxLabel = bbox
    ? `${fmtCoord(bbox.min_lat)}–${fmtCoord(bbox.max_lat)} N · ${fmtCoord(bbox.min_lon)}–${fmtCoord(bbox.max_lon)} E`
    : '';
  const kmLat = bbox ? ((bbox.max_lat - bbox.min_lat) * 111).toFixed(1) : null;
  const kmLon = bbox
    ? ((bbox.max_lon - bbox.min_lon) * 111 * Math.cos((bbox.min_lat + bbox.max_lat) / 2 * Math.PI / 180)).toFixed(1)
    : null;

  return (
    <div style={S.wrap}>
      {/* Toolbar */}
      <div style={{
        ...S.toolbar,
        padding: isMobile ? '6px 8px' : '8px 12px',
        gap: isMobile ? 4 : 6,
      }}>
        <button
          style={{ ...S.toolBtn, ...(tool === 'pan' ? S.toolBtnActive : {}) }}
          onClick={() => setTool('pan')}
        >
          ✋ Pohyb
        </button>
        <button
          style={{ ...S.toolBtn, ...(tool === 'select' ? S.toolBtnActive : {}) }}
          onClick={() => setTool('select')}
        >
          ⬚ Výběr oblasti
        </button>

        {bbox && (
          <>
            <div style={S.divider} />
            <span style={S.bboxInfo}>
              {isMobile ? `${kmLat}×${kmLon} km` : `${bboxLabel} · ${kmLat}×${kmLon} km`}
            </span>
            <button style={{ ...S.toolBtn, fontSize: 10 }} onClick={clearBbox}>✕ Zrušit výběr</button>
          </>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <button style={S.toolBtn} onClick={onHelp}>?</button>
        </div>
      </div>

      {/* Download panel */}
      {bbox && (
        <div style={{
          ...S.cuzkPanel,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 6 : 8,
          padding: isMobile ? '8px 12px' : '6px 12px',
        }}>
          {isMobile && bboxLabel && (
            <span style={{ ...S.cuzkLabel, fontSize: 9 }}>{bboxLabel}</span>
          )}

          <CountryDropdown
            country={country}
            disabled={cuzkState === 'downloading'}
            onChange={(c) => { setCountry(c); setCuzkState('idle'); }}
          />

          <div style={{ width: '0.5px', height: 16, background: 'var(--panel-border)', flexShrink: 0 }} />

          {/* CZ: DSM typ */}
          {country === 'cz' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={S.cuzkLabel}>DSM:</span>
              <select
                style={S.cuzkSelect}
                value={dsmType}
                onChange={(e) => setDsmType(e.target.value)}
                disabled={cuzkState === 'downloading'}
              >
                <option value="DMPOK">DMP OK (doporučeno)</option>
                <option value="DMP1G">DMP 1G</option>
              </select>
            </div>
          )}

          {/* PL: info */}
          {country === 'pl' && (
            <span style={{ ...S.cuzkLabel, fontStyle: 'italic' }}>LiDAR · EPSG:2180</span>
          )}

          {/* AT: info */}
          {country === 'at' && (
            <span style={{ ...S.cuzkLabel, fontStyle: 'italic' }}>GeoTIFF 1m · EPSG:3035</span>
          )}

          {/* Tlačítko */}
          {cuzkState === 'idle' && (
            <button style={{
              ...S.cuzkBtn,
              width: isMobile ? '100%' : 'auto',
              padding: isMobile ? '8px 12px' : '5px 12px',
            }} onClick={handleDownload}>
              ↓ Stáhnout DMR + DMP
            </button>
          )}

          {cuzkState === 'downloading' && (
            <div style={S.cuzkProgress}>
              <div style={S.cuzkBarWrap}>
                <div style={{ ...S.cuzkBarFill, width: `${cuzkProgress}%` }} />
              </div>
              <span style={{ ...S.cuzkMsg, whiteSpace: isMobile ? 'normal' : 'nowrap' }}>{cuzkMsg}</span>
            </div>
          )}

          {cuzkState === 'done' && (
            <span style={{ ...S.cuzkMsg, color: 'var(--forest)' }}>✓ Staženo</span>
          )}

          {cuzkState === 'error' && (
            <>
              <span style={{ ...S.cuzkMsg, color: 'var(--rock)' }}>{cuzkMsg}</span>
              <button style={{ ...S.cuzkBtn, background: 'var(--text-secondary)' }}
                onClick={handleDownload}>
                Zkusit znovu
              </button>
            </>
          )}
        </div>
      )}

      {/* Mapa */}
      <div style={S.mapContainer}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {tool === 'pan' && !bbox && (
          <div style={S.hint}>Vyberte oblast – nástroj Výběr oblasti</div>
        )}
        {tool === 'select' && !bbox && (
          <div style={S.hint}>Táhněte myší pro výběr oblasti — pak stáhněte data a ta se sama nahrají jako vstupní</div>
        )}
      </div>
    </div>
  );
}