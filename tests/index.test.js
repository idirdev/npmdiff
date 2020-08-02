'use strict';

/**
 * @fileoverview Tests for npmdiff.
 * @author idirdev
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  readPackageJson,
  diffDeps,
  diffScripts,
  diffVersions,
  formatSize,
  generateReport,
} = require('../src/index.js');

// ─── Temp dir helpers ─────────────────────────────────────────────────────────

let tmpA, tmpB;

before(() => {
  tmpA = fs.mkdtempSync(path.join(os.tmpdir(), 'npmdiff-a-'));
  tmpB = fs.mkdtempSync(path.join(os.tmpdir(), 'npmdiff-b-'));
});

after(() => {
  fs.rmSync(tmpA, { recursive: true, force: true });
  fs.rmSync(tmpB, { recursive: true, force: true });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('formatSize', () => {
  it('formats bytes', () => {
    assert.equal(formatSize(0), '0 B');
    assert.equal(formatSize(512), '512.00 B');
  });

  it('formats kilobytes', () => {
    assert.equal(formatSize(1024), '1.00 KB');
    assert.equal(formatSize(2048), '2.00 KB');
  });

  it('formats megabytes', () => {
    assert.equal(formatSize(1024 * 1024), '1.00 MB');
  });

  it('handles negative bytes as 0 B', () => {
    assert.equal(formatSize(-1), '0 B');
  });
});

describe('diffDeps', () => {
  const depsA = { express: '^4.18.0', lodash: '^4.17.21', chalk: '^4.0.0' };
  const depsB = { express: '^4.18.2', lodash: '^4.17.21', axios: '^1.0.0' };

  it('detects added dependencies', () => {
    const diff = diffDeps(depsA, depsB);
    assert.ok('axios' in diff.added);
    assert.equal(diff.added.axios, '^1.0.0');
  });

  it('detects removed dependencies', () => {
    const diff = diffDeps(depsA, depsB);
    assert.ok('chalk' in diff.removed);
  });

  it('detects changed dependencies', () => {
    const diff = diffDeps(depsA, depsB);
    assert.ok('express' in diff.changed);
    assert.equal(diff.changed.express.from, '^4.18.0');
    assert.equal(diff.changed.express.to, '^4.18.2');
  });

  it('detects unchanged dependencies', () => {
    const diff = diffDeps(depsA, depsB);
    assert.ok('lodash' in diff.unchanged);
  });

  it('handles null inputs gracefully', () => {
    const diff = diffDeps(null, null);
    assert.deepEqual(diff.added, {});
    assert.deepEqual(diff.removed, {});
  });
});

describe('diffScripts', () => {
  const pkgA = { scripts: { build: 'tsc', test: 'jest', start: 'node index.js' } };
  const pkgB = { scripts: { build: 'esbuild', test: 'jest', lint: 'eslint .' } };

  it('detects added scripts', () => {
    const diff = diffScripts(pkgA, pkgB);
    assert.ok('lint' in diff.added);
  });

  it('detects removed scripts', () => {
    const diff = diffScripts(pkgA, pkgB);
    assert.ok('start' in diff.removed);
  });

  it('detects changed scripts', () => {
    const diff = diffScripts(pkgA, pkgB);
    assert.ok('build' in diff.changed);
    assert.equal(diff.changed.build.from, 'tsc');
    assert.equal(diff.changed.build.to, 'esbuild');
  });
});

describe('diffVersions', () => {
  const pkgA = {
    name: 'my-pkg',
    version: '1.0.0',
    engines: { node: '>=14' },
    dependencies: { express: '^4.17.0' },
    devDependencies: { jest: '^27.0.0' },
    scripts: { test: 'jest' },
  };
  const pkgB = {
    name: 'my-pkg',
    version: '2.0.0',
    engines: { node: '>=16' },
    dependencies: { express: '^4.18.2', axios: '^1.0.0' },
    devDependencies: { jest: '^29.0.0' },
    scripts: { test: 'jest', build: 'tsc' },
  };

  it('reports version change', () => {
    const diff = diffVersions(pkgA, pkgB);
    assert.equal(diff.version.from, '1.0.0');
    assert.equal(diff.version.to, '2.0.0');
  });

  it('detects engine change', () => {
    const diff = diffVersions(pkgA, pkgB);
    assert.equal(diff.engines.changed, true);
  });

  it('diffs dependencies correctly', () => {
    const diff = diffVersions(pkgA, pkgB);
    assert.ok('axios' in diff.dependencies.added);
    assert.ok('express' in diff.dependencies.changed);
  });

  it('diffs devDependencies correctly', () => {
    const diff = diffVersions(pkgA, pkgB);
    assert.ok('jest' in diff.devDependencies.changed);
  });
});

describe('readPackageJson', () => {
  it('returns object for valid package.json', () => {
    const data = { name: 'test', version: '1.0.0' };
    fs.writeFileSync(path.join(tmpA, 'package.json'), JSON.stringify(data));
    const result = readPackageJson(tmpA);
    assert.equal(result.name, 'test');
  });

  it('returns empty object for missing file', () => {
    const result = readPackageJson(path.join(tmpA, 'nonexistent'));
    assert.deepEqual(result, {});
  });
});

describe('generateReport', () => {
  it('produces a non-empty string', () => {
    const pkgA = { version: '1.0.0', dependencies: { express: '^4.17.0' }, scripts: {} };
    const pkgB = { version: '2.0.0', dependencies: { express: '^4.18.0' }, scripts: {} };
    const diff = diffVersions(pkgA, pkgB);
    const report = generateReport(diff);
    assert.ok(typeof report === 'string');
    assert.ok(report.includes('1.0.0'));
    assert.ok(report.includes('2.0.0'));
  });
});
