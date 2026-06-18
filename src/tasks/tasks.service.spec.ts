import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Tasks } from './tasks.entity';
import { Users } from '../users/user.entity';
import { GroupUser } from '../group-user/group-user.entity';
import { UsersTasks } from '../users-tasks/users-tasks.entity';

// ─── Factories ───────────────────────────────────────────────────────────────

function makeUser(overrides = {}): Users {
  return {
    id: 1,
    username: 'testuser',
    password: 'hashed',
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

function makeTask(overrides = {}): Tasks {
  return {
    id: 1,
    title: 'Mission test',
    description: 'Description test',
    points: 10,
    StartDate: new Date('2026-06-18T12:00:00'),
    EndDate: null,
    frequency: null,
    deadline: null,
    reminderTime: null,
    isDailyMission: false,
    targetSteps: null,
    groupId: null,
    userId: makeUser(),
    usersTasks: [],
    reward: null,
    partner: null,
    ...overrides,
  } as unknown as Tasks;
}

function makeUserTask(overrides = {}): UsersTasks {
  return {
    userId: 1,
    tasksId: 1,
    task: makeTask(),
    user: makeUser(),
    invitation: true,
    validated: false,
    validationProofUrl: null,
    steps: null,
    ...overrides,
  } as unknown as UsersTasks;
}

// ─── Mock repos ──────────────────────────────────────────────────────────────

const mockTasksRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  insert: jest.fn(),
  query: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockUsersRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockGroupUserRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockUsersTasksRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  insert: jest.fn(),
  createQueryBuilder: jest.fn(),
};

// Helper pour chaîner createQueryBuilder
function mockQB(result: any) {
  const qb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(result),
    getOne: jest.fn().mockResolvedValue(result),
  };
  return jest.fn().mockReturnValue(qb);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Tasks), useValue: mockTasksRepo },
        { provide: getRepositoryToken(Users), useValue: mockUsersRepo },
        { provide: getRepositoryToken(GroupUser), useValue: mockGroupUserRepo },
        { provide: getRepositoryToken(UsersTasks), useValue: mockUsersTasksRepo },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  // ── getTodayDailyMission ──────────────────────────────────────────────────

  describe('getTodayDailyMission', () => {
    it('retourne null si aucune mission du jour existe', async () => {
      mockTasksRepo.createQueryBuilder = mockQB(null);
      const result = await service.getTodayDailyMission(1);
      expect(result).toBeNull();
    });

    it('retourne la mission avec steps null si l\'utilisateur n\'a pas encore soumis', async () => {
      const task = makeTask({ id: 5, isDailyMission: true, targetSteps: 8000, points: 50 });
      mockTasksRepo.createQueryBuilder = mockQB(task);
      mockUsersTasksRepo.findOne.mockResolvedValue(null);

      const result = await service.getTodayDailyMission(1);
      expect(result).not.toBeNull();
      expect(result.steps).toBeNull();
      expect(result.validated).toBe(false);
      expect(result.targetSteps).toBe(8000);
    });

    it('retourne la mission avec steps et validated si déjà soumis', async () => {
      const task = makeTask({ id: 5, isDailyMission: true, targetSteps: 8000, points: 50 });
      const userTask = makeUserTask({ tasksId: 5, steps: 9000, validated: true });
      mockTasksRepo.createQueryBuilder = mockQB(task);
      mockUsersTasksRepo.findOne.mockResolvedValue(userTask);

      const result = await service.getTodayDailyMission(1);
      expect(result.steps).toBe(9000);
      expect(result.validated).toBe(true);
    });
  });

  // ── submitSteps ───────────────────────────────────────────────────────────

  describe('submitSteps', () => {
    it('retourne une erreur si la mission est introuvable', async () => {
      mockTasksRepo.findOne.mockResolvedValue(null);
      const result = await service.submitSteps(99, 1, 5000);
      expect(result.error).toBeDefined();
    });

    it('retourne une erreur si la date ne correspond pas à aujourd\'hui', async () => {
      const task = makeTask({
        StartDate: new Date('2026-01-01T12:00:00'),
        isDailyMission: true,
        targetSteps: 8000,
      });
      mockTasksRepo.findOne.mockResolvedValue(task);
      const result = await service.submitSteps(1, 1, 5000);
      expect(result.error).toMatch(/jour prévu/);
    });

    it('retourne une erreur si les pas ont déjà été enregistrés', async () => {
      const today = new Date();
      const task = makeTask({ StartDate: today, isDailyMission: true, targetSteps: 8000 });
      const userTask = makeUserTask({ steps: 5000 });
      mockTasksRepo.findOne.mockResolvedValue(task);
      mockUsersTasksRepo.findOne.mockResolvedValue(userTask);
      const result = await service.submitSteps(1, 1, 9000);
      expect(result.error).toMatch(/déjà été enregistrés/);
    });

    it('valide la mission si steps >= targetSteps', async () => {
      const today = new Date();
      const task = makeTask({ StartDate: today, isDailyMission: true, targetSteps: 8000 });
      const userTask = makeUserTask({ steps: null });
      mockTasksRepo.findOne.mockResolvedValue(task);
      mockUsersTasksRepo.findOne.mockResolvedValue(userTask);
      mockUsersTasksRepo.save.mockImplementation(async (ut) => ut);

      const result = await service.submitSteps(1, 1, 9000);
      expect(result.validated).toBe(true);
      expect(result.steps).toBe(9000);
    });

    it('ne valide pas si steps < targetSteps', async () => {
      const today = new Date();
      const task = makeTask({ StartDate: today, isDailyMission: true, targetSteps: 8000 });
      const userTask = makeUserTask({ steps: null });
      mockTasksRepo.findOne.mockResolvedValue(task);
      mockUsersTasksRepo.findOne.mockResolvedValue(userTask);
      mockUsersTasksRepo.save.mockImplementation(async (ut) => ut);

      const result = await service.submitSteps(1, 1, 3000);
      expect(result.validated).toBe(false);
    });
  });

  // ── createDailyMission ────────────────────────────────────────────────────

  describe('createDailyMission', () => {
    it('retourne une erreur si l\'utilisateur n\'est pas admin', async () => {
      mockUsersRepo.findOne.mockResolvedValue(makeUser({ role: 'user' }));
      const result = await service.createDailyMission(1, {
        title: 'Test', description: 'desc', points: 10, targetSteps: 5000, date: '2026-06-18',
      });
      expect(result.error).toBeDefined();
    });

    it('crée une mission et l\'assigne à tous les utilisateurs actifs', async () => {
      const admin = makeUser({ role: 'admin' });
      mockUsersRepo.findOne.mockResolvedValue(admin);
      mockTasksRepo.query.mockResolvedValue({ insertId: 42 });
      mockUsersRepo.find.mockResolvedValue([makeUser({ id: 1 }), makeUser({ id: 2 })]);
      mockUsersTasksRepo.insert.mockResolvedValue({});

      const result = await service.createDailyMission(1, {
        title: 'Marcher 8000 pas', description: 'desc', points: 50, targetSteps: 8000, date: '2026-06-18',
      });

      expect(mockTasksRepo.query).toHaveBeenCalledTimes(1);
      expect(mockUsersTasksRepo.insert).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(42);
    });
  });

  // ── getDailyMissionStreak ─────────────────────────────────────────────────

  describe('getDailyMissionStreak', () => {
    it('retourne streak 0 et 7 jours si aucune validation', async () => {
      mockUsersTasksRepo.createQueryBuilder = mockQB([]);
      const result = await service.getDailyMissionStreak(1);
      expect(result.streak).toBe(0);
      expect(result.weekDays).toHaveLength(7);
    });

    it('calcule correctement un streak de 1 jour si aujourd\'hui validé', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const userTask = makeUserTask({
        validated: true,
        task: makeTask({ StartDate: today, isDailyMission: true }),
      });
      mockUsersTasksRepo.createQueryBuilder = mockQB([userTask]);
      const result = await service.getDailyMissionStreak(1);
      expect(result.streak).toBeGreaterThanOrEqual(1);
    });

    it('marque aujourd\'hui comme isFuture=false si validé', async () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const userTask = makeUserTask({
        validated: true,
        task: makeTask({ StartDate: today, isDailyMission: true }),
      });
      mockUsersTasksRepo.createQueryBuilder = mockQB([userTask]);
      const result = await service.getDailyMissionStreak(1);
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const todayDay = result.weekDays.find(d => d.date === todayStr);
      expect(todayDay?.isFuture).toBe(false);
      expect(todayDay?.validated).toBe(true);
    });
  });

  // ── getDailyMissionHistory ────────────────────────────────────────────────

  describe('getDailyMissionHistory', () => {
    it('retourne une liste vide si aucune mission', async () => {
      mockUsersTasksRepo.createQueryBuilder = mockQB([]);
      const result = await service.getDailyMissionHistory(1);
      expect(result).toEqual([]);
    });

    it('retourne les missions avec les bonnes propriétés', async () => {
      const task = makeTask({ isDailyMission: true, targetSteps: 8000, points: 50 });
      const userTask = makeUserTask({ steps: 9000, validated: true, task });
      mockUsersTasksRepo.createQueryBuilder = mockQB([userTask]);
      const result = await service.getDailyMissionHistory(1);
      expect(result[0].steps).toBe(9000);
      expect(result[0].validated).toBe(true);
      expect(result[0].targetSteps).toBe(8000);
    });
  });

  // ── validateTask ──────────────────────────────────────────────────────────

  describe('validateTask', () => {
    it('retourne une erreur si la tâche est introuvable', async () => {
      mockUsersTasksRepo.findOne.mockResolvedValue(null);
      mockTasksRepo.findOne.mockResolvedValue(null);
      const result = await service.validateTask(99, 1, '/uploads/test.jpg');
      expect(result.error).toBeDefined();
    });

    it('valide une tâche sans fréquence', async () => {
      const userTask = makeUserTask();
      const task = makeTask({ frequency: null });
      mockUsersTasksRepo.findOne.mockResolvedValue(userTask);
      mockTasksRepo.findOne.mockResolvedValue(task);
      mockUsersTasksRepo.save.mockImplementation(async (ut) => ut);

      const result = await service.validateTask(1, 1, '/uploads/test.jpg');
      expect(result.validated).toBe(true);
      expect(result.validationProofUrl).toBe('/uploads/test.jpg');
    });

    it('refuse la validation si aujourd\'hui n\'est pas dans la fréquence', async () => {
      const userTask = makeUserTask();
      // Force une fréquence qui exclut forcément le jour actuel (liste vide = tous les jours autorisés, on met un jour improbable)
      const joursExclus = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const todayFR = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
      const todayCapital = todayFR.charAt(0).toUpperCase() + todayFR.slice(1);
      const joursSansAujourdhui = joursExclus.filter(j => j !== todayCapital);

      const task = makeTask({ frequency: JSON.stringify(joursSansAujourdhui) });
      mockUsersTasksRepo.findOne.mockResolvedValue(userTask);
      mockTasksRepo.findOne.mockResolvedValue(task);

      const result = await service.validateTask(1, 1, '/uploads/test.jpg');
      expect(result.error).toBeDefined();
    });
  });

  // ── getProgressionStats ───────────────────────────────────────────────────

  describe('getProgressionStats', () => {
    it('retourne scale=day si compte créé il y a moins de 14 jours', async () => {
      const recentUser = makeUser({ CreationDate: new Date() });
      mockUsersRepo.findOne.mockResolvedValue(recentUser);
      mockUsersTasksRepo.createQueryBuilder = mockQB([]);

      const result = await service.getProgressionStats(1);
      expect(result.scale).toBe('day');
      expect(result.points).toHaveLength(14);
    });

    it('retourne scale=week si compte entre 14 et 90 jours', async () => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const user = makeUser({ CreationDate: d });
      mockUsersRepo.findOne.mockResolvedValue(user);
      mockUsersTasksRepo.createQueryBuilder = mockQB([]);

      const result = await service.getProgressionStats(1);
      expect(result.scale).toBe('week');
    });

    it('retourne scale=month si compte de plus de 90 jours', async () => {
      const d = new Date();
      d.setDate(d.getDate() - 100);
      const user = makeUser({ CreationDate: d });
      mockUsersRepo.findOne.mockResolvedValue(user);
      mockUsersTasksRepo.createQueryBuilder = mockQB([]);

      const result = await service.getProgressionStats(1);
      expect(result.scale).toBe('month');
    });

    it('compte correctement totalMissions et totalPoints', async () => {
      const user = makeUser({ CreationDate: new Date() });
      mockUsersRepo.findOne.mockResolvedValue(user);

      const task1 = makeTask({ points: 10, isDailyMission: false });
      const task2 = makeTask({ points: 20, isDailyMission: false });
      const ut1 = makeUserTask({ validated: true, task: task1 });
      const ut2 = makeUserTask({ validated: true, task: task2 });

      // Premier appel = groupValidations, deuxième = dailyValidations
      let callCount = 0;
      mockUsersTasksRepo.createQueryBuilder = jest.fn().mockImplementation(() => {
        callCount++;
        const results = callCount === 1 ? [ut1, ut2] : [];
        return {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(results),
        };
      });

      const result = await service.getProgressionStats(1);
      expect(result.totalMissions).toBe(2);
      expect(result.totalPoints).toBe(30);
    });
  });

  // ── getPendingReminders ───────────────────────────────────────────────────

  describe('getPendingReminders', () => {
    it('retourne une liste vide si aucune tâche avec rappel', async () => {
      mockUsersTasksRepo.createQueryBuilder = mockQB([]);
      const result = await service.getPendingReminders(1);
      expect(result).toEqual([]);
    });

    it('inclut seulement les tâches avec reminderTime défini', async () => {
      const taskAvecRappel = makeTask({ reminderTime: '09:00', frequency: null });
      const taskSansRappel = makeTask({ reminderTime: null, frequency: null });
      const ut1 = makeUserTask({ invitation: true, task: taskAvecRappel });
      const ut2 = makeUserTask({ invitation: true, task: taskSansRappel });
      mockUsersTasksRepo.createQueryBuilder = mockQB([ut1, ut2]);

      const result = await service.getPendingReminders(1);
      expect(result).toHaveLength(1);
      expect(result[0].reminderTime).toBe('09:00');
    });

    it('retourne le groupId du groupe lié à la tâche', async () => {
      const group = { id: 5 };
      const task = makeTask({ reminderTime: '09:00', frequency: null, groupId: group });
      const ut = makeUserTask({ invitation: true, task });
      mockUsersTasksRepo.createQueryBuilder = mockQB([ut]);

      const result = await service.getPendingReminders(1);
      expect(result[0].groupId).toBe(5);
    });
  });
});