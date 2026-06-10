import React, { useRef } from 'react';

const S = {
  panel: {
    width: 268,
    flexShrink: 0,
    background: 'var(--panel-bg)',
    borderRight: '0.5px solid var(--panel-border)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  section: {
    padding: '14px 16px',
    borderBottom: '0.5px solid var(--panel-border)',
  },
  label: {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    marginBottom: 10,
  },
  dropZone: {
    border: '1px dashed var(--panel-border)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 12px',
    textAlign: 'center',
    cursor: 'pointer',
    background: '#fafaf8',
    transition: 'border-color 0.15s',
    marginBottom: 6,
  },
  dropIcon: { fontSize: 20, color: 'var(--text-muted)', marginBottom: 5 },
  dropText: { fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 },
  dropExt: {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    color: 'var(--text-muted)',
    marginTop: 3,
  },
  fileLoaded: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 'var(--radius-md)',
    background: '#f6f9f3',
    border: '0.5px solid #d0e0c0',
    marginBottom: 6,
  },
  fileLoadedDsm: {
    background: '#f3f8fb',
    border: '0.5px solid #b8d4e4',
  },
  fileName: {
    flex: 1,
    fontFamily: 'var(--mono)',
    fontSize: 11,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileSize: { fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    padding: '0 2px',
    flexShrink: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingLabel: { fontSize: 12, color: 'var(--text-secondary)' },
  select: {
    fontFamily: 'var(--mono)',
    fontSize: 11,
    padding: '3px 6px',
    borderRadius: 'var(--radius-sm)',
    border: '0.5px solid var(--panel-border)',
    background: '#fafaf8',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  numInput: {
    fontFamily: 'var(--mono)',
    fontSize: 11,
    padding: '3px 6px',
    borderRadius: 'var(--radius-sm)',
    border: '0.5px solid var(--panel-border)',
    background: '#fafaf8',
    width: 64,
    textAlign: 'right',
    color: 'var(--text-primary)',
  },
  layerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 0',
    cursor: 'pointer',
  },
  layerDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    flexShrink: 0,
  },
  layerName: { fontSize: 12, flex: 1 },
  toggle: {
    width: 30,
    height: 17,
    borderRadius: 9,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  toggleKnob: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: '50%',
    background: '#fff',
    top: 3,
    transition: 'left 0.2s',
  },
  optionalListbox: {
    border: '0.5px solid var(--panel-border)',
    borderRadius: 'var(--radius-md)',
    minHeight: 52,
    padding: 6,
    marginBottom: 6,
    background: '#fafaf8',
  },
  optionalItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 4px',
    borderRadius: 4,
  },
  optionalItemName: {
    flex: 1,
    fontFamily: 'var(--mono)',
    fontSize: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'var(--text-secondary)',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    width: '100%',
    padding: '6px 0',
    borderRadius: 'var(--radius-sm)',
    border: '0.5px solid var(--panel-border)',
    background: 'none',
    fontSize: 11,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--mono)',
    marginBottom: 4,
    transition: 'background 0.15s',
  },
};

const CRS_OPTIONS = [
  { label: 'S-JTSK (ČR) EPSG:5514', value: 'EPSG:5514' },
  { label: 'UTM 33N EPSG:32633', value: 'EPSG:32633' },
  { label: 'UTM 32N EPSG:32632', value: 'EPSG:32632' },
  { label: 'UTM 34N EPSG:32634', value: 'EPSG:32634' },
  { label: 'S-JTSK/03 EPSG:2065', value: 'EPSG:2065' },
];

const PAPER_OPTIONS = ['A4 na šířku', 'A4 na výšku', 'A3 na šířku', 'A3 na výšku', 'Extent dat'];

