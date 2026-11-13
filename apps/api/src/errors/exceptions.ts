import { MessageType } from '@interfaces/error-message.interface';
import { HttpStatus } from '@nestjs/common';
import { DefaultException } from './default-exception';

export class NotFoundException extends DefaultException {
  constructor(resource: string) {
    super(
      {
        title: `${resource} não encontrado`,
        description: `Não foi possível encontrar ${resource.toLowerCase()}. Verifique os dados e tente novamente.`,
        actionButtonLabel: 'Voltar',
        type: MessageType.ERROR,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class AlreadyExistsException extends DefaultException {
  constructor(resource: string) {
    super(
      {
        title: `${resource} já cadastrado`,
        description: `${resource} já existe no sistema.`,
        actionButtonLabel: 'Voltar',
        type: MessageType.WARNING,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class UnauthorizedException extends DefaultException {
  constructor(description = 'Credenciais inválidas ou sessão expirada.') {
    super(
      {
        title: 'Não autorizado',
        description,
        actionButtonLabel: 'Voltar',
        type: MessageType.WARNING,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ForbiddenException extends DefaultException {
  constructor(title: string, description: string) {
    super(
      { title, description, actionButtonLabel: 'Voltar', type: MessageType.ERROR },
      HttpStatus.FORBIDDEN,
    );
  }
}
