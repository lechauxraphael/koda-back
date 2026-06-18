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

    const existing = await this.repo.findOne({
      where: {
        task: { id: taskId } as any,
        requester: { id: requesterId } as any,
        voter: { id: requesterId } as any,
        validationDate: today as any,
      },
    });

    if (existing) {
      await this.repo
        .createQueryBuilder()
        .delete()
        .where('taskId = :taskId', { taskId })
        .andWhere('requesterId = :requesterId', { requesterId })
        .andWhere('validationDate = :today', { today })
        .execute();
    }

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

    const existing = await this.repo
      .createQueryBuilder('tv')
      .where('tv.taskId = :taskId', { taskId })
      .andWhere('tv.requesterId = :requesterId', { requesterId })
      .andWhere('tv.voterId = :voterId', { voterId })
      .andWhere('tv.validationDate = :today', { today })
      .getOne();

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

  async getMissionHistory(taskId: number, userId: number): Promise<any> {
    // Récupère la mission
    const task = await this.repo.manager.findOne('tasks', {
      where: { id: taskId },
    }) as any;

    if (!task) return { error: 'Mission introuvable' };

    const startDate = new Date(task.StartDate);
    const endDate = task.EndDate ? new Date(task.EndDate) : new Date();
    const frequency: string[] = task.frequency ? JSON.parse(task.frequency) : [];

    const dayMapFR: Record<string, number> = {
      'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4,
      'Vendredi': 5, 'Samedi': 6, 'Dimanche': 0,
    };

    const scheduledDays = frequency.map(d => dayMapFR[d]);

    // Récupère toutes les validations pour cette mission et cet utilisateur
    const allValidations = await this.repo
      .createQueryBuilder('tv')
      .where('tv.taskId = :taskId', { taskId })
      .andWhere('tv.requesterId = :userId', { userId })
      .getMany();

    // Pour chaque date unique, calcule si validée
    const dateSet = new Set(allValidations.map(v => v.validationDate?.toString().split('T')[0]).filter(Boolean));
    const validatedDates: Record<string, boolean> = {};

    for (const dateStr of dateSet) {
      const votes = await this.repo
        .createQueryBuilder('tv')
        .where('tv.taskId = :taskId', { taskId })
        .andWhere('tv.requesterId = :userId', { userId })
        .andWhere('tv.validationDate = :dateStr', { dateStr })
        .getMany();

const yesCount = votes.filter(v => v.vote === 'yes' && v.voter?.id !== userId).length;
const noCount = votes.filter(v => v.vote === 'no').length;

      validatedDates[dateStr as string] = yesCount > noCount;
    }

    // Génère tous les jours programmés entre startDate et aujourd'hui
    const days = [];
    const cursor = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const limit = endDate < today ? endDate : today;

    while (cursor <= limit) {
      const dayOfWeek = cursor.getDay();
      if (scheduledDays.length === 0 || scheduledDays.includes(dayOfWeek)) {
        const dateStr = cursor.toISOString().split('T')[0];
        days.push({
          date: dateStr,
          validated: validatedDates[dateStr] ?? false,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      taskId,
      title: task.title,
      startDate: task.StartDate,
      endDate: task.EndDate,
      frequency: task.frequency,
      days,
      daysSinceStart,
      totalValidated: days.filter(d => d.validated).length,
    };
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