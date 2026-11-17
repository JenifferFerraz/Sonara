import { Routes } from '@angular/router';
import { licencaGuard } from './core/guards/licenca.guard';
import { semLoginGuard } from './core/guards/sem-login.guard';
import { sessaoGuard } from './core/guards/sessao.guard';
import { ShellComponent } from './layouts/shell/shell.component';

export const routes: Routes = [
  {
    path: 'entrar',
    canActivate: [semLoginGuard],
    loadComponent: () => import('./pages/entrar/entrar.page').then(m => m.EntrarPage)
  },
  {
    path: 'cadastro',
    canActivate: [semLoginGuard],
    loadComponent: () => import('./pages/cadastro/cadastro.page').then(m => m.CadastroPage)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [licencaGuard],
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
