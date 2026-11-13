import { JwtService } from '@nestjs/jwt';
import { InMemoryDevicesRepository } from '@modules/devices/repositories/in-memory-devices.repository';
import { DeactivateDeviceUseCase } from '@modules/devices/use-cases/deactivate.use-case';
import { FindActiveDeviceUseCase } from '@modules/devices/use-cases/find-active.use-case';
import { RegisterDeviceUseCase } from '@modules/devices/use-cases/register.use-case';
import { InMemoryUsersRepository } from '@modules/users/repositories/in-memory-users.repository';
import { CreateUserUseCase } from '@modules/users/use-cases/create.use-case';
import { FindUserByEmailUseCase } from '@modules/users/use-cases/find.use-case';
import { InMemoryRefreshTokensRepository } from '../repositories/in-memory-refresh-tokens.repository';
import { IssueSessionUseCase } from './issue-session.use-case';
import { LoginUseCase } from './login.use-case';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('Auth flow', () => {
  let devices: InMemoryDevicesRepository;
  let tokens: InMemoryRefreshTokensRepository;
  let login: LoginUseCase;
  let refresh: RefreshTokenUseCase;
  let deactivate: DeactivateDeviceUseCase;

  const credentials = { email: 'dra@example.com', password: 'senha-forte-1' };

  beforeEach(async () => {
    const users = new InMemoryUsersRepository();
    devices = new InMemoryDevicesRepository();
    tokens = new InMemoryRefreshTokensRepository();

    await new CreateUserUseCase(users).execute({
      ...credentials,
      name: 'Dra. Teste',
      cpf: '123.456.789-09',
      crm: '12345',
      crmUf: 'sp',
    });

    const issue = new IssueSessionUseCase(
      new JwtService({ secret: 'test-secret' }),
      tokens,
    );
    login = new LoginUseCase(
      new FindUserByEmailUseCase(users),
      new RegisterDeviceUseCase(devices),
      tokens,
      issue,
    );
    refresh = new RefreshTokenUseCase(
      tokens,
      new FindActiveDeviceUseCase(devices),
      issue,
    );
    deactivate = new DeactivateDeviceUseCase(devices);
  });

  it('rejects a wrong password', async () => {
    await expect(
      login.execute({ ...credentials, password: 'errada' }),
    ).rejects.toThrow();
  });

  it('reuses the same device when the app sends its device id', async () => {
    const first = await login.execute({ ...credentials, deviceName: 'PC' });
    const second = await login.execute({ ...credentials, deviceId: first.deviceId });
    expect(second.deviceId).toBe(first.deviceId);
    expect(devices.items).toHaveLength(1);
  });

  it('refuses a third device until one is deactivated', async () => {
    const a = await login.execute({ ...credentials, deviceName: 'PC' });
    await login.execute({ ...credentials, deviceName: 'Notebook' });
    await expect(
      login.execute({ ...credentials, deviceName: 'Tablet' }),
    ).rejects.toThrow();

    await deactivate.execute({ userId: devices.items[0].userId, deviceId: a.deviceId });
    await expect(
      login.execute({ ...credentials, deviceName: 'Tablet' }),
    ).resolves.toBeDefined();
  });

  it('limits device swaps per month', async () => {
    const userId = (await login.execute({ ...credentials })).user.id;
    for (let i = 0; i < 3; i++) {
      const d = await devices.create({ userId, name: `D${i}` });
      await deactivate.execute({ userId, deviceId: d.id });
    }
    const extra = await devices.create({ userId, name: 'Extra' });
    await expect(
      deactivate.execute({ userId, deviceId: extra.id }),
    ).rejects.toThrow();
  });

  it('ends the previous session when a new login happens', async () => {
    const first = await login.execute(credentials);
    await login.execute({ ...credentials, deviceId: first.deviceId });
    await expect(refresh.execute(first.refreshToken)).rejects.toThrow();
  });

  it('rotates the refresh token and detects reuse', async () => {
    const session = await login.execute(credentials);
    const rotated = await refresh.execute(session.refreshToken);
    expect(rotated.refreshToken).not.toBe(session.refreshToken);

    // reusing the old token revokes every session of the user
    await expect(refresh.execute(session.refreshToken)).rejects.toThrow();
    await expect(refresh.execute(rotated.refreshToken)).rejects.toThrow();
  });

  it('refuses refresh for a deactivated device', async () => {
    const session = await login.execute(credentials);
    await deactivate.execute({ userId: session.user.id, deviceId: session.deviceId });
    await expect(refresh.execute(session.refreshToken)).rejects.toThrow();
  });
});
