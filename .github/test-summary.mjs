// The result of a run of the browser tests, as Markdown for the job's summary
// on GitHub: how many passed, which passed only on the retry, which failed and
// which took longest. A retry turns an unstable test green, and without this
// it would go unnoticed. Reads what the JSON reporter wrote.
// Usage: node .github/test-summary.mjs <part>
import { readFileSync } from 'node:fs';

const part = process.argv[2] ?? 'tests';
const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;

let report;
try {
  report = JSON.parse(
    readFileSync('playwright-report/results.json', { encoding: 'utf8' }),
  );
} catch {
  console.log(`### ${part}\n\nThe tests left no report: they did not finish.`);
  process.exit(0);
}

const tests = [];
const walk = (suite, titles) => {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      tests.push({
        name: [`[${test.projectName}]`, ...titles, spec.title].join(' › '),
        status: test.status,
        duration: Math.max(0, ...test.results.map((r) => r.duration ?? 0)),
      });
    }
  }
  for (const child of suite.suites ?? []) {
    walk(child, [...titles, child.title]);
  }
};
for (const file of report.suites ?? []) walk(file, []);

const { expected, unexpected, flaky, skipped, duration } = report.stats;
const lines = [
  `### ${part}`,
  '',
  `${expected} passed, ${flaky} unstable, ${unexpected} failed, ${skipped} skipped, in ${seconds(duration)}.`,
];
const list = (title, status) => {
  const found = tests.filter((test) => test.status === status);
  if (!found.length) return;
  lines.push('', `**${title}**`, '');
  for (const test of found) lines.push(`- ${test.name}`);
};
list('Failed', 'unexpected');
list('Unstable: failed, then passed on the retry', 'flaky');
const slowest = tests
  .filter((test) => test.status !== 'skipped')
  .sort((a, b) => b.duration - a.duration)
  .slice(0, 5);
if (slowest.length) {
  lines.push('', '**Slowest**', '', '| Time | Test |', '| --- | --- |');
  for (const test of slowest) {
    lines.push(`| ${seconds(test.duration)} | ${test.name} |`);
  }
}
console.log(lines.join('\n'));
