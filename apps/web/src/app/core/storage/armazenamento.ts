/**
 * Contrato de guardar um valor. Quem usa não sabe onde ele fica (navegador, memória, e no futuro
 * o cofre do sistema no app desktop). Mesmo molde do `Storage<T>` do frontend do trabalho.
 */
export abstract class Armazenamento<T> {
  abstract obter(): T;
  abstract gravar(valor: T): void;
  abstract limpar(): void;
}
