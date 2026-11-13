// Gera o par Ed25519 da licença. Cole a saída no .env.
import { generateKeyPairSync } from 'node:crypto';

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const privada = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64url');
const publica = String(publicKey.export({ format: 'jwk' }).x); // 32 bytes, base64url

console.log(`LICENSE_PRIVATE_KEY=${privada}`);
console.log(`LICENSE_PUBLIC_KEY=${publica}`);
