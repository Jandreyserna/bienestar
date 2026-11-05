import type { Request, Response } from 'express';
import { z } from 'zod';
import { idParamSchema, parseInput } from '../../../../shared/infrastructure/http/validation.js';
import type {
  CreateSection,
  DeleteSection,
  GetPageSections,
  GetSection,
  UpdateSection,
} from '../../application/SectionUseCases.js';

const nullableText = z.string().nullable().optional();

const itemSchema = z.object({
  id: z.uuid().optional(),
  title: z.string(),
  description: nullableText,
  imageUrl: nullableText,
});

const contentSchema = {
  title: z.string(),
  subtitle: nullableText,
  body: nullableText,
  imageUrl: nullableText,
  position: z.number().int().min(0).optional(),
  items: z.array(itemSchema).optional(),
};

const createSchema = z.object({ page: z.string(), key: z.string(), ...contentSchema });
const updateSchema = z.object(contentSchema);
const listQuerySchema = z.object({ page: z.string({ error: 'Indica la página con ?page=home' }) });

/** Adaptador HTTP: valida forma de la entrada y delega en los casos de uso. */
export class SectionController {
  constructor(
    private readonly getPageSections: GetPageSections,
    private readonly getSection: GetSection,
    private readonly createSection: CreateSection,
    private readonly updateSection: UpdateSection,
    private readonly deleteSection: DeleteSection,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { page } = parseInput(listQuerySchema, req.query);
    res.json(await this.getPageSections.execute(page));
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { id } = parseInput(idParamSchema, req.params);
    res.json(await this.getSection.execute(id));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const command = parseInput(createSchema, req.body);
    res.status(201).json(await this.createSection.execute(command));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = parseInput(idParamSchema, req.params);
    const command = parseInput(updateSchema, req.body);
    res.json(await this.updateSection.execute(id, command));
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = parseInput(idParamSchema, req.params);
    await this.deleteSection.execute(id);
    res.status(204).end();
  };
}
