export const config = {
  /**
   * Login e licença obrigatórios. Em `false` (modo de teste), o app abre direto no laudo, com todos os
   * exames liberados e sem falar com o servidor. Volte para `true` antes de vender.
   */
  exigirLogin: false,
  /** API NestJS. Só licença, dispositivos e máscaras passam por ela. */
  apiUrl: 'http://localhost:3030',
  /**
   * Chave pública Ed25519 (base64url) embutida no app: confere máscaras e licença sem internet.
   * Cole aqui o valor de LICENSE_PUBLIC_KEY (npm run keys, no apps/api).
   */
  chavePublica: 'qWpRDtX1mMPRxf-Eq9HFdJZJRLK4A6Ls_-1Pc1fYstk',
};
