// Compila el sitio Angular dentro de backend/sitio para que la API lo sirva en el mismo dominio.
// Hostinger publica solo la carpeta backend/ (su "directorio raíz"), por eso el sitio debe quedar aquí.
// Si ../frontend no está disponible (p. ej. al construir solo el backend en Docker), publica solo la API.
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backend = fileURLToPath(new URL('..', import.meta.url));
const frontend = path.resolve(backend, '../frontend');
const output = path.join(backend, 'sitio');

if (!existsSync(path.join(frontend, 'package.json'))) {
  console.warn(`\n[sitio] No se encontró la carpeta del frontend (${frontend}): se publica solo la API.`);
  process.exit(0);
}

const env = { ...process.env, NG_CLI_ANALYTICS: 'false' };
function run(command) {
  console.log(`\n==> [frontend] ${command}`);
  execSync(command, { cwd: frontend, stdio: 'inherit', env });
}

// En el servidor no hay node_modules del frontend: se instalan para compilar y se borran después.
const hadDependencies = existsSync(path.join(frontend, 'node_modules'));
if (!hadDependencies) run('npm ci --include=dev --no-audit --no-fund');
run(`npx ng build --output-path "${output}"`);
if (!hadDependencies) {
  for (const folder of ['node_modules', '.angular']) {
    rmSync(path.join(frontend, folder), { recursive: true, force: true });
  }
}

if (!existsSync(path.join(output, 'browser', 'index.html'))) {
  console.error('\n[sitio] La compilación no generó index.html.');
  process.exit(1);
}
console.log(`\n[sitio] Sitio listo en ${path.join(output, 'browser')}`);
