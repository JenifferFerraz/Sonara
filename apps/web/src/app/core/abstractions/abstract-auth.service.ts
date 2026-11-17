import { Observable } from 'rxjs';

/**
 * O que os guards precisam saber, sem depender de como a autenticação é feita.
 * Mesmo molde do `AbstractAuthModuleService` do frontend do trabalho.
 */
export abstract class AbstractAuthService {
  /** Pode usar o app: licença em dia (ou na carência) e pelo menos um exame liberado. Vale offline. */
  abstract estaAutenticado(): Observable<boolean>;
  /** Licença plenamente em dia: quem está assim não precisa ver a tela de login. */
  abstract estaComLicencaEmDia(): Observable<boolean>;
}