const LAYERS = [
  { key: 'contours', label: 'Vrstevnice a terén', color: '#c96a3a' },
  { key: 'rocks', label: 'Skály a balvany', color: '#888' },
  { key: 'water', label: 'Voda a bažiny', color: '#5a9ab5' },
  { key: 'vegetation', label: 'Vegetace', color: '#4a6a38' },
  { key: 'roads', label: 'Cesty a silnice', color: '#d4a340' },
  { key: 'buildings', label: 'Budovy', color: '#c06060' },
  { key: 'man_made', label: 'Umělé prvky', color: '#8060b0' },
  { key: 'magnetic_lines', label: 'Mag. sever', color: '#5a9ab5' },
];

function FileDropZone({ id, label, icon, accept, file, onFile, onRemove, colorStyle }) {
  const ref = useRef();
  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };
  const handleChange = (e) => {
    const f = e.target.files[0];
    if (f) onFile(f);
  };
  const formatSize = (b) => b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : (b / 1e3).toFixed(0) + ' KB';

  if (file) {
    return (
      <div style={{ ...S.fileLoaded, ...(colorStyle || {}) }}>
        <span style={{ fontSize: 15, color: colorStyle ? 'var(--water)' : 'var(--forest)' }}>◈</span>
        <span style={S.fileName}>{file.name}</span>
        <span style={S.fileSize}>{formatSize(file.size)}</span>
        <button style={S.removeBtn} onClick={onRemove} title="Odebrat soubor">×</button>
      </div>
    );
  }

  return (
    <div
      style={S.dropZone}
      onClick={() => ref.current.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--rock)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--panel-border)'}
    >
      <div style={S.dropIcon}>{icon}</div>
      <p style={S.dropText}>{label}</p>
      <div style={S.dropExt}>{accept}</div>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={handleChange} />
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      style={{ ...S.toggle, background: on ? 'var(--forest-mid)' : 'var(--panel-border)' }}
      onClick={onChange}
      aria-checked={on}
      role="switch"
    >
      <div style={{ ...S.toggleKnob, left: on ? 16 : 3 }} />
    </button>
  );
}

