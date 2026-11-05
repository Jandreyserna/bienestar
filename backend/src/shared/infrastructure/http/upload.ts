import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import type { Request, RequestHandler } from 'express';
import multer from 'multer';
import type { FilePolicy } from '../../domain/FilePolicy.js';
import { UnsupportedFileTypeError } from '../../domain/FilePolicy.js';
import { ValidationError } from '../../domain/errors.js';
import type { UploadedFile } from '../../application/ports/FileStorage.js';

/**
 * Middleware de carga: guarda el archivo en una carpeta temporal (streaming a disco,
 * no en memoria) y aplica la política de tipos/tamaño antes de llegar al caso de uso.
 * El archivo temporal se elimina automáticamente cuando termina la respuesta.
 */
export function singleFileUpload(policy: FilePolicy, tmpDir: string, field = 'file'): RequestHandler[] {
  mkdirSync(tmpDir, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: tmpDir,
      filename: (_req, _file, cb) => cb(null, randomUUID()),
    }),
    limits: { fileSize: policy.maxBytes, files: 1 },
    // Los navegadores envían el nombre del archivo en UTF-8 ("Educación.pdf").
    defParamCharset: 'utf8',
    fileFilter: (_req, file, cb) => {
      if (policy.isAllowedMime(file.mimetype)) cb(null, true);
      else
        cb(
          new UnsupportedFileTypeError(
            `Tipo de archivo no permitido para ${policy.label}: ${file.mimetype}`,
          ),
        );
    },
  });

  const cleanup: RequestHandler = (req, res, next) => {
    const tempPath = req.file?.path;
    if (tempPath) {
      res.on('close', () => {
        void rm(tempPath, { force: true });
      });
    }
    next();
  };

  return [upload.single(field), cleanup];
}

/** Convierte el archivo de multer al tipo de la capa de aplicación. */
export function uploadedFileFrom(req: Request, required: true): UploadedFile;
export function uploadedFileFrom(req: Request, required: false): UploadedFile | undefined;
export function uploadedFileFrom(req: Request, required: boolean): UploadedFile | undefined {
  const file = req.file;
  if (!file) {
    if (required) throw ValidationError.field('file', 'Debes adjuntar un archivo en el campo "file"');
    return undefined;
  }
  return {
    tempPath: file.path,
    originalName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
  };
}
