import { Component } from '@angular/core';

/**
 * Moldura das telas de entrada: painel de marca à esquerda e formulário à direita.
 * A página tem sempre a altura da tela (sem rolagem da página): a imagem se ajusta ao espaço
 * que sobra e, se o formulário for maior que a tela, só a coluna dele rola.
 * No celular o painel de marca some e fica só o formulário.
 */
@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss'
})
export class AuthLayoutComponent {}
