import cors from 'cors';
import express, { Router, type Express } from 'express';
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
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
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
  app.use(notFoundHandler());
  app.use(errorHandler(logger));
  return app;
}
