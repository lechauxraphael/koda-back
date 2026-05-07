import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from '../users/user.entity';
import { Groups } from 'src/groups/groups.entity';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'sentAt', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  sentAt!: Date;

  @ManyToOne(() => Users, (user) => user.chats, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: Users;

  @ManyToOne(() => Groups, (group) => group.chats, { nullable: false })
  @JoinColumn({ name: 'groupId' })
  group!: Groups;
}
