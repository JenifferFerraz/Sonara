import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AbstractAuthService } from './core/abstractions/abstract-auth.service';
import { autenticacaoInterceptor } from './core/interceptors/autenticacao.interceptor';
import { credenciaisInterceptor } from './core/interceptors/credenciais.interceptor';
import { erroApiInterceptor } from './core/interceptors/erro-api.interceptor';
import { AutenticacaoService } from './core/services/autenticacao.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: AbstractAuthService, useExisting: AutenticacaoService },
    // A ordem importa: o erro fica por fora para ver só o que os outros não resolveram.
    provideHttpClient(
      withFetch(),
      withInterceptors([erroApiInterceptor, credenciaisInterceptor, autenticacaoInterceptor])
    ),
    // Só em produção. Espera o app estabilizar para não competir com o carregamento.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
