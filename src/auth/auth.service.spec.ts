import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

function makeUser(overrides = {}) {
  return {
    id: 1,
    username: 'testuser',
    password: 'hashed_password',
    mail: 'test@test.com',
    role: 'user',
    isActive: true,
    ...overrides,
  };
}

const mockUsersService = {
  findOne: jest.fn(),
  updateLastConnection: jest.fn(),
  updatePassword: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── signIn ────────────────────────────────────────────────────────────────

  describe('signIn', () => {
    it('lève UnauthorizedException si l\'utilisateur n\'existe pas', async () => {
      mockUsersService.findOne.mockResolvedValue(undefined);
      await expect(service.signIn('inconnu', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si le compte est désactivé', async () => {
      const user = makeUser({ isActive: false });
      mockUsersService.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.signIn('testuser', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si le mot de passe est incorrect', async () => {
      const user = makeUser();
      mockUsersService.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn('testuser', 'wrongpass')).rejects.toThrow(UnauthorizedException);
    });

    it('retourne un access_token si les credentials sont valides', async () => {
      const user = makeUser();
      mockUsersService.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.updateLastConnection.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('mock_jwt_token');

      const result = await service.signIn('testuser', 'correctpass');
      expect(result).toEqual({ access_token: 'mock_jwt_token' });
    });

    it('le payload JWT contient sub, username et role', async () => {
      const user = makeUser({ role: 'admin' });
      mockUsersService.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.updateLastConnection.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.signIn('testuser', 'pass');

      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 1,
        username: 'testuser',
        role: 'admin',
      });
    });

    it('accepte le mot de passe en clair pour les anciens comptes et met à jour le hash', async () => {
      const user = makeUser({ password: 'plaintext_legacy' });
      mockUsersService.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // bcrypt échoue
      mockUsersService.updatePassword.mockResolvedValue(undefined);
      mockUsersService.updateLastConnection.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.signIn('testuser', 'plaintext_legacy');
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(1, 'plaintext_legacy');
      expect(result.access_token).toBe('token');
    });

    it('met à jour la date de dernière connexion à chaque login réussi', async () => {
      const user = makeUser();
      mockUsersService.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.updateLastConnection.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.signIn('testuser', 'pass');
      expect(mockUsersService.updateLastConnection).toHaveBeenCalledWith(1);
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('retourne un message de succès', async () => {
      const result = await service.logout({});
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });
});