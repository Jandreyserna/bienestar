import { ValidationError } from '../../../shared/domain/errors.js';
import { UnauthorizedError } from '../../../shared/application/errors.js';
import type { Logger } from '../../../shared/application/ports/Logger.js';
import { AdminUser, normalizeEmail, type AdminUserRepository } from '../domain/AdminUser.js';
import type { IssuedToken, PasswordHasher, TokenService } from './ports.js';

export interface LoginResult extends IssuedToken {
  admin: { id: string; email: string };
}

export class Login {
  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    // Mismo mensaje para correo inexistente y contraseña errada: no revela qué cuentas existen.
    const invalid = new UnauthorizedError('Correo o contraseña incorrectos');
    let normalized: string;
    try {
      normalized = normalizeEmail(email);
    } catch {
      throw invalid;
    }
    const user = await this.adminUserRepository.findByEmail(normalized);
    if (!user || !(await this.passwordHasher.verify(password, user.passwordHash))) throw invalid;

    const issued = this.tokenService.issue({ sub: user.id, email: user.email });
    return { ...issued, admin: { id: user.id, email: user.email } };
  }
}

/** Crea el administrador inicial a partir de ADMIN_EMAIL / ADMIN_PASSWORD si aún no existe. */
export class EnsureAdminUser {
  static readonly MIN_PASSWORD_LENGTH = 10;

  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly logger: Logger,
  ) {}

  async execute(credentials: { email?: string; password?: string }): Promise<void> {
    if (!credentials.email || !credentials.password) {
      this.logger.warn('ADMIN_EMAIL/ADMIN_PASSWORD no configurados: no se creó usuario administrador');
      return;
    }
    if (credentials.password.length < EnsureAdminUser.MIN_PASSWORD_LENGTH) {
      throw ValidationError.field(
        'ADMIN_PASSWORD',
        `ADMIN_PASSWORD debe tener al menos ${EnsureAdminUser.MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
    const email = normalizeEmail(credentials.email);
    if (await this.adminUserRepository.findByEmail(email)) return;

    const hash = await this.passwordHasher.hash(credentials.password);
    await this.adminUserRepository.save(AdminUser.create(email, hash, new Date()));
    this.logger.info(`Usuario administrador creado: ${email}`);
  }
}
