import { ConflictError } from '../../../shared/domain/errors.js';
import {
  isDuplicateKeyError,
  type MySqlDatabase,
} from '../../../shared/infrastructure/database/MySqlDatabase.js';
import type { PageSlug } from '../domain/PageSlug.js';
import type { Section, SectionSnapshot } from '../domain/Section.js';
import type { SectionFactory } from '../domain/SectionFactory.js';
import type { SectionLayout } from '../domain/SectionLayout.js';
import type { SectionRepository, SectionSummary } from '../domain/SectionRepository.js';

interface SectionRow {
  id: string;
  page: PageSlug;
  section_key: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  layout: SectionLayout;
  position: number;
  created_at: Date;
  updated_at: Date;
}

interface ItemRow {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  position: number;
}

/** Adaptador MySQL del repositorio de secciones. Guarda el agregado completo en una transacción. */
export class MySqlSectionRepository implements SectionRepository {
  constructor(
    private readonly database: MySqlDatabase,
    private readonly sectionFactory: SectionFactory,
  ) {}

  async findById(id: string): Promise<Section | null> {
    const rows = await this.database.query<SectionRow>('SELECT * FROM sections WHERE id = ?', [id]);
    const [section] = await this.hydrate(rows);
    return section ?? null;
  }

  async findByPage(page: PageSlug): Promise<Section[]> {
    const rows = await this.database.query<SectionRow>(
      'SELECT * FROM sections WHERE page = ? ORDER BY position, created_at',
      [page],
    );
    return this.hydrate(rows);
  }

  async findByPageAndKey(page: PageSlug, key: string): Promise<Section | null> {
    const rows = await this.database.query<SectionRow>(
      'SELECT * FROM sections WHERE page = ? AND section_key = ?',
      [page, key],
    );
    const [section] = await this.hydrate(rows);
    return section ?? null;
  }

  async findSummaries(): Promise<SectionSummary[]> {
    const rows = await this.database.query<Pick<SectionRow, 'page' | 'section_key' | 'title' | 'position'>>(
      'SELECT page, section_key, title, position FROM sections ORDER BY page, position, created_at',
    );
    return rows.map((row) => ({ page: row.page, key: row.section_key, title: row.title, position: row.position }));
  }

  async save(section: Section): Promise<void> {
    const s = section.toSnapshot();
    try {
      await this.database.transaction(async (tx) => {
        // SELECT ... FOR UPDATE en vez de "ON DUPLICATE KEY UPDATE": funciona igual en MySQL 8 y
        // en MariaDB (motor habitual en Hostinger) y bloquea la fila mientras se reescriben los items.
        const existing = await tx.query('SELECT id FROM sections WHERE id = ? FOR UPDATE', [s.id]);
        if (existing.length === 0) {
          await tx.execute(
            `INSERT INTO sections
               (id, page, section_key, title, subtitle, body, image_url, layout, position, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              s.id, s.page, s.key, s.title, s.subtitle, s.body, s.imageUrl, s.layout, s.position, s.createdAt,
              s.updatedAt,
            ],
          );
        } else {
          await tx.execute(
            `UPDATE sections
               SET title = ?, subtitle = ?, body = ?, image_url = ?, layout = ?, position = ?, updated_at = ?
             WHERE id = ?`,
            [s.title, s.subtitle, s.body, s.imageUrl, s.layout, s.position, s.updatedAt, s.id],
          );
        }
        await tx.execute('DELETE FROM section_items WHERE section_id = ?', [s.id]);
        if (s.items.length > 0) {
          await tx.execute(
            'INSERT INTO section_items (id, section_id, title, description, image_url, position) VALUES ?',
            [s.items.map((item) => [item.id, s.id, item.title, item.description, item.imageUrl, item.position])],
          );
        }
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError(`Ya existe una sección "${s.key}" en esta página`);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.database.execute('DELETE FROM sections WHERE id = ?', [id]);
  }

  private async hydrate(rows: SectionRow[]): Promise<Section[]> {
    if (rows.length === 0) return [];
    const items = await this.database.query<ItemRow>(
      'SELECT * FROM section_items WHERE section_id IN (?) ORDER BY position',
      [rows.map((row) => row.id)],
    );
    return rows.map((row) => {
      const snapshot: SectionSnapshot = {
        id: row.id,
        page: row.page,
        key: row.section_key,
        title: row.title,
        subtitle: row.subtitle,
        body: row.body,
        imageUrl: row.image_url,
        layout: row.layout,
        position: row.position,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: items
          .filter((item) => item.section_id === row.id)
          .map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            imageUrl: item.image_url,
            position: item.position,
          })),
      };
      return this.sectionFactory.reconstitute(snapshot);
    });
  }
}
