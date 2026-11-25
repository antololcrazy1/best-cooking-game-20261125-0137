// main.ts — the entry program for Sizzle & Serve. It copies the playable
// game and its screenshots into the output directory and writes the dossier
// the make.fun scorer compares byte for byte. Standard library only.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function countFiles(dir: string): number {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile()).length;
}

function copyTree(name: string): number {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  if (!existsSync(from)) {
    throw new Error(`missing ${name}/ in the repository`);
  }
  const files = countFiles(from);
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
  return files;
}

mkdirSync(outputDir, { recursive: true });
const gameFiles = copyTree('game');
const shotFiles = copyTree('screenshots');
if (shotFiles === 0) throw new Error('screenshots/ holds no images');

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`copied ${gameFiles} game files and ${shotFiles} screenshots`);
console.log(`wrote ${join(outputDir, 'dossier.json')} (${dossier.length} bytes)`);
