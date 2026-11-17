import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InMemoryRefreshTokensRepository } from '@modules/auth/repositories/in-memory-refresh-tokens.repository';
import { IssueSessionUseCase } from '@modules/auth/use-cases/issue-session.use-case';
import { LoginUseCase } from '@modules/auth/use-cases/login.use-case';
import { InMemoryDevicesRepository } from '@modules/devices/repositories/in-memory-devices.repository';
import { DeactivateDeviceUseCase } from '@modules/devices/use-cases/deactivate.use-case';
import { ListDevicesUseCase } from '@modules/devices/use-cases/list.use-case';
import { RegisterDeviceUseCase } from '@modules/devices/use-cases/register.use-case';
import { InMemoryUsersRepository } from '@modules/users/repositories/in-memory-users.repository';
import { CreateUserUseCase } from '@modules/users/use-cases/create.use-case';
import { FindUserByEmailUseCase } from '@modules/users/use-cases/find.use-case';
import { env } from '../env';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let tokens: InMemoryRefreshTokensRepository;
  let devices: InMemoryDevicesRepository;
  let login: LoginUseCase;
  let guard: AuthGuard;
  let jwt: JwtService;

  const credentials = { email: 'dra@example.com', password: 'senha-forte-1' };

  const contexto = (authorization?: string) => {
    const request: Record<string, unknown> = { headers: authorization ? { authorization } : {} };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
    return { context, request };
  };

  beforeEach(async () => {
    const users = new InMemoryUsersRepository();
    devices = new InMemoryDevicesRepository();
    tokens = new InMemoryRefreshTokensRepository();
    jwt = new JwtService({ secret: env.JWT_SECRET, signOptions: { expiresIn: '15m' } });

    await new CreateUserUseCase(users).execute({
      ...credentials,
      name: 'Dra. Teste',
      cpf: '123.456.789-09',
      crm: '12345',
      crmUf: 'sp',
    });
    login = new LoginUseCase(
      new FindUserByEmailUseCase(users),
      new RegisterDeviceUseCase(devices),
      tokens,
      new IssueSessionUseCase(jwt, tokens),
    );
    guard = new AuthGuard(jwt, tokens);
  });

  it('refuses a request without a token', async () => {
    await expect(guard.canActivate(contexto().context)).rejects.toMatchObject({ status: 401 });
  });

  it('refuses a token that was not signed by the server', async () => {
    const falso = new JwtService({ secret: 'outro-segredo' }).sign({ sub: 'u', deviceId: 'd', sid: 's' });
    await expect(guard.canActivate(contexto(`Bearer ${falso}`).context)).rejects.toMatchObject({ status: 401 });
  });

  it('lets a valid session through and fills in the user and the device', async () => {
    const { accessToken, deviceId, user } = await login.execute({ ...credentials, deviceName: 'pc-A' });
    const { context, request } = contexto(`Bearer ${accessToken}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request['user']).toBe(user.id);
    expect(request['deviceId']).toBe(deviceId);
  });

  it('refuses an access token that has no session id', async () => {
    const { user, deviceId } = await login.execute({ ...credentials, deviceName: 'pc-A' });
    const semSessao = jwt.sign({ sub: user.id, deviceId });
    await expect(guard.canActivate(contexto(`Bearer ${semSessao}`).context)).rejects.toMatchObject({ status: 401 });
  });

  it('ends the previous session as soon as the doctor signs in on another device', async () => {
    const a = await login.execute({ ...credentials, deviceName: 'pc-A' });
    await expect(guard.canActivate(contexto(`Bearer ${a.accessToken}`).context)).resolves.toBe(true);

    const b = await login.execute({ ...credentials, deviceName: 'pc-B' });

    // o token de A ainda não venceu, mas a sessão dele foi encerrada
    const erro = await guard.canActivate(contexto(`Bearer ${a.accessToken}`).context).catch(e => e);
    expect(erro.getStatus()).toBe(401);
    expect(erro.getResponse()).toMatchObject({ code: 'SESSAO_ENCERRADA' });
    await expect(guard.canActivate(contexto(`Bearer ${b.accessToken}`).context)).resolves.toBe(true);
  });

  it('disconnects a device right away when it is deactivated', async () => {
    const a = await login.execute({ ...credentials, deviceName: 'pc-A' });
    await new DeactivateDeviceUseCase(devices, tokens).execute({ userId: a.user.id, deviceId: a.deviceId });

    const erro = await guard.canActivate(contexto(`Bearer ${a.accessToken}`).context).catch(e => e);
    expect(erro.getResponse()).toMatchObject({ code: 'SESSAO_ENCERRADA' });
  });

  it('shows which device holds the active online session', async () => {
    const a = await login.execute({ ...credentials, deviceName: 'pc-A' });
    const lista = new ListDevicesUseCase(devices, tokens);

    expect((await lista.execute(a.user.id)).map(d => [d.name, d.sessaoAtiva])).toEqual([['pc-A', true]]);

    const b = await login.execute({ ...credentials, deviceName: 'pc-B' });
    const depois = await lista.execute(a.user.id);
    expect(depois.find(d => d.id === a.deviceId)?.sessaoAtiva).toBe(false);
    expect(depois.find(d => d.id === b.deviceId)?.sessaoAtiva).toBe(true);
    expect(depois.filter(d => d.sessaoAtiva)).toHaveLength(1);
  });
});
