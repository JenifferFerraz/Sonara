export interface Dispositivo {
  id: string;
  name: string;
  active: boolean;
  lastSeenAt: string;
  createdAt: string;
  /** Este aparelho tem a sessão online em uso agora (só uma por conta). */
  sessaoAtiva?: boolean;
}

/** Limite de dispositivos ativos por conta. */
export const MAX_DISPOSITIVOS_ATIVOS = 2;
