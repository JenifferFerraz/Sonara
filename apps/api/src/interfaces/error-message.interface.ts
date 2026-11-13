export enum MessageType {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export interface UserErrorMessage {
  title: string;
  description: string;
  actionButtonLabel: string;
  type: MessageType;
}
