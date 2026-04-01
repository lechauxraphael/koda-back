import { Injectable, ConflictException } from '@nestjs/common';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './groups.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    private usersService: UsersService,
  ) {}

  async findAll(): Promise<Group[]> {
    return this.groupsRepository.find();
  }

  async findAllByUser(username: string): Promise<any[]> {
    const groups = await this.groupsRepository.find({ 
      where: { creator: username },
      relations: ['users']
    });

    return groups.map(group => ({
      ...group,
      users: group.users.map(user => ({
        userId: user.userId,
        username: user.username,
      })),
    }));
  }

  async findOneGroup(groupId: number): Promise<any | { error: string }> {
    const group = await this.groupsRepository.findOne({
      where: { groupId },
      relations: ['users'],
    });

    if (!group) return { error: 'Le groupe n\'existe pas' };

    // On filtre pour ne garder que userId et username pour chaque membre
    return {
      ...group,
      users: group.users.map(user => ({
        userId: user.userId,
        username: user.username,
      })),
    };
  }

  async create(groupData: Partial<Group>): Promise<any> {
    const newGroup = this.groupsRepository.create(groupData);
    
    // On récupère le créateur pour l'ajouter comme premier membre
    if (groupData.creator) {
      const creator = await this.usersService.findOne(groupData.creator);
      if (creator) {
        newGroup.users = [creator];
      }
    }

    const savedGroup = await this.groupsRepository.save(newGroup);
    return this.findOneGroup(savedGroup.groupId);
  }

  async addUserToGroup(groupId: number, username: string): Promise<any | { error: string }> {
    const group = await this.groupsRepository.findOne({
      where: { groupId },
      relations: ['users'],
    });
    if (!group) return { error: 'Le groupe n\'existe pas' };

    const user = await this.usersService.findOne(username);
    if (!user) return { error: 'L\'utilisateur n\'existe pas' };

    // Vérifier si l'utilisateur est déjà dans le groupe
    const isAlreadyMember = group.users.some(u => u.userId === user.userId);
    if (isAlreadyMember) return { error: 'L\'utilisateur est déjà dans ce groupe' };

    // Vérifier la taille max
    if (group.users.length >= group.maxGroupSize) {
      return { error: 'Le groupe est complet' };
    }

    group.users.push(user);
    await this.groupsRepository.save(group);
    
    return this.findOneGroup(groupId);
  }

  async delete(groupId: number, username: string): Promise<boolean | { error: string }> {
    const group = await this.groupsRepository.findOne({ where: { groupId } });
    
    if (!group) {
      return { error: "Le groupe n'existe pas" };
    }

    if (group.creator !== username) {
      return { error: "Vous n'êtes pas le créateur de ce groupe" };
    }

    await this.groupsRepository.remove(group);
    return true;
  }
}
