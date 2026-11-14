import type { Template } from '@sonara/laudo-engine';
import abdomeSuperior from './abdome-superior.json';
import abdomeTotal from './abdome-total.json';
import pelveSuprapubica from './pelve-suprapubica.json';
import transvaginal from './transvaginal.json';

/** A ordem daqui é a ordem das abas e dos subtipos na tela. */
export const templates: Record<string, Template> = {
  'abdome-total': abdomeTotal as unknown as Template,
  'abdome-superior': abdomeSuperior as unknown as Template,
  transvaginal: transvaginal as unknown as Template,
  'pelve-suprapubica': pelveSuprapubica as unknown as Template,
};
