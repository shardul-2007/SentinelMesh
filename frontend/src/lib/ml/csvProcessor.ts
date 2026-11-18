import {
  ColumnMapping,
  ColumnSummary,
  DatasetMetadata,
  FeatureBaseline,
} from './types';

export const NON_FEATURE_KEYWORDS = [
  'label',
  'attack_cat',
  'attack_type',
  'target',
  'is_attack',
  'is_synthetic',
  'predicted_',
  'anomaly_',
  'severity',
  'detection_',
  'record_id',
  'flow_id',
  'flow id',
];

const COLUMN_ROLE_ALIASES: Record<keyof ColumnMapping, string[]> = {
  src_ip: ['src_ip', 'source_ip', 'srcip', 'source ip', 'src_addr', 'ipv4_src_addr', 'sip'],
  dst_ip: ['dst_ip', 'dest_ip', 'destination_ip', 'dstip', 'destination ip', 'dst_addr', 'ipv4_dst_addr', 'dip'],
  src_port: ['src_port', 'source_port', 'sport', 'source port', 'l4_src_port'],
  dst_port: ['dst_port', 'dest_port', 'destination_port', 'dport', 'dsport', 'destination port', 'l4_dst_port'],
  protocol: ['protocol', 'proto', 'ip_proto', 'l4_proto'],
  timestamp: ['timestamp', 'time', 'stime', 'flow_start', 'start_time', 'datetime', 'date'],
  label: ['label', 'attack_cat', 'class', 'category', 'target', 'attack_type', 'traffic_type', 'is_attack'],
  record_id: ['record_id', 'flow_id', 'flow id', 'id', 'event_id'],
};

// Mulberry32 deterministic seeded PRNG
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randChoice<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Generate 1,200 reproducible SYNTHETIC DEMONSTRATION network flow records.
 * Clearly labeled as synthetic data (never real production captures).
 */
