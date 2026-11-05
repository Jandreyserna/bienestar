import { randomUUID } from 'node:crypto';
import { ValidationError } from '../../../shared/domain/errors.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string): string {
  const email = raw.trim().toLowerCase();
  if (email.length > 190 || !EMAIL_PATTERN.test(email)) {
    throw ValidationError.field('email', 'Correo electrónico inválido');
  }
  return email;
}

export interface AdminUserSnapshot {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

/** Usuario con acceso al panel de administración. */
export class AdminUser {
  private constructor(private readonly props: AdminUserSnapshot) {}

  static create(email: string, passwordHash: string, now: Date): AdminUser {
    return new AdminUser({ id: randomUUID(), email: normalizeEmail(email), passwordHash, createdAt: now });
  }

  static reconstitute(snapshot: AdminUserSnapshot): AdminUser {
    return new AdminUser({ ...snapshot });
  }

  get id(): string {
    return this.props.id;
  }
  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }

  toSnapshot(): AdminUserSnapshot {
    return { ...this.props };
  }
}

export interface AdminUserRepository {
  findByEmail(email: string): Promise<AdminUser | null>;
  save(user: AdminUser): Promise<void>;
}
