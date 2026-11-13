declare namespace Express {
  interface Request {
    /** id do médico (sub do JWT) */
    user?: string;
    /** id do dispositivo da sessão */
    deviceId?: string;
  }
}
