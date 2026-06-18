import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { Users } from './user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

function makeUser(overrides = {}): Users {
  return {
    id: 1,
    username: 'testuser',
    password: 'hashed_password',
    mail: 'test@test.com',
    role: 'user',
    isActive: true,
    avatar: null,
    banner: null,
    bio: null,
    tags: null,
    firstname: null,
    lastname: null,
    CreationDate: new Date('2026-01-01'),
    LastConnectionDate: new Date(),
    tasks: [],
    usersTasks: [],
    ...overrides,
  } as unknown as Users;
}

const mockUsersRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(Users), useValue: mockUsersRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('crée un utilisateur avec un mot de passe hashé', async () => {
      const user = makeUser();
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUsersRepo.create.mockReturnValue(user);
      mockUsersRepo.save.mockResolvedValue(user);

      const result = await service.create({
        username: 'testuser',
        password: 'plaintext',
        mail: 'test@test.com',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 10);
      expect(mockUsersRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(user);
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('retourne l\'utilisateur si trouvé', async () => {
      const user = makeUser();
      mockUsersRepo.findOne.mockResolvedValue(user);
      const result = await service.findOne('testuser');
      expect(result).toEqual(user);
    });

    it('retourne undefined si l\'utilisateur n\'existe pas', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      const result = await service.findOne('inconnu');
      expect(result).toBeUndefined();
    });
  });

  // ── findOnePlayer ──────────────────────────────────────────────────────────

  describe('findOnePlayer', () => {
    it('retourne l\'utilisateur par id', async () => {
      const user = makeUser({ id: 42 });
      mockUsersRepo.findOne.mockResolvedValue(user);
      const result = await service.findOnePlayer(42);
      expect(result?.id).toBe(42);
    });

    it('retourne undefined si l\'id n\'existe pas', async () => {
      mockUsersRepo.findOne.mockResolvedValue(null);
      const result = await service.findOnePlayer(999);
      expect(result).toBeUndefined();
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('met à jour les champs et retourne l\'utilisateur mis à jour', async () => {
      const updated = makeUser({ bio: 'Nouvelle bio' });
      mockUsersRepo.update.mockResolvedValue({});
      mockUsersRepo.findOne.mockResolvedValue(updated);

      const result = await service.update(1, { bio: 'Nouvelle bio' });
      expect(mockUsersRepo.update).toHaveBeenCalledWith(1, { bio: 'Nouvelle bio' });
      expect(result.bio).toBe('Nouvelle bio');
    });
  });

  // ── setActive ─────────────────────────────────────────────────────────────

  describe('setActive', () => {
    it('désactive un utilisateur', async () => {
      mockUsersRepo.update.mockResolvedValue({});
      await service.setActive(1, false);
      expect(mockUsersRepo.update).toHaveBeenCalledWith(1, { isActive: false });
    });

    it('réactive un utilisateur', async () => {
      mockUsersRepo.update.mockResolvedValue({});
      await service.setActive(1, true);
      expect(mockUsersRepo.update).toHaveBeenCalledWith(1, { isActive: true });
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('supprime un utilisateur par id', async () => {
      mockUsersRepo.delete.mockResolvedValue({});
      await service.delete(1);
      expect(mockUsersRepo.delete).toHaveBeenCalledWith(1);
    });
  });

  // ── updatePassword ────────────────────────────────────────────────────────

  describe('updatePassword', () => {
    it('hash et met à jour le mot de passe', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed');
      mockUsersRepo.update.mockResolvedValue({});
      await service.updatePassword(1, 'newplaintext');
      expect(bcrypt.hash).toHaveBeenCalledWith('newplaintext', 10);
      expect(mockUsersRepo.update).toHaveBeenCalledWith(1, { password: 'new_hashed' });
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retourne tous les utilisateurs', async () => {
      const users = [makeUser({ id: 1 }), makeUser({ id: 2 })];
      mockUsersRepo.find.mockResolvedValue(users);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });

  // ── updateLastConnection ──────────────────────────────────────────────────

  describe('updateLastConnection', () => {
    it('met à jour la date de dernière connexion', async () => {
      mockUsersRepo.update.mockResolvedValue({});
      await service.updateLastConnection(1);
      expect(mockUsersRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ LastConnectionDate: expect.any(Date) }),
      );
    });
  });
});