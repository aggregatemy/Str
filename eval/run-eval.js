// Evaluation script for Strażnik Prawa ingestion and API endpoints
// Usage: node eval/run-eval.js

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = [
  'id',
  'ingestMethod',
  'title',
  'summary',
  'date',
  'impact',
  'category',
  'legalStatus',
  'officialRationale'
];

function readQueries() {
  const filePath = path.join(__dirname, 'queries.jsonl');
  const lines = fs.readFileSync(filePath, 'utf-8').trim().split(/\r?\n/).filter(Boolean);
  return lines.map(line => JSON.parse(line));
}

async function fetchWithTiming(url) {
  const start = performance.now();
  const response = await fetch(url);
  const durationMs = performance.now() - start;
  const json = await response.json().catch(() => null);
  return { response, json, durationMs };
}

function uniqueKey(update) {
  return (
    update.eliUri ||
    update.id ||
    `${update.title || ''}|${update.date || ''}|${update.sourceUrl || ''}`
  );
}

function analyzeUpdates(updates = []) {
  const seen = new Set();
  let duplicates = 0;
  let missingFields = 0;
  let oldest = null;
  let newest = null;

  for (const u of updates) {
    const key = uniqueKey(u);
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);

    for (const field of REQUIRED_FIELDS) {
      if (u[field] === undefined || u[field] === null || u[field] === '') missingFields += 1;
    }

    if (u.date) {
      const d = new Date(u.date);
      if (!Number.isNaN(d.getTime())) {
        if (!oldest || d < oldest) oldest = d;
        if (!newest || d > newest) newest = d;
      }
    }
  }

  const spanDays = oldest && newest ? Math.round((newest - oldest) / (1000 * 60 * 60 * 24)) : null;
  const now = new Date();
  const coverageOk = oldest ? (Math.round((now - oldest) / (1000 * 60 * 60 * 24)) >= 120) : false;

  return {
    count: updates.length,
    uniqueCount: seen.size,
    duplicates,
    missingFields,
    oldestDate: oldest ? oldest.toISOString() : null,
    newestDate: newest ? newest.toISOString() : null,
    spanDays,
    coverage120d: coverageOk
  };
}

async function run() {
  const queries = readQueries();
  const results = [];

  for (const q of queries) {
    const entry = { name: q.name, url: q.url, source: q.source };
    try {
      const { response, json, durationMs } = await fetchWithTiming(q.url);
      entry.status = response.status;
      entry.ok = response.ok;
      entry.durationMs = Math.round(durationMs);

      if (Array.isArray(json)) {
        entry.analysis = analyzeUpdates(json);
      } else if (json && Array.isArray(json.data)) {
        entry.analysis = analyzeUpdates(json.data);
      } else {
        entry.analysis = { error: 'Unexpected JSON shape' };
      }
    } catch (err) {
      entry.ok = false;
      entry.error = err.message;
    }
    results.push(entry);
  }

  const summary = {
    timestamp: new Date().toISOString(),
    results,
  };

  const outPath = path.join(__dirname, 'report.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log('Evaluation completed. Report saved to', outPath);
  for (const r of results) {
    console.log(`- ${r.name}: status=${r.status || 'n/a'}, ok=${r.ok}, durationMs=${r.durationMs || 'n/a'}, count=${r.analysis?.count || 'n/a'}, dup=${r.analysis?.duplicates || 'n/a'}, coverage120d=${r.analysis?.coverage120d}`);
  }
}

run().catch(err => {
  console.error('Evaluation failed:', err);
  process.exit(1);
});
