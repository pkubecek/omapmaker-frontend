import React, { useEffect, useRef } from 'react';
import { getPngUrl, getGpkgUrl } from '../api';

const S = {
  panel: {
    width: 288,
    flexShrink: 0,
    background: 'var(--panel-bg)',
    borderLeft: '0.5px solid var(--panel-border)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  section: {
    padding: '14px 16px',
    borderBottom: '0.5px solid var(--panel-border)',
  },
  sectionLabel: {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    marginBottom: 10,
  },
  progressHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: { fontSize: 12, fontWeight: 500 },
  progressPct: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-secondary)' },
  barWrap: {
    background: '#f0ead6',
    borderRadius: 3,
    height: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    background: 'var(--forest)',
    transition: 'width 0.5s ease',
  },
  barFillError: { background: '#c96a3a' },
  stepText: {
    fontFamily: 'var(--mono)',
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
  logWrap: {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    lineHeight: 1.8,
    maxHeight: 220,
    overflowY: 'auto',
    color: 'var(--text-secondary)',
  },
  logLine: { display: 'flex', gap: 6, alignItems: 'baseline' },
  logTime: { color: 'var(--text-muted)', flexShrink: 0, fontSize: 9 },
  logOk: { color: 'var(--forest)' },
  logWarn: { color: 'var(--rock)' },
  logInfo: { color: 'var(--text-secondary)' },
  outputSection: { padding: '14px 16px', flex: 1 },
  previewWrap: {
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    border: '0.5px solid var(--panel-border)',
    marginBottom: 10,
    aspectRatio: '1.414',
    background: 'var(--paper)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  previewPlaceholder: { textAlign: 'center', color: 'var(--text-muted)', padding: 16 },
  placeholderIcon: { fontSize: 28, marginBottom: 6, opacity: 0.3 },
  placeholderText: { fontSize: 11, lineHeight: 1.4 },
  dlBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    padding: '8px 0',
    borderRadius: 'var(--radius-md)',
    fontSize: 12,
    cursor: 'pointer',
    marginBottom: 6,
    border: '0.5px solid var(--panel-border)',
    background: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'var(--sans)',
    transition: 'background 0.15s',
  },
  dlBtnPrimary: {
    background: 'var(--ink)',
    color: '#fff',
    borderColor: 'var(--ink)',
  },
  dlBtnDisabled: { opacity: 0.38, cursor: 'not-allowed' },
};

const STATUS_LABELS = {
  idle: 'Čeká na spuštění',
  queued: 'Ve frontě...',
  running: 'Zpracovávám...',
  done: 'Hotovo ✓',
  error: 'Chyba!',
};

export default function OutputPanel({ job, logLines }) {
  const logRef = useRef(null);
  const { status = 'idle', progress = 0, step = '', jobId = null } = job || {};
  const isDone = status === 'done';
  const isError = status === 'error';

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  const now = () => {
    const d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map((n) => String(n).padStart(2, '0'))
      .join(':');
  };

  return (
    <div style={S.panel}>
      {/* Progress */}
      <div style={S.section}>
        <div style={S.sectionLabel}>Průběh zpracování</div>
        <div style={S.progressHeader}>
          <span style={S.progressTitle}>{STATUS_LABELS[status] || status}</span>
          <span style={S.progressPct}>{status === 'idle' ? '—' : `${Math.round(progress)}%`}</span>
        </div>
        <div style={S.barWrap}>
          <div
            style={{
              ...S.barFill,
              ...(isError ? S.barFillError : {}),
              width: `${progress}%`,
            }}
          />
        </div>
        <div style={S.stepText}>
          {status === 'idle'
            ? 'Nahrajte DTM a DSM, pak klikněte Generovat mapu'
            : step || '—'}
        </div>
      </div>

      {/* Log */}
      <div style={S.section}>
        <div style={S.sectionLabel}>Log</div>
        <div style={S.logWrap} ref={logRef}>
          {logLines.length === 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Zde se zobrazí průběh...</span>
          )}
          {logLines.map((line, i) => (
            <div style={S.logLine} key={i}>
              <span style={S.logTime}>{line.time}</span>
              <span style={line.type === 'ok' ? S.logOk : line.type === 'warn' ? S.logWarn : S.logInfo}>
                {line.msg}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Output */}
      <div style={S.outputSection}>
        <div style={S.sectionLabel}>Výstup</div>
        <div style={S.previewWrap}>
          {isDone && jobId ? (
            <img
              style={S.previewImg}
              src={getPngUrl(jobId)}
              alt="Náhled vygenerované mapy"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={S.previewPlaceholder}>
              <div style={S.placeholderIcon}>🗺</div>
              <div style={S.placeholderText}>
                {isError ? 'Zpracování selhalo' : 'Výsledná mapa se zobrazí zde'}
              </div>
            </div>
          )}
        </div>

        <a
          href={isDone && jobId ? getPngUrl(jobId) : undefined}
          download="OMap.png"
          style={{ textDecoration: 'none' }}
        >
          <button
            style={{
              ...S.dlBtn,
              ...S.dlBtnPrimary,
              ...(!isDone ? S.dlBtnDisabled : {}),
            }}
            disabled={!isDone}
          >
            ↓ Stáhnout mapu PNG
          </button>
        </a>

        <a
          href={isDone && jobId ? getGpkgUrl(jobId) : undefined}
          download="OMap.gpkg"
          style={{ textDecoration: 'none' }}
        >
          <button
            style={{
              ...S.dlBtn,
              ...(!isDone ? S.dlBtnDisabled : {}),
            }}
            disabled={!isDone}
          >
            ⬡ Exportovat GPKG pro OOM
          </button>
        </a>
      </div>
    </div>
  );
}
