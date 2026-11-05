import { ConflictError } from '../../../shared/domain/errors.js';
import {
  isDuplicateKeyError,
  type MySqlDatabase,
} from '../../../shared/infrastructure/database/MySqlDatabase.js';
import { AdminUser, type AdminUserRepository } from '../domain/AdminUser.js';

interface AdminUserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export class MySqlAdminUserRepository implements AdminUserRepository {
  constructor(private readonly database: MySqlDatabase) {}

  async findByEmail(email: string): Promise<AdminUser | null> {
    const [row] = await this.database.query<AdminUserRow>('SELECT * FROM admin_users WHERE email = ?', [email]);
    return row
      ? AdminUser.reconstitute({
          id: row.id,
          email: row.email,
          passwordHash: row.password_hash,
          createdAt: row.created_at,
        })
      : null;
  }

  async save(user: AdminUser): Promise<void> {
    const s = user.toSnapshot();
    try {
      await this.database.execute(
        'INSERT INTO admin_users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
        [s.id, s.email, s.passwordHash, s.createdAt],
      );
    } catch (error) {
      if (isDuplicateKeyError(error)) throw new ConflictError('Ya existe un administrador con ese correo');
      throw error;
    }
  }
}
