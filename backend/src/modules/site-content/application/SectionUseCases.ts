import { ConflictError, NotFoundError } from '../../../shared/domain/errors.js';
import type { Logger } from '../../../shared/application/ports/Logger.js';
import { toPageSlug } from '../domain/PageSlug.js';
import type { SectionContent, SectionItemDraft } from '../domain/Section.js';
import type { NewSectionInput, SectionFactory } from '../domain/SectionFactory.js';
import { SectionKey } from '../domain/SectionKey.js';
import type { SectionRepository } from '../domain/SectionRepository.js';
import { DEFAULT_SECTIONS } from '../domain/defaultSections.js';
import { toSectionDto, type SectionDto } from './SectionDto.js';

/** Casos de uso del contenido de las páginas (RF-01.2, RF-02.1). */

export class GetPageSections {
  constructor(private readonly sectionRepository: SectionRepository) {}

  async execute(page: string): Promise<SectionDto[]> {
    const sections = await this.sectionRepository.findByPage(toPageSlug(page));
    return sections.map(toSectionDto);
  }
}

export class GetSection {
  constructor(private readonly sectionRepository: SectionRepository) {}

  async execute(id: string): Promise<SectionDto> {
    const section = await this.sectionRepository.findById(id);
    if (!section) throw NotFoundError.entity('Sección', id);
    return toSectionDto(section);
  }
}

export interface CreateSectionCommand extends SectionContent {
  page: string;
  key: string;
  items?: SectionItemDraft[];
}

export class CreateSection {
  constructor(
    private readonly sectionRepository: SectionRepository,
    private readonly sectionFactory: SectionFactory,
  ) {}

  async execute(command: CreateSectionCommand): Promise<SectionDto> {
    const page = toPageSlug(command.page);
    const key = SectionKey.from(command.key);
    if (await this.sectionRepository.findByPageAndKey(page, key.value)) {
      throw new ConflictError(`Ya existe una sección "${key.value}" en esta página`);
    }
    const siblings = await this.sectionRepository.findByPage(page);
    const nextPosition = siblings.reduce((max, s) => Math.max(max, s.position + 1), 0);
    const section = this.sectionFactory.create({ ...command, page, key: key.value }, nextPosition, new Date());
    await this.sectionRepository.save(section);
    return toSectionDto(section);
  }
}

export interface UpdateSectionCommand extends SectionContent {
  /** Si se envía, reemplaza la lista completa de items (en ese orden). */
  items?: SectionItemDraft[];
}

export class UpdateSection {
  constructor(
    private readonly sectionRepository: SectionRepository,
    private readonly sectionFactory: SectionFactory,
  ) {}

  async execute(id: string, command: UpdateSectionCommand): Promise<SectionDto> {
    const section = await this.sectionRepository.findById(id);
    if (!section) throw NotFoundError.entity('Sección', id);

    const now = new Date();
    section.updateContent(command, now);
    if (command.items) {
      section.replaceItems(command.items, () => this.sectionFactory.nextId(), now);
    }
    await this.sectionRepository.save(section);
    return toSectionDto(section);
  }
}

export class DeleteSection {
  constructor(private readonly sectionRepository: SectionRepository) {}

  async execute(id: string): Promise<void> {
    const section = await this.sectionRepository.findById(id);
    if (!section) throw NotFoundError.entity('Sección', id);
    section.assertCanBeDeleted();
    await this.sectionRepository.delete(id);
  }
}

/** Crea las secciones estructurales que falten (idempotente; se ejecuta al arrancar). */
export class SeedDefaultSections {
  constructor(
    private readonly sectionRepository: SectionRepository,
    private readonly sectionFactory: SectionFactory,
    private readonly logger: Logger,
  ) {}

  async execute(defaults: NewSectionInput[] = DEFAULT_SECTIONS): Promise<void> {
    for (const input of defaults) {
      const existing = await this.sectionRepository.findByPageAndKey(input.page, input.key);
      if (existing) continue;
      const section = this.sectionFactory.create(input, input.position ?? 0, new Date());
      await this.sectionRepository.save(section);
      this.logger.info(`Sección inicial creada: ${input.page}/${input.key}`);
    }
  }
}
