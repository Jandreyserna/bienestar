import type { EducationLevel } from './EducationLevel.js';
import type { Worksheet } from './Worksheet.js';

export interface WorksheetRepository {
  findById(id: string): Promise<Worksheet | null>;
  /** Sin nivel devuelve todas las cartillas. */
  findAll(level?: EducationLevel): Promise<Worksheet[]>;
  save(worksheet: Worksheet): Promise<void>;
  delete(id: string): Promise<void>;
}
