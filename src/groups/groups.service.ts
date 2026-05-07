import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Groups } from './groups.entity';
import { GroupUser } from '../group-user/group-user.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Groups)
    private groupsRepository: Repository<Groups>,
    @InjectRepository(GroupUser)
    private groupUserRepository: Repository<GroupUser>,
    private usersService: UsersService,
  ) {}

  async findAll(): Promise<Groups[]> {
    return this.groupsRepository.find();
  }

  async findAllByUser(username: string): Promise<any[]> {
    const userGroups = await this.groupsRepository.find({
      where: {
        groupUsers: {
          invitation: true,
          user: {
            username,
          },
        },
      },
      relations: ['groupUsers', 'groupUsers.user'],
    });

    if (userGroups.length === 0) return [];

    const groupIds = userGroups.map((group) => group.id);
    const groups = await this.groupsRepository.find({
      where: { id: In(groupIds) },
      relations: ['groupUsers', 'groupUsers.user'],
    });

    return groups.map((group) => this.formatGroup(group));
  }

  async findPendingInvitations(username: string): Promise<any[]> {
    const groups = await this.groupsRepository.find({
      where: {
        groupUsers: {
          invitation: false,
          user: {
            username,
          },
        },
      },
      relations: ['groupUsers', 'groupUsers.user'],
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      creator: group.creator,
      maxGroupSize: group.maxGroupSize,
      dateCreation: group.dateCreation,
      invitation: false,
    }));
  }

  async findOneGroup(id: number): Promise<any | { error: string }> {
    const group = await this.groupsRepository.findOne({
      where: { id },
      relations: ['groupUsers', 'groupUsers.user'],
    });

    if (!group) return { error: 'Le groupe n\'existe pas' };

    return this.formatGroup(group);
  }

  async create(groupData: Partial<Groups>): Promise<any> {
    const newGroup = this.groupsRepository.create(groupData);
    const savedGroup = await this.groupsRepository.save(newGroup);

    if (groupData.creator) {
      const creator = await this.usersService.findOne(groupData.creator);

      if (creator) {
        const membership = this.groupUserRepository.create({
          group: savedGroup,
          user: creator,
          invitation: true,
        });

        await this.groupUserRepository.save(membership);
      }
    }

    return this.findOneGroup(savedGroup.id);
  }

  async addUserToGroup(
    id: number,
    username: string,
    requesterUsername: string,
  ): Promise<any | { error: string }> {
    const group = await this.groupsRepository.findOne({
      where: { id },
      relations: ['groupUsers', 'groupUsers.user'],
    });
    if (!group) return { error: 'Le groupe n\'existe pas' };

    if (group.creator !== requesterUsername) {
      return { error: 'Seul le créateur du groupe peut inviter un utilisateur' };
    }

    const user = await this.usersService.findOne(username);
    if (!user) return { error: 'L\'utilisateur n\'existe pas' };

    const existingMembership = group.groupUsers.find(
      (groupUser) => groupUser.user.id === user.id,
    );

    if (existingMembership?.invitation) {
      return { error: 'L\'utilisateur fait déjà partie du groupe' };
    }

    if (existingMembership && !existingMembership.invitation) {
      return { error: 'L\'utilisateur a déjà une invitation en attente' };
    }

    const activeMembersCount = group.groupUsers.filter(
      (groupUser) => groupUser.invitation,
    ).length;

    if (activeMembersCount >= group.maxGroupSize) {
      return { error: 'Le groupe est complet' };
    }

    const membership = this.groupUserRepository.create({
      group,
      user,
      invitation: false,
    });

    await this.groupUserRepository.save(membership);

    return {
      message: 'Invitation envoyée avec succès',
      groupId: group.id,
      username: user.username,
      invitation: false,
    };
  }

  async acceptInvitation(
    id: number,
    username: string,
  ): Promise<any | { error: string }> {
    const group = await this.groupsRepository.findOne({
      where: { id },
      relations: ['groupUsers', 'groupUsers.user'],
    });
    if (!group) return { error: 'Le groupe n\'existe pas' };

    const membership = group.groupUsers.find(
      (groupUser) => groupUser.user.username === username,
    );

    if (!membership) {
      return { error: 'Aucune invitation trouvée pour cet utilisateur' };
    }

    if (membership.invitation) {
      return { error: 'L\'utilisateur fait déjà partie du groupe' };
    }

    const activeMembersCount = group.groupUsers.filter(
      (groupUser) => groupUser.invitation,
    ).length;

    if (activeMembersCount >= group.maxGroupSize) {
      return { error: 'Le groupe est complet' };
    }

    membership.invitation = true;
    await this.groupUserRepository.save(membership);

    return this.findOneGroup(id);
  }

  async delete(id: number, username: string): Promise<boolean | { error: string }> {
    const group = await this.groupsRepository.findOne({ where: { id } });

    if (!group) {
      return { error: 'Le groupe n\'existe pas' };
    }

    if (group.creator !== username) {
      return { error: 'Vous n\'êtes pas le créateur de ce groupe' };
    }

    await this.groupsRepository.remove(group);
    return true;
  }

  private formatGroup(group: Groups) {
    let {groupUsers, ...rest} = group;
    return {
      ...rest,
      users: groupUsers
        .filter((groupUser) => groupUser.invitation)
        .map((groupUser) => ({
          id: groupUser.user.id,
          username: groupUser.user.username,
          invitation: groupUser.invitation,
        })),
    };
  }
}
