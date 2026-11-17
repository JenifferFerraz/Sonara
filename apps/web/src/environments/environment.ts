/** Ambiente de desenvolvimento (ng serve). */
export const environment = {
  production: false,
  /** API NestJS. Só conta, licença, dispositivos e máscaras passam por ela; nenhum texto de laudo. */
  apiUrl: 'http://localhost:3030',
  /** Chave pública Ed25519 (base64url) que confere licença e máscaras sem internet. */
  chavePublica: 'qWpRDtX1mMPRxf-Eq9HFdJZJRLK4A6Ls_-1Pc1fYstk'
};
