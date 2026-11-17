import { UserErrorMessage } from '@interfaces/error-message.interface';
import { HttpException } from '@nestjs/common';

export class DefaultException extends HttpException {
  /** `code` é lido pelo app (ex.: SESSAO_ENCERRADA); a mensagem em `userMessage` é para a pessoa. */
  constructor(userMessage: UserErrorMessage, statusCode: number = 500, code?: string) {
    super({ userMessage, ...(code ? { code } : {}), timestamp: new Date().toISOString() }, statusCode);
  }
}