export function generateSyntheticDemoRows(nSamples = 1200, seed = 42): Record<string, any>[] {
  const rng = createRng(seed);
  const nBenign = Math.floor(nSamples * 0.72);
  const nDdos = Math.floor(nSamples * 0.09);
  const nScan = Math.floor(nSamples * 0.08);
  const nBrute = Math.floor(nSamples * 0.06);
  const nExfil = nSamples - (nBenign + nDdos + nScan + nBrute);

  const baseMs = new Date('2026-11-18T08:00:00Z').getTime();
  const internalHosts = Array.from({ length: 50 }, (_, i) => `10.0.1.${i + 10}`);
  const serverHosts = ['10.0.1.50', '10.0.1.51', '10.0.1.52', '10.0.1.60'];
  const externalNormal = Array.from({ length: 35 }, (_, i) => `172.16.20.${i + 5}`);

  const rows: Record<string, any>[] = [];

  const pushFlow = (
    srcIp: string,
    dstIp: string,
    srcPort: number,
    dstPort: number,
    protocol: string,
    durationMs: number,
    pktSent: number,
    pktRecv: number,
    bytesSent: number,
    bytesRecv: number,
    synCount: number,
    failedConns: number,
    label: string,
    offsetSec: number
  ) => {
    const durSec = Math.max(durationMs / 1000, 0.001);
    const totalPkts = Math.max(pktSent + pktRecv, 1);
    const totalBytes = Math.max(bytesSent + bytesRecv, 1);
    rows.push({
      timestamp: new Date(baseMs + offsetSec * 1000).toISOString(),
      src_ip: srcIp,
      dst_ip: dstIp,
      src_port: srcPort,
      dst_port: dstPort,
      protocol,
      flow_duration_ms: Number(durationMs.toFixed(2)),
      packets_sent: pktSent,
      packets_recv: pktRecv,
      bytes_sent: bytesSent,
      bytes_recv: bytesRecv,
      packet_rate: Number((totalPkts / durSec).toFixed(2)),
      byte_rate: Number((totalBytes / durSec).toFixed(2)),
      syn_flag_count: synCount,
      failed_conn_count: failedConns,
      avg_packet_size: Number((totalBytes / totalPkts).toFixed(2)),
      is_synthetic_demo: true,
      label,
    });
  };

  // 1. BENIGN
  const commonPorts = [443, 443, 443, 80, 80, 53, 53, 22, 8080, 123];
  for (let i = 0; i < nBenign; i++) {
    const dstPort = randChoice(rng, commonPorts);
    const proto = dstPort === 53 || dstPort === 123 ? 'UDP' : 'TCP';
    const dur = 35 + rng() * rng() * 14000;
    const pktSent = randInt(rng, 4, 65);
    const pktRecv = randInt(rng, 4, 80);
    const bytesSent = pktSent * randInt(rng, 95, 580);
    const bytesRecv = pktRecv * randInt(rng, 140, 1050);
    const syn = proto === 'TCP' ? randChoice(rng, [0, 1, 1, 2]) : 0;
    const failed = randChoice(rng, [0, 0, 0, 0, 1]);
    pushFlow(
      randChoice(rng, internalHosts),
      randChoice(rng, [...externalNormal, ...serverHosts]),
      randInt(rng, 32768, 60999),
      dstPort,
      proto,
      dur,
      pktSent,
      pktRecv,
      bytesSent,
      bytesRecv,
      syn,
      failed,
      'BENIGN',
      randInt(rng, 0, 7200)
    );
  }

  // 2. DDoS_Flood (targeting institutional portal 10.0.1.50:443)
  const botnetIps = ['198.51.100.14', '198.51.100.19', '198.51.100.23', '203.0.113.88'];
  for (let i = 0; i < nDdos; i++) {
    const dur = 40 + rng() * 600;
    const pktSent = randInt(rng, 600, 3800);
    const pktRecv = randInt(rng, 0, 40);
    pushFlow(
      randChoice(rng, botnetIps),
      '10.0.1.50',
      randInt(rng, 1024, 65535),
      randChoice(rng, [443, 80]),
      randChoice(rng, ['TCP', 'TCP', 'UDP']),
      dur,
      pktSent,
      pktRecv,
      pktSent * randInt(rng, 54, 140),
      pktRecv * randInt(rng, 40, 90),
      randInt(rng, 250, 1800),
      randInt(rng, 10, 85),
      'DDoS_Flood',
      randInt(rng, 1800, 2700)
    );
  }

  // 3. Port_Scan (probing exposed campus services)
  const scanPorts = [21, 22, 23, 25, 80, 135, 139, 445, 1433, 3306, 3389, 5900, 6379, 8080];
  const scannerIps = ['198.51.100.77', '198.51.100.78'];
  for (let i = 0; i < nScan; i++) {
    const dur = 6 + rng() * 170;
    const pktSent = randInt(rng, 1, 6);
    const pktRecv = randInt(rng, 0, 2);
    pushFlow(
      randChoice(rng, scannerIps),
      randChoice(rng, serverHosts),
      randInt(rng, 40000, 65000),
      randChoice(rng, scanPorts),
      'TCP',
      dur,
      pktSent,
      pktRecv,
      pktSent * randInt(rng, 40, 74),
      pktRecv * randInt(rng, 40, 64),
      randInt(rng, 3, 18),
      randInt(rng, 8, 45),
      'Port_Scan',
      randInt(rng, 3000, 3900)
    );
  }

  // 4. Brute_Force (repeated auth failures on SSH/RDP/MySQL)
  const bruteIps = ['203.0.113.45', '203.0.113.46'];
  for (let i = 0; i < nBrute; i++) {
    const dur = 120 + rng() * 2200;
    const pktSent = randInt(rng, 18, 95);
    const pktRecv = randInt(rng, 15, 80);
    pushFlow(
      randChoice(rng, bruteIps),
      randChoice(rng, ['10.0.1.51', '10.0.1.52']),
      randInt(rng, 35000, 62000),
      randChoice(rng, [22, 3389, 3306]),
      'TCP',
      dur,
      pktSent,
      pktRecv,
      pktSent * randInt(rng, 110, 260),
      pktRecv * randInt(rng, 90, 210),
      randInt(rng, 8, 35),
      randInt(rng, 25, 140),
      'Brute_Force',
      randInt(rng, 4200, 5200)
    );
  }

  // 5. Data_Exfiltration (asymmetric outbound volume over non-standard port)
  const exfilSources = ['10.0.1.24', '10.0.1.31'];
  for (let i = 0; i < nExfil; i++) {
    const dur = 3500 + rng() * 24000;
    const pktSent = randInt(rng, 900, 4500);
    const pktRecv = randInt(rng, 15, 90);
    pushFlow(
      randChoice(rng, exfilSources),
      '192.0.2.99',
      randInt(rng, 42000, 61000),
      randChoice(rng, [4444, 8443, 9001]),
      'TCP',
      dur,
      pktSent,
      pktRecv,
      pktSent * randInt(rng, 1150, 1480),
      pktRecv * randInt(rng, 60, 150),
      randInt(rng, 1, 4),
      randInt(rng, 0, 3),
      'Data_Exfiltration',
      randInt(rng, 5400, 6600)
    );
  }

  // Deterministic Fisher-Yates shuffle
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  return rows.map((r, idx) => ({
    record_id: `FLOW-${String(idx + 1).padStart(5, '0')}`,
    ...r,
  }));
}

