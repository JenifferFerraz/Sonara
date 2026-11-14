import type { Template } from '@sonara/laudo-engine';
import abdomeSuperior from './abdome-superior.json';
import abdomeTotal from './abdome-total.json';
import pelvico from './pelvico.json';
import tireoide from './tireoide.json';
import transvaginal from './transvaginal.json';

/** A ordem daqui é a ordem das abas e dos subtipos na tela. */
export const templates: Record<string, Template> = {
  'abdome-total': abdomeTotal as unknown as Template,
  'abdome-superior': abdomeSuperior as unknown as Template,
  transvaginal: transvaginal as unknown as Template,
  pelvico: pelvico as unknown as Template,
  tireoide: tireoide as unknown as Template,
};
