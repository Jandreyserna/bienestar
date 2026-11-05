import path from 'node:path';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { uploadedFileFrom } from '../../../../shared/infrastructure/http/upload.js';
import { idParamSchema, parseInput } from '../../../../shared/infrastructure/http/validation.js';
import type {
  CreateWorksheet,
  DeleteWorksheet,
  DownloadWorksheet,
  GetWorksheet,
  ListWorksheets,
  UpdateWorksheet,
} from '../../application/WorksheetUseCases.js';

// Los campos llegan como texto porque el formulario es multipart/form-data.
const detailsSchema = z.object({
  title: z.string(),
  description: z.string(),
  humanValue: z.string(),
  level: z.string(),
});
const listQuerySchema = z.object({ level: z.string().optional() });

export class WorksheetController {
  constructor(
    private readonly listWorksheets: ListWorksheets,
    private readonly getWorksheet: GetWorksheet,
    private readonly createWorksheet: CreateWorksheet,
    private readonly updateWorksheet: UpdateWorksheet,
    private readonly deleteWorksheet: DeleteWorksheet,
    private readonly downloadWorksheet: DownloadWorksheet,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { level } = parseInput(listQuerySchema, req.query);
    res.json(await this.listWorksheets.execute(level));
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { id } = parseInput(idParamSchema, req.params);
    res.json(await this.getWorksheet.execute(id));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const details = parseInput(detailsSchema, req.body ?? {});
    const created = await this.createWorksheet.execute(details, uploadedFileFrom(req, true));
    res.status(201).json(created);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = parseInput(idParamSchema, req.params);
    const details = parseInput(detailsSchema, req.body ?? {});
    res.json(await this.updateWorksheet.execute(id, details, uploadedFileFrom(req, false)));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = parseInput(idParamSchema, req.params);
    await this.deleteWorksheet.execute(id);
    res.status(204).end();
  };

  download = async (req: Request, res: Response): Promise<void> => {
    const { id } = parseInput(idParamSchema, req.params);
    const file = await this.downloadWorksheet.execute(id);
    res.type(file.mimeType);
    // res.download hace streaming desde disco: no carga el archivo en memoria ni bloquea el hilo.
    // Se pasa la carpeta como `root` porque `send` rechaza rutas absolutas con segmentos que
    // empiezan por punto (p. ej. un proyecto en ".bienestar/"); así solo valida el nombre del archivo.
    const options = { root: path.dirname(file.localPath) };
    await new Promise<void>((resolve, reject) => {
      res.download(path.basename(file.localPath), file.downloadName, options, (error) => {
        // Si el cliente cancela a mitad de la descarga no es un error del servidor.
        if (error && !res.headersSent) reject(error);
        else resolve();
      });
    });
  };
}