/**
 * Parse raw CSV text into row objects, handling quoted values and trimming
 * whitespace from CIC-IDS2017 / UNSW-NB15 column headers.
 */
export function parseCsvText(csvText: string, filename = 'uploaded.csv'): {
  rows: Record<string, any>[];
  metadata: DatasetMetadata;
} {
  if (!csvText || !csvText.trim()) {
    throw new Error(`File '${filename}' is empty.`);
  }

  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (current.trim().length > 0) {
        lines.push(current);
      }
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0) {
    lines.push(current);
  }

  if (lines.length < 2) {
    throw new Error(`CSV file '${filename}' must contain a header row and at least one data row.`);
  }

  const splitRow = (line: string): string[] => {
    const result: string[] = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (quoted && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (c === ',' && !quoted) {
        result.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    result.push(cell.trim());
    return result;
  };

  const rawHeaders = splitRow(lines[0]).map((h, i) => (h.trim() || `col_${i}`));
  // Deduplicate headers
  const seen: Record<string, number> = {};
  const headers = rawHeaders.map((h) => {
    if (seen[h] !== undefined) {
      seen[h] += 1;
      return `${h}_${seen[h]}`;
    }
    seen[h] = 0;
    return h;
  });

  // Cap at 5,000 rows in browser/serverless mode for snappy interactive evaluation
  const maxRows = Math.min(lines.length - 1, 5000);
  const rows: Record<string, any>[] = [];

  for (let r = 1; r <= maxRows; r++) {
    const vals = splitRow(lines[r]);
    const obj: Record<string, any> = {};
    for (let c = 0; c < headers.length; c++) {
      const raw = vals[c] ?? '';
      if (raw === '' || raw.toLowerCase() === 'nan' || raw.toLowerCase() === 'null') {
        obj[headers[c]] = null;
      } else if (raw.toLowerCase() === 'infinity' || raw.toLowerCase() === 'inf') {
        obj[headers[c]] = Infinity;
      } else if (raw.toLowerCase() === '-infinity' || raw.toLowerCase() === '-inf') {
        obj[headers[c]] = -Infinity;
      } else if (raw.toLowerCase() === 'true') {
        obj[headers[c]] = true;
      } else if (raw.toLowerCase() === 'false') {
        obj[headers[c]] = false;
      } else {
        const num = Number(raw);
        obj[headers[c]] = !Number.isNaN(num) && raw !== '' && !raw.includes(':') && !/^\d+\.\d+\.\d+\.\d+$/.test(raw)
          ? num
          : raw;
      }
    }
    rows.push(obj);
  }

  const metadata = inspectRows(rows, filename);
  return { rows, metadata };
}

export function inspectRows(rows: Record<string, any>[], filename: string): DatasetMetadata {
  if (!rows.length) {
    throw new Error('Dataset contains 0 rows.');
  }
  const cols = Object.keys(rows[0]);
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];
  const columnSummary: ColumnSummary[] = [];
  let totalMissingCells = 0;

  for (const col of cols) {
    let missingCount = 0;
    let infiniteCount = 0;
    let numValid = 0;
    let nonNull = 0;
    const uniques = new Set<string>();

    for (const row of rows) {
      const v = row[col];
      if (v === null || v === undefined || v === '') {
        missingCount++;
        totalMissingCells++;
      } else {
        nonNull++;
        uniques.add(String(v));
        if (typeof v === 'number') {
          if (!Number.isFinite(v)) {
            infiniteCount++;
          } else {
            numValid++;
          }
        }
      }
    }

    const isNumeric = nonNull > 0 && (numValid + infiniteCount) / nonNull >= 0.85 && typeof rows.find((r) => r[col] !== null)?.[col] !== 'boolean';
    if (isNumeric) {
      numericColumns.push(col);
    } else {
      categoricalColumns.push(col);
    }

    columnSummary.push({
      column: col,
      kind: isNumeric ? 'numeric' : 'categorical',
      missingCount,
      missingPct: Number(((missingCount / rows.length) * 100).toFixed(2)),
      infiniteCount,
      uniqueValues: uniques.size,
    });
  }

  // Duplicate row check
  const rowHashes = new Set<string>();
  let duplicateRows = 0;
  for (const row of rows) {
    const key = JSON.stringify(row);
    if (rowHashes.has(key)) duplicateRows++;
    else rowHashes.add(key);
  }

  const suggestedMapping = autoDetectColumnMapping(cols);
  const candidateMlFeatures = suggestMlFeatures(cols, numericColumns, suggestedMapping);
  const isSyntheticDemo = rows.some((r) => r.is_synthetic_demo === true || r.is_synthetic_demo === 'True');

  return {
    filename,
    nRows: rows.length,
    nCols: cols.length,
    numericColumns,
    categoricalColumns,
    totalMissingCells,
    duplicateRows,
    columnSummary,
    suggestedMapping,
    candidateMlFeatures,
    isSyntheticDemo,
  };
}

