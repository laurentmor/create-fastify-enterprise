// SPDX-FileCopyrightText: 2025 Your Org
// SPDX-License-Identifier: MIT

import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyTemplateDir, assertEmptyOrMissingDir } from '../utils/fs.js';
import type { ProjectOptions, TemplateVars } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// When bundled to dist/index.js, templates/ sits next to it (see package.json `files`
// and the build script). In dev (bun run src/index.ts) it sits at the repo root.
function resolveTemplatesRoot(): string {
  const candidates = [
    path.resolve(__dirname, '../templates'), // dist/index.js -> ../templates
    path.resolve(__dirname, '../../templates'), // src/generator/index.ts -> ../../templates
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    `Could not locate the "templates" directory. Looked in:\n${candidates.join('\n')}`,
  );
}

/**
 * Feature blocks in template source files are wrapped like:
 *   // [[FEATURE:sampleModule:start]]
 *   ...code...
 *   // [[FEATURE:sampleModule:end]]
 *
 * If the feature is enabled, the marker lines are stripped and the content kept.
 * If disabled, the marker lines AND the content between them are removed.
 */
function stripFeatureBlocks(content: string, features: Record<string, boolean>): string {
  const lines = content.split('\n');
  const output: string[] = [];
  let skipping = false;

  for (const line of lines) {
    const startMatch = /\[\[FEATURE:(\w+):start\]\]/.exec(line);
    const endMatch = /\[\[FEATURE:(\w+):end\]\]/.exec(line);

    if (startMatch) {
      const enabled = features[startMatch[1] as string] ?? true;
      skipping = !enabled;
      continue; // never keep the marker line itself
    }
    if (endMatch) {
      skipping = false;
      continue;
    }
    if (!skipping) output.push(line);
  }

  return output.join('\n');
}

function renderPlaceholders(content: string, vars: TemplateVars): string {
  return (
    content
      .replaceAll('__PROJECT_NAME__', vars.projectName)
      .replaceAll('__AUTHOR__', vars.author)
      .replaceAll('__YEAR__', vars.year)
      .replaceAll('__LICENSE__', vars.license)
      .replaceAll('__SPDX_LICENSE__', vars.spdxLicense)
      // REUSE-IgnoreStart
      // (the line below assembles a real SPDX tag as data, which would
      // otherwise look like an invalid header to a naive text scan of *this*
      // file)
      .replaceAll('__SPDX_ID_LINE__', `SPDX-License-Identifier: ${vars.spdxLicense}`)
      // REUSE-IgnoreEnd
      .replaceAll('__PACKAGE_MANAGER__', vars.packageManager)
      .replaceAll('__RUN__', vars.runCmd)
      .replaceAll('__DLX__', vars.dlx)
      .replaceAll('__INSTALL__', vars.installCmd)
  );
}

function pmCommands(
  pm: ProjectOptions['packageManager'],
): Pick<TemplateVars, 'runCmd' | 'dlx' | 'installCmd'> {
  switch (pm) {
    case 'bun':
      return { runCmd: 'bun run', dlx: 'bunx', installCmd: 'bun install' };
    case 'pnpm':
      return { runCmd: 'pnpm', dlx: 'pnpm dlx', installCmd: 'pnpm install' };
    case 'npm':
    default:
      return { runCmd: 'npm run', dlx: 'npx --no --', installCmd: 'npm install' };
  }
}

const LICENSE_FILES: Record<TemplateVars['license'], string> = {
  MIT: 'MIT.txt',
  'Apache-2.0': 'Apache-2.0.txt',
  UNLICENSED: 'LicenseRef-Proprietary.txt',
};

// "UNLICENSED" is an npm package.json convention ("do not publish"), not a
// valid SPDX license identifier. REUSE/SPDX headers need a real identifier,
// so proprietary projects use the LicenseRef- namespace instead.
const SPDX_LICENSE_IDS: Record<TemplateVars['license'], string> = {
  MIT: 'MIT',
  'Apache-2.0': 'Apache-2.0',
  UNLICENSED: 'LicenseRef-Proprietary',
};

export async function generateProject(options: ProjectOptions): Promise<string[]> {
  assertEmptyOrMissingDir(options.targetDir);

  const templatesRoot = resolveTemplatesRoot();
  const srcDir = path.join(templatesRoot, 'default');

  const vars: TemplateVars = {
    projectName: options.projectName,
    license: options.license,
    spdxLicense: SPDX_LICENSE_IDS[options.license],
    packageManager: options.packageManager,
    author: options.author,
    year: String(new Date().getFullYear()),
    withSampleModule: options.withSampleModule,
    withVault: options.withVault,
    ...pmCommands(options.packageManager),
  };

  const features: Record<string, boolean> = {
    sampleModule: options.withSampleModule,
    vault: options.withVault,
    pmBun: options.packageManager === 'bun',
    pmNpm: options.packageManager === 'npm',
    pmPnpm: options.packageManager === 'pnpm',
  };

  await mkdir(options.targetDir, { recursive: true });

  const written = await copyTemplateDir(srcDir, options.targetDir, (content, relativePath) => {
    if (relativePath.endsWith('.png') || relativePath.endsWith('.ico')) return content;
    const stripped = stripFeatureBlocks(content, features);
    return renderPlaceholders(stripped, vars);
  });

  // Drop the entire users module + its test if the sample module was declined.
  if (!options.withSampleModule) {
    await rm(path.join(options.targetDir, 'src/modules/users'), { recursive: true, force: true });
    await rm(path.join(options.targetDir, 'test/modules/users'), { recursive: true, force: true });
  }

  // Drop Vault example assets if declined.
  if (!options.withVault) {
    await rm(path.join(options.targetDir, '.vault'), { recursive: true, force: true });
  }

  // REUSE expects every license referenced by SPDX-License-Identifier to live
  // under LICENSES/. We only ship the one the user actually picked, and use
  // the same text to generate the root LICENSE file.
  const licensesDir = path.join(options.targetDir, 'LICENSES');
  const chosenLicenseFile = LICENSE_FILES[options.license];
  const sourceLicenseText = await readFile(
    path.join(srcDir, 'LICENSES', chosenLicenseFile),
    'utf8',
  );
  const renderedLicenseText = renderPlaceholders(sourceLicenseText, vars);

  await rm(licensesDir, { recursive: true, force: true });
  await mkdir(licensesDir, { recursive: true });
  await writeFile(path.join(licensesDir, chosenLicenseFile), renderedLicenseText, 'utf8');
  await writeFile(path.join(options.targetDir, 'LICENSE'), renderedLicenseText, 'utf8');

  return written;
}
