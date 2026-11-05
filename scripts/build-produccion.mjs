// Build de producción: lo ejecuta Hostinger con `npm run build` en la raíz del repositorio.
//
// 1. API: instala dependencias, compila TypeScript y deja solo las dependencias de producción.
// 2. Sitio: instala dependencias, compila Angular y borra lo que el servidor no necesita.
//
// OJO: al final borra frontend/node_modules y las dependencias de desarrollo del backend.
// En tu equipo no lo necesitas (usa `npm run dev` / `npm start` dentro de cada carpeta);
// si lo ejecutas, vuelve a correr `npm install` en backend/ y frontend/ para seguir desarrollando.
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const env = { ...process.env, NG_CLI_ANALYTICS: 'false' };

function run(command, folder) {
  console.log(`\n==> [${folder}] ${command}`);
  execSync(command, { cwd: path.join(root, folder), stdio: 'inherit', env });
}

const started = Date.now();

// --include=dev: TypeScript y Angular CLI son dependencias de desarrollo y hacen falta para compilar.
run('npm ci --include=dev --no-audit --no-fund', 'backend');
run('npm run build', 'backend');
run('npm prune --omit=dev --no-audit --no-fund', 'backend');

run('npm ci --include=dev --no-audit --no-fund', 'frontend');
run('npm run build', 'frontend');
for (const folder of ['node_modules', '.angular']) {
  rmSync(path.join(root, 'frontend', folder), { recursive: true, force: true });
}

for (const required of ['backend/dist/main.js', 'frontend/dist/frontend/browser/index.html']) {
  if (!existsSync(path.join(root, required))) {
    console.error(`\nFalta ${required}: el build no se completó.`);
    process.exit(1);
  }
}
console.log(`\nBuild listo en ${Math.round((Date.now() - started) / 1000)} s: API en backend/dist, sitio en frontend/dist.`);
