import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildTestApp, type TestApp } from '../support/testApp.js';

/** Despliegue de una sola app: la API también sirve el sitio Angular compilado. */
describe('Sitio servido por la API', () => {
  let t: TestApp;
  let siteDir: string;

  beforeAll(async () => {
    siteDir = await mkdtemp(path.join(os.tmpdir(), 'bm-sitio-'));
    await writeFile(
      path.join(siteDir, 'index.html'),
      `<link rel="stylesheet" href="styles-ABCD1234.css" media="print" onload="this.media='all'"><app-root></app-root>`,
    );
    await writeFile(path.join(siteDir, 'main-ABCD1234.js'), 'console.log(1)');
    await writeFile(path.join(siteDir, 'favicon.ico'), 'ico');
    t = await buildTestApp({ SITE_DIR: siteDir });
  });

  afterAll(async () => {
    await t.dispose();
    await rm(siteDir, { recursive: true, force: true });
  });

  it('entrega index.html en la raíz y en las rutas de Angular, sin caché', async () => {
    for (const url of ['/', '/equipo', '/admin/secciones']) {
      const res = await request(t.app).get(url);
      expect(res.status).toBe(200);
      expect(res.text).toContain('<app-root>');
      expect(res.headers['cache-control']).toBe('no-cache');
    }
  });

  it('cachea para siempre los archivos con hash y por un día los demás', async () => {
    const js = await request(t.app).get('/main-ABCD1234.js');
    expect(js.headers['cache-control']).toContain('immutable');
    const icon = await request(t.app).get('/favicon.ico');
    expect(icon.headers['cache-control']).toBe('public, max-age=86400');
  });

  it('la API y los archivos inexistentes siguen respondiendo 404 en JSON', async () => {
    const api = await request(t.app).get('/api/no-existe');
    expect(api.status).toBe(404);
    expect(api.body.error.code).toBe('NOT_FOUND');
    const missing = await request(t.app).get('/chunk-NOEXISTE.js');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
    expect((await request(t.app).get('/api/health')).body.status).toBe('ok');
  });

  it('la política de seguridad permite el onload de Angular y las fuentes de Google', async () => {
    const csp = (await request(t.app).get('/')).headers['content-security-policy'];
    expect(csp).toContain("script-src-attr 'unsafe-hashes' 'sha256-MhtPZXr7+LpJUY5qtMutB+qWfQtMaPccfe7QXtCcEYc='");
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://fonts.gstatic.com');
    expect(csp).toContain("img-src 'self' data: https:");
  });
});
