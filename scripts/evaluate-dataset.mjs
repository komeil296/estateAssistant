import { readFile } from 'node:fs/promises';

const datasetPath = new URL('../datasets/seed-examples.jsonl', import.meta.url);
const apiUrl = process.env.API_URL ?? 'http://localhost:3000/ai/parse-search';

function getPath(value, path) {
  return path.split('.').reduce((current, key) => current?.[key], value);
}

function flattenExpected(value, prefix = '') {
  const result = [];
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      child !== null &&
      typeof child === 'object' &&
      !Array.isArray(child)
    ) {
      result.push(...flattenExpected(child, path));
    } else {
      result.push([path, child]);
    }
  }
  return result;
}

function sameValue(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

const lines = (await readFile(datasetPath, 'utf8'))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

let totalChecks = 0;
let passedChecks = 0;
let passedCases = 0;

console.log(`Evaluating ${lines.length} examples against ${apiUrl}\n`);

for (const line of lines) {
  const example = JSON.parse(line);
  let response;

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: example.text }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    response = await res.json();
  } catch (error) {
    console.error(`[ERROR] ${example.id}: ${error.message}`);
    process.exitCode = 1;
    continue;
  }

  const checks = flattenExpected(example.expected);
  const failures = [];

  for (const [path, expected] of checks) {
    totalChecks += 1;
    const actual = getPath(response, path);
    if (sameValue(actual, expected)) {
      passedChecks += 1;
    } else {
      failures.push({ path, expected, actual });
    }
  }

  if (failures.length === 0) {
    passedCases += 1;
    console.log(`[PASS] ${example.id} — ${example.text}`);
  } else {
    console.log(`[FAIL] ${example.id} — ${example.text}`);
    for (const failure of failures) {
      console.log(
        `       ${failure.path}: expected=${JSON.stringify(failure.expected)}, actual=${JSON.stringify(failure.actual)}`,
      );
    }
  }
}

console.log(
  `\nResult: ${passedCases}/${lines.length} examples fully passed; ${passedChecks}/${totalChecks} field checks passed.`,
);

if (passedCases !== lines.length) {
  process.exitCode = 1;
}
