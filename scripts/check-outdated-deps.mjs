#!/usr/bin/env node
/**
 * Reports outdated npm dependencies for mobile and web packages.
 * Run: node scripts/check-outdated-deps.mjs
 * Optional: node scripts/check-outdated-deps.mjs --json
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const jsonOutput = process.argv.includes('--json');

const targets = [
  { name: 'mobile', cwd: path.join(root, 'user-business-mobile', 'MobileApp') },
  { name: 'web', cwd: path.join(root, 'user-business-web') },
];

const report = {};

for (const target of targets) {
  try {
    const raw = execSync('npm outdated --json', {
      cwd: target.cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    report[target.name] = raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    const stdout = err.stdout?.toString?.() ?? '';
    report[target.name] = stdout.trim() ? JSON.parse(stdout) : {};
  }
}

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

console.log('# Dependency outdated report\n');
for (const [name, packages] of Object.entries(report)) {
  const entries = Object.entries(packages);
  console.log(`## ${name} (${entries.length} outdated)\n`);
  if (entries.length === 0) {
    console.log('All dependencies up to date.\n');
    continue;
  }
  for (const [pkg, info] of entries) {
    console.log(
      `- ${pkg}: ${info.current} → wanted ${info.wanted} → latest ${info.latest}`,
    );
  }
  console.log('');
}
