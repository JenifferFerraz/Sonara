import { UserErrorMessage } from '@interfaces/error-message.interface';
import { HttpException } from '@nestjs/common';

export class DefaultException extends HttpException {
  constructor(userMessage: UserErrorMessage, statusCode: number = 500) {
    super({ userMessage, timestamp: new Date().toISOString() }, statusCode);
  }
}
