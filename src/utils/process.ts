// SPDX-FileCopyrightText: 2025 Your Org
// SPDX-License-Identifier: MIT

import { spawn } from 'node:child_process';

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export function run(
  command: string,
  args: string[],
  cwd: string,
  { silent = false }: { silent?: boolean } = {},
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: process.platform === 'win32',
      stdio: silent ? 'pipe' : 'inherit',
    });

    let stdout = '';
    let stderr = '';
    if (silent) {
      child.stdout?.on('data', (d: Buffer) => (stdout += d.toString()));
      child.stderr?.on('data', (d: Buffer) => (stderr += d.toString()));
    }

    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

export function installCommand(packageManager: 'bun' | 'npm' | 'pnpm'): [string, string[]] {
  switch (packageManager) {
    case 'bun':
      return ['bun', ['install']];
    case 'pnpm':
      return ['pnpm', ['install']];
    case 'npm':
    default:
      return ['npm', ['install']];
  }
}

export async function isCommandAvailable(command: string): Promise<boolean> {
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = await run(checkCmd, [command], process.cwd(), { silent: true });
  return result.code === 0;
}

export async function gitInitAndCommit(cwd: string): Promise<boolean> {
  const init = await run('git', ['init', '-q'], cwd, { silent: true });
  if (init.code !== 0) return false;
  await run('git', ['add', '-A'], cwd, { silent: true });
  const commit = await run(
    'git',
    ['commit', '-q', '-m', 'chore: initial scaffold from create-fastify-enterprise'],
    cwd,
    { silent: true },
  );
  return commit.code === 0;
}
