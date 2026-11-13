import { Injectable } from '@nestjs/common';
import { createPrivateKey, sign } from 'node:crypto';
import { env } from '../../env';

/** Assina com Ed25519. O app confere com a chave pública embutida, sem internet. */
@Injectable()
export class SignatureService {
  private readonly privateKey = createPrivateKey({
    key: Buffer.from(env.LICENSE_PRIVATE_KEY, 'base64url'),
    format: 'der',
    type: 'pkcs8',
  });

  /** Assinatura em base64url. */
  sign(message: Buffer | string): string {
    return sign(null, Buffer.from(message), this.privateKey).toString('base64url');
  }

  get publicKey(): string {
    return env.LICENSE_PUBLIC_KEY;
  }
}
