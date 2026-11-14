import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AtualizacaoComponent } from './shared/atualizacao/atualizacao.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AtualizacaoComponent],
  template: '<router-outlet /><app-atualizacao />'
})
export class App {}