export function autoDetectColumnMapping(columns: string[]): ColumnMapping {
  const lowerMap: Record<string, string> = {};
  for (const c of columns) {
    lowerMap[c.toLowerCase().trim()] = c;
  }

  const mapping: ColumnMapping = {
    src_ip: null,
    dst_ip: null,
    src_port: null,
    dst_port: null,
    protocol: null,
    timestamp: null,
    label: null,
    record_id: null,
  };

  (Object.keys(COLUMN_ROLE_ALIASES) as (keyof ColumnMapping)[]).forEach((role) => {
    for (const alias of COLUMN_ROLE_ALIASES[role]) {
      if (lowerMap[alias]) {
        mapping[role] = lowerMap[alias];
        break;
      }
    }
  });

  return mapping;
}

export function suggestMlFeatures(
  allCols: string[],
  numericCols: string[],
  mapping: ColumnMapping
): string[] {
  const excluded = new Set<string>(
    [mapping.label, mapping.record_id, mapping.src_ip, mapping.dst_ip, mapping.timestamp].filter(Boolean) as string[]
  );
  const numSet = new Set(numericCols);
  return allCols.filter((col) => {
    if (!numSet.has(col) || excluded.has(col)) return false;
    const lower = col.toLowerCase();
    return !NON_FEATURE_KEYWORDS.some((kw) => lower.includes(kw));
  });
}

