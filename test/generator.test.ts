// SPDX-FileCopyrightText: 2025 Your Org
// SPDX-License-Identifier: MIT

import { existsSync } from 'node:fs';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateProject } from '../src/generator/index.js';
import type { ProjectOptions } from '../src/types.js';

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), 'cfe-test-'));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function baseOptions(overrides: Partial<ProjectOptions> = {}): ProjectOptions {
  return {
    projectName: 'my-app',
    targetDir: path.join(workDir, 'my-app'),
    license: 'MIT',
    packageManager: 'npm',
    withSampleModule: true,
    withVault: true,
    install: false,
    gitInit: false,
    author: 'Acme Inc',
    ...overrides,
  };
}

describe('generateProject', () => {
  it('renders placeholders and never leaks raw tokens', async () => {
    const options = baseOptions();
    await generateProject(options);

    const pkgRaw = await readFile(path.join(options.targetDir, 'package.json'), 'utf8');
    expect(pkgRaw).toContain('"name": "my-app"');
    expect(pkgRaw).not.toMatch(/__[A-Z_]+__/);

    const appTs = await readFile(path.join(options.targetDir, 'src/app.ts'), 'utf8');
    expect(appTs).not.toMatch(/__[A-Z_]+__/);
    expect(appTs).not.toMatch(/\[\[FEATURE:/);

    const readme = await readFile(path.join(options.targetDir, 'README.md'), 'utf8');
    expect(readme).toContain('# my-app');
    expect(readme).not.toMatch(/__[A-Z_]+__/);
  });

  it('renames escaped dotfiles back to their real names', async () => {
    const options = baseOptions();
    await generateProject(options);

    expect(existsSync(path.join(options.targetDir, '.gitignore'))).toBe(true);
    expect(existsSync(path.join(options.targetDir, 'REUSE.toml'))).toBe(true);
    expect(existsSync(path.join(options.targetDir, '_dot_gitignore'))).toBe(false);
    expect(existsSync(path.join(options.targetDir, '_REUSE.toml'))).toBe(false);
  });

  it('writes a real SPDX-License-Identifier, not the npm-only UNLICENSED value', async () => {
    const options = baseOptions({ license: 'UNLICENSED' });
    await generateProject(options);

    const appTs = await readFile(path.join(options.targetDir, 'src/app.ts'), 'utf8');
    // REUSE-IgnoreStart
    expect(appTs).toContain('SPDX-License-Identifier: LicenseRef-Proprietary');
    // REUSE-IgnoreEnd

    const pkg = JSON.parse(
      await readFile(path.join(options.targetDir, 'package.json'), 'utf8'),
    ) as {
      license: string;
    };
    expect(pkg.license).toBe('UNLICENSED');

    expect(existsSync(path.join(options.targetDir, 'LICENSES/LicenseRef-Proprietary.txt'))).toBe(
      true,
    );
    expect(existsSync(path.join(options.targetDir, 'LICENSES/MIT.txt'))).toBe(false);
  });

  it('omits the sample module and its feature-block markers when disabled', async () => {
    const options = baseOptions({ withSampleModule: false });
    await generateProject(options);

    expect(existsSync(path.join(options.targetDir, 'src/modules/users'))).toBe(false);
    expect(existsSync(path.join(options.targetDir, 'test/modules/users'))).toBe(false);
    expect(existsSync(path.join(options.targetDir, 'src/modules/health'))).toBe(true);

    const appTs = await readFile(path.join(options.targetDir, 'src/app.ts'), 'utf8');
    expect(appTs).not.toContain('userRoutes');
    expect(appTs).not.toMatch(/\[\[FEATURE/);
  });

  it('omits the .vault directory when disabled', async () => {
    const options = baseOptions({ withVault: false });
    await generateProject(options);

    expect(existsSync(path.join(options.targetDir, '.vault'))).toBe(false);
  });

  it('selects the right install/run commands per package manager', async () => {
    const options = baseOptions({ packageManager: 'bun' });
    await generateProject(options);

    const hook = await readFile(path.join(options.targetDir, '.husky/pre-commit'), 'utf8');
    expect(hook).toContain('bunx lint-staged');

    const ci = await readFile(path.join(options.targetDir, '.github/workflows/ci.yml'), 'utf8');
    expect(ci).toContain('oven-sh/setup-bun');
    expect(ci).not.toContain('actions/setup-node');
  });

  it('refuses to write into a non-empty target directory', async () => {
    const options = baseOptions();
    await generateProject(options);

    await expect(generateProject(options)).rejects.toThrow(/not empty/i);
  });
});
