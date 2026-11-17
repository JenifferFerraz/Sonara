/** Ambiente de produção (ng build). Troca `environment.ts` pelo `fileReplacements` do angular.json. */
export const environment = {
  production: true,
  /**
   * TODO antes de ligar o login: endereço da API em produção (HTTPS, no mesmo site do app, para o
   * cookie httpOnly do refresh token funcionar). Ex.: 'https://api.seudominio.com.br'.
   */
  apiUrl: '',
  /** TODO antes de ligar o login: chave PÚBLICA do par Ed25519 de produção (`npm run keys` na API). */
  chavePublica: '',
  /** Modo de teste: sem login. Volte para `true` antes de vender. */
  exigirLogin: false
};
