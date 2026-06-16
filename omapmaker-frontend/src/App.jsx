import React, { useState, useCallback, useRef } from 'react';
import Topbar from './components/Topbar';
import SettingsPanel from './components/SettingsPanel';
import MapView from './components/MapView';
import OutputPanel from './components/OutputPanel';
import CuzkDownloader from './components/CuzkDownloader';
import { startJob, getJobStatus } from './api';
import HelpModal from './components/HelpModal';

const DEFAULT_SETTINGS = {
  crs: 'EPSG:5514',
  scale: '10000',
  paper: 'A4 na šířku',
  sigma: '6.5',
  slopeThreshold: '45',
  northRotation: '5',
  bin1: '1',
  bin2: '2',
  bin3: '6',
  bin4: '12',
  layers: {
    contours: true,
    rocks: true,
    water: true,
    vegetation: true,
    roads: true,
    buildings: true,
    man_made: true,
    magnetic_lines: false,
  },
};

const DEFAULT_FILES = {
  dtm: null,
  dsm: null,
  zabaged: [],
  isom: [],
};

const PAPER_MAP = {
  'A4 na šířku': 'A4 (Landscape)',
  'A4 na výšku': 'A4 (Portrait)',
  'A3 na šířku': 'A3 (Landscape)',
  'A3 na výšku': 'A3 (Portrait)',
  'Extent dat': 'Data Extent',
};

function nowStr() {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

export default function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [files, setFiles] = useState(DEFAULT_FILES);
  const [bbox, setBbox] = useState(null);
  const [job, setJob] = useState({ status: 'idle', progress: 0, step: '', jobId: null });
  const [logLines, setLogLines] = useState([]);
  const pollRef = useRef(null);

  const [showHelp, setShowHelp] = useState(
  () => localStorage.getItem('omapmaker_help_seen') !== '1'
  );

  const addLog = useCallback((msg, type = 'info') => {
    setLogLines((prev) => [...prev.slice(-199), { time: nowStr(), msg, type }]);
  }, []);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const pollJob = useCallback((jobId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const data = await getJobStatus(jobId);
        setJob((prev) => ({
          ...prev,
          status: data.status,
          progress: data.progress ?? prev.progress,
          step: data.step ?? prev.step,
          jobId,
        }));
        if (data.step) addLog(data.step, data.status === 'error' ? 'warn' : 'info');
        if (data.status === 'done' || data.status === 'error') {
          stopPolling();
          if (data.status === 'done') addLog('Analýza dokončena.', 'ok');
          else addLog('Chyba: ' + (data.error || 'Neznámá chyba'), 'warn');
        }
      } catch (err) {
        addLog('Chyba při komunikaci se serverem.', 'warn');
      }
    }, 1500);
  }, [addLog]);

  const handleRun = useCallback(async () => {
    if (!files.dtm || !files.dsm) return;
    setLogLines([]);
    setJob({ status: 'queued', progress: 0, step: 'Odesílám data...', jobId: null });
    addLog('Spouštím analýzu...', 'info');

    const formData = new FormData();
    formData.append('dtm', files.dtm);
    formData.append('dsm', files.dsm);
    (files.zabaged || []).forEach((f) => formData.append('zabaged', f));
    (files.isom || []).forEach((f) => formData.append('isom', f));

    const params = {
      crs: settings.crs,
      scale: parseInt(settings.scale),
      paper_format: PAPER_MAP[settings.paper] || settings.paper,
      sigma: parseFloat(settings.sigma),
      slope_threshold: parseFloat(settings.slopeThreshold),
      north_rotation: parseFloat(settings.northRotation),
      bins: [
        parseFloat(settings.bin1),
        parseFloat(settings.bin2),
        parseFloat(settings.bin3),
        parseFloat(settings.bin4),
      ],
      layers: settings.layers,
      bbox: bbox || null,
    };

    try {
      const { job_id } = await startJob(formData, params);
      addLog(`Job spuštěn: ${job_id}`, 'ok');
      setJob((prev) => ({ ...prev, status: 'running', jobId: job_id }));
      pollJob(job_id);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      addLog('Chyba při spuštění: ' + msg, 'warn');
      setJob({ status: 'error', progress: 0, step: msg, jobId: null });
    }
  }, [files, settings, bbox, addLog, pollJob]);

  const handleCuzkComplete = useCallback((dmrFile, dmpFile) => {
    addLog(`DTM načteno: ${dmrFile.name} (${(dmrFile.size / 1e6).toFixed(1)} MB)`, 'ok');
    addLog(`DSM načteno: ${dmpFile.name} (${(dmpFile.size / 1e6).toFixed(1)} MB)`, 'ok');
    setFiles(prev => ({ ...prev, dtm: dmrFile, dsm: dmpFile }));
  }, [addLog]);

  const canRun = Boolean(files.dtm && files.dsm);
  const running = job.status === 'running' || job.status === 'queued';

  let topStatus = 'Připraveno';
  if (!files.dtm && !files.dsm) topStatus = 'Nahrajte DTM a DSM';
  else if (!files.dtm) topStatus = 'Chybí DTM';
  else if (!files.dsm) topStatus = 'Chybí DSM';
  else if (running) topStatus = 'Zpracovávám...';
  else if (job.status === 'done') topStatus = 'Mapa vygenerována ✓';
  else if (job.status === 'error') topStatus = 'Chyba!';
  else topStatus = 'Připraveno ke spuštění';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Topbar
        status={topStatus}
        canRun={canRun}
        running={running}
        onRun={handleRun}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SettingsPanel
          settings={settings}
          onSettings={setSettings}
          files={files}
          onFiles={setFiles}
        />

        <MapView bbox={bbox} onBboxChange={setBbox} onCuzkComplete={handleCuzkComplete} onHelp={() => setShowHelp(true)} />

        <OutputPanel job={job} logLines={logLines} />
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}  
    </div>
  );
}
