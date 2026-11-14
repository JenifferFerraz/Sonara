import { Component } from '@angular/core';

/**
 * Moldura das telas de entrada: painel de marca à esquerda e formulário à direita.
 * O formulário vai no `<ng-content>`. No celular, o painel some e fica só a marca no topo.
 */
@Component({
  selector: 'app-auth-layout',
  template: `
    <div class="pagina">
      <aside class="marca" aria-label="Sobre o Sonara">
        <div class="conteudo">
          <div class="logo">
            <img src="logo-icone.svg" alt="" width="44" height="44" />
            <span>Sonara</span>
          </div>

          <h1>Laudos de ultrassom,<br />prontos em minutos.</h1>
          <p class="lead">
            Preencha as medidas e os achados. O Sonara redige o laudo, com as suas palavras.
          </p>

          <svg class="varredura" viewBox="0 0 440 360" aria-hidden="true" focusable="false">
            <defs>
              <radialGradient id="eco" cx="50%" cy="6%" r="95%">
                <stop offset="0" stop-color="#5fd6c6" stop-opacity="0.34" />
                <stop offset="0.6" stop-color="#0b6b66" stop-opacity="0.16" />
                <stop offset="1" stop-color="#073b3a" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="feixe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#93ddd3" stop-opacity="0.9" />
                <stop offset="1" stop-color="#93ddd3" stop-opacity="0" />
              </linearGradient>
              <clipPath id="recorte">
                <path d="M220 20 L-0.8 265.2 A330 330 0 0 0 440.8 265.2 Z" />
              </clipPath>
            </defs>

            <path d="M220 20 L-0.8 265.2 A330 330 0 0 0 440.8 265.2 Z" fill="url(#eco)" />

            <g clip-path="url(#recorte)">
              <!-- estruturas: uma imagem anecogênica (escura) com borda brilhante e um nódulo -->
              <ellipse cx="170" cy="200" rx="46" ry="30" fill="#073b3a" fill-opacity="0.72" />
              <ellipse cx="170" cy="200" rx="46" ry="30" fill="none" stroke="#93ddd3" stroke-opacity="0.45" stroke-width="2" />
              <ellipse cx="286" cy="236" rx="22" ry="15" fill="#5fd6c6" fill-opacity="0.28" />
              <ellipse cx="260" cy="140" rx="64" ry="14" fill="#93ddd3" fill-opacity="0.1" />
              <ellipse cx="190" cy="288" rx="90" ry="12" fill="#93ddd3" fill-opacity="0.08" />
            </g>

            <g fill="none" stroke="#93ddd3" stroke-opacity="0.34" stroke-width="1">
              <path d="M159.8 86.9 A90 90 0 0 0 280.2 86.9 M119.6 131.5 A150 150 0 0 0 320.4 131.5 M79.5 176.1 A210 210 0 0 0 360.5 176.1 M39.3 220.6 A270 270 0 0 0 400.7 220.6 M-0.8 265.2 A330 330 0 0 0 440.8 265.2" />
              <path d="M220 20 L440.8 265.2 M220 20 L338.3 328.1 M220 20 L220 350 M220 20 L101.7 328.1 M220 20 L-0.8 265.2" stroke-opacity="0.16" />
            </g>
            <path d="M220 20 L-0.8 265.2 A330 330 0 0 0 440.8 265.2 Z" fill="none" stroke="#93ddd3" stroke-opacity="0.55" stroke-width="1.5" />

            <g class="feixe-grupo">
              <path d="M220 20 L220 350" stroke="url(#feixe)" stroke-width="2" />
            </g>
            <circle cx="220" cy="20" r="5" fill="#5fd6c6" />
          </svg>

          <ul class="pontos">
            <li>Nenhum dado de paciente vai para o servidor</li>
            <li>Abdome, pelve, tireoide e mamas</li>
            <li>Frases do seu jeito, salvas no seu login</li>
          </ul>
        </div>
        <p class="legal">O sistema só redige. Quem interpreta o exame e responde pelo laudo é o médico.</p>
      </aside>

      <main class="formulario">
        <div class="caixa">
          <div class="logo-mobile" aria-hidden="true">
            <img src="logo-icone.svg" alt="" width="34" height="34" />
            <span>Sonara</span>
          </div>
          <ng-content />
        </div>
      </main>
    </div>
  `,
  styles: `
    .pagina {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      min-height: 100vh;
    }

    /* ---------- painel de marca ---------- */
    .marca {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 24px;
      padding: 40px 48px 28px;
      color: #eaf5f2;
      background:
        radial-gradient(circle at 78% 8%, rgba(95, 214, 198, 0.22), transparent 46%),
        radial-gradient(circle at 8% 96%, rgba(11, 107, 102, 0.55), transparent 55%),
        linear-gradient(160deg, #0b6b66 0%, var(--sn-profunda) 70%);
      overflow: hidden;
    }
    .conteudo { max-width: 520px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .logo { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 700; letter-spacing: 0.3px; }
    h1 { margin: 18px 0 0; font-size: clamp(28px, 3.1vw, 42px); line-height: 1.12; font-weight: 700; letter-spacing: -0.5px; }
    .lead { margin: 0; max-width: 440px; font-size: 16px; line-height: 1.5; color: #cfe9e4; }

    .varredura { width: 100%; max-width: 440px; height: auto; margin: 8px auto 0; display: block; }
    .feixe-grupo {
      transform-origin: 220px 20px;
      animation: varrer 7s ease-in-out infinite alternate;
    }
    @keyframes varrer {
      from { transform: rotate(-36deg); }
      to { transform: rotate(36deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .feixe-grupo { animation: none; }
    }

    .pontos { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .pontos li {
      display: flex; align-items: center; gap: 10px; font-size: 14px; color: #dcf1ed;
      &::before {
        content: '';
        width: 7px; height: 7px; border-radius: 50%;
        background: var(--sn-secundaria);
        box-shadow: 0 0 0 4px rgba(95, 214, 198, 0.18);
        flex: none;
      }
    }
    .legal { margin: 0; max-width: 520px; width: 100%; align-self: center; font-size: 12px; color: #a6cdc7; }

    /* ---------- lado do formulário ---------- */
    .formulario {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 32px;
      background: var(--sn-fundo);
    }
    .caixa { width: min(400px, 100%); }
    .logo-mobile { display: none; align-items: center; gap: 8px; margin-bottom: 22px; font-size: 20px; font-weight: 700; color: var(--sn-primaria); }

    @media (max-width: 900px) {
      .pagina { grid-template-columns: 1fr; }
      .marca { display: none; }
      .logo-mobile { display: flex; }
      .formulario { align-items: flex-start; padding: 32px 20px; }
    }
  `
})
export class AuthLayoutComponent {}
