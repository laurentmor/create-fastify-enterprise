// SPDX-FileCopyrightText: 2025 Your Org
// SPDX-License-Identifier: MIT

import * as p from '@clack/prompts';
import path from 'node:path';
import validateNpmPackageName from 'validate-npm-package-name';
import type { ProjectOptions } from '../types.js';

export interface CliFlags {
  name?: string | undefined;
  license?: string | undefined;
  packageManager?: string | undefined;
  noSample?: boolean | undefined;
  noVault?: boolean | undefined;
  noInstall?: boolean | undefined;
  noGit?: boolean | undefined;
  author?: string | undefined;
  yes?: boolean | undefined;
}

const DEFAULTS = {
  license: 'MIT' as const,
  packageManager: 'bun' as const,
  author: 'Your Organization',
};

export async function resolveOptions(flags: CliFlags, cwd: string): Promise<ProjectOptions> {
  p.intro('create-fastify-enterprise');

  const projectName = await resolveProjectName(flags.name);
  const license = await resolveLicense(flags.license, flags.yes);
  const packageManager = await resolvePackageManager(flags.packageManager, flags.yes);
  const withSampleModule = flags.noSample
    ? false
    : await resolveBoolean(
        'Include the sample "users" CRUD module (Mongoose model + TypeBox schemas + routes)?',
        true,
        flags.yes,
      );
  const withVault = flags.noVault
    ? false
    : await resolveBoolean(
        'Include Vault-ready example config (.vault/ agent + policy templates)?',
        true,
        flags.yes,
      );
  const install = flags.noInstall
    ? false
    : await resolveBoolean('Install dependencies now?', true, flags.yes);
  const gitInit = flags.noGit
    ? false
    : await resolveBoolean('Initialize a git repository?', true, flags.yes);
  const author = flags.author ?? (flags.yes ? DEFAULTS.author : await resolveAuthor());

  p.outro('Configuration complete. Generating project...');

  return {
    projectName,
    targetDir: path.resolve(cwd, projectName),
    license,
    packageManager,
    withSampleModule,
    withVault,
    install,
    gitInit,
    author,
  };
}

async function resolveProjectName(flagName?: string): Promise<string> {
  if (flagName) {
    const check = validateNpmPackageName(flagName);
    if (!check.validForNewPackages) {
      p.cancel(
        `Invalid project name "${flagName}": ${[...(check.errors ?? []), ...(check.warnings ?? [])].join(', ')}`,
      );
      process.exit(1);
    }
    return flagName;
  }

  const value = await p.text({
    message: 'Project name?',
    placeholder: 'my-service',
    validate: (input) => {
      if (!input) return 'A project name is required';
      const check = validateNpmPackageName(input);
      if (!check.validForNewPackages) {
        return [...(check.errors ?? []), ...(check.warnings ?? [])].join(', ') || 'Invalid name';
      }
      return undefined;
    },
  });

  if (p.isCancel(value)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }

  return value;
}

async function resolveLicense(
  flagLicense?: string,
  yes?: boolean,
): Promise<ProjectOptions['license']> {
  const valid = ['MIT', 'Apache-2.0', 'UNLICENSED'] as const;
  if (flagLicense && (valid as readonly string[]).includes(flagLicense)) {
    return flagLicense as ProjectOptions['license'];
  }
  if (yes) return DEFAULTS.license;

  const value = await p.select({
    message: 'SPDX license for the generated project?',
    options: [
      { value: 'MIT', label: 'MIT', hint: 'permissive, recommended default' },
      { value: 'Apache-2.0', label: 'Apache-2.0', hint: 'permissive, explicit patent grant' },
      { value: 'UNLICENSED', label: 'UNLICENSED', hint: 'proprietary / closed source' },
    ],
  });

  if (p.isCancel(value)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }

  return value;
}

async function resolvePackageManager(
  flagPm?: string,
  yes?: boolean,
): Promise<ProjectOptions['packageManager']> {
  const valid = ['bun', 'npm', 'pnpm'] as const;
  if (flagPm && (valid as readonly string[]).includes(flagPm)) {
    return flagPm as ProjectOptions['packageManager'];
  }
  if (yes) return DEFAULTS.packageManager;

  const value = await p.select({
    message: 'Package manager?',
    options: [
      { value: 'bun', label: 'bun', hint: 'recommended, fastest install + native TS' },
      { value: 'npm', label: 'npm' },
      { value: 'pnpm', label: 'pnpm' },
    ],
  });

  if (p.isCancel(value)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }

  return value;
}

async function resolveBoolean(
  message: string,
  defaultValue: boolean,
  yes?: boolean,
): Promise<boolean> {
  if (yes) return defaultValue;

  const value = await p.confirm({ message, initialValue: defaultValue });

  if (p.isCancel(value)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }

  return value;
}

async function resolveAuthor(): Promise<string> {
  const value = await p.text({
    message: 'Author / organization name (used in LICENSE and SPDX headers)?',
    placeholder: DEFAULTS.author,
    defaultValue: DEFAULTS.author,
  });

  if (p.isCancel(value)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }

  return value || DEFAULTS.author;
}
