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
  }): Promise<Tasks | { error: string }> {
    const user = await this.usersRepository.findOne({
      where: { username: taskData.username },
    });

    if (!user) {
      return { error: 'L\'utilisateur n\'existe pas' };
    }

    // 1. Trouver le groupe de l'utilisateur
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

    // 2. Créer la tâche
    const newTask = this.tasksRepository.create({
      title: taskData.title,
      description: taskData.description,
      points: 0,
      EndDate: null,
      groupId: membership.group,
      userId: user,
      reward: null,
      partner: null,
    });

    const savedTask = await this.tasksRepository.save(newTask);

    // 3. Récupérer tous les membres du groupe (ceux qui ont accepté l'invitation au groupe)
    const groupMembers = await this.groupUserRepository.find({
      where: {
        groupId: membership.groupId,
        invitation: true,
      },
    });

    // 4. Créer les entrées dans la table users-tasks pour tous les membres
    if (groupMembers.length > 0) {
      const usersTasksEntries = groupMembers.map((member) => {
        return {
          tasksId: savedTask.id,
          userId: member.userId,
          // invitation = 1 pour le créateur, 0 pour les autres
          invitation: member.userId === user.id ? true : false,
        };
      });

      // On utilise insert pour être plus direct sur une table de liaison
      await this.usersTasksRepository.insert(usersTasksEntries);
    }

    return savedTask;
  }

  async acceptTaskInvitation(taskId: number, username: string): Promise<any | { error: string }> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) return { error: 'L\'utilisateur n\'existe pas' };

    // On cherche la liaison dans la table tasks-user
    const taskInvitation = await this.usersTasksRepository.findOne({
      where: {
        tasksId: taskId,
        userId: user.id,
      },
    });

    if (!taskInvitation) {
      return { error: 'Invitation de tâche introuvable' };
    }

    if (taskInvitation.invitation) {
      return { error: 'La tâche a déjà été acceptée' };
    }

    // On passe l'invitation à true (1 en base) pour affecter la tâche
    taskInvitation.invitation = true;
    await this.usersTasksRepository.save(taskInvitation);

    return { success: true, message: 'Tâche affectée avec succès' };
  }

  async getUserTasks(username: string): Promise<Tasks[]> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) return [];

    // On récupère uniquement les tâches acceptées (invitation = 1)
    const userTasks = await this.usersTasksRepository.find({
      where: {
        userId: user.id,
        invitation: true,
      },
      relations: ['task'],
    });

    return userTasks.map(ut => ut.task);
  }
}
