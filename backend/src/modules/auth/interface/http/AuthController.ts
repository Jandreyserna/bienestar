import type { Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { UnauthorizedError } from '../../../../shared/application/errors.js';
import { parseInput } from '../../../../shared/infrastructure/http/validation.js';
import type { Login } from '../../application/AuthUseCases.js';
import type { TokenService } from '../../application/ports.js';

const loginSchema = z.object({ email: z.string(), password: z.string() });

export class AuthController {
  constructor(private readonly login: Login) {}

  signIn = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = parseInput(loginSchema, req.body);
    res.json(await this.login.execute(email, password));
  };

  me = (_req: Request, res: Response): void => {
    res.json({ admin: res.locals['admin'] });
  };
}

/** Middleware que exige un token Bearer válido de administrador. */
export function requireAdmin(tokenService: TokenService): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError('Debes iniciar sesión como administrador');
    }
    const claims = tokenService.verify(token);
    res.locals['admin'] = { id: claims.sub, email: claims.email };
    next();
  };
}
