import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE });

/**
 * Start a processing job.
 * @param {FormData} formData  - contains dtm, dsm, optional zabaged/isom files
 * @param {object}   params    - { crs, scale, paper_format, sigma, slope_threshold,
 *                                 bins, layers, north_rotation, bbox }
 */
export async function startJob(formData, params) {
  formData.append('params', JSON.stringify(params));
  const res = await api.post('/api/jobs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data; // { job_id }
}

/**
 * Poll job status.
 * Returns { status, progress, step, log_tail, error }
 * status: 'queued' | 'running' | 'done' | 'error'
 */
export async function getJobStatus(jobId) {
  const res = await api.get(`/api/jobs/${jobId}`);
  return res.data;
}

/** Download PNG result as a blob URL */
export function getPngUrl(jobId) {
  return `${BASE}/api/jobs/${jobId}/png`;
}

/** Download GPKG result */
export function getGpkgUrl(jobId) {
  return `${BASE}/api/jobs/${jobId}/gpkg`;
}

/**
 * Trigger ČÚZK tile download on the server.
 * @param {object} bbox   - { min_lat, min_lon, max_lat, max_lon }
 * @param {string} dsmType - 'DMPOK' | 'DMP1G'
 * @param {string} outDir  - server-side output directory
 */
export async function downloadCuzk(bbox, dsmType, outDir) {
  const res = await api.post('/api/download/cuzk', { bbox, dsm_type: dsmType, out_dir: outDir });
  return res.data; // { dmr_path, dmp_path }
}
