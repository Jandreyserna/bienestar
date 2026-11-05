import jwt, { type SignOptions } from 'jsonwebtoken';
import type { AppConfig } from '../../../config/env.js';
import { UnauthorizedError } from '../../../shared/application/errors.js';
import type { AdminClaims, IssuedToken, TokenService } from '../application/ports.js';

const ISSUER = 'bienestar-moral';

export class JwtTokenService implements TokenService {
  constructor(private readonly config: AppConfig) {}

  issue(claims: AdminClaims): IssuedToken {
    const token = jwt.sign({ email: claims.email }, this.config.auth.jwtSecret, {
      subject: claims.sub,
      issuer: ISSUER,
      algorithm: 'HS256',
      expiresIn: this.config.auth.jwtExpiresIn as SignOptions['expiresIn'],
    });
    const { exp } = jwt.decode(token) as { exp: number };
    return { token, expiresAt: new Date(exp * 1000).toISOString() };
  }

  verify(token: string): AdminClaims {
    try {
      const payload = jwt.verify(token, this.config.auth.jwtSecret, {
        issuer: ISSUER,
        algorithms: ['HS256'],
      });
      if (typeof payload === 'string' || !payload.sub || typeof payload['email'] !== 'string') {
        throw new Error('Payload inválido');
      }
      return { sub: payload.sub, email: payload['email'] };
    } catch {
      throw new UnauthorizedError('Sesión inválida o expirada. Inicia sesión de nuevo.');
    }
  }
}
