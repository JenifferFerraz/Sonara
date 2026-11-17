export interface Dispositivo {
  id: string;
  name: string;
  active: boolean;
  lastSeenAt: string;
  createdAt: string;
}

/** Limite de dispositivos ativos por conta. */
export const MAX_DISPOSITIVOS_ATIVOS = 2;
