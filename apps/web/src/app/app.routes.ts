import { Routes } from '@angular/router';
import { licencaGuard, sessaoGuard } from './core/guards';
import { ShellComponent } from './layouts/shell/shell.component';

export const routes: Routes = [
  {
    path: 'entrar',
    loadComponent: () => import('./pages/entrar/entrar.page').then(m => m.EntrarPage)
  },
  {
    path: 'cadastro',
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
