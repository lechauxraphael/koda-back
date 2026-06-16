import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskValidation } from './task-validation.entity';

@Injectable()
export class TaskValidationService {
  constructor(
    @InjectRepository(TaskValidation)
    private repo: Repository<TaskValidation>,
  ) {}

  async submitValidation(taskId: number, requesterId: number): Promise<any> {
  const today = new Date().toISOString().split('T')[0];

  // Supprime l'ancienne validation du jour si elle existe
  const existing = await this.repo.findOne({
    where: {
      task: { id: taskId } as any,
      requester: { id: requesterId } as any,
      voter: { id: requesterId } as any,
      validationDate: today as any,
    },
  });

  if (existing) {
    // Supprime tous les votes liés à cette validation aujourd'hui
    await this.repo
      .createQueryBuilder()
      .delete()
      .where('taskId = :taskId', { taskId })
      .andWhere('requesterId = :requesterId', { requesterId })
      .andWhere('validationDate = :today', { today })
      .execute();
  }

  // Crée une nouvelle demande
  const validation = this.repo.create({
    task: { id: taskId } as any,
    requester: { id: requesterId } as any,
    voter: { id: requesterId } as any,
    vote: 'yes',
    resolved: false,
    validationDate: today as any,
  });
  return this.repo.save(validation);
}

  async vote(taskId: number, requesterId: number, voterId: number, vote: string): Promise<any> {
    if (requesterId === voterId) return { error: 'Tu ne peux pas voter pour toi-même' };

    const today = new Date().toISOString().split('T')[0];

    const existing = await this.repo.findOne({
      where: {
        task: { id: taskId } as any,
        requester: { id: requesterId } as any,
        voter: { id: voterId } as any,
        validationDate: today as any,
      },
    });

    if (existing) {
      existing.vote = vote;
      return this.repo.save(existing);
    }

    const newVote = this.repo.create({
      task: { id: taskId } as any,
      requester: { id: requesterId } as any,
      voter: { id: voterId } as any,
      vote,
      resolved: false,
      validationDate: today as any,
    });
    return this.repo.save(newVote);
  }

  async getVotes(taskId: number, requesterId: number, currentUserId?: number): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    const votes = await this.repo
      .createQueryBuilder('tv')
      .leftJoinAndSelect('tv.voter', 'voter')
      .where('tv.taskId = :taskId', { taskId })
      .andWhere('tv.requesterId = :requesterId', { requesterId })
      .andWhere('tv.validationDate = :today', { today })
      .getMany();

    const yes = votes.filter(v => v.vote === 'yes' && v.voter.id !== requesterId);
    const no = votes.filter(v => v.vote === 'no');
    const myVote = currentUserId ? votes.find(v => v.voter.id === currentUserId)?.vote ?? null : null;

    return {
      yes: yes.map(v => ({ id: v.voter.id, username: v.voter.username })),
      no: no.map(v => ({ id: v.voter.id, username: v.voter.username })),
      total: yes.length + no.length,
      myVote,
    };
  }

async getPendingForGroup(groupId: number): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];

  const all = await this.repo
    .createQueryBuilder('tv')
    .leftJoinAndSelect('tv.task', 'task')
    .leftJoinAndSelect('tv.requester', 'requester')
    .leftJoinAndSelect('tv.voter', 'voter')
    .leftJoinAndSelect('task.groupId', 'group')
    .where('group.id = :groupId', { groupId })
    .andWhere('tv.resolved = false')
    .andWhere('tv.validationDate = :today', { today })
    .getMany();

  return all.filter(tv => tv.voter?.id === tv.requester?.id);
}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resolveExpiredValidations(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const all = await this.repo
      .createQueryBuilder('tv')
      .leftJoinAndSelect('tv.task', 'task')
      .leftJoinAndSelect('tv.requester', 'requester')
      .leftJoinAndSelect('tv.voter', 'voter')
      .where('tv.resolved = false')
      .andWhere('tv.validationDate = :yesterdayStr', { yesterdayStr })
      .getMany();

    // Garde uniquement les entrées où voter = requester (les demandes)
    const pending = all.filter(tv => tv.voter?.id === tv.requester?.id);

    for (const validation of pending) {
      const votes = await this.getVotesByDate(validation.task.id, validation.requester.id, yesterdayStr);
      const validated = votes.yes.length >= votes.no.length;

      await this.repo
        .createQueryBuilder()
        .update()
        .set({ resolved: true })
        .where('taskId = :taskId', { taskId: validation.task.id })
        .andWhere('requesterId = :requesterId', { requesterId: validation.requester.id })
        .andWhere('validationDate = :yesterdayStr', { yesterdayStr })
        .execute();
    }
  }

  private async getVotesByDate(taskId: number, requesterId: number, date: string): Promise<any> {
    const votes = await this.repo
      .createQueryBuilder('tv')
      .leftJoinAndSelect('tv.voter', 'voter')
      .where('tv.taskId = :taskId', { taskId })
      .andWhere('tv.requesterId = :requesterId', { requesterId })
      .andWhere('tv.validationDate = :date', { date })
      .getMany();

    const yes = votes.filter(v => v.vote === 'yes' && v.voter.id !== requesterId);
    const no = votes.filter(v => v.vote === 'no');

    return { yes, no };
  }
}