export default function SettingsPanel({ settings, onSettings, files, onFiles }) {
  const zabRef = useRef();
  const isomRef = useRef();

  const set = (key, val) => onSettings({ ...settings, [key]: val });
  const toggleLayer = (key) =>
    onSettings({ ...settings, layers: { ...settings.layers, [key]: !settings.layers[key] } });

  const addFiles = (type, newFiles) => {
    onFiles({ ...files, [type]: [...(files[type] || []), ...Array.from(newFiles)] });
  };
  const removeOptional = (type, idx) => {
    const arr = [...files[type]];
    arr.splice(idx, 1);
    onFiles({ ...files, [type]: arr });
  };

  return (
    <div style={S.panel}>
      {/* LiDAR */}
      <div style={S.section}>
        <div style={S.label}>LiDAR data</div>
        <FileDropZone
          label="Přetáhni nebo klikni pro DTM"
          icon="▲"
          accept=".las,.laz"
          file={files.dtm}
          onFile={(f) => onFiles({ ...files, dtm: f })}
          onRemove={() => onFiles({ ...files, dtm: null })}
        />
        <FileDropZone
          label="Přetáhni nebo klikni pro DSM"
          icon="◆"
          accept=".las,.laz,.tif,.tiff"
          file={files.dsm}
          onFile={(f) => onFiles({ ...files, dsm: f })}
          onRemove={() => onFiles({ ...files, dsm: null })}
          colorStyle={S.fileLoadedDsm}
        />
      </div>

      {/* Mapa */}
      <div style={S.section}>
        <div style={S.label}>Nastavení mapy</div>
        <div style={S.row}>
          <span style={S.settingLabel}>Sour. systém</span>
          <select style={S.select} value={settings.crs} onChange={(e) => set('crs', e.target.value)}>
            {CRS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={S.row}>
          <span style={S.settingLabel}>Měřítko</span>
          <select style={S.select} value={settings.scale} onChange={(e) => set('scale', e.target.value)}>
            <option value="10000">1 : 10 000</option>
            <option value="15000">1 : 15 000</option>
          </select>
        </div>
        <div style={S.row}>
          <span style={S.settingLabel}>Formát papíru</span>
          <select style={S.select} value={settings.paper} onChange={(e) => set('paper', e.target.value)}>
            {PAPER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={S.row}>
          <span style={S.settingLabel}>Vyhlazení σ</span>
          <input style={S.numInput} type="number" step="0.5" min="0" max="20"
            value={settings.sigma} onChange={(e) => set('sigma', e.target.value)} />
        </div>
        <div style={S.row}>
          <span style={S.settingLabel}>Práh skály (°)</span>
          <input style={S.numInput} type="number" step="1" min="20" max="80"
            value={settings.slopeThreshold} onChange={(e) => set('slopeThreshold', e.target.value)} />
        </div>
        <div style={S.row}>
          <span style={S.settingLabel}>Mag. deklinace (°)</span>
          <input style={S.numInput} type="number" step="0.1"
            value={settings.northRotation} onChange={(e) => set('northRotation', e.target.value)} />
        </div>
      </div>

      {/* Vegetace */}
      <div style={S.section}>
        <div style={S.label}>Výšky vegetace (m)</div>
        {[
          ['Otevřený prostor (do)', 'bin1'],
          ['Boj (do)', 'bin2'],
          ['Chůze (do)', 'bin3'],
          ['Pomalý běh (do)', 'bin4'],
        ].map(([lbl, key]) => (
          <div style={S.row} key={key}>
            <span style={S.settingLabel}>{lbl}</span>
            <input style={S.numInput} type="number" step="0.5" min="0" max="30"
              value={settings[key]} onChange={(e) => set(key, e.target.value)} />
          </div>
        ))}
      </div>

      {/* Vrstvy */}
      <div style={S.section}>
        <div style={S.label}>Vrstvy</div>
        {LAYERS.map((l) => (
          <div style={S.layerRow} key={l.key} onClick={() => toggleLayer(l.key)}>
            <div style={{ ...S.layerDot, background: l.color }} />
            <span style={S.layerName}>{l.label}</span>
            <Toggle on={settings.layers[l.key]} onChange={() => toggleLayer(l.key)} />
          </div>
        ))}
      </div>

      {/* Volitelná data */}
      <div style={{ ...S.section, flex: 1 }}>
        <div style={S.label}>Volitelná vektorová data</div>

        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
          ZABAGED® (.shp)
        </div>
        <div style={S.optionalListbox}>
          {(files.zabaged || []).map((f, i) => (
            <div style={S.optionalItem} key={i}>
              <span style={S.optionalItemName}>{f.name}</span>
              <button style={S.removeBtn} onClick={() => removeOptional('zabaged', i)}>×</button>
            </div>
          ))}
          {!(files.zabaged || []).length && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 4px' }}>
              Žádné soubory
            </div>
          )}
        </div>
        <button style={S.addBtn}
          onClick={() => zabRef.current.click()}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f4f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          + Přidat ZABAGED® soubory
        </button>
        <input ref={zabRef} type="file" accept=".shp" multiple style={{ display: 'none' }}
          onChange={(e) => addFiles('zabaged', e.target.files)} />

        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, marginTop: 8 }}>
          Vlastní ISOM vrstvy (.shp — název = kód ISOM)
        </div>
        <div style={S.optionalListbox}>
          {(files.isom || []).map((f, i) => (
            <div style={S.optionalItem} key={i}>
              <span style={S.optionalItemName}>{f.name}</span>
              <button style={S.removeBtn} onClick={() => removeOptional('isom', i)}>×</button>
            </div>
          ))}
          {!(files.isom || []).length && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 4px' }}>
              Žádné soubory
            </div>
          )}
        </div>
        <button style={S.addBtn}
          onClick={() => isomRef.current.click()}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f4f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          + Přidat ISOM vrstvy
        </button>
        <input ref={isomRef} type="file" accept=".shp" multiple style={{ display: 'none' }}
          onChange={(e) => addFiles('isom', e.target.files)} />
      </div>
    </div>
  );
}
