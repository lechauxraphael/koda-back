import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tasks } from './tasks.entity';
import { Users } from 'src/users/user.entity';
import { GroupUser } from 'src/group-user/group-user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Tasks)
    private tasksRepository: Repository<Tasks>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(GroupUser)
    private groupUserRepository: Repository<GroupUser>,
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
      EndDate: null,
      groupId: membership.group,
      userId: user,
      reward: null,
      partner: null,
    });

    return this.tasksRepository.save(newTask);
  }
}
