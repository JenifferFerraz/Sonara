import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessaoMonitorService } from './core/services/sessao-monitor.service';
import { AtualizacaoComponent } from './shared/atualizacao/atualizacao.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AtualizacaoComponent],
  template: '<router-outlet /><app-atualizacao />'
})
export class App {
  // Liga o controle de sessão única assim que o app abre.
  private readonly _monitor = inject(SessaoMonitorService);
}
