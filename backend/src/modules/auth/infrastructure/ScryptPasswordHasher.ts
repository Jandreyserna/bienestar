import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import type { PasswordHasher } from '../application/ports.js';

const KEY_LENGTH = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // scrypt corre en el threadpool de libuv: no bloquea el event loop.
    scrypt(password, salt, KEY_LENGTH, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/** Hash de contraseñas con scrypt nativo de Node (sin dependencias nativas que compilar). */
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await derive(plain, salt, PARAMS);
    return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64'), key.toString('base64')].join('$');
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const [algorithm, n, r, p, salt, key] = stored.split('$');
    if (algorithm !== 'scrypt' || !salt || !key) return false;
    const expected = Buffer.from(key, 'base64');
    const actual = await derive(plain, Buffer.from(salt, 'base64'), {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
