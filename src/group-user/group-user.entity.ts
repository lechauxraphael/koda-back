import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Groups } from '../groups/groups.entity';
import { Users } from 'src/users/user.entity';

@Entity('groups_users')
@Index('IDX_66513d446e807d82760aafcdde', ['userId'])
export class GroupUser {
  @PrimaryColumn()
  groupId!: number;

  @PrimaryColumn()
  userId!: number;

  @ManyToOne(() => Groups, (group) => group.groupUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: Groups;

  @ManyToOne(() => Users, (user) => user.groupUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Users;

  @Column({ default: false })
  invitation!: boolean;
}
