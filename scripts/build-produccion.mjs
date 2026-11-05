// Build de producción cuando la app de Hostinger usa la raíz del repositorio como directorio raíz.
// (Si usa backend/ como directorio raíz, Hostinger ejecuta directamente `npm run build` del backend,
// que ya compila la API y el sitio.)
//
// OJO: al final deja el backend solo con dependencias de producción. En tu equipo no lo necesitas;
// si lo ejecutas, vuelve a correr `npm install` en backend/ para seguir desarrollando.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function run(command, folder) {
  console.log(`\n==> [${folder}] ${command}`);
  execSync(command, { cwd: path.join(root, folder), stdio: 'inherit' });
}

const started = Date.now();

// --include=dev: TypeScript y Angular CLI son dependencias de desarrollo y hacen falta para compilar.
run('npm ci --include=dev --no-audit --no-fund', 'backend');
run('npm run build', 'backend'); // API (backend/dist) + sitio (backend/sitio)
run('npm prune --omit=dev --no-audit --no-fund', 'backend');

for (const required of ['backend/dist/main.js', 'backend/sitio/browser/index.html']) {
  if (!existsSync(path.join(root, required))) {
    console.error(`\nFalta ${required}: el build no se completó.`);
    process.exit(1);
  }
}
console.log(`\nBuild listo en ${Math.round((Date.now() - started) / 1000)} s.`);
