import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, buildTestApp, type TestApp } from '../support/testApp.js';

describe('API HTTP', () => {
  let t: TestApp;
  let token: string;

  beforeAll(async () => {
    t = await buildTestApp();
    const res = await request(t.app).post('/api/auth/login').send(ADMIN);
    token = res.body.token;
  });

  afterAll(async () => {
    await t.dispose();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  describe('autenticación', () => {
    it('rechaza credenciales inválidas con el formato de error estándar', async () => {
      const res = await request(t.app).post('/api/auth/login').send({ ...ADMIN, password: 'mala' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Correo o contraseña incorrectos' } });
    });

    it('entrega token al administrador', async () => {
      expect(token).toBeTypeOf('string');
      const me = await request(t.app).get('/api/auth/me').set(auth());
      expect(me.body.admin.email).toBe(ADMIN.email);
    });

    it('las escrituras exigen sesión', async () => {
      const res = await request(t.app).post('/api/sections').send({ page: 'home', key: 'x', title: 'X' });
      expect(res.status).toBe(401);
      const tampered = await request(t.app).get('/api/auth/me').set({ Authorization: `Bearer ${token}x` });
      expect(tampered.status).toBe(401);
    });
  });

  describe('secciones', () => {
    it('la página de inicio trae las secciones iniciales en orden', async () => {
      const res = await request(t.app).get('/api/sections?page=home');
      expect(res.status).toBe(200);
      expect(res.body.map((s: { key: string }) => s.key)).toEqual([
        'hero',
        'overview',
        'history',
        'founders',
        'mission-vision',
      ]);
    });

    it('cada página del menú tiene su contenido inicial', async () => {
      for (const page of ['about', 'services', 'human-values', 'team', 'contact']) {
        const res = await request(t.app).get(`/api/sections?page=${page}`);
        expect(res.status).toBe(200);
        expect(res.body[0].key).toBe('intro');
        expect(res.body.length).toBeGreaterThan(1);
      }
    });

    it('el menú lista las secciones de cada página, sin encabezados', async () => {
      const res = await request(t.app).get('/api/navigation');
      expect(res.status).toBe(200);
      expect(res.body.map((p: { page: string }) => p.page)).toEqual([
        'home',
        'about',
        'services',
        'human-values',
        'team',
        'contact',
      ]);
      const home = res.body[0].sections.map((s: { key: string }) => s.key);
      expect(home).toEqual(['overview', 'history', 'founders', 'mission-vision']);
      const values = res.body[3].sections.map((s: { key: string }) => s.key);
      expect(values).toEqual(['value-bank', 'more-values', 'worksheets']);
    });

    it('guarda el diseño elegido y rechaza diseños desconocidos', async () => {
      const created = await request(t.app)
        .post('/api/sections')
        .set(auth())
        .send({ page: 'team', key: 'voluntarios', title: 'Voluntarios', layout: 'people', items: [{ title: 'Ana' }] });
      expect(created.status).toBe(201);
      expect(created.body.layout).toBe('people');

      const kept = await request(t.app)
        .put(`/api/sections/${created.body.id}`)
        .set(auth())
        .send({ title: 'Voluntariado' });
      expect(kept.body.layout).toBe('people');

      const invalid = await request(t.app)
        .put(`/api/sections/${created.body.id}`)
        .set(auth())
        .send({ title: 'Voluntariado', layout: 'carrusel-3d' });
      expect(invalid.status).toBe(400);
      expect(invalid.body.error.details.fields[0].field).toBe('layout');

      const menu = await request(t.app).get('/api/navigation');
      const team = menu.body.find((p: { page: string }) => p.page === 'team');
      expect(team.sections.at(-1)).toEqual({ key: 'voluntarios', title: 'Voluntariado' });

      await request(t.app).delete(`/api/sections/${created.body.id}`).set(auth());
    });

    it('valida la página solicitada', async () => {
      const res = await request(t.app).get('/api/sections?page=blog');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('el admin edita los fundadores y el público ve el cambio', async () => {
      const [founders] = (await request(t.app).get('/api/sections?page=home')).body.filter(
        (s: { key: string }) => s.key === 'founders',
      );
      const res = await request(t.app)
        .put(`/api/sections/${founders.id}`)
        .set(auth())
        .send({
          title: 'Fundadores',
          items: [
            { title: 'María Pérez', description: 'Docente', imageUrl: 'https://cdn.test/images/maria.jpg' },
            { title: 'Juan Gómez' },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.items.map((i: { title: string }) => i.title)).toEqual(['María Pérez', 'Juan Gómez']);

      const publicView = await request(t.app).get(`/api/sections/${founders.id}`);
      expect(publicView.body.items).toHaveLength(2);
    });

    it('crea secciones nuevas, rechaza duplicadas y protege las estructurales', async () => {
      const created = await request(t.app)
        .post('/api/sections')
        .set(auth())
        .send({ page: 'home', key: 'aliados', title: 'Aliados' });
      expect(created.status).toBe(201);
      expect(created.body.position).toBe(5);
      expect(created.body.layout).toBe('cards');

      const duplicated = await request(t.app)
        .post('/api/sections')
        .set(auth())
        .send({ page: 'home', key: 'aliados', title: 'Otra' });
      expect(duplicated.status).toBe(409);

      const hero = (await request(t.app).get('/api/sections?page=home')).body[0];
      const deleteHero = await request(t.app).delete(`/api/sections/${hero.id}`).set(auth());
      expect(deleteHero.status).toBe(422);
      expect(deleteHero.body.error.code).toBe('BUSINESS_RULE_VIOLATION');

      const deleted = await request(t.app).delete(`/api/sections/${created.body.id}`).set(auth());
      expect(deleted.status).toBe(204);
    });
  });

  describe('cartillas', () => {
    const pdf = Buffer.from('%PDF-1.4 cartilla de prueba');

    it('carga, lista por nivel y descarga una cartilla', async () => {
      const created = await request(t.app)
        .post('/api/worksheets')
        .set(auth())
        .field('title', 'Respeto y Convivencia')
        .field('description', 'Actividades para el aula')
        .field('humanValue', 'Respeto')
        .field('level', 'primary')
        .attach('file', pdf, { filename: 'Cartilla Educación.pdf', contentType: 'application/pdf' });
      expect(created.status).toBe(201);
      expect(created.body.file).toMatchObject({ name: 'Cartilla Educación.pdf', mimeType: 'application/pdf' });

      const preschool = await request(t.app).get('/api/worksheets?level=preschool');
      expect(preschool.status).toBe(200);
      expect(preschool.body).toHaveLength(0);

      const primary = await request(t.app).get('/api/worksheets?level=primary');
      const secondary = await request(t.app).get('/api/worksheets?level=secondary');
      expect(primary.body).toHaveLength(1);
      expect(secondary.body).toHaveLength(0);

      const download = await request(t.app).get(`/api/worksheets/${created.body.id}/download`).buffer(true);
      expect(download.status).toBe(200);
      expect(download.headers['content-disposition']).toContain('respeto-y-convivencia.pdf');
      expect(Buffer.from(download.body).equals(pdf)).toBe(true);
    });

    it('rechaza tipos de archivo no permitidos', async () => {
      const res = await request(t.app)
        .post('/api/worksheets')
        .set(auth())
        .field('title', 'X')
        .field('description', 'X')
        .field('humanValue', 'X')
        .field('level', 'primary')
        .attach('file', Buffer.from('<script>'), { filename: 'x.html', contentType: 'text/html' });
      expect(res.status).toBe(415);
      expect(res.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
    });

    it('devuelve 404 estándar si la cartilla no existe', async () => {
      const res = await request(t.app).get('/api/worksheets/7b0c1c63-0b8b-4a8a-9a5a-1e2f3a4b5c6d/download');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('imágenes y errores', () => {
    it('sube una imagen y devuelve su URL pública', async () => {
      const png = Buffer.from('89504e470d0a1a0a', 'hex');
      const res = await request(t.app)
        .post('/api/media/images')
        .set(auth())
        .attach('file', png, { filename: 'portada.png', contentType: 'image/png' });
      expect(res.status).toBe(201);
      expect(res.body.url).toMatch(/^https:\/\/cdn\.test\/images\/[0-9a-f-]+\.png$/);
    });

    it('rutas inexistentes y JSON mal formado usan el formato estándar', async () => {
      const missing = await request(t.app).get('/api/no-existe');
      expect(missing.status).toBe(404);
      const badJson = await request(t.app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email":');
      expect(badJson.status).toBe(400);
      expect(badJson.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('los errores inesperados no filtran detalles internos', async () => {
      t.sections.findByPage = async () => {
        throw new Error("ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'10.0.0.5'");
      };
      const res = await request(t.app).get('/api/sections?page=home');
      expect(res.status).toBe(500);
      expect(JSON.stringify(res.body)).not.toContain('root');
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
