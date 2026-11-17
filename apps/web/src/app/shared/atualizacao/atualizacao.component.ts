import { Component, inject } from '@angular/core';
import { AtualizacaoService } from '../../core/services/atualizacao.service';

/** Aviso fixo "Há uma nova versão". A lógica de atualização está no `AtualizacaoService`. */
@Component({
  selector: 'app-atualizacao',
  templateUrl: './atualizacao.component.html',
  styleUrl: './atualizacao.component.scss'
})
export class AtualizacaoComponent {
  readonly atualizacao = inject(AtualizacaoService);
}
