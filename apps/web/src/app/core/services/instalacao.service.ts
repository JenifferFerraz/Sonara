import { Injectable, signal } from '@angular/core';
import { noNavegador } from '../utils/plataforma';

/** Evento do navegador que oferece a instalação do app (Chrome, Edge, Android). */
interface EventoInstalacao extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    /** Guardado pelo index.html, porque o navegador dispara o evento uma só vez e cedo. */
    __sonaraInstalar?: EventoInstalacao;
  }
}

function emModoApp(): boolean {
  if (!noNavegador()) return false;
  return (
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function ehIos(): boolean {
  if (!noNavegador()) return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** Instalar o Sonara como aplicativo (PWA): janela própria, ícone na área de trabalho e uso offline. */
@Injectable({ providedIn: 'root' })
export class InstalacaoService {
  /** Já está rodando como app instalado. */
  readonly instalado = signal(emModoApp());
  /** O navegador ofereceu a instalação: o botão pode abrir o diálogo do sistema. */
  readonly podeInstalar = signal(noNavegador() && Boolean(window.__sonaraInstalar) && !emModoApp());
  /** iPhone e iPad não têm o diálogo: a pessoa instala pelo menu Compartilhar. */
  readonly instrucoesIos = signal(ehIos() && !emModoApp());

  constructor() {
    if (!noNavegador()) return;
    window.addEventListener('sonara:instalavel', () => this.podeInstalar.set(!this.instalado()));
    window.addEventListener('appinstalled', () => {
      window.__sonaraInstalar = undefined;
      this.podeInstalar.set(false);
      this.instalado.set(true);
    });
    matchMedia('(display-mode: standalone)').addEventListener('change', e => {
      this.instalado.set(e.matches);
      if (e.matches) this.podeInstalar.set(false);
    });
  }

  async instalar(): Promise<'aceito' | 'recusado' | 'indisponivel'> {
    const evento = window.__sonaraInstalar;
    if (!evento) return 'indisponivel';
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    // O evento só pode ser usado uma vez.
    window.__sonaraInstalar = undefined;
    this.podeInstalar.set(false);
    return outcome === 'accepted' ? 'aceito' : 'recusado';
  }
}
