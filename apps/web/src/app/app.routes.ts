import { Routes } from '@angular/router';
import { ShellComponent } from './layouts/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/laudo/laudo.page').then(m => m.LaudoPage)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
