import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship } from './friendship.entity';
import { Users } from '../users/user.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipRepo: Repository<Friendship>,
    @InjectRepository(Users)
    private usersRepo: Repository<Users>,
  ) {}

  async searchUser(username: string): Promise<Users[]> {
    return this.usersRepo
      .createQueryBuilder('user')
      .where('user.username LIKE :username', { username: `%${username}%` })
      .getMany();
  }

  async sendRequest(requesterId: number, receiverId: number) {
    if (requesterId === receiverId)
      throw new BadRequestException('Tu ne peux pas t\'ajouter toi-même');

    const existing = await this.friendshipRepo.findOne({
      where: [
        { requester: { id: requesterId }, receiver: { id: receiverId } },
        { requester: { id: receiverId }, receiver: { id: requesterId } },
      ],
    });

    if (existing) throw new BadRequestException('Demande déjà existante');

    const friendship = this.friendshipRepo.create({
      requester: { id: requesterId } as Users,
      receiver: { id: receiverId } as Users,
      status: 'pending',
    });

    return this.friendshipRepo.save(friendship);
  }

  async acceptRequest(userId: number, requesterId: number) {
    const friendship = await this.friendshipRepo.findOne({
      where: { requester: { id: requesterId }, receiver: { id: userId }, status: 'pending' },
    });

    if (!friendship) throw new BadRequestException('Demande introuvable');

    friendship.status = 'accepted';
    return this.friendshipRepo.save(friendship);
  }

  async getPending(userId: number) {
    return this.friendshipRepo.find({
      where: { receiver: { id: userId }, status: 'pending' },
    });
  }

  async getFriends(userId: number) {
    const friendships = await this.friendshipRepo.find({
      where: [
        { requester: { id: userId }, status: 'accepted' },
        { receiver: { id: userId }, status: 'accepted' },
      ],
    });

    return friendships.map(f =>
      f.requester.id === userId ? f.receiver : f.requester
    );
  }

  async getPendingCount(userId: number): Promise<number> {
    return this.friendshipRepo.count({
      where: { receiver: { id: userId }, status: 'pending' },
    });
  }

  async getMyPending(userId: number) {
    return this.friendshipRepo.find({
        where: { requester: { id: userId }, status: 'pending' },
    });
  }
}