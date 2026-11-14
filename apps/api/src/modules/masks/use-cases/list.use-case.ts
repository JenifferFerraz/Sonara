import { SignatureService } from '@services/signature/signature.service';
import { Injectable } from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { env } from '../../../env';

export type MascaraAssinada = {
  id: string;
  versao: string;
  /** JSON exato que foi assinado: o app confere a assinatura sobre esta string. */
  json: string;
  assinatura: string;
};

@Injectable()
export class ListMasksUseCase {
  constructor(private readonly _signature: SignatureService) {}

  async execute(modulos: string[]): Promise<MascaraAssinada[]> {
    const dir = resolve(process.cwd(), env.MASKS_DIR);
    const arquivos = (await readdir(dir)).filter(nome => nome.endsWith('.json'));

    const mascaras: MascaraAssinada[] = [];
    for (const arquivo of arquivos) {
      const json = await readFile(join(dir, arquivo), 'utf8');
      const { id, versao, modulo } = JSON.parse(json) as { id: string; versao: string; modulo?: string };
      if (!modulos.includes(modulo ?? id)) continue;
      mascaras.push({ id, versao, json, assinatura: this._signature.sign(json) });
    }
    return mascaras;
  }
}