export function cleanAndEnrichRows(
  rows: Record<string, any>[],
  selectedFeatures: string[],
  dropDuplicates = false
): {
  cleanedRows: Record<string, any>[];
  activeFeatures: string[];
  cleaningReport: {
    initialRows: number;
    finalRows: number;
    infiniteValuesReplaced: number;
    duplicatesRemoved: number;
    remainingMissingCells: number;
  };
} {
  const initialRows = rows.length;
  let infiniteValuesReplaced = 0;

  let working = rows.map((row, idx) => {
    const copy: Record<string, any> = { ...row };
    for (const k of Object.keys(copy)) {
      if (typeof copy[k] === 'number' && !Number.isFinite(copy[k])) {
        copy[k] = null;
        infiniteValuesReplaced++;
      }
    }
    if (!copy.record_id) {
      copy.record_id = `REC-${String(idx + 1).padStart(5, '0')}`;
    }
    return copy;
  });

  let duplicatesRemoved = 0;
  if (dropDuplicates) {
    const seen = new Set<string>();
    const deduped: Record<string, any>[] = [];
    for (const r of working) {
      const k = JSON.stringify(r);
      if (seen.has(k)) {
        duplicatesRemoved++;
      } else {
        seen.add(k);
        deduped.push(r);
      }
    }
    working = deduped;
  }

  const activeFeatures = [...selectedFeatures];
  // Add transparent derived asymmetry ratios if base columns exist
  const hasBytes = working.length > 0 && 'bytes_sent' in working[0] && 'bytes_recv' in working[0];
  const hasPackets = working.length > 0 && 'packets_sent' in working[0] && 'packets_recv' in working[0];

  for (const r of working) {
    if (hasBytes) {
      const bs = Number(r.bytes_sent) || 0;
      const br = Number(r.bytes_recv) || 0;
      r.bytes_asymmetry_ratio = Number(((bs + 1) / (br + 1)).toFixed(4));
    }
    if (hasPackets) {
      const ps = Number(r.packets_sent) || 0;
      const pr = Number(r.packets_recv) || 0;
      r.packets_asymmetry_ratio = Number(((ps + 1) / (pr + 1)).toFixed(4));
    }
  }
  if (hasBytes && !activeFeatures.includes('bytes_asymmetry_ratio')) {
    activeFeatures.push('bytes_asymmetry_ratio');
  }
  if (hasPackets && !activeFeatures.includes('packets_asymmetry_ratio')) {
    activeFeatures.push('packets_asymmetry_ratio');
  }

  let remainingMissingCells = 0;
  for (const r of working) {
    for (const v of Object.values(r)) {
      if (v === null || v === undefined || v === '') remainingMissingCells++;
    }
  }

  return {
    cleanedRows: working,
    activeFeatures,
    cleaningReport: {
      initialRows,
      finalRows: working.length,
      infiniteValuesReplaced,
      duplicatesRemoved,
      remainingMissingCells,
    },
  };
}

export function computeBaselines(
  rows: Record<string, any>[],
  features: string[]
): Record<string, FeatureBaseline> {
  const baselines: Record<string, FeatureBaseline> = {};
  for (const col of features) {
    const vals: number[] = [];
    for (const r of rows) {
      const n = Number(r[col]);
      if (r[col] !== null && r[col] !== undefined && r[col] !== '' && Number.isFinite(n)) {
        vals.push(n);
      }
    }
    if (!vals.length) continue;
    vals.sort((a, b) => a - b);
    const mean = vals.reduce((acc, x) => acc + x, 0) / vals.length;
    const variance = vals.reduce((acc, x) => acc + (x - mean) ** 2, 0) / vals.length;
    const std = Math.sqrt(variance) > 1e-9 ? Math.sqrt(variance) : 1.0;
    const q = (p: number) => vals[Math.min(vals.length - 1, Math.floor(p * (vals.length - 1)))];

    baselines[col] = {
      mean,
      std,
      median: q(0.5),
      p05: q(0.05),
      p95: q(0.95),
      p99: q(0.99),
      min: vals[0],
      max: vals[vals.length - 1],
    };
  }
  return baselines;
}
