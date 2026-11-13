export class DeviceEntity {
  id: string;
  userId: string;
  name: string;
  active: boolean;
  lastSeenAt: Date;
  deactivatedAt: Date | null;
  createdAt: Date;
}

/** Regras da spec (seção 5). */
export const MAX_DISPOSITIVOS_ATIVOS = 2;
export const MAX_TROCAS_POR_MES = 3;
