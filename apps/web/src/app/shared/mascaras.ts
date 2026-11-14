/** Medida decimal: só dígitos e uma vírgula ("3.5" e "3,5" viram "3,5"). */
export function mascaraDecimal(valor: string): string {
  const limpo = valor.replace('.', ',').replace(/[^\d,]/g, '');
  const i = limpo.indexOf(',');
  if (i === -1) return limpo;
  return limpo.slice(0, i + 1) + limpo.slice(i + 1).replace(/,/g, '');
}

/**
 * Data dd/mm/aaaa enquanto a pessoa digita só números.
 * Se aparecer qualquer letra ("há 12 dias"), o texto fica como está.
 */
export function mascaraData(valor: string): string {
  if (/[^\d/\s.-]/.test(valor)) return valor;
  const d = valor.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Só dígitos (idade). */
export function mascaraInteiro(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 3);
}

/** Aplica a máscara no próprio input e devolve o valor limpo. */
export function aplicarMascara(evento: Event, mascara: (v: string) => string): string {
  const el = evento.target as HTMLInputElement;
  const limpo = mascara(el.value);
  if (el.value !== limpo) el.value = limpo;
  return limpo;
}

/** CPF: 000.000.000-00 enquanto a pessoa digita. */
export function mascaraCpf(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
