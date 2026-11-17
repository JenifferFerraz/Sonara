import { Injectable } from '@angular/core';
import { reduzirUsuario, Usuario } from '../models/usuario.model';
import { ArmazenamentoLocalJson } from './armazenamento-local';

/** Dados não sensíveis do médico logado (nome, CRM...). Dados antigos com CPF são reduzidos ao ler. */
@Injectable({ providedIn: 'root' })
export class UsuarioStorage extends ArmazenamentoLocalJson<Usuario | null> {
  constructor() {
    super('sonara.usuario', null);
  }

  override obter(): Usuario | null {
    const guardado = super.obter();
    return guardado ? reduzirUsuario(guardado) : null;
  }
}
