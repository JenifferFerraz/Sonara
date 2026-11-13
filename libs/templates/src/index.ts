import type { Template } from '@sonara/laudo-engine';
import transvaginal from './transvaginal.json';

export const templates: Record<string, Template> = {
  transvaginal: transvaginal as unknown as Template,
};
