import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiErro } from '../models/api-erro.model';

/**
 * Transforma qualquer falha de chamada em `ApiErro`, com a mensagem que o médico pode ler
 * (a API manda `userMessage`; sem rede, o status é 0).
 * Fica por fora dos outros interceptors, para só ver o erro depois de eles tentarem resolver.
 */
export const erroApiInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((erro: unknown) => {
      if (!(erro instanceof HttpErrorResponse)) return throwError(() => erro);
      if (erro.status === 0) {
        return throwError(
          () => new ApiErro('Sem conexão com o servidor. Verifique a internet e tente de novo.', 0)
        );
      }
      const msg = erro.error?.userMessage;
      return throwError(
        () => new ApiErro(msg?.description ?? 'Não foi possível concluir a operação.', erro.status, msg?.title ?? '')
      );
    })
  );
