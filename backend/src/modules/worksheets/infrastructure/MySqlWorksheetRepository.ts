import type { MySqlDatabase } from '../../../shared/infrastructure/database/MySqlDatabase.js';
import type { EducationLevel } from '../domain/EducationLevel.js';
import { Worksheet } from '../domain/Worksheet.js';
import type { WorksheetRepository } from '../domain/WorksheetRepository.js';

interface WorksheetRow {
  id: string;
  title: string;
  description: string;
  human_value: string;
  level: EducationLevel;
  file_path: string;
  file_url: string;
  file_name: string;
  file_mime: string;
  file_size: number;
  created_at: Date;
  updated_at: Date;
}

export class MySqlWorksheetRepository implements WorksheetRepository {
  constructor(private readonly database: MySqlDatabase) {}

  async findById(id: string): Promise<Worksheet | null> {
    const [row] = await this.database.query<WorksheetRow>('SELECT * FROM worksheets WHERE id = ?', [id]);
    return row ? toDomain(row) : null;
  }

  async findAll(level?: EducationLevel): Promise<Worksheet[]> {
    const rows = level
      ? await this.database.query<WorksheetRow>(
          'SELECT * FROM worksheets WHERE level = ? ORDER BY created_at DESC',
          [level],
        )
      : await this.database.query<WorksheetRow>('SELECT * FROM worksheets ORDER BY level, created_at DESC');
    return rows.map(toDomain);
  }

  async save(worksheet: Worksheet): Promise<void> {
    const s = worksheet.toSnapshot();
    await this.database.transaction(async (tx) => {
      const existing = await tx.query('SELECT id FROM worksheets WHERE id = ? FOR UPDATE', [s.id]);
      if (existing.length === 0) {
        await tx.execute(
          `INSERT INTO worksheets
             (id, title, description, human_value, level, file_path, file_url, file_name, file_mime,
              file_size, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.id, s.title, s.description, s.humanValue, s.level, s.file.path, s.file.url,
            s.file.originalName, s.file.mimeType, s.file.sizeBytes, s.createdAt, s.updatedAt,
          ],
        );
      } else {
        await tx.execute(
          `UPDATE worksheets
             SET title = ?, description = ?, human_value = ?, level = ?, file_path = ?, file_url = ?,
                 file_name = ?, file_mime = ?, file_size = ?, updated_at = ?
           WHERE id = ?`,
          [
            s.title, s.description, s.humanValue, s.level, s.file.path, s.file.url,
            s.file.originalName, s.file.mimeType, s.file.sizeBytes, s.updatedAt, s.id,
          ],
        );
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.database.execute('DELETE FROM worksheets WHERE id = ?', [id]);
  }
}

function toDomain(row: WorksheetRow): Worksheet {
  return Worksheet.reconstitute({
    id: row.id,
    title: row.title,
    description: row.description,
    humanValue: row.human_value,
    level: row.level,
    file: {
      path: row.file_path,
      url: row.file_url,
      originalName: row.file_name,
      mimeType: row.file_mime,
      sizeBytes: Number(row.file_size),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
