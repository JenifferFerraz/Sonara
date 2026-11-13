export const config = {
  /** API NestJS. Só licença, dispositivos e máscaras passam por ela. */
  apiUrl: 'http://localhost:3030',
  /**
   * Chave pública Ed25519 (base64url) embutida no app: confere máscaras e licença sem internet.
   * Cole aqui o valor de LICENSE_PUBLIC_KEY (npm run keys, no apps/api).
   */
  chavePublica: '',
};
