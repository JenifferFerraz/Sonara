import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  /** Copia texto simples e HTML ao mesmo tempo: Word recebe formatado, o sistema da clínica recebe limpo. */
  async copiar(texto: string, html: string): Promise<boolean> {
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([texto], { type: 'text/plain' }),
            'text/html': new Blob([html], { type: 'text/html' })
          })
        ]);
        return true;
      }
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      return false;
    }
  }
}
