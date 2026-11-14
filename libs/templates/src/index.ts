import type { Template } from '@sonara/laudo-engine';
import abdomeTotal from './abdome-total.json';
import pelveSuprapubica from './pelve-suprapubica.json';
import transvaginal from './transvaginal.json';

export const templates: Record<string, Template> = {
  transvaginal: transvaginal as unknown as Template,
  'abdome-total': abdomeTotal as unknown as Template,
  'pelve-suprapubica': pelveSuprapubica as unknown as Template,
};
