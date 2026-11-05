import type { Worksheet } from '../domain/Worksheet.js';

export interface WorksheetDto {
  id: string;
  title: string;
  description: string;
  humanValue: string;
  level: string;
  file: { url: string; name: string; mimeType: string; sizeBytes: number };
  createdAt: string;
  updatedAt: string;
}

export function toWorksheetDto(worksheet: Worksheet): WorksheetDto {
  const s = worksheet.toSnapshot();
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    humanValue: s.humanValue,
    level: s.level,
    file: {
      url: s.file.url,
      name: s.file.originalName,
      mimeType: s.file.mimeType,
      sizeBytes: s.file.sizeBytes,
    },
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
