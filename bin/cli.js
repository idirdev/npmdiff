#!/usr/bin/env node
'use strict';

/**
 * @fileoverview CLI entry point for npmdiff.
 * @author idirdev
 */

const path = require('path');
const {
  readPackageJson,
  diffVersions,
  diffDeps,
  diffScripts,
  generateReport,
} = require('../src/index.js');

const args = process.argv.slice(2);

/** Print usage information. */
function usage() {
  console.log([
    'Usage: npmdiff <pathA> <pathB> [options]',
    '',
    'Options:',
    '  --json         Output as JSON',
    '  --deps-only    Compare dependencies only',
    '  --scripts      Compare scripts only',
    '  --help         Show this help',
  ].join('\n'));
}

if (args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

const positional = args.filter(a => !a.startsWith('--'));
if (positional.length < 2) {
  console.error('Error: two paths required.\n');
  usage();
  process.exit(1);
}

const [pathA, pathB] = positional.map(p => path.resolve(p));
const jsonOutput = args.includes('--json');
const depsOnly = args.includes('--deps-only');
const scriptsOnly = args.includes('--scripts');

async function main() {
  const pkgA = readPackageJson(pathA);
  const pkgB = readPackageJson(pathB);

  if (!pkgA.name && !pkgA.version) {
    console.error(`No valid package.json found at: ${pathA}`);
    process.exit(1);
  }
  if (!pkgB.name && !pkgB.version) {
    console.error(`No valid package.json found at: ${pathB}`);
    process.exit(1);
  }

  if (scriptsOnly) {
    const diff = diffScripts(pkgA, pkgB);
    if (jsonOutput) {
      console.log(JSON.stringify(diff, null, 2));
    } else {
      const added = Object.keys(diff.added).length;
      const removed = Object.keys(diff.removed).length;
      const changed = Object.keys(diff.changed).length;
      console.log(`Scripts: +${added} added, -${removed} removed, ~${changed} changed`);
    }
    return;
  }

  if (depsOnly) {
    const diff = diffDeps(pkgA.dependencies, pkgB.dependencies);
    if (jsonOutput) {
      console.log(JSON.stringify(diff, null, 2));
    } else {
      const added = Object.keys(diff.added).length;
      const removed = Object.keys(diff.removed).length;
      const changed = Object.keys(diff.changed).length;
      console.log(`Dependencies: +${added} added, -${removed} removed, ~${changed} changed`);
    }
    return;
  }

  const result = diffVersions(pkgA, pkgB);
  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('\nnpmdiff report\n' + '='.repeat(40));
    console.log(`A: ${pathA}`);
    console.log(`B: ${pathB}\n`);
    console.log(generateReport(result));
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
