#!/usr/bin/env bun
// SPDX-FileCopyrightText: 2025 Your Org
// SPDX-License-Identifier: MIT

import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolveOptions, type CliFlags } from './prompts/index.js';
import { generateProject } from './generator/index.js';
import { gitInitAndCommit, installCommand, isCommandAvailable, run } from './utils/process.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, '../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
    return pkg.version;
  } catch {
    return '0.0.0';
  }
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('create-fastify-enterprise')
    .description(
      'Scaffold an enterprise-grade Fastify + TypeBox + MongoDB/Mongoose service with CI, OpenAPI, Vault-ready config and REUSE/SPDX compliance.',
    )
    .version(readVersion())
    .argument('[project-name]', 'name of the project / target directory')
    .option('-l, --license <license>', 'SPDX license id: MIT | Apache-2.0 | UNLICENSED')
    .option('-p, --package-manager <pm>', 'package manager: bun | npm | pnpm')
    .option('--no-sample', 'skip the sample "users" CRUD module')
    .option('--no-vault', 'skip Vault-ready example config')
    .option('--no-install', 'skip dependency installation')
    .option('--no-git', 'skip git repository initialization')
    .option('-a, --author <author>', 'author / organization name')
    .option('-y, --yes', 'accept all defaults, skip interactive prompts')
    .action(async (projectName: string | undefined, opts: Record<string, unknown>) => {
      const flags: CliFlags = {
        name: projectName,
        license: opts.license as string | undefined,
        packageManager: opts.packageManager as string | undefined,
        noSample: opts.sample === false,
        noVault: opts.vault === false,
        noInstall: opts.install === false,
        noGit: opts.git === false,
        author: opts.author as string | undefined,
        yes: Boolean(opts.yes),
      };

      const options = await resolveOptions(flags, process.cwd());

      const spinner = p.spinner();
      spinner.start(`Scaffolding ${pc.cyan(options.projectName)}`);
      let fileCount: number;
      try {
        const written = await generateProject(options);
        fileCount = written.length;
      } catch (error) {
        spinner.stop('Failed to scaffold project', 1);
        p.log.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
        return;
      }
      spinner.stop(
        `Created ${fileCount} files in ${pc.cyan(path.relative(process.cwd(), options.targetDir) || '.')}`,
      );

      if (options.install) {
        const available = await isCommandAvailable(options.packageManager);
        if (!available) {
          p.log.warn(
            `"${options.packageManager}" was not found on PATH. Skipping install — run it manually inside the project.`,
          );
        } else {
          const installSpinner = p.spinner();
          installSpinner.start(`Installing dependencies with ${options.packageManager}`);
          const [cmd, args] = installCommand(options.packageManager);
          const result = await run(cmd, args, options.targetDir, { silent: true });
          if (result.code === 0) {
            installSpinner.stop('Dependencies installed');
          } else {
            installSpinner.stop('Dependency installation failed — run it manually', 1);
            if (result.stderr) p.log.error(result.stderr.split('\n').slice(-20).join('\n'));
          }
        }
      }

      if (options.gitInit) {
        const gitAvailable = await isCommandAvailable('git');
        if (gitAvailable) {
          const ok = await gitInitAndCommit(options.targetDir);
          if (ok) p.log.success('Initialized git repository with an initial commit');
          else p.log.warn('Could not initialize git repository automatically');
        } else {
          p.log.warn('git was not found on PATH. Skipping repository initialization.');
        }
      }

      printNextSteps(options);
    });

  await program.parseAsync(process.argv);
}

function printNextSteps(options: {
  projectName: string;
  targetDir: string;
  packageManager: string;
  install: boolean;
}): void {
  const rel = path.relative(process.cwd(), options.targetDir) || '.';
  const lines = [
    '',
    pc.bold('Next steps:'),
    `  cd ${rel}`,
    !options.install ? `  ${options.packageManager} install` : null,
    `  cp .env.example .env`,
    `  ${options.packageManager === 'bun' ? 'bun run' : `${options.packageManager} run`} dev`,
    '',
    pc.dim('Docs:    README.md'),
    pc.dim('OpenAPI: http://localhost:3000/docs once the server is running'),
    pc.dim('Health:  http://localhost:3000/health'),
    '',
  ].filter((l): l is string => l !== null);

  console.log(lines.join('\n'));
}

main().catch((error: unknown) => {
  p.log.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});
