import { Injectable, ConflictException } from '@nestjs/common';
import { Users } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Groups } from './groups.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Groups)
    private groupsRepository: Repository<Groups>,
    private usersService: UsersService,
  ) {}

  async findAll(): Promise<Groups[]> {
    return this.groupsRepository.find();
  }

  async findAllByUser(username: string): Promise<any[]> {
    // 1. Trouver d'abord les IDs des groupes auxquels l'utilisateur appartient
    const userGroups = await this.groupsRepository.find({ 
      where: { 
        users: { 
          username: username 
        } 
      }
    });

    if (userGroups.length === 0) return [];

    // 2. Récupérer ces groupes avec TOUS leurs membres (sans filtrage)
    const groupIds = userGroups.map(group => group.id);
    const groups = await this.groupsRepository.find({
      where: { id: In(groupIds) },
      relations: ['users']
    });

    return groups.map(group => ({
      ...group,
      users: group.users.map(user => ({
        id: user.id,
        username: user.username,
      })),
    }));
  }

  async findOneGroup(id: number): Promise<any | { error: string }> {
    const group = await this.groupsRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!group) return { error: 'Le groupe n\'existe pas' };

    // On filtre pour ne garder que id et username pour chaque membre
    return {
      ...group,
      users: group.users.map(user => ({
        id: user.id,
        username: user.username,
      })),
    };
  }

  async create(groupData: Partial<Groups>): Promise<any> {
    const newGroup = this.groupsRepository.create(groupData);
    
    // On récupère le créateur pour l'ajouter comme premier membre
    if (groupData.creator) {
      const creator = await this.usersService.findOne(groupData.creator);
      if (creator) {
        newGroup.users = [creator];
      }
    }

    const savedGroup = await this.groupsRepository.save(newGroup);
    return this.findOneGroup(savedGroup.id);
  }

  async addUserToGroup(id: number, username: string): Promise<any | { error: string }> {
    const group = await this.groupsRepository.findOne({
      where: { id },
      relations: ['users'],
    });
    if (!group) return { error: 'Le groupe n\'existe pas' };

    const user = await this.usersService.findOne(username);
    if (!user) return { error: 'L\'utilisateur n\'existe pas' };

    // Vérifier si l'utilisateur est déjà dans le groupe
    const isAlreadyMember = group.users.some(u => u.id === user.id);
    if (isAlreadyMember) return { error: 'L\'utilisateur est déjà dans ce groupe' };

    // Vérifier la taille max
    if (group.users.length >= group.maxGroupSize) {
      return { error: 'Le groupe est complet' };
    }

    group.users.push(user);
    await this.groupsRepository.save(group);
    
    return this.findOneGroup(id);
  }

  async delete(id: number, username: string): Promise<boolean | { error: string }> {
    const group = await this.groupsRepository.findOne({ where: { id } }); 
    
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
