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
}