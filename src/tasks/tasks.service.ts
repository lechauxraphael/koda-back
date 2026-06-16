import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tasks } from './tasks.entity';
import { Users } from 'src/users/user.entity';
import { GroupUser } from 'src/group-user/group-user.entity';
import { UsersTasks } from 'src/users-tasks/users-tasks.entity';

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
  ) {}

  async create(taskData: {
    username: string;
    title: string;
    description: string;
    frequency?: string;
    deadline?: Date | null;
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
      EndDate: taskData.deadline ?? null,
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

  // Déduplique par id (au cas où)
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
        validated: ut.validated,
        validationProofUrl: ut.validationProofUrl,
      })) ?? [],
    }));
}

  async validateTask(taskId: number, userId: number, proofUrl: string): Promise<any> {
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
    userTask.validationProofUrl = proofUrl;
    return this.usersTasksRepository.save(userTask);
  }

  async getPendingReminders(userId: number): Promise<any[]> {
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
    const todayCapital = today.charAt(0).toUpperCase() + today.slice(1);

    const userTasks = await this.usersTasksRepository.find({
      where: { userId, invitation: true },
      relations: ['task'],
    });

    return userTasks
      .filter(ut => {
        if (!ut.task?.reminderTime) return false;
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
      }));
  }
}