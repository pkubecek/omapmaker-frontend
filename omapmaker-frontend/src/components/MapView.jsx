import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { startCuzkDownload, getCuzkStatus, getDmrUrl, getDmpUrl } from '../api';

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
  // ČÚZK inline panel
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

export default function MapView({ bbox, onBboxChange, onCuzkComplete, onHelp }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const rectRef = useRef(null);
  const drawState = useRef({ drawing: false, start: null });
  const [tool, setTool] = useState('pan');

  // ČÚZK state
  const [dsmType, setDsmType] = useState('DMPOK');
  const [cuzkState, setCuzkState] = useState('idle'); // idle | downloading | done | error
  const [cuzkProgress, setCuzkProgress] = useState(0);
  const [cuzkMsg, setCuzkMsg] = useState('');

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

  // Draw bbox
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

  // Tool mouse handlers
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

    function onMouseDown(e) {
      startLatLng = e.latlng;
      if (rectRef.current) { rectRef.current.remove(); rectRef.current = null; }
      if (tempRect) { tempRect.remove(); tempRect = null; }
      drawState.current.drawing = true;
      // reset ČÚZK state při novém výběru
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

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      if (tempRect) tempRect.remove();
      container.style.cursor = '';
      map.dragging.enable();
    };
  }, [tool, onBboxChange]);

  const clearBbox = () => {
    if (rectRef.current) { rectRef.current.remove(); rectRef.current = null; }
    onBboxChange(null);
    setCuzkState('idle');
  };

  // ČÚZK stahování s pollingem
  const handleCuzkDownload = useCallback(async () => {
    if (!bbox || cuzkState === 'downloading') return;
    setCuzkState('downloading');
    setCuzkProgress(5);
    setCuzkMsg('Spouštím stahování...');

    let dlId = null;
    try {
      const { download_id } = await startCuzkDownload(bbox, dsmType);
      dlId = download_id;
    } catch (err) {
      setCuzkMsg(`Chyba: ${err.response?.data?.detail || err.message}`);
      setCuzkState('error');
      return;
    }

    // Polling každé 3 sekundy
    const poll = setInterval(async () => {
      try {
        const s = await getCuzkStatus(dlId);
        setCuzkProgress(s.progress || 0);
        setCuzkMsg(s.step || '');

        if (s.status === 'done') {
          clearInterval(poll);

          // Stáhni soubory jako Blob a vytvoř File objekty
          setCuzkMsg('Načítám soubory...');
          try {
            const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            const [dmrResp, dmpResp] = await Promise.all([
              fetch(`${BASE}/api/download/cuzk/${dlId}/dmr`),
              fetch(`${BASE}/api/download/cuzk/${dlId}/dmp`),
            ]);
            const dmrBlob = await dmrResp.blob();
            const dmpBlob = await dmpResp.blob();
            const dmrFile = new File([dmrBlob], 'DMR5G_merged.laz', { type: 'application/octet-stream' });
            const dmpFile = new File([dmpBlob], `${dsmType}_merged.laz`, { type: 'application/octet-stream' });

            setCuzkState('done');
            setCuzkProgress(100);
            setCuzkMsg('✓ Soubory načteny jako vstup');
            if (onCuzkComplete) onCuzkComplete(dmrFile, dmpFile);
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
  }, [bbox, dsmType, cuzkState, onCuzkComplete]);

  const bboxLabel = bbox
    ? `${fmtCoord(bbox.min_lat)}–${fmtCoord(bbox.max_lat)} N · ${fmtCoord(bbox.min_lon)}–${fmtCoord(bbox.max_lon)} E`
    : '';

  const kmLat = bbox ? ((bbox.max_lat - bbox.min_lat) * 111).toFixed(1) : null;
  const kmLon = bbox ? ((bbox.max_lon - bbox.min_lon) * 111 * Math.cos((bbox.min_lat + bbox.max_lat) / 2 * Math.PI / 180)).toFixed(1) : null;

  return (
    <div style={S.wrap}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <button
          style={{ ...S.toolBtn, ...(tool === 'pan' ? S.toolBtnActive : {}) }}
          onClick={() => setTool('pan')}
        >✋ Posun</button>
        <button
          style={{ ...S.toolBtn, ...(tool === 'select' ? S.toolBtnActive : {}) }}
          onClick={() => setTool('select')}
        >⬜ Výběr oblasti</button>
        <div style={S.divider} />
        {bbox && (
          <button style={S.toolBtn} onClick={clearBbox}>× Zrušit</button>
        )}
        {bboxLabel && (
          <span style={S.bboxInfo}>
            {bboxLabel}
            {kmLat && <span style={{ marginLeft: 6, color: 'var(--text-muted)' }}>~{kmLat}×{kmLon} km</span>}
          </span>
        )}
        <button
          style={{
            ...S.toolBtn,
            marginLeft: 'auto',
            borderRadius: '50%',
            width: 26, height: 26, padding: 0,
            fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'right',
            flexShrink: 0,
          }}
          onClick={onHelp}
          title="Nápověda — Jak na to?"
        >?</button>
      </div>

      {/* ČÚZK inline panel — zobrazí se po výběru oblasti */}
      {bbox && (
        <div style={S.cuzkPanel}>
          <span style={S.cuzkLabel}>Stáhnout z ČÚZK:</span>
          <select
            style={S.cuzkSelect}
            value={dsmType}
            onChange={(e) => setDsmType(e.target.value)}
            disabled={cuzkState === 'downloading'}
          >
            <option value="DMPOK">DMP OK (doporučeno)</option>
            <option value="DMP1G">DMP 1G</option>
          </select>

          {cuzkState === 'idle' && (
            <button style={S.cuzkBtn} onClick={handleCuzkDownload}>
              ↓ Stáhnout DMR + DMP
            </button>
          )}

          {cuzkState === 'downloading' && (
            <div style={S.cuzkProgress}>
              <div style={S.cuzkBarWrap}>
                <div style={{ ...S.cuzkBarFill, width: `${cuzkProgress}%` }} />
              </div>
              <span style={S.cuzkMsg}>{cuzkMsg}</span>
            </div>
          )}

          {cuzkState === 'done' && (
            <span style={{ ...S.cuzkMsg, color: 'var(--forest)' }}>✓ Staženo — soubory nastaveny jako vstup</span>
          )}

          {cuzkState === 'error' && (
            <>
              <span style={{ ...S.cuzkMsg, color: 'var(--rock)' }}>{cuzkMsg}</span>
              <button style={{ ...S.cuzkBtn, background: 'var(--text-secondary)' }} onClick={handleCuzkDownload}>
                Zkusit znovu
              </button>
            </>
          )}
        </div>
      )}

      {/* Mapa */}
      <div style={S.mapContainer}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {tool === 'select' && !bbox && (
          <div style={S.hint}>Táhněte myší pro výběr oblasti — pak stáhněte z ČÚZK nebo nahrajte vlastní data</div>
        )}
      </div>
    </div>
  );
}
