import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private chatRepo: Repository<Chat>,
  ) {}

  async getMessages(groupId: number) {
    return this.chatRepo.find({
      where: { group: { id: groupId } },
      relations: ['user'],
      order: { sentAt: 'ASC' },
    });
  }

  async sendMessage(groupId: number, userId: number, message: string) {
    const chat = this.chatRepo.create({
      group: { id: groupId } as any,
      user: { id: userId } as any,
      message,
    });
    return this.chatRepo.save(chat);
  }

  async sendImage(groupId: number, userId: number, imageUrl: string, taskId?: number) {
    const chat = this.chatRepo.create({
      group: { id: groupId } as any,
      user: { id: userId } as any,
      message: '',
      imageUrl,
      taskId: taskId ?? null,
    } as any);
    return this.chatRepo.save(chat);
  }

  async deleteValidationMessage(groupId: number, userId: number, taskId: number): Promise<void> {
  await this.chatRepo
    .createQueryBuilder()
    .delete()
    .where('groupId = :groupId', { groupId })
    .andWhere('userId = :userId', { userId })
    .andWhere('taskId = :taskId', { taskId })
    .execute();
}
}