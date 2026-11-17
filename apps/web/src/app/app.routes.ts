import { Routes } from '@angular/router';
import { authGuardActivate, authGuardActivateChild } from './core/guards/auth.guard';
import { noAuthGuardActivate } from './core/guards/no-auth.guard';
import { sessaoGuard } from './core/guards/sessao.guard';
import { ShellComponent } from './layouts/shell/shell.component';

export const routes: Routes = [
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then(m => m.InicioPage)
  },
  {
    path: 'entrar',
    canActivate: [noAuthGuardActivate],
    loadComponent: () => import('./pages/entrar/entrar.page').then(m => m.EntrarPage)
  },
  {
    path: 'cadastro',
    canActivate: [noAuthGuardActivate],
    loadComponent: () => import('./pages/cadastro/cadastro.page').then(m => m.CadastroPage)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuardActivate],
    canActivateChild: [authGuardActivateChild],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/laudo/laudo.page').then(m => m.LaudoPage)
      },
      {
        path: 'dispositivos',
        canActivate: [sessaoGuard],
        loadComponent: () => import('./pages/dispositivos/dispositivos.page').then(m => m.DispositivosPage)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
