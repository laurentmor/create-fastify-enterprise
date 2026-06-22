// SPDX-FileCopyrightText: 2025 Your Org
// SPDX-License-Identifier: MIT

import { existsSync, readdirSync, statSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Recursively copy a directory, applying a per-file transform to text files.
 * Binary-looking extensions are copied as-is.
 */
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.hcl',
  '.env',
  '.example',
  '.txt',
  '.gitignore',
  '.npmrc',
  '.editorconfig',
  '.nvmrc',
  '.cfg',
  '.toml',
  '.tpl',
  '.dockerfile',
  '',
]);

function isTextFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return TEXT_EXTENSIONS.has(ext) || path.basename(filePath).startsWith('.');
}

export async function copyTemplateDir(
  srcDir: string,
  destDir: string,
  transform: (content: string, relativePath: string) => string,
): Promise<string[]> {
  const writtenFiles: string[] = [];

  async function walk(currentSrc: string, currentDest: string): Promise<void> {
    const entries = readdirSync(currentSrc, { withFileTypes: true });
    await mkdir(currentDest, { recursive: true });

    for (const entry of entries) {
      const srcPath = path.join(currentSrc, entry.name);
      const destPath = path.join(currentDest, renameDotfile(entry.name));

      if (entry.isDirectory()) {
        await walk(srcPath, destPath);
        continue;
      }

      const relativePath = path.relative(destDir, destPath);

      if (isTextFile(srcPath)) {
        const raw = await readFile(srcPath, 'utf8');
        const rendered = transform(raw, relativePath);
        await writeFile(destPath, rendered, 'utf8');
      } else {
        const raw = await readFile(srcPath);
        await writeFile(destPath, raw);
      }

      writtenFiles.push(relativePath);
    }
  }

  await walk(srcDir, destDir);
  return writtenFiles;
}

/**
 * Templates "escape" filenames that would otherwise be picked up/mangled by
 * tooling that runs over the CLI's own repo (which physically contains this
 * `templates/` directory):
 *   - `_dot_gitignore`  -> `.gitignore`  (npm/git treat real dotfiles specially)
 *   - `_REUSE.toml`     -> `REUSE.toml`  (reuse-tool auto-parses any nested
 *                                         REUSE.toml as live config)
 * The leading underscore is stripped on generation either way.
 */
function renameDotfile(name: string): string {
  if (name.startsWith('_dot_')) {
    return `.${name.slice('_dot_'.length)}`;
  }
  if (name.startsWith('_')) {
    return name.slice(1);
  }
  return name;
}

export function assertEmptyOrMissingDir(targetDir: string): void {
  if (!existsSync(targetDir)) {
    return;
  }
  const stat = statSync(targetDir);
  if (!stat.isDirectory()) {
    throw new Error(`Target path "${targetDir}" exists and is not a directory.`);
  }
  const contents = readdirSync(targetDir).filter((f) => f !== '.git');
  if (contents.length > 0) {
    throw new Error(
      `Target directory "${targetDir}" already exists and is not empty. Choose another name or empty it first.`,
    );
  }
}

export async function removeDir(targetDir: string): Promise<void> {
  await rm(targetDir, { recursive: true, force: true });
}

export async function renamePath(from: string, to: string): Promise<void> {
  await rename(from, to);
}
