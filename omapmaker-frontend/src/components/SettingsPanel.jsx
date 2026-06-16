import React, { useRef, useState } from 'react';

const S = {
  panel: {
    width: 350,
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

const TOOLTIPS = {
  lidar: 'Nahrajte data ze zařízení nebo vyberte oblast tažením v mapě a stáhněte.',
  scale: 'Měřítko výsledné mapy. 1:10 000 pro detailní mapy, 1:15 000 pro větší oblasti.',
  paper: 'Formát výstupního PNG. "Extent dat" ořízne mapu přesně na rozsah dat.',
  sigma: 'Míra vyhlazení vrstevnic. Vyšší hodnota = hladší vrstevnice, ale méně detailní. Doporučeno 5–8.',
  slopeThreshold: 'Minimální sklon terénu (ve stupních) aby byl prvek klasifikován jako skála. Nižší = více skal, ale budou více splývat.',
  northRotation: 'Odchylka mag. severu od zvoleného souřadnicového systému.',
  bin1: 'Výška do které je vegetace považována za otevřený prostor (tráva, louka).',
  bin2: 'Výška do které je vegetace klasifikována jako znak (znak 410).',
  bin3: 'Výška do které je vegetace klasifikována jako chůze (znak 408).',
  bin4: 'Výška do které je vegetace klasifikována jako znak 406. Nad touto výškou = les (znak 405).',
  zabaged: 'Nahrajte data veformátu .shp. Název souboru odpovídá názvu vrstvy v ZABAGED® (např. "LesniPudaSeStromy.shp")',
  other: 'Jakákoliv jiná vrstva ve formátu .shp, která svýmnázvem odpovídá danému znaku (např. "301.shp")'
};

// Tooltip komponent
function Tooltip({ text }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef();

  const show = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: r.right + 8, y: r.top });
    setVisible(true);
  };
  const hide = () => setVisible(false);

  return (
    <>
      <button
        ref={btnRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{
          background: 'none', border: 'none', cursor: 'help',
          color: 'var(--text-muted)', fontSize: 11, lineHeight: 1,
          padding: '0 3px', flexShrink: 0, borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 15, height: 15,
          border: '0.5px solid var(--panel-border)',
        }}
        tabIndex={-1}
      >?</button>
      {visible && (
        <div style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 9999,
          background: 'var(--ink)',
          color: '#fff',
          fontSize: 11,
          fontFamily: 'var(--sans)',
          lineHeight: 1.5,
          padding: '7px 10px',
          borderRadius: 6,
          maxWidth: 220,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
        }}>
          {text}
        </div>
      )}
    </>
  );
}

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
  { key: 'water', label: 'Voda a bažiny', color: '#317fa0' },
  { key: 'vegetation', label: 'Vegetace', color: '#6b9950' },
  { key: 'roads', label: 'Cesty a silnice', color: '#f0b643' },
  { key: 'buildings', label: 'Budovy', color: '#2c2c2c' },
  { key: 'man_made', label: 'Umělé prvky', color: '#8060b0' },
  { key: 'magnetic_lines', label: 'Mag. poledníky', color: '#7bc7e6' },
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
        <div style={S.label}>LiDAR data 
        <Tooltip style={S.settingLabel} text={TOOLTIPS.lidar} />
        </div>
        <FileDropZone
          label="Přetáhni nebo klikni pro DMR"
          icon="⛰️"
          accept=".las,.laz"
          file={files.dtm}
          onFile={(f) => onFiles({ ...files, dtm: f })}
          onRemove={() => onFiles({ ...files, dtm: null })}
        />
        <FileDropZone
          label="Přetáhni nebo klikni pro DMP"
          icon="🌲"
          accept=".las,.laz,"
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
          <span style={S.settingLabel}>Souřadnicový systém</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <select style={S.select} value={settings.crs} onChange={(e) => set('crs', e.target.value)}>
              {CRS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div style={S.row}>
          <span style={S.settingLabel}>Měřítko</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tooltip text={TOOLTIPS.scale} />
            <select style={S.select} value={settings.scale} onChange={(e) => set('scale', e.target.value)}>
              <option value="10000">1 : 10 000</option>
              <option value="15000">1 : 15 000</option>
            </select>
          </div>
        </div>
        <div style={S.row}>
          <span style={S.settingLabel}>Formát papíru</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tooltip text={TOOLTIPS.paper} />
            <select style={S.select} value={settings.paper} onChange={(e) => set('paper', e.target.value)}>
              {PAPER_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={S.row}>
          <span style={S.settingLabel}>Vyhlazení vrstevnic</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tooltip text={TOOLTIPS.sigma} />
            <input style={S.numInput} type="number" step="0.5" min="0" max="20"
              value={settings.sigma} onChange={(e) => set('sigma', e.target.value)} />
          </div>
        </div>
        <div style={S.row}>
          <span style={S.settingLabel}>Minimální sklon skal (°)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tooltip text={TOOLTIPS.slopeThreshold} />
            <input style={S.numInput} type="number" step="1" min="20" max="80"
              value={settings.slopeThreshold} onChange={(e) => set('slopeThreshold', e.target.value)} />
          </div>
        </div>
        <div style={S.row}>
          <span style={S.settingLabel}>Mag. deklinace (°)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tooltip text={TOOLTIPS.northRotation} />
            <input style={S.numInput} type="number" step="0.1"
              value={settings.northRotation} onChange={(e) => set('northRotation', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Vegetace */}
      <div style={S.section}>
        <div style={S.label}>Výška vegetace (m)</div>
        {[
          ['Otevřený prostor (do)', 'bin1'],
          ['Prodírání (do)', 'bin2'],
          ['Chůze (do)', 'bin3'],
          ['Pomalý běh (do)', 'bin4'],
        ].map(([lbl, key]) => (
          <div style={S.row} key={key}>
            <span style={S.settingLabel}>{lbl}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tooltip text={TOOLTIPS[key]} />
              <input style={S.numInput} type="number" step="0.5" min="0" max="30"
                value={settings[key]} onChange={(e) => set(key, e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      {/* Mikrotvary — rozbalovací */}
      <CollapsibleSection label="Prohlubně a kupky" defaultOpen={false}>
        <div style={{ ...S.label, marginBottom: 8 }}>Prohlubně</div>
        {[
          ['Min. průměr (m)', 'depMinDiameter', '0.5', '0.5', '50', 'Minimální průměr prohlubně v metrech. Menší objekty se ignorují.'],
          ['Max. průměr (m)', 'depMaxDiameter', '0.5', '0.5', '50', 'Maximální průměr prohlubně. Větší objekty se ignorují.'],
          ['Min. hloubka (m)', 'depMinDepth', '0.1', '0.1', '10', 'Minimální hloubka prohlubně v metrech.'],
        ].map(([lbl, key, step, min, max, tip]) => (
          <div style={S.row} key={key}>
            <span style={S.settingLabel}>{lbl}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tooltip text={tip} />
              <input style={S.numInput} type="number" step={step} min={min} max={max}
                value={settings[key]} onChange={(e) => set(key, e.target.value)} />
            </div>
          </div>
        ))}

        <div style={{ ...S.label, marginTop: 12, marginBottom: 8 }}>Kupky</div>
        {[
          ['Min. průměr (m)', 'knoMinDiameter', '0.5', '0.5', '50', 'Minimální průměr kupky v metrech.'],
          ['Max. průměr (m)', 'knoMaxDiameter', '0.5', '0.5', '50', 'Maximální průměr kupky. Větší kopce se ignorují.'],
          ['Min. výška (m)', 'knoMinHeight', '0.1', '0.1', '10', 'Minimální výška kupky nad okolním terénem.'],
        ].map(([lbl, key, step, min, max, tip]) => (
          <div style={S.row} key={key}>
            <span style={S.settingLabel}>{lbl}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tooltip text={tip} />
              <input style={S.numInput} type="number" step={step} min={min} max={max}
                value={settings[key]} onChange={(e) => set(key, e.target.value)} />
            </div>
          </div>
        ))}
      </CollapsibleSection>

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
          <Tooltip text={TOOLTIPS.zabaged} />

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
          Vlastní vrstvy (.shp)
          <Tooltip text={TOOLTIPS.other} />
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