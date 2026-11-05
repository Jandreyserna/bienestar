export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export interface AdminClaims {
  sub: string;
  email: string;
}

export interface IssuedToken {
  token: string;
  expiresAt: string;
}

export interface TokenService {
  issue(claims: AdminClaims): IssuedToken;
  /** Lanza UnauthorizedError si el token es inválido o expiró. */
  verify(token: string): AdminClaims;
}
