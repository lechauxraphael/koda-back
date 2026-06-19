import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tasks } from './tasks.entity';
import { Users } from 'src/users/user.entity';
import { GroupUser } from 'src/group-user/group-user.entity';
import { UsersTasks } from 'src/users-tasks/users-tasks.entity';
import { TaskValidation } from 'src/task-validation/task-validation.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Tasks)
    private tasksRepository: Repository<Tasks>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(GroupUser)
    private groupUserRepository: Repository<GroupUser>,
    @InjectRepository(UsersTasks)
    private usersTasksRepository: Repository<UsersTasks>,
    @InjectRepository(TaskValidation)
    private taskValidationRepository: Repository<TaskValidation>,
  ) {}

  async create(taskData: {
    username: string;
    title: string;
    description: string;
    frequency?: string;
    reminderTime?: string;
    groupId?: number;
  }): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { username: taskData.username },
    });

    if (!user) {
      return { error: 'L\'utilisateur n\'existe pas' };
    }

    const membership = await this.groupUserRepository.findOne({
      where: {
        userId: user.id,
        invitation: true,
      },
      relations: ['group'],
    });

    if (!membership) {
      return { error: 'Vous devez être dans un groupe pour créer une tâche' };
    }

    const newTask = this.tasksRepository.create({
      title: taskData.title,
      description: taskData.description,
      points: 0,
      frequency: taskData.frequency ?? null,
      reminderTime: taskData.reminderTime ?? null,
      groupId: taskData.groupId ? { id: taskData.groupId } as any : membership.group,
      userId: user,
      reward: null,
      partner: null,
    } as any);

    const savedTask = await this.tasksRepository.save(newTask) as any;

    const groupMembers = await this.groupUserRepository.find({
      where: {
        groupId: membership.groupId,
        invitation: true,
      },
    });

    if (groupMembers.length > 0) {
      const usersTasksEntries = groupMembers.map((member) => ({
        tasksId: savedTask.id,
        userId: member.userId,
        invitation: member.userId === user.id ? true : false,
      }));

      await this.usersTasksRepository.insert(usersTasksEntries as any);
    }

    return savedTask;
  }

  async acceptTaskInvitation(taskId: number, username: string): Promise<any | { error: string }> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) return { error: 'L\'utilisateur n\'existe pas' };

    const taskInvitation = await this.usersTasksRepository.findOne({
      where: { tasksId: taskId, userId: user.id },
    });

    if (!taskInvitation) return { error: 'Invitation de tâche introuvable' };
    if (taskInvitation.invitation) return { error: 'La tâche a déjà été acceptée' };

    taskInvitation.invitation = true;
    await this.usersTasksRepository.save(taskInvitation);

    return { success: true, message: 'Tâche affectée avec succès' };
  }

  async getUserTasks(username: string): Promise<any[]> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) return [];

    const userTasks = await this.usersTasksRepository.find({
      where: { userId: user.id, invitation: true },
      relations: ['task'],
    });

    return userTasks.map(ut => ut.task);
  }

  async getGroupTasks(groupId: number): Promise<any[]> {
    const tasks = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.userId', 'creator')
      .leftJoinAndSelect('task.usersTasks', 'ut')
      .leftJoinAndSelect('ut.user', 'participant')
      .where('task.groupId = :groupId', { groupId })
      .orderBy('task.StartDate', 'DESC')
      .getMany();

    const seen = new Set();
    return tasks
      .filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      })
      .map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        frequency: t.frequency,
        deadline: t.EndDate,
        reminderTime: t.reminderTime,
        startDate: t.StartDate,
        creator: {
          id: t.userId.id,
          username: t.userId.username,
        },
        participants: t.usersTasks?.map(ut => ({
          userId: ut.userId,
          username: ut.user?.username,
          avatar: ut.user?.avatar ?? null,
          validated: ut.validated,
        })) ?? [],
      }));
  }

  async validateTask(taskId: number, userId: number): Promise<any> {
    const userTask = await this.usersTasksRepository.findOne({
      where: { tasksId: taskId, userId },
    });
    if (!userTask) return { error: 'Tâche introuvable' };

    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (task?.frequency) {
      try {
        const days: string[] = JSON.parse(task.frequency);
        if (days.length > 0) {
          const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
          const todayCapital = today.charAt(0).toUpperCase() + today.slice(1);
          if (!days.includes(todayCapital)) {
            return { error: `Cette mission ne peut être validée que les jours suivants : ${days.join(', ')}` };
          }
        }
      } catch (_) {}
    }

    userTask.validated = true;
    return this.usersTasksRepository.save(userTask);
  }

  async getPendingReminders(userId: number): Promise<any[]> {
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
    const todayCapital = today.charAt(0).toUpperCase() + today.slice(1);

    const userTasks = await this.usersTasksRepository
      .createQueryBuilder('ut')
      .leftJoinAndSelect('ut.task', 'task')
      .leftJoinAndSelect('task.groupId', 'group')
      .where('ut.userId = :userId', { userId })
      .andWhere('ut.invitation = true')
      .getMany();

    return userTasks
      .filter(ut => {
        if (!ut.task?.reminderTime) return false;
        if (ut.task.isDailyMission) return false;
        if (!ut.task.frequency) return true;
        try {
          const days: string[] = JSON.parse(ut.task.frequency);
          return days.includes(todayCapital);
        } catch { return false; }
      })
      .map(ut => ({
        taskId: ut.task.id,
        title: ut.task.title,
        reminderTime: ut.task.reminderTime,
        groupId: ut.task.groupId?.id ?? null,
      }));
  }

  async createDailyMission(adminId: number, data: {
    title: string;
    description: string;
    points: number;
    targetSteps: number;
    date: string;
  }): Promise<any> {
    const admin = await this.usersRepository.findOne({ where: { id: adminId } });
    if (!admin || admin.role !== 'admin') {
      return { error: 'Action réservée aux administrateurs' };
    }

    const result = await this.tasksRepository.query(
      `INSERT INTO tasks (title, description, points, StartDate, EndDate, isDailyMission, targetSteps, groupId, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description,
        data.points,
        `${data.date} 12:00:00`,
        `${data.date} 12:00:00`,
        1,
        data.targetSteps,
        null,
        admin.id,
      ],
    );

    const savedTaskId = result.insertId;

    const allUsers = await this.usersRepository.find({ where: { isActive: true } });
    if (allUsers.length > 0) {
      const usersTasksEntries = allUsers.map((u) => ({
        tasksId: savedTaskId,
        userId: u.id,
        invitation: true,
      }));
      await this.usersTasksRepository.insert(usersTasksEntries as any);
    }

    return { id: savedTaskId, title: data.title, date: data.date };
  }

  async getTodayDailyMission(userId: number): Promise<any> {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const task = await this.tasksRepository
      .createQueryBuilder('task')
      .where('task.isDailyMission = true')
      .andWhere('DATE(task.StartDate) = :today', { today })
      .getOne();

    if (!task) return null;

    const userTask = await this.usersTasksRepository.findOne({
      where: { tasksId: task.id, userId },
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      points: task.points,
      targetSteps: task.targetSteps,
      steps: userTask?.steps ?? null,
      validated: userTask?.validated ?? false,
    };
  }

  async submitSteps(taskId: number, userId: number, steps: number): Promise<any> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) return { error: 'Mission introuvable' };

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const taskDate = this.toLocalDateStr(new Date(task.StartDate));
    if (taskDate !== today) {
      return { error: 'Cette mission ne peut être validée que le jour prévu' };
    }

    const userTask = await this.usersTasksRepository.findOne({
      where: { tasksId: taskId, userId },
    });
    if (!userTask) return { error: 'Mission introuvable pour cet utilisateur' };

    if (userTask.steps !== null && userTask.steps !== undefined) {
      return { error: 'Les pas ont déjà été enregistrés pour aujourd\'hui' };
    }

    userTask.steps = steps;
    userTask.validated = steps >= task.targetSteps;

    return this.usersTasksRepository.save(userTask);
  }

  async getDailyMissionHistory(userId: number): Promise<any[]> {
    const userTasks = await this.usersTasksRepository
      .createQueryBuilder('ut')
      .leftJoinAndSelect('ut.task', 'task')
      .where('ut.userId = :userId', { userId })
      .andWhere('task.isDailyMission = true')
      .orderBy('task.StartDate', 'DESC')
      .getMany();

    return userTasks.map(ut => ({
      taskId: ut.task.id,
      title: ut.task.title,
      date: ut.task.StartDate,
      targetSteps: ut.task.targetSteps,
      steps: ut.steps,
      validated: ut.validated,
      points: ut.task.points,
    }));
  }

  async getAllDailyMissions(): Promise<any[]> {
    const tasks = await this.tasksRepository
      .createQueryBuilder('task')
      .where('task.isDailyMission = true')
      .orderBy('task.StartDate', 'DESC')
      .getMany();

    return tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      points: t.points,
      targetSteps: t.targetSteps,
      date: t.StartDate,
    }));
  }

  private toLocalDateStr(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  async getDailyMissionStreak(userId: number): Promise<any> {
    const userTasks = await this.usersTasksRepository
      .createQueryBuilder('ut')
      .leftJoinAndSelect('ut.task', 'task')
      .where('ut.userId = :userId', { userId })
      .andWhere('task.isDailyMission = true')
      .orderBy('task.StartDate', 'DESC')
      .getMany();

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.toLocalDateStr(today);

    const validatedDates = new Set(
      userTasks
        .filter(ut => ut.validated)
        .map(ut => this.toLocalDateStr(new Date(ut.task.StartDate)))
    );

    const cursor = new Date(today);
    if (!validatedDates.has(this.toLocalDateStr(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (validatedDates.has(this.toLocalDateStr(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diffToMonday);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = this.toLocalDateStr(d);
      const isValidated = validatedDates.has(dateStr);
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;

      weekDays.push({
        date: dateStr,
        validated: isValidated,
        isFuture: !isPast && !(isToday && isValidated),
      });
    }

    return { streak, weekDays };
  }

  async getProgressionStats(userId: number): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return { scale: 'day', points: [], totalMissions: 0, totalPoints: 0 };

    const accountCreationDate = new Date(user.CreationDate);
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - accountCreationDate.getTime()) / (1000 * 60 * 60 * 24));

    let scale: 'day' | 'week' | 'month';
    if (daysSinceCreation < 14) scale = 'day';
    else if (daysSinceCreation < 90) scale = 'week';
    else scale = 'month';

    // Missions de groupe validées via users-tasks
    const groupValidations = await this.usersTasksRepository
      .createQueryBuilder('ut')
      .leftJoinAndSelect('ut.task', 'task')
      .where('ut.userId = :userId', { userId })
      .andWhere('ut.validated = true')
      .andWhere('task.isDailyMission = false')
      .getMany();

    // Défis du jour validés via users-tasks
    const dailyValidations = await this.usersTasksRepository
      .createQueryBuilder('ut')
      .leftJoinAndSelect('ut.task', 'task')
      .where('ut.userId = :userId', { userId })
      .andWhere('ut.validated = true')
      .andWhere('task.isDailyMission = true')
      .getMany();

    // Missions de groupe avec majorité de votes positifs via task-validation
    const voteValidations = await this.taskValidationRepository
      .createQueryBuilder('tv')
      .leftJoinAndSelect('tv.task', 'task')
      .where('tv.requesterId = :userId', { userId })
      .andWhere('tv.resolved = true')
      .getMany();

    // Groupe les votes par taskId + date pour calculer la majorité
    const voteMap = new Map<string, { yes: number; no: number; task: any; date: string }>();
    for (const tv of voteValidations) {
      const dateStr = tv.validationDate?.toString().split('T')[0] ?? '';
      const key = `${tv.task.id}-${dateStr}`;
      if (!voteMap.has(key)) {
        voteMap.set(key, { yes: 0, no: 0, task: tv.task, date: dateStr });
      }
      const entry = voteMap.get(key)!;
      if (tv.vote === 'yes') entry.yes++;
      else if (tv.vote === 'no') entry.no++;
    }

    // Garde uniquement les dates avec majorité de OUI
    const voteValidatedDates: Date[] = [];
    for (const entry of voteMap.values()) {
      if (entry.yes > entry.no) {
        voteValidatedDates.push(new Date(entry.date));
      }
    }

    const allDates: Date[] = [
      ...groupValidations.map(ut => new Date(ut.task.StartDate)),
      ...dailyValidations.map(ut => new Date(ut.task.StartDate)),
      ...voteValidatedDates,
    ];

    const totalMissions = groupValidations.length + dailyValidations.length + voteValidatedDates.length;
    const totalPoints = [
      ...groupValidations,
      ...dailyValidations,
    ].reduce((sum, ut) => sum + (ut.task.points ?? 0), 0);

    const counts = new Map<string, number>();
    for (const d of allDates) {
      let key: string;
      if (scale === 'day') {
        key = this.toLocalDateStr(d);
      } else if (scale === 'week') {
        const monday = new Date(d);
        const dow = d.getDay();
        const diffToMonday = dow === 0 ? -6 : 1 - dow;
        monday.setDate(d.getDate() + diffToMonday);
        key = this.toLocalDateStr(monday);
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const points: { label: string; value: number }[] = [];

    if (scale === 'day') {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = this.toLocalDateStr(d);
        points.push({ label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), value: counts.get(key) ?? 0 });
      }
    } else if (scale === 'week') {
      const numWeeks = Math.ceil(90 / 7);
      for (let i = numWeeks - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i * 7);
        const dow = d.getDay();
        const diffToMonday = dow === 0 ? -6 : 1 - dow;
        const monday = new Date(d);
        monday.setDate(d.getDate() + diffToMonday);
        const key = this.toLocalDateStr(monday);
        points.push({ label: monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), value: counts.get(key) ?? 0 });
      }
    } else {
      const numMonths = Math.min(12, Math.ceil(daysSinceCreation / 30) + 1);
      for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        points.push({ label: d.toLocaleDateString('fr-FR', { month: 'short' }), value: counts.get(key) ?? 0 });
      }
    }

    return { scale, points, totalMissions, totalPoints };
  }
}