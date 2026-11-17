import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CacheService } from '../cache/cache.service';
import { Dispositivo } from '../models/dispositivo.model';

const CHAVE_CACHE = 'dispositivos';
const VALIDADE_MS = 30 * 1000;

/** Dispositivos ativos da conta (limite de 2 por médico). */
@Injectable({ providedIn: 'root' })
export class DispositivosService {
  private readonly _http = inject(HttpClient);
  private readonly _cache = inject(CacheService);

  /** Lista os dispositivos ativos. Repetir a chamada em até 30 s reaproveita o resultado. */
  listar(forcar = false): Promise<Dispositivo[]> {
    if (forcar) this._cache.invalidar(CHAVE_CACHE);
    return this._cache.obterOuBuscar(CHAVE_CACHE, VALIDADE_MS, () =>
      firstValueFrom(this._http.get<Dispositivo[]>(`${environment.apiUrl}/devices`))
    );
  }

  async desativar(id: string): Promise<void> {
    await firstValueFrom(this._http.delete(`${environment.apiUrl}/devices/${id}`));
    this._cache.invalidar(CHAVE_CACHE);
  }
}
