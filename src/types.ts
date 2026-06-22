// SPDX-FileCopyrightText: 2025 Your Org
// SPDX-License-Identifier: MIT

export interface ProjectOptions {
  /** Target directory name / npm package name */
  projectName: string;
  /** Absolute path where the project will be generated */
  targetDir: string;
  /** SPDX license identifier, used for REUSE headers + LICENSE file */
  license: 'MIT' | 'Apache-2.0' | 'UNLICENSED';
  /** Package manager used to install deps and shown in generated docs/CI */
  packageManager: 'bun' | 'npm' | 'pnpm';
  /** Whether to enable the sample "users" CRUD module backed by Mongoose */
  withSampleModule: boolean;
  /** Whether to render Vault Agent example files (.vault/) */
  withVault: boolean;
  /** Whether to run the package manager install after scaffolding */
  install: boolean;
  /** Whether to run `git init` + initial commit after scaffolding */
  gitInit: boolean;
  /** Author name used in package.json / LICENSE / SPDX headers */
  author: string;
}

export type TemplateVars = {
  projectName: string;
  license: ProjectOptions['license'];
  /** SPDX-compliant identifier for headers: same as license, except UNLICENSED -> LicenseRef-Proprietary */
  spdxLicense: string;
  packageManager: ProjectOptions['packageManager'];
  author: string;
  year: string;
  withSampleModule: boolean;
  withVault: boolean;
  /** e.g. "npm run", "pnpm", "bun run" — used in README/docs snippets */
  runCmd: string;
  /** e.g. "npx --no --", "pnpm dlx", "bunx" — used in Husky hooks */
  dlx: string;
  /** e.g. "npm install", "pnpm install", "bun install" */
  installCmd: string;
};
