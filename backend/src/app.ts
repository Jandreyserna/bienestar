import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type Express, type RequestHandler, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { AppContainer } from './container.js';
import { errorHandler, notFoundHandler } from './shared/infrastructure/http/errorHandler.js';

/**
 * Construye la aplicación Express a partir del contenedor (no abre puertos: útil para tests).
 * Los tests registran sus dobles en el contenedor ANTES de llamar a esta función.
 */
export function createApp(container: AppContainer): Express {
  const {
    config,
    logger,
    database,
    adminGuard,
    imageUpload,
    documentUpload,
    authController,
    sectionController,
    worksheetController,
    mediaController,
  } = container.cradle;

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.http.trustProxy ? 1 : false);

  // Las imágenes las consume el frontend desde otro origen, por eso CORP cross-origin.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          // Angular carga su CSS con onload="this.media='all'": se permite solo ese fragmento exacto.
          'script-src-attr': ["'unsafe-hashes'", `'${STYLESHEET_ONLOAD_HASH}'`],
          // Las secciones pueden usar imágenes de otros sitios (URL pegada en el panel).
          'img-src': ["'self'", 'data:', 'https:'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
        },
      },
    }),
  );
  app.use(cors({ origin: config.http.corsOrigins, exposedHeaders: ['Content-Disposition'] }));
  app.use(express.json({ limit: '1mb' }));

  if (config.storage.driver === 'local') {
    app.use('/uploads', express.static(config.storage.rootDir, { index: false, dotfiles: 'deny', maxAge: '7d' }));
  }

  const api = Router();

  api.get('/health', async (_req, res) => {
    const up = await database.ping();
    res.status(up ? 200 : 503).json({ status: up ? 'ok' : 'degraded', database: up ? 'up' : 'down' });
  });

  // --- Autenticación del panel
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.env === 'test' ? 1000 : 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos. Espera unos minutos.' } },
  });
  const auth = Router();
  auth.post('/login', loginLimiter, authController.signIn);
  auth.get('/me', adminGuard, authController.me);
  api.use('/auth', auth);

  // --- Secciones de las páginas: lectura pública, escritura solo admin.
  const sections = Router();
  sections.get('/', sectionController.list);
  sections.get('/:id', sectionController.get);
  sections.post('/', adminGuard, sectionController.create);
  sections.put('/:id', adminGuard, sectionController.update);
  sections.delete('/:id', adminGuard, sectionController.remove);
  api.use('/sections', sections);
  api.get('/navigation', sectionController.navigation);

  // --- Cartillas de valores humanos. El guard va antes de la carga: un anónimo nunca sube nada.
  const worksheets = Router();
  worksheets.get('/', worksheetController.list);
  worksheets.get('/:id', worksheetController.get);
  worksheets.get('/:id/download', worksheetController.download);
  worksheets.post('/', adminGuard, ...documentUpload, worksheetController.create);
  worksheets.put('/:id', adminGuard, ...documentUpload, worksheetController.update);
  worksheets.delete('/:id', adminGuard, worksheetController.remove);
  api.use('/worksheets', worksheets);

  // --- Imágenes (portada, historia, fundadores...)
  const media = Router();
  media.post('/images', adminGuard, ...imageUpload, mediaController.uploadImageFile);
  api.use('/media', media);

  app.use('/api', api);

  // Sitio público y panel (Angular compilado) en el mismo dominio que la API.
  const siteDir = config.http.siteDir;
  if (existsSync(path.join(siteDir, 'index.html'))) {
    app.use(express.static(siteDir, { index: false, dotfiles: 'ignore', setHeaders: siteCacheHeaders }));
    app.use(spaFallback(siteDir));
    logger.info(`Sitio servido desde ${siteDir}`);
  }

  app.use(notFoundHandler());
  app.use(errorHandler(logger));
  return app;
}

/** sha256 de "this.media='all'" (el onload con el que Angular carga su hoja de estilos). */
const STYLESHEET_ONLOAD_HASH = 'sha256-MhtPZXr7+LpJUY5qtMutB+qWfQtMaPccfe7QXtCcEYc=';

/** Archivos con hash en el nombre (main-AB12CD34.js) no cambian nunca; index.html siempre se revalida. */
function siteCacheHeaders(res: express.Response, filePath: string): void {
  const name = path.basename(filePath);
  if (name === 'index.html') res.setHeader('Cache-Control', 'no-cache');
  else if (/-[A-Z0-9]{8}\.(?:js|css)$/.test(name)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  else res.setHeader('Cache-Control', 'public, max-age=86400');
}

/**
 * Las rutas del sitio (/equipo, /admin/secciones...) las resuelve Angular: se responde index.html.
 * No aplica a /api, /uploads ni a archivos inexistentes (con extensión), que siguen al 404 en JSON.
 */
function spaFallback(siteDir: string): RequestHandler {
  return (req, res, next) => {
    const isPage = req.method === 'GET' || req.method === 'HEAD';
    const reserved = /^\/(?:api|uploads)(?:\/|$)/.test(req.path) || path.extname(req.path) !== '';
    if (!isPage || reserved) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile('index.html', { root: siteDir });
  };
}
