import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const name = `${path}/${entry.name}`;
    if (entry.isDirectory()) { await walk(name); continue; }
    const text = await readFile(name, 'utf8');
    if (text.split('\n').length > 500) throw new Error(`${name} exceeds 500 lines`);
    if (/\.(m?js)$/.test(name)) {
      const result = spawnSync(process.execPath, ['--check', name], { encoding: 'utf8' });
      if (result.status) throw new Error(result.stderr);
    }
  }
}
for (const folder of ['src', 'scripts', 'tests']) await walk(folder);
console.log('Syntax and source file size checks passed.');
