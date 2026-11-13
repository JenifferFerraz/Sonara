// Verificação offline de licença e de máscaras (Ed25519 via WebCrypto).
// Funciona no navegador, no Electron e no Node 20+.

export interface LicencaPayload {
  medicoId: string;
  nome: string;
  crm: string;
  modulos: string[];
  dispositivoId: string;
  /** Emissão e validade, em milissegundos desde epoch. */
  emitidoEm: number;
  validoAte: number;
}

export type StatusLicenca =
  | { status: 'ok'; payload: LicencaPayload; diasRestantes: number }
  | { status: 'carencia'; payload: LicencaPayload; diasCarencia: number }
  | { status: 'expirada' | 'invalida' | 'relogio' | 'outro-dispositivo' };

export const DIA_MS = 86_400_000;
export const CARENCIA_DIAS = 7;

export function b64urlParaBytes(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesParaB64url(b: Uint8Array): string {
  let bin = '';
  b.forEach((x) => (bin += String.fromCharCode(x)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importarChave(chavePublicaB64url: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', b64urlParaBytes(chavePublicaB64url), { name: 'Ed25519' }, false, ['verify']);
}

export async function verificarAssinatura(
  mensagem: Uint8Array<ArrayBuffer>,
  assinaturaB64url: string,
  chavePublicaB64url: string,
): Promise<boolean> {
  try {
    const chave = await importarChave(chavePublicaB64url);
    return await crypto.subtle.verify('Ed25519', chave, b64urlParaBytes(assinaturaB64url), mensagem);
  } catch {
    return false;
  }
}

/** Máscara baixada: o app recusa se a assinatura não bater. */
export function verificarMascara(json: string, assinatura: string, chavePublica: string): Promise<boolean> {
  return verificarAssinatura(new TextEncoder().encode(json), assinatura, chavePublica);
}

/**
 * Token = base64url(payload JSON) + "." + base64url(assinatura).
 * `ultimaDataVista` protege contra voltar o relógio.
 */
export async function verificarLicenca(
  token: string,
  chavePublica: string,
  dispositivoId: string,
  agora: number,
  ultimaDataVista: number,
): Promise<StatusLicenca> {
  const [corpo, assinatura] = token.split('.');
  if (!corpo || !assinatura) return { status: 'invalida' };
  const bytes = b64urlParaBytes(corpo);
  if (!(await verificarAssinatura(bytes, assinatura, chavePublica))) return { status: 'invalida' };

  let payload: LicencaPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { status: 'invalida' };
  }
  if (payload.dispositivoId !== dispositivoId) return { status: 'outro-dispositivo' };
  if (agora < ultimaDataVista) return { status: 'relogio' };
  if (agora <= payload.validoAte) {
    return { status: 'ok', payload, diasRestantes: Math.ceil((payload.validoAte - agora) / DIA_MS) };
  }
  const apos = (agora - payload.validoAte) / DIA_MS;
  if (apos <= CARENCIA_DIAS) return { status: 'carencia', payload, diasCarencia: Math.ceil(CARENCIA_DIAS - apos) };
  return { status: 'expirada' };
}
