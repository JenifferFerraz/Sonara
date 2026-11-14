// Helpers compartilhados pelos geradores de máscara.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const v = (id) => ({ var: id });
export const e = (a, b) => ({ '==': [v(a), b] });
export const and = (...c) => ({ and: c });
export const op = (valor, rotulo, laudo, impressao) => ({
  valor,
  rotulo,
  ...(laudo !== undefined && { laudo }),
  ...(impressao && { impressao }),
});

/**
 * Grupo com checkbox: os campos só aparecem (e só entram no laudo) quando o checkbox está marcado.
 * Devolve [checkbox, ...campos], para usar com spread dentro de `campos`.
 */
export function opcional(id, rotulo, campos, extra = {}) {
  return [
    { id, tipo: 'check', rotulo, achado: rotulo, ...extra },
    ...campos.map((c) => ({ ...c, showIf: c.showIf ? and(v(id), c.showIf) : v(id) })),
  ];
}

/** Grava libs/templates/src/<id>.json. */
export function salvar(template) {
  const dir = dirname(fileURLToPath(import.meta.url));
  writeFileSync(join(dir, '..', 'src', `${template.id}.json`), JSON.stringify(template, null, 2) + '\n');
  console.log(`${template.id}.json gerado`);
}
