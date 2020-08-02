'use strict';

/**
 * @fileoverview npmdiff - Compare two versions of an npm package
 * (dependencies, size, scripts).
 * @module npmdiff
 * @author idirdev
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Reads and parses a package.json from the given directory.
 * @param {string} dir - Directory containing package.json.
 * @returns {object} Parsed package.json or empty object on failure.
 */
function readPackageJson(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Formats a byte count as a human-readable string.
 * @param {number} bytes - Number of bytes.
 * @returns {string} Formatted size string (e.g. "1.23 MB").
 */
function formatSize(bytes) {
  if (bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(2)} ${units[i]}`;
}

/**
 * Compares two dependency maps and returns added, removed, changed, and unchanged entries.
 * @param {object} depsA - Dependency map from package A.
 * @param {object} depsB - Dependency map from package B.
 * @returns {{ added: object, removed: object, changed: object, unchanged: object }} Diff result.
 */
function diffDeps(depsA, depsB) {
  const a = depsA || {};
  const b = depsB || {};
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  const added = {};
  const removed = {};
  const changed = {};
  const unchanged = {};

  for (const key of allKeys) {
    const inA = key in a;
    const inB = key in b;
    if (inA && !inB) {
      removed[key] = a[key];
    } else if (!inA && inB) {
      added[key] = b[key];
    } else if (a[key] !== b[key]) {
      changed[key] = { from: a[key], to: b[key] };
    } else {
      unchanged[key] = a[key];
    }
  }

  return { added, removed, changed, unchanged };
}

/**
 * Compares the scripts sections of two package.json objects.
 * @param {object} pkgA - First package.json object.
 * @param {object} pkgB - Second package.json object.
 * @returns {{ added: object, removed: object, changed: object, unchanged: object }} Script diff.
 */
function diffScripts(pkgA, pkgB) {
  return diffDeps(pkgA.scripts || {}, pkgB.scripts || {});
}

/**
 * Fetches all published versions of an npm package.
 * @param {string} name - Package name.
 * @returns {string[]} Array of version strings or empty array on error.
 */
function getVersions(name) {
  const result = spawnSync('npm', ['view', name, 'versions', '--json'], {
    encoding: 'utf8',
    shell: true,
  });
  try {
    return JSON.parse(result.stdout || '[]');
  } catch {
    return [];
  }
}

/**
 * Compares two package.json objects across dependencies, devDependencies,
 * scripts, version, and engines.
 * @param {object} pkgA - First package.json.
 * @param {object} pkgB - Second package.json.
 * @returns {object} Full diff report.
 */
function diffVersions(pkgA, pkgB) {
  return {
    version: { from: pkgA.version || null, to: pkgB.version || null },
    engines: {
      from: pkgA.engines || {},
      to: pkgB.engines || {},
      changed: JSON.stringify(pkgA.engines) !== JSON.stringify(pkgB.engines),
    },
    dependencies: diffDeps(pkgA.dependencies, pkgB.dependencies),
    devDependencies: diffDeps(pkgA.devDependencies, pkgB.devDependencies),
    peerDependencies: diffDeps(pkgA.peerDependencies, pkgB.peerDependencies),
    scripts: diffScripts(pkgA, pkgB),
  };
}

/**
 * Generates a human-readable report string from a diffVersions result.
 * @param {object} diffResult - Output of diffVersions().
 * @returns {string} Formatted report.
 */
function generateReport(diffResult) {
  const lines = [];

  lines.push(`Version: ${diffResult.version.from} → ${diffResult.version.to}`);

  if (diffResult.engines.changed) {
    lines.push(`Engines changed: ${JSON.stringify(diffResult.engines.from)} → ${JSON.stringify(diffResult.engines.to)}`);
  }

  for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'scripts']) {
    const d = diffResult[section];
    const added = Object.keys(d.added).length;
    const removed = Object.keys(d.removed).length;
    const changed = Object.keys(d.changed).length;
    if (added || removed || changed) {
      lines.push(`${section}: +${added} added, -${removed} removed, ~${changed} changed`);
      for (const [k, v] of Object.entries(d.added)) lines.push(`  + ${k}: ${v}`);
      for (const [k, v] of Object.entries(d.removed)) lines.push(`  - ${k}: ${v}`);
      for (const [k, v] of Object.entries(d.changed)) lines.push(`  ~ ${k}: ${v.from} → ${v.to}`);
    } else {
      lines.push(`${section}: no changes (${Object.keys(d.unchanged).length} unchanged)`);
    }
  }

  return lines.join('\n');
}

module.exports = {
  readPackageJson,
  formatSize,
  diffDeps,
  diffScripts,
  diffVersions,
  getVersions,
  generateReport,
};
