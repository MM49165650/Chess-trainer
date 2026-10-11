// Lists the licence of every PHP and Node dependency and fails when one is
// not in approved-licences.json. Every approved licence must be compatible
// with GPL-3.0. Licences under "developmentOnly" are accepted for development
// tools but fail the check on a production dependency, which is one that is
// installed on the server or bundled for the browser. A package whose licence
// cannot be read automatically goes in "exceptions", as package name to
// licence, after a check by hand.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Approved = {
    approved: string[];
    developmentOnly: string[];
    exceptions: Record<string, string>;
};
type Dependency = { name: string; licence: string | null; production: boolean };

const here = import.meta.dirname;
const root = join(here, '..', '..');

function readJson(path: string): unknown {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asLicence(value: unknown): string | null {
    if (typeof value === 'string' && value !== '') {
        return value;
    }

    // Composer lists alternatives as an array; older Node packages use
    // an object with a "type" field.
    if (Array.isArray(value) && value.length > 0) {
        return value.map(String).join(' OR ');
    }

    if (isRecord(value) && typeof value.type === 'string') {
        return value.type;
    }

    return null;
}

function composerLicences(...options: string[]): Record<string, unknown> {
    const output = execFileSync(
        'composer',
        ['licenses', '--format=json', ...options],
        { cwd: root, encoding: 'utf8' },
    );
    const parsed: unknown = JSON.parse(output);
    const dependencies = isRecord(parsed) ? parsed.dependencies : null;

    if (!isRecord(dependencies)) {
        throw new Error('Unexpected output from "composer licenses".');
    }

    return dependencies;
}

function phpDependencies(): Dependency[] {
    const production = new Set(Object.keys(composerLicences('--no-dev')));

    return Object.entries(composerLicences()).map(([name, details]) => ({
        name: `php:${name}`,
        licence: isRecord(details) ? asLicence(details.license) : null,
        production: production.has(name),
    }));
}

function nodeDependencies(): Dependency[] {
    const lock = readJson(join(root, 'package-lock.json'));
    const packages = isRecord(lock) ? lock.packages : null;

    if (!isRecord(packages)) {
        throw new Error('Unexpected shape of package-lock.json.');
    }

    const dependencies: Dependency[] = [];

    for (const [path, entry] of Object.entries(packages)) {
        const manifest = join(root, path, 'package.json');

        // The root package, and optional packages for other platforms.
        if (path === '' || !existsSync(manifest)) {
            continue;
        }

        const installed = readJson(manifest);
        const fromLock = isRecord(entry) ? asLicence(entry.license) : null;
        const fromManifest = isRecord(installed)
            ? asLicence(installed.license)
            : null;

        dependencies.push({
            name: `node:${path.replace(/^.*node_modules\//, '')}`,
            licence: fromLock ?? fromManifest,
            // The lock file marks packages that only development needs.
            production: !(isRecord(entry) && entry.dev === true),
        });
    }

    return dependencies;
}

// Handles the licence expressions that occur in practice: names joined by
// OR (any one may be chosen) or by AND (all apply), with optional brackets.
function isApproved(expression: string, approved: Set<string>): boolean {
    const text = expression.replace(/[()]/g, '').trim();

    if (/\sOR\s/i.test(text)) {
        return text
            .split(/\s+OR\s+/i)
            .some((part) => isApproved(part, approved));
    }

    if (/\sAND\s/i.test(text)) {
        return text
            .split(/\s+AND\s+/i)
            .every((part) => isApproved(part, approved));
    }

    return approved.has(text);
}

const config = readJson(join(here, 'approved-licences.json')) as Approved;
const forProduction = new Set(config.approved);
const forDevelopment = new Set([...config.approved, ...config.developmentOnly]);
const counts = new Map<string, number>();
const rejected: string[] = [];

for (const dependency of [...phpDependencies(), ...nodeDependencies()]) {
    const bareName = dependency.name.replace(/^(php|node):/, '');
    const licence = dependency.licence ?? config.exceptions[bareName] ?? null;
    const label = licence ?? 'unknown';

    counts.set(label, (counts.get(label) ?? 0) + 1);

    if (licence === null) {
        rejected.push(`${dependency.name}: ${label}`);
    } else if (!isApproved(licence, forDevelopment)) {
        rejected.push(`${dependency.name}: ${label}`);
    } else if (dependency.production && !isApproved(licence, forProduction)) {
        rejected.push(
            `${dependency.name}: ${label} (approved for development only, but this is a production dependency)`,
        );
    }
}

console.log('Dependency licences:');

for (const [licence, count] of [...counts].sort(([a], [b]) =>
    a.localeCompare(b),
)) {
    console.log(`  ${String(count).padStart(4)}  ${licence}`);
}

if (rejected.length > 0) {
    console.error('\nNot approved:');

    for (const line of rejected) {
        console.error(`  ${line}`);
    }

    process.exit(1);
}

console.log('\nAll dependency licences are approved.');
