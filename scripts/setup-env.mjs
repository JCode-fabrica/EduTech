import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = [
  { dir: 'backend', files: ['.env', '.env.development', '.env.production'] },
  { dir: 'frontend', files: ['.env', '.env.development', '.env.production'] }
];

function ensureEnv(dir, file) {
  const example = path.join(root, dir, `${file}.example`);
  const dest = path.join(root, dir, file);
  if (!fs.existsSync(example)) return;
  if (fs.existsSync(dest)) return;
  fs.copyFileSync(example, dest);
  console.log(`Created ${path.join(dir, file)} from ${file}.example`);
}

for (const t of targets) {
  for (const f of t.files) ensureEnv(t.dir, f);
}

console.log('Env setup complete. Review the generated files and adjust values.');

